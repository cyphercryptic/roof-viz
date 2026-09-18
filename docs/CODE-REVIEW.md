# Full code review — 18 September 2026

Scope: the canonical unified app in `integration/unified-viz`, starting at `fd5d2d0`. Three specialist agents reviewed security/billing/database behavior, visualization/catalog/PDF behavior, and account/interface recovery. The integration lead reviewed API errors, rate limiting, deployment URLs, dependencies, instrumentation and the combined changes. This is a code audit with targeted reproductions, not a penetration-test certification.

## Critical action still required

Two tracked maintenance scripts contained a **Roof Supabase service-role credential**. The literal has been removed from current source and a source credential check is now part of build/test. **The exposed key must still be replaced and retired**; Git history and independent clones retain it. No authenticated Supabase management connection was available, and no key was changed. Follow [CREDENTIAL-ROTATION.md](CREDENTIAL-ROTATION.md) before relying on database isolation.

## Confirmed defects and fixes

| Priority | Defect reproduced | Correction |
|---|---|---|
| Critical | A privileged Roof service-role key was committed in two maintenance scripts. | Current source uses Doppler only; source scanning added. **Key retirement remains required**, with a prepared rollout. |
| High | Direct Supabase inserts bypassed paid sharing and could create nonexpiring public links. | Migration 021 checks subscription entitlement and expiration; public rendering also verifies current access. |
| High | Demo members had individual credits that bypassed the company's shared allowance. | Both limits are checked in the API and serialized database reservation. |
| High | Concurrent webhook reads could apply an older active snapshot after a cancellation, including events in the same second. | Customer lease before the Stripe read, fenced apply token, expiration and retryable delivery. |
| High | Rate limiting counted and inserted separately, ignored insert failures and admitted requests during DB failures. | Migration 022 atomically admits a request; unavailable admission returns 503 and exhausted allowance returns 429. |
| High | Pay As You Go could complete a render while silently losing its Stripe usage report. | Migration 023 commits completion/accounting/outbox together; a fenced worker retries stable events. New PAYG use requires explicit opt-in and a recent scheduler heartbeat. [Operations](metering-operations.md) remain a deployment gate. |
| Medium | Removed catalog products could never be restored because seed deduplication included inactive rows. | Import restores the original inactive record without duplicating it. |
| Medium | Window instructions prohibited white even when White was selected; glass/description choices were ignored. | Category prompts preserve the selected finish and include supported glass/custom details. |
| Medium | PDFs used a roofing title for every category, stretched photos and clipped long descriptions. | Category titles, image aspect preservation, wrapped text and additional pages. |
| Medium | Custom swatch uploads lacked an INSERT policy; repeated logo upserts lacked UPDATE permission. | Admin-only tenant-scoped storage policies; validated unique logo uploads and recoverable UI errors. |
| Medium | Clicking the selected opening category cleared its product while leaving its configurator complete. | Same-category clicks preserve the draft; actual switches clear incompatible choices. |
| Medium | Auth/profile failures could spin forever or redirect established accounts to setup; token refresh could discard drafts. | Bounded, retryable account loads; successful empty reads alone start onboarding; same-user refresh preserves workspace state. |
| Medium | Gallery reads hid DB failures, omitted results beyond the first 1,000 and failed an entire gallery when one image could not be signed. | Stable paging, explicit retry states and per-image recovery. |
| Medium | Analytics reported partial/zero totals after DB errors and allowed expired subscriptions. | Entitlement checks, deterministic paging, UTC day boundaries and retryable failures. Setup status similarly checks errors and active catalog entries. |
| Medium | Preview checkout return URLs and emailed links resolved to the old production app. | Trusted preview branch/deployment URL takes precedence in previews. |
| Medium | Image generation retried permanent provider errors; returned bytes could be mislabeled PNG; malformed uploads escaped parsing. | Image boundary hardening and offline provider/format regressions. |
| Low | Client monitoring used the legacy Sentry filename/import path, which could miss the default bundler's initialization. | Next.js client instrumentation entry and supported Sentry config export. |

## Verification

Final combined verification is recorded in [VALIDATION.md](VALIDATION.md). Test providers, Stripe calls and user sessions are mocked; database regressions execute real SQL in ephemeral PGlite with database roles and RLS. PGlite serializes connections, so the database tests do not claim an independent-connection load test. PDF output was rendered and visually inspected for long-content pagination and image proportions.

The production and development dependency audit reported **zero known vulnerabilities** at review time. This does not establish that every dependency is vulnerability-free.

## Remaining launch gates

- Apply the reviewed SQL manually, in order, following [UNIFIED-CUTOVER.md](UNIFIED-CUTOVER.md). The old Roof deployment shares this database; a preview is not backend isolation. No live SQL was applied during this audit.
- Configure and verify durable metering before enabling Pay As You Go. Stripe remains in test mode; do not treat a successful preview deployment as live billing activation.
- Configure application email and verify Supabase confirmation/recovery delivery.
- Perform authenticated cross-tenant, full billing lifecycle, model-fidelity, mobile, keyboard and browser checks after staged configuration. No controlled browser session was available here; source/component and HTTP checks are not browser end-to-end tests.
- Migrate Window accounts/history through an explicit mapping and reconciliation. Both existing production services and their data remain separate.
- Concurrent identical catalog imports from separate tabs can still create duplicates because catalog identity has no database uniqueness constraint. Sequential import/restore and the normal disabled-button flow are covered. This remaining low-priority consistency issue does not bypass billing or tenant permissions.
- PDF text uses the built-in Latin font; unsupported characters are safely substituted. Full international typography would require an embedded Unicode font.

No paid model generations, charges, customer-data changes or outward emails were used for this review.
