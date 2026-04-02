-- Rate limit logs table for DB-based rate limiting (Vercel serverless compatible)
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient lookups within time windows
CREATE INDEX idx_rate_limit_logs_lookup
  ON rate_limit_logs (identifier, endpoint, created_at);

-- Cleanup function: delete rows older than 1 hour
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_logs WHERE created_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Disable RLS — this table is only accessed by service role
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
