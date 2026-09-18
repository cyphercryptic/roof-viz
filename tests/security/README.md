# Security regression checks

Run policy and webhook fixture tests with no secrets or external calls:

```sh
npm test
```

The database tests execute the actual migration in PGlite (ephemeral WASM PostgreSQL), with two tenants and real database roles/RLS. Install the test engine outside the app so production dependencies stay unchanged:

```sh
npm install --prefix /tmp/viz-security-test --no-audit --no-fund @electric-sql/pglite@0.5.8
PGLITE_MODULE=/tmp/viz-security-test/node_modules/@electric-sql/pglite/dist/index.js npm run test:database
```

The fixture supplies only Supabase's auth identity functions and table grants, then runs the repository migrations. It exercises profile insertion, tenant mutation, generation reservation, browser result forgery, cross-tenant share insertion/update, delinquent billing, webhook RPC permissions, failed reconciliation rollback/retry, duplicate and stale delivery.

PGlite verifies PostgreSQL statements and role behavior but does not exercise Supabase Storage, PostgREST or concurrent independent network connections. Production migration application and authenticated end-to-end smoke tests remain required. All SQL must be applied manually in the Supabase SQL Editor according to project instructions.

Checkout fixtures (`node --test tests/security/checkout.test.mjs`) cover DB read/write failures, stable customer/session idempotency keys, metered quantity omission, incompatible price configuration, existing and delinquent Stripe subscriptions, reuse of open sessions, different-plan conflicts, and sessions opened/completed during earlier reads. Stripe is fully mocked; no session, customer, payment, or subscription is created externally.

Official API references: [Checkout create](https://docs.stripe.com/api/checkout/sessions/create), [Checkout list](https://docs.stripe.com/api/checkout/sessions/list), [Idempotent requests](https://docs.stripe.com/api/idempotent_requests), [Subscription list](https://docs.stripe.com/api/subscriptions/list). Installed Stripe CLI 1.40.6 does not support `stripe docs`; official documentation was read through the web fallback. Existing SDK and account settings were preserved.

The second review adds real SQL checks for sharing entitlements, demo pooled limits, storage permissions, webhook leases, rate admission and the metering outbox. Route/component fixtures cover error recovery, preview URLs, gallery pagination and billing retry behavior. Image/PDF suites run actual Sharp/pdf-lib locally with generated test images. `npm test` and the production prebuild also run `npm run check:secrets`; this scans known private-key formats in current source without printing matched values. It does not scan Git history or prove key retirement.
