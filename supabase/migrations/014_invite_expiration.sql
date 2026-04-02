-- Add expiration to invites (default 7 days from creation)
ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days';

-- Backfill existing invites
UPDATE invites
  SET expires_at = created_at + interval '7 days'
  WHERE expires_at IS NULL;
