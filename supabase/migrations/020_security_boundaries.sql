-- Apply manually in Supabase SQL Editor after 019. No customer rows are deleted.
BEGIN;

-- Profile provisioning belongs exclusively to authenticated server onboarding.
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
REVOKE INSERT ON public.profiles FROM anon, authenticated;

-- Browser code can read jobs; only the server can change results and status.
REVOKE UPDATE, DELETE ON public.visualizations FROM anon, authenticated;

DROP POLICY IF EXISTS "Users can create shared links" ON public.shared_links;
DROP POLICY IF EXISTS "Users can update own tenant shared links" ON public.shared_links;
CREATE POLICY "Users can create shared links" ON public.shared_links
FOR INSERT TO authenticated WITH CHECK (
  tenant_id = public.get_my_tenant_id() AND created_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.visualizations v
    WHERE v.id = visualization_id AND v.tenant_id = shared_links.tenant_id
      AND v.status = 'completed'
  )
);
CREATE POLICY "Users can update own tenant shared links" ON public.shared_links
FOR UPDATE TO authenticated
USING (tenant_id = public.get_my_tenant_id() AND (created_by = (SELECT auth.uid()) OR public.is_admin()))
WITH CHECK (
  tenant_id = public.get_my_tenant_id()
  AND (created_by = (SELECT auth.uid()) OR public.is_admin())
  AND EXISTS (
    SELECT 1 FROM public.visualizations v
    WHERE v.id = visualization_id AND v.tenant_id = shared_links.tenant_id
      AND v.status = 'completed'
  )
);

-- Serialize reservations on the tenant row. The job INSERT itself is the
-- reservation, so concurrent requests cannot all spend the last available render.
-- Completed jobs count even if later usage logging fails. Stale processing jobs
-- expire after 15 minutes (the generation route has a 5-minute maximum).
CREATE OR REPLACE FUNCTION public.guard_visualization_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  sub public.subscriptions%ROWTYPE;
  actor_role text;
  used_count bigint;
  period_start timestamptz;
  period_end timestamptz;
BEGIN
  IF NEW.status <> 'processing' OR NEW.result_image_path IS NOT NULL THEN
    RAISE EXCEPTION 'New visualizations must begin processing' USING ERRCODE = '42501';
  END IF;
  IF auth.role() IS DISTINCT FROM 'service_role' AND NEW.created_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Invalid visualization owner' USING ERRCODE = '42501';
  END IF;
  SELECT role INTO actor_role FROM public.profiles
    WHERE id = NEW.created_by AND tenant_id = NEW.tenant_id;
  IF actor_role IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.products WHERE id = NEW.product_id AND tenant_id = NEW.tenant_id
  ) OR split_part(NEW.original_image_path, '/', 1) <> NEW.tenant_id::text
    OR NEW.original_image_path ~ '(^|/)\.{1,2}(/|$)'
    OR NEW.original_image_path ~ '[[:cntrl:]%?#]'
    OR position(chr(92) in NEW.original_image_path) > 0
    OR position('//' in NEW.original_image_path) > 0 THEN
    RAISE EXCEPTION 'Invalid visualization tenant data' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.tenants WHERE id = NEW.tenant_id FOR UPDATE;
  SELECT * INTO sub FROM public.subscriptions WHERE tenant_id = NEW.tenant_id;
  IF NOT FOUND OR sub.status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'An active subscription is required' USING ERRCODE = '42501';
  END IF;
  period_start := COALESCE(sub.current_period_start, date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
  period_end := COALESCE(sub.current_period_end, period_start + interval '1 month');
  IF sub.plan <> 'free' AND (sub.current_period_end IS NULL OR sub.current_period_end <= now()) THEN
    RAISE EXCEPTION 'Billing period needs renewal' USING ERRCODE = '42501';
  END IF;
  -- Ignore caller-supplied timestamps so quota cannot be backdated.
  NEW.created_at := now();
  SELECT count(*) INTO used_count FROM public.visualizations v
  WHERE v.tenant_id = NEW.tenant_id
    AND (v.status = 'completed' OR (v.status = 'processing' AND v.created_at > now() - interval '15 minutes'))
    AND CASE WHEN actor_role = 'demo' THEN v.created_by = NEW.created_by
      ELSE v.created_at >= period_start AND v.created_at < period_end END;
  IF (actor_role = 'demo' AND used_count >= 5)
    OR (actor_role <> 'demo' AND sub.visualization_limit <> -1 AND used_count >= sub.visualization_limit) THEN
    RAISE EXCEPTION 'Visualization limit reached' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_visualization_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_visualization_insert ON public.visualizations;
CREATE TRIGGER guard_visualization_insert BEFORE INSERT ON public.visualizations
FOR EACH ROW EXECUTE FUNCTION public.guard_visualization_insert();
CREATE INDEX IF NOT EXISTS visualizations_quota_lookup ON public.visualizations (tenant_id, created_at, status);

-- The old event table contains claims recorded BEFORE successful work. Use a new
-- completed-only ledger so a historical failed claim cannot suppress a retry.
CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_processed_events FROM anon, authenticated;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_event_created bigint NOT NULL DEFAULT 0;

-- Subscription update and completion marker commit together or roll back
-- together. Only the trusted webhook may invoke this function.
CREATE OR REPLACE FUNCTION public.apply_stripe_subscription_event(
  p_event_id text, p_created bigint, p_customer_id text, p_subscription_id text,
  p_tenant_id uuid, p_plan text, p_status text, p_limit integer,
  p_period_start timestamptz, p_period_end timestamptz, p_deleted boolean
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  existing public.subscriptions%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO existing FROM public.subscriptions
    WHERE stripe_customer_id = p_customer_id
      AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription customer mapping not ready'; END IF;
  IF EXISTS (SELECT 1 FROM public.stripe_processed_events WHERE id = p_event_id) THEN RETURN 'duplicate'; END IF;
  IF p_created < existing.stripe_event_created
    OR (existing.stripe_subscription_id IS NOT NULL AND existing.stripe_subscription_id <> p_subscription_id) THEN
    INSERT INTO public.stripe_processed_events(id) VALUES (p_event_id) ON CONFLICT DO NOTHING;
    RETURN 'stale';
  END IF;
  UPDATE public.subscriptions SET
    stripe_subscription_id = CASE WHEN p_deleted THEN NULL ELSE p_subscription_id END,
    plan = CASE WHEN p_deleted THEN 'free' ELSE p_plan END,
    status = CASE WHEN p_deleted THEN 'active' ELSE p_status END,
    visualization_limit = CASE WHEN p_deleted THEN 5 ELSE p_limit END,
    current_period_start = CASE WHEN p_deleted THEN NULL ELSE p_period_start END,
    current_period_end = CASE WHEN p_deleted THEN NULL ELSE p_period_end END,
    stripe_event_created = p_created
  WHERE id = existing.id;
  INSERT INTO public.stripe_processed_events(id) VALUES (p_event_id);
  RETURN 'applied';
END;
$$;
REVOKE ALL ON FUNCTION public.apply_stripe_subscription_event(text,bigint,text,text,uuid,text,text,integer,timestamptz,timestamptz,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_subscription_event(text,bigint,text,text,uuid,text,text,integer,timestamptz,timestamptz,boolean) TO service_role;

-- Invitation creation and consumption must share the same tenant lock. Browser
-- inserts would bypass both seat limits and the verified invitation workflow.
REVOKE INSERT, UPDATE ON public.invites FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_team_invite(
  p_inviter_id uuid, p_email text, p_role text, p_token text, p_expires_at timestamptz
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor public.profiles%ROWTYPE;
  sub public.subscriptions%ROWTYPE;
  invitation public.invites%ROWTYPE;
  seat_limit integer;
  occupied bigint;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO actor FROM public.profiles WHERE id = p_inviter_id;
  IF NOT FOUND OR actor.role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only admins can invite members' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('rep', 'admin', 'demo') OR p_email IS NULL OR length(trim(p_email)) = 0
    OR p_token !~ '^[a-f0-9]{64}$' OR p_expires_at IS NULL OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'Invalid invitation';
  END IF;
  PERFORM 1 FROM public.tenants WHERE id = actor.tenant_id FOR UPDATE;
  SELECT * INTO sub FROM public.subscriptions WHERE tenant_id = actor.tenant_id;
  IF NOT FOUND OR sub.status NOT IN ('active', 'trialing')
    OR (sub.plan <> 'free' AND (sub.current_period_end IS NULL OR sub.current_period_end <= now())) THEN
    RAISE EXCEPTION 'Update billing before adding members' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.invites WHERE tenant_id = actor.tenant_id
    AND lower(email) = lower(trim(p_email)) AND accepted_at IS NULL AND expires_at > now())
    OR EXISTS (SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id = p.id
      WHERE p.tenant_id = actor.tenant_id AND lower(u.email) = lower(trim(p_email))) THEN
    RAISE EXCEPTION 'This person is already a member or has a pending invitation' USING ERRCODE = '23505';
  END IF;
  seat_limit := CASE sub.plan WHEN 'starter' THEN 3 WHEN 'pro' THEN 10
    WHEN 'business' THEN -1 WHEN 'business_pro' THEN -1 ELSE 1 END;
  SELECT (SELECT count(*) FROM public.profiles WHERE tenant_id = actor.tenant_id)
    + (SELECT count(*) FROM public.invites WHERE tenant_id = actor.tenant_id
      AND accepted_at IS NULL AND expires_at > now()) INTO occupied;
  IF seat_limit <> -1 AND occupied >= seat_limit THEN
    RAISE EXCEPTION 'Your plan has no available team seats' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.invites(tenant_id,email,role,token,expires_at)
    VALUES (actor.tenant_id, lower(trim(p_email)), p_role, p_token, p_expires_at) RETURNING * INTO invitation;
  RETURN to_jsonb(invitation);
END;
$$;
REVOKE ALL ON FUNCTION public.create_team_invite(uuid,text,text,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_invite(uuid,text,text,text,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.accept_team_invite(p_user_id uuid, p_token text, p_full_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  invitation public.invites%ROWTYPE;
  sub public.subscriptions%ROWTYPE;
  verified_email text;
  seat_limit integer;
  occupied bigint;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO invitation FROM public.invites WHERE token = p_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired invitation' USING ERRCODE = 'P0002'; END IF;
  PERFORM 1 FROM public.tenants WHERE id = invitation.tenant_id FOR UPDATE;
  SELECT * INTO invitation FROM public.invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation' USING ERRCODE = 'P0002';
  END IF;
  SELECT email INTO verified_email FROM auth.users WHERE id = p_user_id AND email_confirmed_at IS NOT NULL;
  IF verified_email IS NULL OR lower(verified_email) <> lower(invitation.email) THEN
    RAISE EXCEPTION 'Sign in with the verified email address this invitation was sent to' USING ERRCODE = '42501';
  END IF;
  IF invitation.accepted_at IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND tenant_id = invitation.tenant_id) THEN
      RETURN jsonb_build_object('success', true);
    END IF;
    RAISE EXCEPTION 'This invitation was already accepted' USING ERRCODE = 'P0002';
  END IF;
  IF invitation.expires_at IS NULL OR invitation.expires_at <= now() THEN
    RAISE EXCEPTION 'Invalid or expired invitation' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'This account already belongs to a team' USING ERRCODE = '23505';
  END IF;
  SELECT * INTO sub FROM public.subscriptions WHERE tenant_id = invitation.tenant_id;
  IF NOT FOUND OR sub.status NOT IN ('active', 'trialing')
    OR (sub.plan <> 'free' AND (sub.current_period_end IS NULL OR sub.current_period_end <= now())) THEN
    RAISE EXCEPTION 'The team must update billing before adding members' USING ERRCODE = '42501';
  END IF;
  seat_limit := CASE sub.plan WHEN 'starter' THEN 3 WHEN 'pro' THEN 10
    WHEN 'business' THEN -1 WHEN 'business_pro' THEN -1 ELSE 1 END;
  SELECT count(*) INTO occupied FROM public.profiles WHERE tenant_id = invitation.tenant_id;
  IF seat_limit <> -1 AND occupied >= seat_limit THEN
    RAISE EXCEPTION 'This team has no available seats' USING ERRCODE = 'P0001';
  END IF;
  IF invitation.role NOT IN ('rep', 'admin', 'demo') THEN
    RAISE EXCEPTION 'Invalid invitation role' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.profiles(id,tenant_id,full_name,role)
    VALUES (p_user_id,invitation.tenant_id,p_full_name,invitation.role);
  UPDATE public.invites SET accepted_at = now() WHERE id = invitation.id;
  RETURN jsonb_build_object('success', true);
END;
$$;
REVOKE ALL ON FUNCTION public.accept_team_invite(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(uuid,text,text) TO service_role;
COMMIT;
