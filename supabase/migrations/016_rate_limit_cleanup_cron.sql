-- Schedule rate limit cleanup every 15 minutes using pg_cron
-- If pg_cron is not available, run SELECT cleanup_rate_limit_logs() manually or via Edge Function

-- Enable pg_cron extension (available on Supabase Pro+ plans)
-- If this fails, the cleanup function still exists and can be called manually
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'cleanup-rate-limits',
    '*/15 * * * *',
    'SELECT cleanup_rate_limit_logs()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available — schedule cleanup_rate_limit_logs() manually';
END;
$$;
