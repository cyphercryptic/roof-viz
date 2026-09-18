-- Apply manually after 020. Follow-up audit fixes; existing customer data is preserved.
BEGIN;

-- RLS helpers must remain resolvable from functions with an empty search_path.
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role IN ('admin','owner') FROM public.profiles WHERE id = auth.uid();
$$;

-- Paid sharing is enforced at the Data API as well as the server route.
CREATE OR REPLACE FUNCTION public.tenant_has_sharing_access(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.subscriptions WHERE tenant_id = p_tenant_id
    AND plan IN ('pro','business','business_pro') AND status IN ('active','trialing')
    AND current_period_end > now());
$$;
REVOKE ALL ON FUNCTION public.tenant_has_sharing_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenant_has_sharing_access(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can create shared links" ON public.shared_links;
DROP POLICY IF EXISTS "Users can update own tenant shared links" ON public.shared_links;
CREATE POLICY "Users can create shared links" ON public.shared_links
FOR INSERT TO authenticated WITH CHECK (
  tenant_id = public.get_my_tenant_id() AND created_by = (SELECT auth.uid())
  AND public.tenant_has_sharing_access(tenant_id)
  AND expires_at IS NOT NULL AND expires_at > now() AND expires_at <= now() + interval '30 days'
  AND EXISTS (SELECT 1 FROM public.visualizations v WHERE v.id = visualization_id
    AND v.tenant_id = shared_links.tenant_id AND v.status = 'completed')
);
CREATE POLICY "Users can update own tenant shared links" ON public.shared_links
FOR UPDATE TO authenticated
USING (tenant_id = public.get_my_tenant_id() AND (created_by = (SELECT auth.uid()) OR public.is_admin()))
WITH CHECK (
  tenant_id = public.get_my_tenant_id() AND (created_by = (SELECT auth.uid()) OR public.is_admin())
  AND (NOT is_active OR (public.tenant_has_sharing_access(tenant_id)
    AND expires_at IS NOT NULL AND expires_at > now() AND expires_at <= now() + interval '30 days'))
  AND EXISTS (SELECT 1 FROM public.visualizations v WHERE v.id = visualization_id
    AND v.tenant_id = shared_links.tenant_id AND v.status = 'completed')
);

-- Demo members consume tenant capacity AND have a separate five-render lifetime cap.
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
  WHERE v.tenant_id = NEW.tenant_id AND v.created_at >= period_start AND v.created_at < period_end
    AND (v.status = 'completed' OR (v.status = 'processing' AND v.created_at > now() - interval '15 minutes'));
  IF sub.visualization_limit <> -1 AND used_count >= sub.visualization_limit THEN
    RAISE EXCEPTION 'Visualization limit reached' USING ERRCODE = 'P0001';
  END IF;
  IF actor_role = 'demo' THEN
    SELECT count(*) INTO used_count FROM public.visualizations v
    WHERE v.tenant_id = NEW.tenant_id AND v.created_by = NEW.created_by
      AND (v.status = 'completed' OR (v.status = 'processing' AND v.created_at > now() - interval '15 minutes'));
    IF used_count >= 5 THEN
      RAISE EXCEPTION 'Demo visualization limit reached' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Unique tenant-prefixed custom swatches may be uploaded only by catalog admins.
CREATE POLICY "Tenant admins can upload product swatches" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'product-swatches' AND public.is_admin()
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
);
CREATE POLICY "Tenant members can inspect product swatches" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'product-swatches' AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
);

-- Branding writes are admin-only; legacy logo upsert also needs an UPDATE rule.
DROP POLICY IF EXISTS "Tenant members can upload logos" ON storage.objects;
CREATE POLICY "Tenant admins can upload logos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'logos' AND public.is_admin()
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
);
CREATE POLICY "Tenant admins can replace logos" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'logos' AND public.is_admin()
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
) WITH CHECK (
  bucket_id = 'logos' AND public.is_admin()
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
);

-- Acquire a customer lease BEFORE reading Stripe. A fencing token prevents an
-- expired worker from writing its older snapshot after a newer worker finishes.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_sync_token uuid;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_sync_until timestamptz;
CREATE OR REPLACE FUNCTION public.acquire_stripe_sync(p_customer_id text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE locked public.subscriptions%ROWTYPE; lease uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO locked FROM public.subscriptions WHERE stripe_customer_id = p_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription customer mapping not ready'; END IF;
  IF locked.billing_sync_until > now() THEN RETURN NULL; END IF;
  lease := gen_random_uuid();
  UPDATE public.subscriptions SET billing_sync_token = lease, billing_sync_until = now() + interval '60 seconds'
    WHERE id = locked.id;
  RETURN lease;
END;
$$;
CREATE OR REPLACE FUNCTION public.release_stripe_sync(p_customer_id text, p_sync_token uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.subscriptions SET billing_sync_token = NULL, billing_sync_until = NULL
    WHERE stripe_customer_id = p_customer_id AND billing_sync_token = p_sync_token;
END;
$$;
CREATE OR REPLACE FUNCTION public.apply_stripe_subscription_event(
  p_event_id text, p_created bigint, p_customer_id text, p_subscription_id text,
  p_tenant_id uuid, p_plan text, p_status text, p_limit integer,
  p_period_start timestamptz, p_period_end timestamptz, p_deleted boolean, p_sync_token uuid
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE locked public.subscriptions%ROWTYPE; outcome text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO locked FROM public.subscriptions WHERE stripe_customer_id = p_customer_id FOR UPDATE;
  IF NOT FOUND OR p_sync_token IS NULL OR locked.billing_sync_token IS DISTINCT FROM p_sync_token
    OR locked.billing_sync_until <= now() THEN
    RAISE EXCEPTION 'Stripe synchronization lease expired; retry delivery';
  END IF;
  outcome := public.apply_stripe_subscription_event(p_event_id,p_created,p_customer_id,p_subscription_id,
    p_tenant_id,p_plan,p_status,p_limit,p_period_start,p_period_end,p_deleted);
  PERFORM public.release_stripe_sync(p_customer_id,p_sync_token);
  RETURN outcome;
END;
$$;
-- Old deployments must fail closed rather than bypass the snapshot lease.
REVOKE EXECUTE ON FUNCTION public.apply_stripe_subscription_event(text,bigint,text,text,uuid,text,text,integer,timestamptz,timestamptz,boolean) FROM service_role;
REVOKE ALL ON FUNCTION public.acquire_stripe_sync(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_stripe_sync(text,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_stripe_subscription_event(text,bigint,text,text,uuid,text,text,integer,timestamptz,timestamptz,boolean,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_stripe_sync(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stripe_sync(text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_stripe_subscription_event(text,bigint,text,text,uuid,text,text,integer,timestamptz,timestamptz,boolean,uuid) TO service_role;
COMMIT;
