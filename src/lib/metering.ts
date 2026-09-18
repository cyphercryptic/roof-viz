import type { SupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

/** Delivery stays available when enrollment is disabled, so existing usage can drain. */
export function isMeteringWorkerConfigured(): boolean {
  return !!process.env.CRON_SECRET && !!process.env.STRIPE_SECRET_KEY;
}

/** Opt in only after migration, scheduler secret and Stripe meter are configured. */
export function isMeteringConfigured(): boolean {
  return process.env.PAYG_METERING_ENABLED === 'true' && process.env.PAYG_RETRY_SCHEDULE_CONFIRMED === 'true'
    && isMeteringWorkerConfigured() && !!process.env.STRIPE_PRICE_PAY_PER_USE;
}

interface MeteringJob {
  visualization_id: string;
  stripe_customer_id: string;
  event_timestamp: number;
  lease_token: string;
}

/** One leased event per call; safe to repeat after a crash or a lost response. */
export async function deliverMeteringEvent(supabase: SupabaseClient, visualizationId?: string, tenantId?: string) {
  const { data, error } = await supabase.rpc('claim_metering_event', {
    p_visualization_id: visualizationId ?? null, p_tenant_id: tenantId ?? null,
  });
  if (error) throw new Error('Unable to claim pending metered usage');
  if (!data) return 'idle' as const;
  const job = data as MeteringJob;
  try {
    await stripe.billing.meterEvents.create({
      event_name: 'visualization',
      identifier: job.visualization_id,
      timestamp: job.event_timestamp,
      payload: { stripe_customer_id: job.stripe_customer_id, value: '1' },
    }, { idempotencyKey: `exteriorviz-meter:${job.visualization_id}`, timeout: 10_000, maxNetworkRetries: 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Meter submission failed';
    const result = await supabase.rpc('finish_metering_event', {
      p_visualization_id: job.visualization_id, p_lease_token: job.lease_token, p_success: false, p_error: message,
    });
    if (result.error || !result.data) throw new Error('Unable to preserve metering retry state');
    return 'retry' as const;
  }
  // If Stripe accepted but this write fails, leave the lease intact. The next
  // worker reuses the same event identifier, timestamp and idempotency key.
  const result = await supabase.rpc('finish_metering_event', {
    p_visualization_id: job.visualization_id, p_lease_token: job.lease_token, p_success: true, p_error: null,
  });
  if (result.error || !result.data) throw new Error('Unable to confirm metered usage delivery');
  return 'sent' as const;
}
