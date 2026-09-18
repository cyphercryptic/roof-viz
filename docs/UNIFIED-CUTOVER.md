# ExteriorViz launch and cutover

Operator runbook · 2026-09-18 · prepared without live mutations.

The unified app uses **RoofViz Supabase `gqqvxzxzuaevsuwazaqx`**. The WindowViz database, accounts, photos, history and subscriptions have **not** been moved. Existing source deployments remain available. Application integration does not itself consolidate their data.

Recorded read-only inventory at handoff; repeat before any migration:

| Database | Tenants | Profiles | Products | Visualizations |
|---|---:|---:|---:|---:|
| Roof / canonical | 2 | 2 | 84 | 30 |
| Window `gpvpfesbdcnhsyylvwtp` | 2 | 2 | 257 | 35 |

The merged static catalog has 503 variants, including one marked coming soon. These are choices available to import, not 503 existing tenant products. Each render changes one selected category; a combined whole-house makeover is not implemented.

## 1. Confirm the destination and preserve recovery

- Work from this unified checkout and record its Git commit plus the current Roof Vercel deployment URL/ID. Its existing Vercel link is `roof-viz`; do not assume this checkout targets a new hosting project.
- Confirm Vercel's Supabase URL identifies **`gqqvxzxzuaevsuwazaqx`**. Keep secret values in Doppler/Vercel; do not put credentials in this runbook or commit them.
- Obtain a recoverable database backup and a private object inventory using existing backup tooling. Preserve bucket/path/size metadata and recoverable copies of customer objects. Confirm recovery before schema work; do not purchase backup upgrades implicitly.
- Preview and review the unified build first. Reserve a short cutover window with no Roof signups, renders, catalog writes, or checkout attempts. Window remains independent. Migration 020 changes permissions on the database shared with the old Roof frontend, so a second Vercel preview is **not** backend isolation.

## 2. Inspect current state — read-only SQL

Run these in the **Roof project's SQL Editor**. Save counts and metadata privately. They do not alter data.

```sql
SELECT 'tenants' AS entity, count(*) FROM public.tenants
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'products', count(*) FROM public.products
UNION ALL SELECT 'visualizations', count(*) FROM public.visualizations;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'products' AND column_name IN
       ('style','category','line','material','attributes','reference_image_url'))
    OR (table_name = 'visualizations' AND column_name IN ('category','perspective'))
    OR (table_name = 'subscriptions' AND column_name = 'stripe_event_created'))
ORDER BY table_name, column_name;

SELECT id, public FROM storage.buckets
WHERE id IN ('house-photos','visualizations','logos','product-swatches');
SELECT policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

SELECT to_regclass('public.stripe_webhook_events') AS legacy_018_ledger,
       to_regclass('public.stripe_processed_events') AS completed_020_ledger;
SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger
WHERE tgrelid IN ('public.visualizations'::regclass, 'public.profiles'::regclass)
  AND NOT tgisinternal;
SELECT proname, prosecdef, proconfig, proacl FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('guard_visualization_insert','apply_stripe_subscription_event');

SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated')
  AND table_name IN ('profiles','visualizations','stripe_processed_events');
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles','visualizations','shared_links','subscriptions','stripe_processed_events');

-- Every tenant must have subscription state before fail-closed quota checks.
SELECT t.id AS tenant_missing_subscription
FROM public.tenants t LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
WHERE s.id IS NULL;
SELECT plan, status, count(*) FROM public.subscriptions GROUP BY plan, status;
```

Expected after setup: customer media buckets private; logos/swatches public; the blanket `Public can view shared visualization images` policy absent; roofing `style` retained; all new category fields present; quota trigger installed; completed-event ledger protected by RLS; no authenticated/anonymous profile INSERT, visualization UPDATE/DELETE, or completed-ledger access. All required tenant subscription rows must exist. If checks disagree, investigate before promotion; do not work around missing billing state by granting unlimited access.

## 3. Apply SQL manually, in order

**Use Supabase SQL Editor only. Do not run `supabase db push`, CLI migrations, or replay Window's historical migrations.** The canonical project must already have its Roof migrations 001–017, including profile privilege protection. Verify actual objects, not just migration numbers.

1. Verify the effects of [018_private_storage_and_webhook_events.sql](../supabase/migrations/018_private_storage_and_webhook_events.sql). If absent, paste and run that file first. It ensures the four buckets, makes customer media private, removes the blanket public read policy, and adds the legacy webhook ledger. Use a signed-URL-compatible frontend when making media private.
2. Paste and run the complete [019_unified_product_categories.sql](../supabase/migrations/019_unified_product_categories.sql). It adds category/configuration fields and indexes while retaining roof `style`, IDs and history. Existing rows default to roofing/exterior. The file ends with read-only category counts.
3. Paste and run the complete [020_security_boundaries.sql](../supabase/migrations/020_security_boundaries.sql). It locks profile provisioning and job updates to server paths, enforces share ownership, reserves visualization quota atomically, and installs the completed-only Stripe event ledger/RPC.
4. Repeat the checks above. Existing entity counts must remain unchanged by these schema files. Verify `style` values and existing photo paths are intact. Review any SQL error before continuing; 019 and 020 each use a transaction.

Migration 018's ledger is retained for history; the unified webhook uses 020's completed-only ledger. Do not delete or reuse the old ledger to suppress new webhook deliveries.

## 4. Promote and smoke-test

1. Confirm the final build includes the 019/020-aware server routes, auth callback, onboarding, and signed media URLs. Run the documented local checks, including `node scripts/test-unified-domain.cjs` and the security tests supplied in `scripts/`, plus typecheck, lint and production build.
2. Configure the intended stable site URL through the existing Doppler → Vercel integration. A Vercel hostname is sufficient; a purchased/custom domain is not required. If using a preview for auth testing, explicitly use that preview's URL so links do not silently return to the old production app.
3. In canonical Supabase Auth, verify Site URL and allowed redirects for the actual host and `/auth/callback` flow; retain required legacy redirects during transition. Test confirmation, login, reset-password, onboarding recovery and invite acceptance with controlled accounts. Supabase Auth email delivery is separate from application Resend email.
4. Promote the reviewed unified deployment during the reserved window. Confirm the configured Stripe webhook endpoint is the unified host's `/api/billing/webhook` and that its signing secret matches the selected Stripe mode. Replay failed **test** events after the new RPC exists; do not fabricate successful payment status.
5. Verify existing Roof login/history and private previews; import a few products in each category; check duplicate imports, category selection, interior/exterior choice, gallery sharing/revocation and proposal download. Test an unauthenticated and a second-tenant session for access denial. Avoid clicking Generate during unpaid smoke checks.
6. Reopen writes after checks pass. Keep the original Window deployment and database intact. Update public entry links only after the unified app is verified.

## 5. Gates before charging clients

- **Billing is currently test mode:** both `roofviz` Doppler dev/prd use Stripe test credentials. Price variable names are configured for `STRIPE_PRICE_PAY_PER_USE`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`, and `STRIPE_PRICE_BUSINESS_PRO`; presence alone does not prove the prices, amounts, currency, cadence or meter are correct. Complete checkout/webhook/cancel/renewal tests. Real billing requires an intentional live-mode setup with matching live prices, webhook secret and customer/subscription mappings. Test resource IDs cannot simply be reused as live resources. Do not charge a real card to test readiness.
- **Application email is not configured:** no `RESEND_API_KEY` or verified sender was present in the inspected Roof configurations. Configure a verified sender and `EMAIL_FROM` before promising invitations/welcome email delivery to clients. Until then, use the application's explicit manual invite-link fallback. Verify Supabase confirmation/reset email delivery independently.
- **Image fidelity is unverified:** offline tests mock the provider. No paid live render was run in this integration. Before selling, perform a small, explicitly budgeted check of roofing, exterior/interior windows, patio doors including a hinged variant, and entry doors. Inspect preservation of the original building, frame/trim separation and color. These are visual concepts, not measurements or installation guarantees.
- **Database and real user flows remain deployment gates:** offline tests and a successful build do not verify live RLS, auth delivery, webhook configuration or migrations. Record which manual checks actually passed.

## 6. Reversal without losing customer work

If checks fail, stop new signups/renders/checkouts and retain the database, storage and current event ledger. Prefer a forward fix or a previously tested **schema-compatible unified build**. Do not drop new columns/tables, reopen public media, undo security permissions, or restore an old database over new customer writes just to roll back the frontend.

The pre-merge Roof build is not an automatic rollback target after 020: its client writes and webhook handling may expect old permissions/contracts. Verify compatibility before promoting it. If full recovery is unavoidable, assess all writes since the backup and prepare a preservation/replay plan first; restoring data is a separate destructive action requiring explicit approval. Window's independent deployment can continue serving its existing customers throughout.

## 7. Separate Window account/history migration

Plan this as a later controlled import; nothing in 019/020 moves Window data.

1. Inventory Window Auth users, identities, tenant membership, catalog/history, sharing, object paths and Stripe mappings. Compare UUID collisions and ownership to Roof. Store a private source→destination mapping; never merge accounts merely because emails match. Have the account owner confirm any intentional linkage.
2. Choose a supported Auth migration or reauthentication/onboarding path. Preserve source user UUIDs where safely possible; otherwise remap every profile/creator/invite reference. Do not copy project-specific sessions/tokens or assume passwords transfer automatically. Preserve tenant/product/visualization IDs where collision-free; record explicit remaps otherwise.
3. Import tenant/identity/profile/product dependencies before history and links. The 020 job-insert guard rejects historical completed rows and replaces timestamps, so historical import requires a reviewed, privileged maintenance procedure—not normal `/api/visualize` inserts or casual trigger disabling. Preserve source status, timestamps, prompts and attribution. Assess whether imported history should affect the canonical billing allowance before import.
4. Copy customer objects into private canonical buckets; preserve mapped tenant prefixes and filenames, verify byte counts/checksums, then update stored paths if IDs changed. Copy any required logos and product assets separately. Do not republish private photos or reuse expired signed URLs as permanent paths.
5. Keep Stripe customer/subscription IDs and mode/account provenance in the migration map. They are external references, not new subscriptions to recreate blindly. Verify the same Stripe account/mode, product/price mapping, billing period, webhook ownership and metering identity before moving entitlement management. Never double-subscribe or double-bill a client. Window's seat/team contracts also need explicit mapping to the canonical fixed plans.
6. Reconcile per-tenant counts, foreign keys, objects, permissions, links and billing totals against the source snapshot. Then let a controlled Window account verify its history in the unified app. Only after acceptance switch its entry point. Retain the source data/deployment for an agreed recovery period; deletion is a separate explicit decision.
