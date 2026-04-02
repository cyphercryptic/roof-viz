import { SupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'connorf.bar9@gmail.com';

/**
 * Check if a tenant has remaining visualizations for their current billing period.
 * Returns { allowed, used, limit, plan } or throws.
 */
export async function checkUsage(
  supabase: SupabaseClient,
  tenantId: string,
  opts?: { userId?: string; role?: string }
) {
  // Demo users get per-user limits (not tenant-level)
  if (opts?.role === 'demo' && opts.userId) {
    const DEMO_LIMIT = 5;
    const { count } = await supabase
      .from('visualizations')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', opts.userId)
      .eq('status', 'completed');

    const used = count || 0;
    return {
      allowed: used < DEMO_LIMIT,
      used,
      limit: DEMO_LIMIT,
      plan: 'demo' as const,
      message: used >= DEMO_LIMIT
        ? `You've used all ${DEMO_LIMIT} demo visualizations. Contact us to get full access!`
        : undefined,
    };
  }
  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (!subscription) {
    // Free tier: allow 10 visualizations per month with no subscription
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const FREE_LIMIT = 10;

    const { count } = await supabase
      .from('usage_records')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('period_start', periodStart)
      .lt('period_end', periodEnd);

    const used = count || 0;
    return {
      allowed: used < FREE_LIMIT,
      used,
      limit: FREE_LIMIT,
      plan: 'free' as const,
      message: used >= FREE_LIMIT ? `You've used all ${FREE_LIMIT} free visualizations this month. Subscribe for more.` : undefined,
    };
  }

  // Unlimited plan
  if (subscription.visualization_limit === -1) {
    // Count usage for display purposes but always allow
    const used = await countCurrentUsage(supabase, tenantId, subscription);
    return { allowed: true, used, limit: -1, plan: subscription.plan };
  }

  const used = await countCurrentUsage(supabase, tenantId, subscription);
  const allowed = used < subscription.visualization_limit;

  return {
    allowed,
    used,
    limit: subscription.visualization_limit,
    plan: subscription.plan,
    message: allowed ? undefined : `You've used all ${subscription.visualization_limit} visualizations for this period. Upgrade your plan for more.`,
  };
}

async function countCurrentUsage(
  supabase: SupabaseClient,
  tenantId: string,
  subscription: { current_period_start: string | null; current_period_end: string | null }
) {
  // Use billing period if available, otherwise use current calendar month
  const now = new Date();
  const periodStart = subscription.current_period_start
    ? subscription.current_period_start
    : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = subscription.current_period_end
    ? subscription.current_period_end
    : new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { count } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('period_start', periodStart)
    .lt('period_end', periodEnd);

  return count || 0;
}

/**
 * Record a visualization usage event.
 * For pay_per_use plans, also reports metered usage to Stripe.
 */
export async function recordUsage(
  supabase: SupabaseClient,
  tenantId: string,
  visualizationId: string
) {
  // Get current billing period and plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end, plan, stripe_subscription_id')
    .eq('tenant_id', tenantId)
    .single();

  const now = new Date();
  const periodStart = subscription?.current_period_start
    || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = subscription?.current_period_end
    || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  await supabase
    .from('usage_records')
    .insert({
      tenant_id: tenantId,
      visualization_id: visualizationId,
      period_start: periodStart,
      period_end: periodEnd,
    });

  // Check for high-usage alerts on Business Pro (or any high-tier plan)
  if (subscription?.plan === 'business_pro') {
    const { data: subFull } = await supabase
      .from('subscriptions')
      .select('visualization_limit')
      .eq('tenant_id', tenantId)
      .single();

    if (subFull?.visualization_limit && subFull.visualization_limit > 0) {
      const { count: currentCount } = await supabase
        .from('usage_records')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('period_start', periodStart)
        .lt('period_end', periodEnd);

      const used = currentCount || 0;
      const limit = subFull.visualization_limit;

      // Send alert at 90% and 100%
      if (used === Math.floor(limit * 0.9) || used === limit) {
        await sendUsageAlert(supabase, tenantId, used, limit);
      }
    }
  }

  // For pay-per-use plans, report metered usage to Stripe
  if (subscription?.plan === 'pay_per_use' && subscription.stripe_subscription_id) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      const meteredItem = stripeSub.items.data[0];
      if (meteredItem) {
        await stripe.billing.meterEvents.create({
          event_name: 'visualization',
          payload: {
            stripe_customer_id: stripeSub.customer as string,
            value: '1',
          },
        });
      }
    } catch (err) {
      // Don't fail the visualization if Stripe metering fails — log and continue
      console.error('Failed to report metered usage to Stripe:', err);
    }
  }
}

/**
 * Send a usage alert when a high-tier tenant approaches or hits their limit.
 * Stores alert in DB and sends email notification to admin.
 */
async function sendUsageAlert(
  supabase: SupabaseClient,
  tenantId: string,
  used: number,
  limit: number
) {
  try {
    // Get tenant name for the alert
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    const tenantName = tenant?.name || tenantId;
    const percentage = Math.round((used / limit) * 100);
    const isOver = used >= limit;

    const subject = isOver
      ? `[RoofViz] ${tenantName} has hit their visualization limit (${used}/${limit})`
      : `[RoofViz] ${tenantName} is at ${percentage}% of their visualization limit (${used}/${limit})`;

    const body = isOver
      ? `${tenantName} has used all ${limit} visualizations for this billing period. They may need a custom enterprise plan. Consider reaching out to discuss their needs.`
      : `${tenantName} has used ${used} of their ${limit} visualizations (${percentage}%). They're approaching their limit and may need to upgrade soon.`;

    // Store alert in usage_alerts (we'll check these from the admin dashboard)
    // For now, log it — email integration can be added via Resend, SendGrid, etc.
    console.warn(`USAGE ALERT: ${subject}\n${body}\nAdmin email: ${ADMIN_ALERT_EMAIL}`);

    // If you have Resend or another email service configured, send the email here:
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ from: 'alerts@roofviz.com', to: ADMIN_ALERT_EMAIL, subject, text: body }),
    // });

  } catch (err) {
    console.error('Failed to send usage alert:', err);
  }
}
