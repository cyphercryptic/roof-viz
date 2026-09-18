import { SupabaseClient } from '@supabase/supabase-js';
import { deliverMeteringEvent, isMeteringConfigured } from '@/lib/metering';
import { hasGenerationAccess } from '@/lib/security-policy';


/** Start of the current calendar month in UTC (fallback billing period for tenants with no Stripe period). */
function currentMonthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Start of next calendar month in UTC. */
function nextMonthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

/**
 * Check if a tenant has remaining visualizations for their current billing period.
 * Returns { allowed, used, limit, plan } or throws.
 */
export async function checkUsage(
  supabase: SupabaseClient,
  tenantId: string,
  opts?: { userId?: string; role?: string }
) {
  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (subscriptionError || !subscription) {
    throw new Error('Unable to verify your visualization allowance. Please try again.');
  }
  if (!hasGenerationAccess(subscription)) {
    return {
      allowed: false, used: 0, limit: subscription.visualization_limit,
      plan: subscription.plan,
      message: 'Please update your billing before creating another visualization.',
    };
  }

  if (subscription.plan === 'pay_per_use') {
    if (!isMeteringConfigured()) {
      return { allowed: false, used: 0, limit: 0, plan: subscription.plan,
        message: 'Pay As You Go is temporarily unavailable while billing delivery is configured.' };
    }
    // A returning customer can also advance a due retry. This supplements the
    // verified hourly scheduler; it does not certify scheduler health itself.
    try { await deliverMeteringEvent(supabase, undefined, tenantId); }
    catch (error) { console.error('Pending metered usage could not be retried:', error); }
    const health = await supabase.rpc('metering_is_healthy', { p_tenant_id: tenantId });
    if (health.error) throw new Error('Unable to verify metered billing availability. Please try again.');
    if (!health.data) {
      return { allowed: false, used: 0, limit: 0, plan: subscription.plan,
        message: 'Your recent usage is awaiting billing reconciliation. Please contact support before creating more renders.' };
    }
  }

  // Match the database INSERT reservation trigger: completed jobs remain counted
  // even when usage logging fails, and recent in-flight jobs consume capacity.
  const isDemo = opts?.role === 'demo' && !!opts.userId;
  const periodStart = subscription.current_period_start || currentMonthStart();
  const periodEnd = subscription.current_period_end || nextMonthStart();
  const recent = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const quotaQuery = () => supabase.from('visualizations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .or(`status.eq.completed,and(status.eq.processing,created_at.gt.${recent})`);
  const { count, error } = await quotaQuery().gte('created_at', periodStart).lt('created_at', periodEnd);
  if (error || count === null) throw new Error('Unable to verify your visualization allowance. Please try again.');
  const tenantLimit = subscription.visualization_limit;
  if (tenantLimit !== -1 && count >= tenantLimit) {
    return {
      allowed: false, used: count, limit: tenantLimit, plan: subscription.plan,
      message: `Your team has used all ${tenantLimit} visualizations for this period.`,
    };
  }
  if (isDemo) {
    const { count: demoCount, error: demoError } = await quotaQuery().eq('created_by', opts!.userId!);
    if (demoError || demoCount === null) throw new Error('Unable to verify your visualization allowance. Please try again.');
    return {
      allowed: demoCount < 5, used: demoCount, limit: 5, plan: 'demo',
      message: demoCount < 5 ? undefined : "You've used all 5 demo visualizations.",
    };
  }
  const limit = tenantLimit;
  const allowed = limit === -1 || count < limit;
  return {
    allowed, used: count, limit, plan: subscription.plan,
    message: allowed ? undefined : `You've used all ${limit} visualizations for this period. Upgrade your plan for more.`,
  };
}

/**
 * Completion, usage accounting and PAYG enqueue commit atomically in migration023.
 * This is only an immediate best-effort dispatch; a failed call never refunds a
 * completed render or loses the durable event. The protected worker retries it.
 */
export async function recordUsage(supabase: SupabaseClient, tenantId: string, visualizationId: string) {
  if (!isMeteringConfigured()) return;
  try {
    await deliverMeteringEvent(supabase, visualizationId);
  } catch (error) {
    console.error('Metered usage remains queued for retry', { tenantId, visualizationId, error });
  }
}
