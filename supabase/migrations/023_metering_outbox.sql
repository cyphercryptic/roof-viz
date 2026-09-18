-- Apply manually after 022. Existing renders are not back-billed automatically.
BEGIN;
ALTER TABLE public.visualizations ADD COLUMN IF NOT EXISTS billing_plan text;
ALTER TABLE public.visualizations ADD COLUMN IF NOT EXISTS billing_customer_id text;
ALTER TABLE public.visualizations ADD COLUMN IF NOT EXISTS billing_period_start timestamptz;
ALTER TABLE public.visualizations ADD COLUMN IF NOT EXISTS billing_period_end timestamptz;

CREATE TABLE public.metering_outbox (
  visualization_id uuid PRIMARY KEY REFERENCES public.visualizations(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  event_timestamp bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','review')),
  attempts integer NOT NULL DEFAULT 0,
  first_attempt_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  lease_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
ALTER TABLE public.metering_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.metering_outbox FROM anon, authenticated;
GRANT ALL ON public.metering_outbox TO service_role;
CREATE INDEX metering_outbox_due ON public.metering_outbox(next_attempt_at) WHERE status IN ('pending','processing');
CREATE INDEX metering_outbox_tenant ON public.metering_outbox(tenant_id,status);

CREATE TABLE public.metering_worker_health (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  last_completed_run timestamptz NOT NULL
);
ALTER TABLE public.metering_worker_health ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.metering_worker_health FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.metering_scheduler_is_healthy()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.role()='service_role' AND EXISTS (SELECT 1 FROM public.metering_worker_health
    WHERE singleton AND last_completed_run>now()-interval '2 hours');
$$;
CREATE OR REPLACE FUNCTION public.record_metering_worker_run()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required' USING ERRCODE='42501'; END IF;
  INSERT INTO public.metering_worker_health(singleton,last_completed_run) VALUES(true,now())
    ON CONFLICT(singleton) DO UPDATE SET last_completed_run=EXCLUDED.last_completed_run;
END;
$$;
REVOKE ALL ON FUNCTION public.metering_scheduler_is_healthy() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_metering_worker_run() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.metering_scheduler_is_healthy() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_metering_worker_run() TO service_role;

CREATE OR REPLACE FUNCTION public.metering_is_healthy(p_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.role() = 'service_role' AND public.metering_scheduler_is_healthy()
    AND (SELECT count(*) FROM public.metering_outbox WHERE tenant_id=p_tenant_id AND status<>'sent') < 10
    AND NOT EXISTS (SELECT 1 FROM public.metering_outbox WHERE tenant_id=p_tenant_id
      AND (status='review' OR (status<>'sent' AND created_at < now()-interval '24 hours')));
$$;
REVOKE ALL ON FUNCTION public.metering_is_healthy(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.metering_is_healthy(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.snapshot_visualization_billing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE sub public.subscriptions%ROWTYPE; pending_count bigint;
BEGIN
  SELECT * INTO STRICT sub FROM public.subscriptions WHERE tenant_id=NEW.tenant_id;
  NEW.billing_plan := sub.plan;
  NEW.billing_customer_id := sub.stripe_customer_id;
  NEW.billing_period_start := COALESCE(sub.current_period_start,date_trunc('month',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
  NEW.billing_period_end := COALESCE(sub.current_period_end,NEW.billing_period_start+interval '1 month');
  IF sub.plan='pay_per_use' THEN
    IF NOT EXISTS (SELECT 1 FROM public.metering_worker_health WHERE singleton AND last_completed_run>now()-interval '2 hours') THEN
      RAISE EXCEPTION 'Metered billing scheduler is unavailable' USING ERRCODE='42501';
    END IF;
    IF sub.stripe_customer_id IS NULL OR sub.stripe_subscription_id IS NULL THEN
      RAISE EXCEPTION 'Metered billing account is not configured' USING ERRCODE='42501';
    END IF;
    SELECT count(*) INTO pending_count FROM public.metering_outbox WHERE tenant_id=NEW.tenant_id AND status<>'sent';
    IF pending_count>=10 OR EXISTS (SELECT 1 FROM public.metering_outbox WHERE tenant_id=NEW.tenant_id
      AND (status='review' OR (status<>'sent' AND created_at<now()-interval '24 hours'))) THEN
      RAISE EXCEPTION 'Metered billing requires reconciliation before more renders' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.snapshot_visualization_billing() FROM PUBLIC, anon, authenticated;
-- Trigger sorts after guard_visualization_insert, which locks tenant and checks allowance.
CREATE TRIGGER snapshot_visualization_billing BEFORE INSERT ON public.visualizations
FOR EACH ROW EXECUTE FUNCTION public.snapshot_visualization_billing();

CREATE OR REPLACE FUNCTION public.record_completed_visualization()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE period_start timestamptz; period_end timestamptz;
BEGIN
  IF NEW.status='completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    period_start := COALESCE(NEW.billing_period_start,date_trunc('month',NEW.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
    period_end := COALESCE(NEW.billing_period_end,period_start+interval '1 month');
    INSERT INTO public.usage_records(tenant_id,visualization_id,period_start,period_end)
      SELECT NEW.tenant_id,NEW.id,period_start,period_end
      WHERE NOT EXISTS (SELECT 1 FROM public.usage_records WHERE visualization_id=NEW.id);
    IF NEW.billing_plan='pay_per_use' THEN
      IF NEW.billing_customer_id IS NULL THEN RAISE EXCEPTION 'Missing metered customer'; END IF;
      INSERT INTO public.metering_outbox(visualization_id,tenant_id,stripe_customer_id,event_timestamp)
        VALUES (NEW.id,NEW.tenant_id,NEW.billing_customer_id,floor(extract(epoch FROM now()))::bigint)
        ON CONFLICT (visualization_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.record_completed_visualization() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER record_completed_visualization AFTER UPDATE OF status ON public.visualizations
FOR EACH ROW EXECUTE FUNCTION public.record_completed_visualization();

CREATE OR REPLACE FUNCTION public.claim_metering_event(p_visualization_id uuid DEFAULT NULL,p_tenant_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE job public.metering_outbox%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required' USING ERRCODE='42501'; END IF;
  -- Stripe guarantees duplicate suppression for at least 24h, not forever.
  -- Ambiguous old attempts require reconciliation instead of risking a double bill.
  UPDATE public.metering_outbox SET status='review',lease_token=NULL,lease_until=NULL,
    last_error='Automatic retry stopped: attempt limit or safe deduplication window exceeded'
    WHERE status IN ('pending','processing') AND (lease_until IS NULL OR lease_until<=now())
      AND (attempts>=8 OR first_attempt_at<now()-interval '23 hours' OR created_at<now()-interval '34 days');
  SELECT * INTO job FROM public.metering_outbox
    WHERE (p_visualization_id IS NULL OR visualization_id=p_visualization_id)
      AND (p_tenant_id IS NULL OR tenant_id=p_tenant_id)
      AND ((status='pending' AND next_attempt_at<=now()) OR (status='processing' AND lease_until<=now()))
    ORDER BY next_attempt_at,created_at FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE public.metering_outbox SET status='processing',attempts=attempts+1,
    first_attempt_at=COALESCE(first_attempt_at,now()),lease_token=gen_random_uuid(),lease_until=now()+interval '60 seconds'
    WHERE visualization_id=job.visualization_id RETURNING * INTO job;
  RETURN to_jsonb(job);
END;
$$;
CREATE OR REPLACE FUNCTION public.finish_metering_event(p_visualization_id uuid,p_lease_token uuid,p_success boolean,p_error text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE job public.metering_outbox%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required' USING ERRCODE='42501'; END IF;
  SELECT * INTO job FROM public.metering_outbox WHERE visualization_id=p_visualization_id FOR UPDATE;
  IF NOT FOUND OR job.status<>'processing' OR job.lease_token IS DISTINCT FROM p_lease_token
    OR job.lease_until<=now() THEN RETURN false; END IF;
  UPDATE public.metering_outbox SET
    status=CASE WHEN p_success THEN 'sent' WHEN attempts>=8 THEN 'review' ELSE 'pending' END,
    sent_at=CASE WHEN p_success THEN now() ELSE NULL END,
    next_attempt_at=now()+make_interval(secs=>least(3600,power(2,attempts)::integer*30)),
    last_error=CASE WHEN p_success THEN NULL ELSE left(COALESCE(p_error,'Meter submission failed'),500) END,
    lease_token=NULL,lease_until=NULL WHERE visualization_id=p_visualization_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_metering_event(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_metering_event(uuid,uuid,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_metering_event(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_metering_event(uuid,uuid,boolean,text) TO service_role;
COMMIT;
