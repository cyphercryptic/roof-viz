# ExteriorViz

Roofing, window and door visualization for contractor sales teams. This unified Next.js application combines RoofViz's private customer-photo storage and shared workspace foundation with WindowViz's category-aware products and configurators.

## Project location

The integration checkout is `/Users/connor/Viz Merge/app`, on `integration/unified-viz`. It is a git worktree of the RoofViz repository. The original RoofViz and WindowViz folders, deployed applications and databases are preserved.

- Shared live build board: http://127.0.0.1:4381
- Local application preview: http://localhost:4382 (while the development server is running)
- Public product name: **ExteriorViz**, a working name; no custom domain purchased.

## Main experience

- Public website with original / AI-preview examples for roofing, windows and doors. Examples use existing promotional assets and do not call a generation API.
- One company account and team workspace.
- Product categories: roofing, windows, sliding glass doors and entry doors.
- Customer photo upload, category-specific product configuration, generation, saved previews, sharing and PDF proposals according to plan permissions.
- Email confirmation, company onboarding, password recovery and verified team invitations.

AI previews are illustrative. They are not measurements, specifications or guarantees of the installed result.

## Local development

Dependencies use the existing npm lockfile. This local worktree may have `node_modules` symlinked to the RoofViz checkout; a fresh clone should run `npm ci`.

Use the configured Doppler project; do not copy secrets into source or commit environment files.

```sh
doppler run -- npm run dev -- --webpack --port 4382
```

The `--webpack` option supports the local symlinked dependency layout. Production uses the configured build script.

## Checks

```sh
npm run lint
npx tsc --noEmit
doppler run -- npm run build -- --webpack
npm test
```

Generation tests must be mocked or explicitly planned; do not spend image-generation credits in ordinary smoke checks. A production build validates compilation, not live email delivery, Stripe payment fulfillment or model output quality.

## Launch dependencies

The unified product needs the new category and security migrations in `supabase/migrations/`. Follow [the integration runbook](docs/UNIFIED-CUTOVER.md) before production cutover. RoofViz and WindowViz use distinct database projects; do not replay WindowViz's historical migration sequence into RoofViz.

**Apply migrations manually in the Supabase SQL editor. Do not use Supabase CLI migrations.** Code changes alone do not update the live schema or database permissions.

Existing WindowViz users, subscriptions, saved photos and generated results remain in the original WindowViz service until a mapped migration is performed. They are not automatically available in the unified account.

Before signing on clients, verify the schema/security changes, auth redirect URLs, invitation and recovery email delivery, subscription fulfillment, private photo sharing, and a deliberately authorized generation test. The currently configured email sender may be limited to the verified account until a sending domain is verified.

Support: connor@bar9.ai.
