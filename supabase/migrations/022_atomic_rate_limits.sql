-- Run manually in Supabase SQL Editor after 021_review_hardening.sql.
-- Admission and recording are one transaction, so concurrent requests cannot
-- all consume the same final slot. No browser role can invoke this RPC.
BEGIN;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer,
  p_window_seconds integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz;
  v_count integer;
  v_oldest timestamptz;
BEGIN
  IF p_identifier IS NULL OR length(p_identifier) NOT BETWEEN 1 AND 512
     OR p_endpoint IS NULL OR length(p_endpoint) NOT BETWEEN 1 AND 256
     OR p_max_requests IS NULL OR p_max_requests NOT BETWEEN 1 AND 10000
     OR p_window_seconds IS NULL OR p_window_seconds NOT BETWEEN 1 AND 3600 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(jsonb_build_array(p_identifier, p_endpoint)::text, 77122)
  );
  v_now := clock_timestamp();
  SELECT count(*)::integer, min(created_at) INTO v_count, v_oldest
    FROM public.rate_limit_logs
    WHERE identifier = p_identifier AND endpoint = p_endpoint
      AND created_at > v_now - make_interval(secs => p_window_seconds);

  IF v_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false, 'remaining', 0,
      'retry_after_seconds', greatest(1, ceil(extract(epoch FROM
        v_oldest + make_interval(secs => p_window_seconds) - v_now))::integer)
    );
  END IF;

  INSERT INTO public.rate_limit_logs(identifier, endpoint, created_at)
    VALUES (p_identifier, p_endpoint, v_now);
  RETURN jsonb_build_object(
    'allowed', true, 'remaining', p_max_requests - v_count - 1,
    'retry_after_seconds', 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text,text,integer,integer) TO service_role;
COMMIT;
