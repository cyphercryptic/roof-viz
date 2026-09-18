# Integration validation — 18 September 2026

The unified app was checked without paid image generation, live payments, outbound email or customer-data writes.

## Passed

- Production Next.js webpack build, including TypeScript and 37 routes.
- Full ESLint: zero errors; 12 existing/reviewed warnings for unused code and raw tenant-logo images.
- `npm test`: domain fixtures cover all 503 products, all four generation categories, perspective/tenant validation, provider input contracts and canonical catalog imports; onboarding fixtures cover verified identity, safe callback destinations and race recovery; 37 individual policy/invitation/webhook/checkout tests pass.
- Actual migrations 019 and 020 run successfully against an ephemeral PostgreSQL-compatible PGlite database. Its 17 checks cover profile permissions, cross-tenant sharing, path normalization attacks, usage reservation, immutable results, billing reconciliation and atomic invitation seat limits.
- HTTP checks on the local app: home, login, signup, privacy, terms, password reset, robots, sitemap, and both social images return 200.
- Read-only infrastructure inspection: Roof photo/result buckets are private; migration 018's webhook table exists. Unified category columns and migration 020's new processed-event table are not present yet.
- Read-only Stripe test-price verification: all five configured prices are active USD prices matching application amounts; Pay As You Go uses metered usage. No customer, Checkout session, payment or subscription was created.
- Git base matches the fetched upstream main commit `9d88f21`; changes are isolated on `integration/unified-viz`.

## Deliberately unverified / required before launch

- No controlled browser session was available. HTTP, source and build checks are not a substitute for interactive desktop/mobile and keyboard QA.
- No live Supabase migrations were applied. Follow [UNIFIED-CUTOVER.md](UNIFIED-CUTOVER.md); use the SQL editor manually.
- Existing WindowViz accounts, subscription mappings and saved images are still in the independent Window service.
- Real authenticated signup/confirmation/reset/invitation, cross-tenant access, live webhook delivery, paid metering and generation fidelity need staged checks after database setup.
- Stripe is in test mode in both inspected Doppler configurations. Application email has no Resend key/verified sender.
- Stripe metering has an idempotent visualization identifier but no durable retry queue; reconcile failed reporting before relying on Pay As You Go revenue.
- An open checkout for another plan must be finished, expired or resolved through support before choosing a different plan, preventing duplicate subscriptions.

The deployment is a review preview, not a claim that live client onboarding or charging has been activated.
