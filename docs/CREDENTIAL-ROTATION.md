# Required: replace the exposed Roof Supabase service credential

The full code audit found a legacy `service_role` JWT embedded in both tracked `scripts/download-swatches.mjs` and `scripts/download-swatches-2.mjs`. Its decoded project reference is `gqqvxzxzuaevsuwazaqx` (Roof). The credential value was not printed or copied into this report. Current source now requires Doppler-provided environment variables and the build/test pipeline scans for known private credentials.

**Source removal does not revoke the credential.** Earlier commits and independent clones retain it. Treat it as compromised until its acceptance has been disabled; its validity was not tested by making a request with the leaked token. No project key has been created, disabled or revoked during this audit. No authenticated Supabase management connection was available to complete the replacement.

## Prepared rollout

1. In the **Roof project only**, open Supabase Settings → API Keys. Create a new secret key for the server and a publishable key for the client if these do not already exist. They coexist with legacy keys during migration.
2. Inventory consumers of this Roof project: original Roof production, the unified Vercel preview, Doppler `roofviz` dev/prd, maintenance scripts and any external jobs. Check Window's code/config for any inherited Roof-project credential; do not change unrelated projects. Never paste values into chat or source.
3. Store the replacement server key in Doppler's existing `SUPABASE_SERVICE_ROLE_KEY` variable and the publishable key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These application-defined names can hold the new opaque key values: the installed Supabase clients pass them to `createClient` without decoding JWTs. Preserve Doppler → Vercel synchronization and redeploy each actual consumer so build-time public configuration updates. Inspect any direct REST/Edge Function consumers separately for header compatibility.
4. Verify controlled authentication, RLS-protected reads, privileged server reads and uploads with the replacement keys. Confirm every active consumer has been migrated. Do not use the pending unified SQL migration as a prerequisite to updating the old production app's credentials.
5. Deactivate the **legacy API keys** in the Roof project's API Keys settings. This is the operation that prevents the leaked legacy credential being used as an API key. Confirm old-key rejection and new-key access without printing either key. Review project access logs for unexpected privileged activity.
6. Keep historical copies treated as exposed. Removing historical Git content is a separate, coordinated history rewrite; do not force-push shared branches as a substitute for retiring the key.

This is an API-key migration, not an instruction to rotate the project's JWT signing secret blindly. Supabase documents a coexistence/deactivation path for legacy API keys, with deactivation reversible if a missed consumer must be recovered. Follow the actual project dashboard's available controls and verify each step.

References checked during the audit: [Supabase API-key incident procedure](https://supabase.com/docs/guides/getting-started/api-keys#rotate-a-leaked-or-compromised-key), [migration to publishable and secret keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys). These explain the source of the retirement requirement; it is a confirmed exposed privileged credential, not a hypothetical warning.
