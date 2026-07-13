-- PRIVACY FIX: house-photos and visualizations were world-readable two ways —
-- a blanket anon SELECT policy (015) and public=true on the buckets themselves.
-- Every customer house photo was fetchable by anyone with the URL, and share-link
-- expiry/revocation was cosmetic. The app now uses short-lived signed URLs
-- everywhere (upload preview, gallery, visualize, share page), so both public
-- paths can be closed. logos and product-swatches stay public by design: logos
-- appear on public share pages and swatches are non-sensitive catalog assets.

-- 1. Ensure buckets exist (previously created by hand — not reproducible from the
--    repo) and set their visibility explicitly.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('house-photos', 'house-photos', false),
  ('visualizations', 'visualizations', false),
  ('logos', 'logos', true),
  ('product-swatches', 'product-swatches', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. Drop the blanket anonymous read on customer photos/results. The share page
--    is server-rendered and mints signed URLs with the service role, so anon
--    never needs direct storage SELECT on these buckets.
DROP POLICY IF EXISTS "Public can view shared visualization images" ON storage.objects;

-- Tenant-scoped authenticated SELECT policies from 015 remain — they are what
-- authorize signed-URL creation from the browser (gallery, visualize preview).

-- 3. Stripe webhook idempotency: Stripe retries deliveries and can send the same
--    event more than once; processing a duplicate re-runs subscription writes.
--    The webhook inserts the event id first and skips processing on conflict.
--    Service-role only — enable RLS with no policies.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
