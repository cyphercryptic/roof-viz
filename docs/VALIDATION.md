# Integration and full code-review validation — 18 September 2026

The unified app was checked without paid image generation, live payments, outbound email or customer-data writes. The full follow-up audit starts at commit `fd5d2d0` on `integration/unified-viz`; findings and remaining risks are in [CODE-REVIEW.md](CODE-REVIEW.md).

## Current automated results

- **67 Node test-runner checks pass** across access policies, invite/checkout/webhook routes, account/gallery recovery, analytics/status, quota rules, URLs, rate limiting, durable billing and render integration.
- **33 database checks pass** across both PGlite suites. They execute actual migrations through 023, plus the standalone atomic rate-limit migration, with database roles/RLS, tenant fixtures, transaction rollback and simulated lease interleavings.
- **Four additional fixture suites pass**: 503-product/domain routing and prompts; verified onboarding/callback/race handling; image format/size/upload/provider retry boundaries using Sharp; actual PDF generation using pdf-lib/Sharp for four categories, long content, aspect preservation and export access guards.
- **TypeScript passes**, including an explicit nonincremental check.
- **Full ESLint passes with zero errors and zero warnings.**
- **Dependency audit: zero reported vulnerabilities**, including development dependencies, at review time.
- **Source credential guard passes.** Two embedded privileged credentials were removed from current maintenance-script source. This checks known patterns in current files, not historical commits or credential validity. [Key retirement remains mandatory](CREDENTIAL-ROTATION.md).
- **Diff whitespace check passes.** No new runtime dependency was installed.

**Production Next.js webpack build passes**, including TypeScript, static generation and server-route compilation. The review branch deploys to the [protected Vercel preview](https://roof-viz-git-integration-unified-viz-cyphercryptics-projects.vercel.app); original production aliases remain unchanged.

## HTTP and artifact checks

Local HTTP checks after the fixes: home, login, signup, privacy, terms, password reset, robots, sitemap and both social images return200. Unauthenticated usage, analytics and onboarding-status requests return401. Two synthetic long-content PDF pages were rendered and visually inspected: no clipped content/footer overlap; portrait and wide images retain their proportions.

The earlier integration's read-only infrastructure checks found Roof customer-media buckets private and migration018's webhook table present. Category columns and020's processed-event table were absent. No live schema was changed during either review. Both inspected Doppler configurations use Stripe test mode; application Resend delivery is not configured. All five configured test prices were read-only verified against their application amounts, with PAYG using metered usage.

## What these checks do not prove

- No controlled browser session was available. Component fixtures, HTTP, source and build checks do not replace real desktop/mobile/keyboard or authenticated browser QA.
- PGlite runs real PostgreSQL-compatible SQL but serializes connections. It does not exercise Supabase Storage/PostgREST or concurrent independent network clients.
- Provider and Stripe calls are mocked. Model fidelity, real signup/email/reset/invite delivery, full subscription lifecycle and live usage delivery still need staged checks.
- The committed service-role key has **not** been retired. Current-file scanning and source removal do not secure its historical copies.
- Migrations019–023 require manual SQL Editor application with a compatible frontend. Preview hosting shares the Roof backend; it is not an isolated test database.
- PAYG stays disabled until the hourly retry schedule, protected worker, heartbeat and meter configuration are verified. A daily cron alone is insufficient. See [metering operations](metering-operations.md).
- Existing Window accounts/history remain in the independent service; migration requires the mapping and reconciliation in [UNIFIED-CUTOVER.md](UNIFIED-CUTOVER.md).

A successful review preview is not a claim that live client charging or onboarding is activated.
