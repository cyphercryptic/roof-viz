# Roof Supabase credential rotation

**Status (2026-11-12): replacement API keys are deployed and the exposed legacy key is rejected on all tested routes. Legacy JWT signing-secret revocation remains pending additional management permission.** Target: Roof Supabase `gqqvxzxzuaevsuwazaqx`, verified from both Doppler configurations. Window remains separate and unchanged.

## Incident and completed changes

A legacy `service_role` JWT appeared in tracked `scripts/download-swatches.mjs` and `scripts/download-swatches-2.mjs`. Source cleanup alone did not revoke historical copies. A read-only check on 2026-11-12 initially confirmed that the historical key was accepted (HTTP 200) and matched Roof Doppler and Vercel settings. Connor authorized replacement and retirement and confirmed that there are no contractor customers yet.

Created these replacement API keys (identifiers below are metadata, not credential values):

| Use | Name | Key ID |
|---|---|---|
| Browser | `exteriorviz_browser_2026_11` | `0e626cff-a801-4d7c-bcb7-c6a828edba4a` |
| Application server | `exteriorviz_app_2026_11` | `2839dd40-b2e2-434a-be7e-48ff16947bdc` |
| n8n monitor | `exteriorviz_monitor_2026_11` | `27c1890a-b2ad-4d95-8bf0-dc7c20d361a8` |

- Updated Doppler `roofviz/dev` and `roofviz/prd`: `NEXT_PUBLIC_SUPABASE_ANON_KEY` now holds the publishable key; `SUPABASE_SERVICE_ROLE_KEY` holds the application secret key. Readback equality was verified without printing values. No unlock was required.
- Updated and verified Vercel project `roof-viz` (`prj_V1vaCRRspMWAfxptfGCAg1iPXTWD`, team `team_CmrLwAbsrBBsaooLvE8TgHU2`) for development, preview and production. These environment entries are not identified as integration-managed, so actual values were verified explicitly rather than assuming Doppler sync. `SUPABASE_ACCESS_TOKEN` is absent from Vercel.
- Updated dedicated n8n Supabase credential `Bar9 Monitor roofviz DB` (`8QGs2Tv8bh2WUanm`) with the monitor key and restricted its HTTP Request use to `gqqvxzxzuaevsuwazaqx.supabase.co`. It is used only by `HTTP - RoofViz Database` in active `WF-MAINT-01: Build Health Monitor` (`gsdVGiEr9orOdbnN`). Credential metadata confirms the update; the workflow graph was unchanged. The full monitor was not manually run because it can send email.
- Removed embedded legacy-key fallbacks from the original Roof `main` scripts, using the already-sanitized unified versions. The script bodies after configuration are identical. Committed/pushed as `3f6d052`. Both scripts pass `node --check`, and the source credential guard passed from the original checkout.
- Removed the superseded Supabase entries from original Roof's ignored `.env.local`; local development and maintenance scripts must use Doppler. No new secret was written to a local env file.
- Rebuilt original Roof production from `main` and the unified feature preview with replacement keys. No unified production promotion, database migration or Window data migration occurred.
- Disabled legacy API keys using `PUT /v1/projects/{ref}/api-keys/legacy?enabled=false`; a separate readback confirmed `enabled=false`. Initial requests still accepted the old key during propagation. Later requests rejected it; do not infer enforcement from the settings response alone.

## Deployment and access verification

| Deployment | ID | Commit | Result |
|---|---|---|---|
| Original Roof production | `dpl_8SAvCnKZqfzHc5MNSN4k2otz6CfH` | `3f6d052` | Ready |
| Unified preview | `dpl_CUBq21rLyKeVLT4qwkBG5ArGXLB3` | `b5d5401` | Ready |

Production: https://roof-viz.vercel.app (immutable: https://roof-fqm53m4bk-cyphercryptics-projects.vercel.app).
Unified preview: https://roof-viz-git-integration-unified-viz-cyphercryptics-projects.vercel.app (immutable: https://roof-mkp3jq9vv-cyphercryptics-projects.vercel.app).

For both production and the stable preview alias, `/` and `/login` returned **200**, unauthenticated `/api/billing/usage` returned **401**, and fetched login JavaScript bundles contained the replacement publishable key. Deployment protection stayed enabled.

Fresh API checks after legacy deactivation propagated:

| Check | HTTP result |
|---|---|
| Historical exposed key as `apikey` and Bearer token against REST | **401** |
| Historical exposed Bearer token plus replacement publishable key against Auth admin | **401** |
| Historical exposed Bearer token alone against Storage | **401** |
| Replacement server key against REST | **200** |
| Replacement publishable key against Auth settings | **200** |

The new monitor key also passed its read-only database check. The new publishable key's anonymous profile query returned zero rows. The new application key successfully uploaded a temporary one-pixel image, created a signed URL and downloaded matching bytes; the temporary object was then removed. No existing object was modified.

A controlled owner sign-in check was skipped because no confirmed `connor@bar9.ai` Auth user was found; no account was created and no login email was sent. Full authenticated browser QA, provider generation, billing flows and the monitor's scheduled execution remain outside this verification.

## Remaining step: remove legacy JWT trust

The current [Supabase incident-recovery guide](https://supabase.com/docs/guides/security/rotate-leaked-api-keys) explicitly requires revoking the legacy JWT secret when a legacy service-role key leaked. A legacy API key is also a signed JWT; API-key deactivation and signing-key trust are separate controls. Do not treat the tested gateway rejection as verification that the legacy signing secret is revoked.

The supplied management token had API Keys and API Key Secrets permissions, but both signing-key GET endpoints returned **403** with `Missing required permission(s): auth_signing_keys_read`. Connor was asked to add **Auth Signing Keys: Read-write** to the same Roof-only token (or recreate it) and save it in Doppler `roofviz/dev` as `SUPABASE_ACCESS_TOKEN`. Existing rotation authorization persists. The token remains in dev pending this step and was not deployed to Vercel.

Continuation procedure:

1. Read `GET /v1/projects/{ref}/config/auth/signing-keys` and `/config/auth/signing-keys/legacy`, printing only IDs, algorithms and statuses. The public JWKS already advertises ES256 key `3a4e54a5-0d7c-4013-8dc5-60accbbbfcfe`; its current/standby status is unverified until management access works.
2. Follow the [JWT signing-keys guide](https://supabase.com/docs/guides/auth/signing-keys). If a modern key is already current, do not create/rotate another unnecessarily. If required, import the legacy secret into the signing-key system, create an ES256 standby key and rotate it into use through the documented APIs. Respect the platform's transition cooldowns.
3. Revoke the legacy key by changing its status, **not permanently deleting it**. Existing test sessions may need to sign in again. App code verifies users with Supabase `auth.getUser()` and has no direct JWT-secret verifier or Edge Function invocations in either checkout. No customer data/schema should change.
4. Confirm management status is revoked, rerun the old-key rejection matrix and new-key access checks, and recheck deployed public/auth-boundary routes. Keep legacy API keys disabled.
5. Update this report and the handoff, remove temporary management credentials from app configuration when no longer needed, and commit only the session's changed files. The pre-existing landing-page edits are Connor's separate work.

Access-log review was not performed: the supplied token did not include Logs permission. Do not claim historical misuse was ruled out. Do not re-enable exposed keys or force-push Git history as a substitute for retirement. Window project `gpvpfesbdcnhsyylvwtp` uses separate credentials and needs no changes for this incident.
