# ExteriorViz — Handoff

**Status:** Unified app and hardening are pushed; review preview is Ready. The exposed Roof service-role key is confirmed active (2026-11-12); rotation awaits Supabase management access. Production activation also requires manual schema changes and live-service verification.
**Last session:** 2026-11-12 — Codex for Connor
**Preview:** https://roof-viz-git-integration-unified-viz-cyphercryptics-projects.vercel.app · **Repo:** https://github.com/cyphercryptic/roof-viz · **History:** [HANDOFF_LOG.md](HANDOFF_LOG.md)
**Branch:** `integration/unified-viz` · **Latest application commit:** `370df61` (after integration `fd5d2d0`). Original production/main and Window data have not been cut over.

## Start here (next session)
1. Prioritize [CREDENTIAL-ROTATION.md](CREDENTIAL-ROTATION.md): the previously committed Roof service-role key is confirmed active. Obtain Roof-scoped management access, then replace and retire it. Source cleanup does not revoke historical copies. Inventory and safely migrate all consumers before deactivation; do not print keys or rewrite shared Git history.
2. Fetch the RoofViz repo and work on `integration/unified-viz`. Check local changes and remote drift before editing; the original `main` checkout is not the unified app. Read this handoff and [CODE-REVIEW.md](CODE-REVIEW.md).
3. Follow [UNIFIED-CUTOVER.md](UNIFIED-CUTOVER.md): confirm backups/current state, then coordinate manual SQL Editor application of 019–023 and a compatible frontend. The preview shares the Roof backend; do not treat it as an isolated test database.
4. Verify auth redirects/delivery, controlled account and browser flows, billing and image fidelity after setup. Keep PAYG disabled until its hourly worker, heartbeat and Stripe meter are verified. Plan Window account/history mapping before moving existing users.

## Open items
- [ ] Replace and retire the exposed Roof service-role credential, verify old-key rejection/new-key access, and review access logs. Historical/original copies remain exposed; a read-only HTTP check confirmed the key is still accepted on 2026-11-12.
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

## Last session (2026-11-12, Codex for Connor)

Investigated the Supabase credential incident at Connor's request. **Rotation is not complete:** the historical exposed Roof service-role key was accepted by a read-only request (HTTP 200). Supabase management access is required to create replacements and disable legacy API keys; no management token or connected Supabase management tool was available, and the browser access host was unavailable. Connor was asked to supply a short-lived, Roof-only management token through Doppler, not chat.

- Confirmed Roof `dev` and `prd` in Doppler and Vercel's shared development/preview/production environment entry still use the exposed server key. Their client keys are also legacy JWTs. Window `dev`/`prd` point to the separate Window project and do not use the exposed Roof key.
- Identified an additional consumer: active n8n `WF-MAINT-01: Build Health Monitor` (`gsdVGiEr9orOdbnN`), node `HTTP - RoofViz Database`, credential `Bar9 Monitor roofviz DB` (`8QGs2Tv8bh2WUanm`, `supabaseApi`). Credential metadata confirms it is used only by that workflow. Update this credential during rotation without changing the workflow graph.
- Vercel CLI access works with scope `cyphercryptics-projects`; the connected Vercel plugin returned project-not-found for the same known project. Production is Ready at `dpl_J3WPj2RHtvA6mkyGfP8FV3TEZHPY` / commit `9d88f21`; current unified preview is Ready at `dpl_4dB92c9bdD2hVmQvisefobnjvnuL` / commit `310ff9f`. Rebuild each source with replacement keys; do not promote the unified app as part of credential replacement.
- Source/client constructors accept replacement API keys through the existing environment-variable names. The original Roof checkout also has ignored `.env.local` Supabase variables; normal development should use Doppler so stale values are not used.
- Fresh local verification: source credential guard, four fixture suites, **68 Node tests**, ESLint and TypeScript passed. No production build, PGlite suite, browser flow, paid generation, email or checkout test was run.
- Preserved pre-existing uncommitted changes in `src/app/page.tsx`, `src/components/landing/Landing.module.css`, and `src/components/landing/MobileNav.tsx`: landing pricing and Escape-focus restoration. The handoff's mobile-menu item is implemented locally but still needs browser review and a separate commit.
- No keys, app configuration, workflow, schema, account or production deployment were changed. A documentation push can create a new branch preview automatically. No secret values were printed or saved in this report. See [CREDENTIAL-ROTATION.md](CREDENTIAL-ROTATION.md) for the current consumer inventory and continuation steps.

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
