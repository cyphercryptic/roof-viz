# Pay As You Go delivery and recovery

Pay As You Go is **disabled by default**. Fixed subscription plans do not require the metering worker. No account settings, scheduler, credentials, billing objects, or paid requests were changed while implementing this code.

## Enable only after these steps

1. Apply additive migrations 019, 020, 021, 022 and 023 in order using the Supabase SQL Editor. No CLI migration push. Deploy the corresponding application code. Drain/review any in-flight jobs created before 023; historical renders are deliberately not back-billed.
2. Verify the existing Stripe PAYG price references an active meter with event name `visualization`, customer mapping `stripe_customer_id`, and value mapping `value`. The app uses the existing Stripe metering integration; it does not create another service or subscription. Test with Stripe sandbox fixtures before enabling real payments.
3. Store `CRON_SECRET` in the project secrets manager and sync it through the established deployment integration. Do not put its value in source, logs or example commands. Existing `STRIPE_SECRET_KEY` and `STRIPE_PRICE_PAY_PER_USE` must be configured.
4. Configure a trusted **hourly or more frequent** existing scheduler to request `GET /api/internal/billing/meter` on the canonical production host with `Authorization: Bearer <CRON_SECRET>`. Use the scheduler's secret binding. Do not upgrade a plan or provision a paid scheduler merely for this job. The daily 06:00 UTC Vercel cron is a free-tier-compatible backstop; **it is not sufficient as the primary retry schedule**.
5. Invoke the protected worker once through the scheduler/operator to establish its heartbeat, then verify another scheduled run completes within the next hour. The worker runs with `CRON_SECRET` and `STRIPE_SECRET_KEY` even while PAYG is disabled. Set `PAYG_RETRY_SCHEDULE_CONFIRMED=true` and `PAYG_METERING_ENABLED=true` only after verifying the schedule. Until the worker has completed a scan, both PAYG checkout and generation fail closed. They also stop if its last completed run becomes more than two hours old.
6. Verify a sandbox completed visualization produces one `usage_records` row, one outbox row and one Stripe meter event. Duplicate worker invocation must not create another usage event. This repo's offline tests prove transaction/lease behavior but do not replace this sandbox configuration check.

Disabling either PAYG activation flag stops new checkout and generation but leaves the authenticated worker available to drain existing usage. Keep its scheduler, Stripe credentials and cron secret configured until every pending event has been delivered or reconciled.

No extra paid infrastructure is required by the implementation. If no reliable existing scheduler is available, leave PAYG disabled and offer the fixed monthly plans.

## What commits and retries

The job captures the plan, customer and billing period at creation. Changing the tenant's plan during image generation does not move that render to a different billing account. A database trigger commits visualization completion, the usage record and the PAYG outbox row in the same transaction. An enqueue error rolls back completion; the route does not return a successful unbilled render. A later delivery failure cannot turn a completed render into a failed one and refund its quota.

The normal render request attempts immediate delivery. A returning PAYG customer's preflight can advance one due event for that tenant. The protected worker drains at most 25 events or 45 seconds of work, whichever comes first. Each Stripe request has a 10-second timeout and no SDK retry loop. A 60-second database lease and token guard every acknowledgement. Crashed workers leave a recoverable event; later attempts reuse the original visualization identifier, event timestamp and HTTP idempotency key.

An event retries with exponential delay, up to eight attempts. A tenant is blocked from further PAYG generation when it has 10 outstanding events, an outstanding event older than 24 hours, or any event requiring review. A stale worker heartbeat blocks all PAYG until scheduling recovers.

## Review without double-billing

Stripe guarantees idempotency and meter-identifier deduplication for at least 24 hours, not indefinitely. The worker therefore quarantines ambiguous attempts after 23 hours and does not automatically resend them. Events older than 34 days or exhausting eight attempts also enter `review`. Never reset these indiscriminately: Stripe may have accepted an event whose acknowledgement was lost.

Review queue (read-only SQL in the editor):

```sql
SELECT visualization_id, tenant_id, stripe_customer_id, status, attempts,
       first_attempt_at, created_at, last_error
FROM public.metering_outbox
WHERE status <> 'sent'
ORDER BY created_at;

SELECT last_completed_run FROM public.metering_worker_health;
```

For a `review` event, compare the exact visualization/event identifier and original timestamp with Stripe's request/event records. If it was accepted, mark the row sent through a reviewed admin reconciliation; do not resend it. If Stripe confirms it was never accepted, review whether its timestamp is still within Stripe's 35-day window before retrying. If acceptance cannot be established, reconcile the charge manually with the client instead of risking a duplicate. These are billing mutations and must be deliberate; this runbook does not execute them.

A worker response with `needsReview > 0` uses HTTP 503 to make the condition visible to monitoring. Clearing a review event without resolving its charge would hide owed usage. Check the scheduler and worker logs when heartbeat or queue health blocks PAYG. The application does not claim to send an automatic billing alert email.

Source references: [Stripe usage recording](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage-api), [Stripe idempotent request retention](https://docs.stripe.com/api/idempotent_requests), [Vercel cron usage](https://vercel.com/docs/cron-jobs/usage-and-pricing).
