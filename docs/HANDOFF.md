# ExteriorViz — Handoff

**Status:** Replacement Roof API keys are deployed and exposed-key rejection is verified. Legacy JWT signing-secret revocation awaits additional management permission; manual schema changes and live-service verification remain launch gates.
**Last session:** 2026-11-12 — Codex for Connor
**Preview:** https://roof-viz-git-integration-unified-viz-cyphercryptics-projects.vercel.app · **Repo:** https://github.com/cyphercryptic/roof-viz · **History:** [HANDOFF_LOG.md](HANDOFF_LOG.md)
**Branch:** `integration/unified-viz` · **Latest application commit:** `370df61` (after integration `fd5d2d0`). Original production/main and Window data have not been cut over.

## Start here (next session)
1. Finish [CREDENTIAL-ROTATION.md](CREDENTIAL-ROTATION.md): replacement keys are deployed and legacy API keys are disabled with rejection verified. Complete legacy JWT signing-secret revocation after Connor adds Auth Signing Keys: Read-write to the Roof-only token. Do not re-enable the exposed keys or print credentials.
2. Fetch the RoofViz repo and work on `integration/unified-viz`. Check local changes and remote drift before editing; the original `main` checkout is not the unified app. Read this handoff and [CODE-REVIEW.md](CODE-REVIEW.md).
3. Follow [UNIFIED-CUTOVER.md](UNIFIED-CUTOVER.md): confirm backups/current state, then coordinate manual SQL Editor application of 019–023 and a compatible frontend. The preview shares the Roof backend; do not treat it as an isolated test database.
4. Verify auth redirects/delivery, controlled account and browser flows, billing and image fidelity after setup. Keep PAYG disabled until its hourly worker, heartbeat and Stripe meter are verified. Plan Window account/history mapping before moving existing users.

## Open items
- [ ] Finish legacy JWT signing-secret revocation and review access logs. Replacement API keys, consumer updates, deployment rebuilds and old-key rejection/new-key access are verified; signing-key access is currently blocked by token scope.
- [ ] Obtain a recoverable database/object backup, repeat live inventory, and manually apply migrations 019–023 in order during a coordinated cutover. Live schema, RLS and Supabase Storage/PostgREST behavior remain unverified after these changes.
- [ ] Verify the preview/production Supabase Auth allowlist and actual signup, confirmation, onboarding, password recovery and invitation flows with controlled accounts.
- [ ] Configure application email (`RESEND_API_KEY`, verified `EMAIL_FROM`) and verify client delivery. Test Supabase Auth email separately; it uses a different delivery path.
- [ ] Configure live Stripe resources/secrets intentionally and test checkout, webhook delivery, cancellation/renewal and entitlement changes. Inspected dev/prd credentials are test mode; no live charges were made.
- [ ] Before enabling PAYG, verify an existing hourly-or-more-frequent scheduler, protected worker, heartbeat, meter mapping, sandbox delivery and reconciliation. The daily Vercel cron alone is insufficient; fixed plans do not require the worker.
- [ ] Migrate Window users, tenant membership, products, history, objects and subscription mappings with explicit identity mapping and count/checksum reconciliation. None of that data has moved.
- [ ] Perform real desktop/mobile/keyboard browser QA, authenticated cross-tenant checks and staged provider-fidelity tests across all four categories and relevant perspectives. Offline mocks/HTTP checks do not prove these flows; no paid model calls were made.
- [ ] Exercise independent concurrent clients for quota, invitation and billing races. PGlite executes real SQL but serializes its connections.
- [ ] Resolve remaining lower-priority catalog consistency risk: simultaneous identical imports can duplicate products without a database uniqueness constraint.
- [ ] If international PDF text is required, embed a Unicode font; current Latin-font export safely substitutes unsupported characters. Confirm whether clients need additional manufacturer-option controls; the form exposes only part of the optional attribute model.
- [ ] Minor UI polish: mobile landing-menu Escape dismissal should restore focus to its trigger; complete this during keyboard QA.
- [ ] Choose final branding/custom URL when desired (working name ExteriorViz; Vercel hostname is sufficient for preview), promote only after launch gates pass, and recheck the branch alias after future pushes.

## Last session (2026-11-12, credential rotation)

Replaced Roof API credentials at Connor's request and rebuilt the existing app deployments. **Gateway retirement is verified; legacy JWT signing-secret revocation remains pending Auth Signing Keys permission.** See [CREDENTIAL-ROTATION.md](CREDENTIAL-ROTATION.md) for key IDs, consumers, verification evidence and exact continuation steps.

- New publishable/application-secret keys are stored in Doppler `roofviz/dev` and `roofviz/prd`, and verified in Vercel across all three environments. A separate secret key is saved in the dedicated n8n Roof monitor credential; the workflow graph was unchanged.
- Original Roof scripts no longer have embedded-key fallbacks (`main` commit `3f6d052`, pushed). Its ignored local Supabase overrides were removed in favor of Doppler.
- Original Roof production `dpl_8SAvCnKZqfzHc5MNSN4k2otz6CfH` and unified preview `dpl_CUBq21rLyKeVLT4qwkBG5ArGXLB3` are Ready with replacement keys. Both public/login routes returned 200, unauthenticated usage returned 401, and login bundles contain the new publishable key. No unified production cutover occurred.
- Legacy API keys report disabled. After propagation, the exposed key returned **401** through REST, Auth with a replacement public key, and Storage; replacement access returned **200**. New-key storage upload, signed download, byte comparison and cleanup passed. Anonymous profile access returned zero rows.
- Supabase's current incident procedure also requires revoking the legacy signing secret. Signing-key reads returned 403 (`auth_signing_keys_read` missing); Connor was asked to add Auth Signing Keys: Read-write to the Roof-only management token in Doppler. Do not ask for rotation approval again.
- No confirmed `connor@bar9.ai` Auth user was available for the optional login check. No test user, email, paid render, charge, schema migration or Window migration was created/performed. No historical access-log review or full browser QA was done.
- Preserved the three pre-existing landing-page edits. Original source credential guard and script syntax checks passed; the earlier fresh 68 Node tests, four fixture suites, ESLint and TypeScript evidence remains unchanged.

## Gotchas (durable)
- Roof is the canonical backend: `gqqvxzxzuaevsuwazaqx`. Window remains separate: `gpvpfesbdcnhsyylvwtp`. Do not replay Window's historical SQL into Roof; the additive unified migrations preserve roofing fields.
- Apply SQL manually in Supabase SQL Editor. Never run CLI migrations or `supabase db push`. Migrations 020–023 change permissions/contracts shared with the old Roof app; rolling back only the frontend may be incompatible.
- Secrets belong in Doppler (`roofviz` dev/prd) with existing Vercel synchronization. Never copy values into code, docs or Git. Do not access unrelated family projects.
- `PAYG_METERING_ENABLED` and `PAYG_RETRY_SCHEDULE_CONFIRMED` remain off until verified. A stale worker heartbeat fails closed; do not hide errors by bypassing the gate or blindly replay ambiguous billing events.
- The existing Vercel project is `roof-viz`; pushing this feature branch creates a protected preview, not a new isolated backend or production cutover. Use `vercel curl` for protected HTTP checks; keep deployment protection enabled.
- Local dependencies may be symlinked in a worktree; use webpack for local dev/build. On a fresh machine, install from the existing lockfile. Read installed Next.js 16 docs before code changes; current error boundaries use `retry`.
- The 503 catalog variants are choices available to import, not prepopulated tenant products. Each generation changes one category; a simultaneous whole-house makeover is not implemented.

- Missing migration 022 deliberately makes rate-limited routes return 503. Do not weaken the guard to make an unconfigured preview appear functional.
- Disabling PAYG enrollment flags leaves the authenticated worker available to drain existing usage; retain the scheduler and credentials while a backlog exists.

## How to verify

From the repository root, with project-scoped Doppler configuration:

```sh
npm ci                                      # fresh checkout only
npm test                                    # offline fixtures; no paid providers
npm run lint
npx tsc --noEmit --incremental false
doppler run -- npm run build -- --webpack
doppler run -- npm run dev -- --webpack --port 4382
vercel inspect https://roof-78r4imih9-cyphercryptics-projects.vercel.app
vercel curl / --deployment https://roof-78r4imih9-cyphercryptics-projects.vercel.app -- --silent --output /dev/null --write-out '%{http_code}\n'
```

For the 33 real-SQL checks, use the pinned external PGlite installation and `PGLITE_MODULE=… npm run test:database` commands in [tests/security/README.md](../tests/security/README.md). No production database is contacted. Local public routes should return 200; unauthenticated API usage/analytics/onboarding requests should return 401. Do not invoke generation, account email or payment flows during ordinary unpaid smoke checks.

## Key files / state

- [UNIFIED-CUTOVER.md](UNIFIED-CUTOVER.md): manual SQL order, backup/cutover/reversal and separate Window migration plan.
- [CREDENTIAL-ROTATION.md](CREDENTIAL-ROTATION.md): urgent credential retirement rollout; no secret values.
- [metering-operations.md](metering-operations.md): PAYG activation, hourly scheduling, heartbeat and reconciliation.
- [CODE-REVIEW.md](CODE-REVIEW.md) / [VALIDATION.md](VALIDATION.md): dated audit and verification evidence; current open status lives in this handoff.
- [supabase/migrations](../supabase/migrations): unified 019–023 plus historical Roof schema; [tests/security](../tests/security): offline route and database checks.
- Vercel project `prj_V1vaCRRspMWAfxptfGCAg1iPXTWD`, team `team_CmrLwAbsrBBsaooLvE8TgHU2`; original production `https://roof-viz.vercel.app` remains separate from the review preview.
- Last recorded read-only counts (2026-09-18; repeat before migration): Roof 2 tenants / 2 profiles / 84 products / 30 visualizations; Window 2 / 2 / 257 / 35.
- The prior live progress board/local development server are session conveniences, not durable handoff dependencies. Use the repository and deployed preview from either machine.
