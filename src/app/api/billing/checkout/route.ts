import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, PLANS } from '@/lib/stripe';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { billingCheckoutSchema, parseBody } from '@/lib/validation';
import { getSiteUrl } from '@/lib/site';
import { isMeteringConfigured } from '@/lib/metering';

const existingBilling = () => NextResponse.json({
  error: 'You already have a subscription or payment in progress. Use Manage Billing to review it.',
  code: 'USE_PORTAL',
}, { status: 409 });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (profileError) throw new Error('Could not verify billing permissions');
    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only admins can manage billing' }, { status: 403 });
    }
    const admin = createAdminClient();
    const rateCheck = await checkRateLimit(admin, user.id, '/api/billing/checkout', RATE_LIMITS.general);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck);
    const parsed = parseBody(billingCheckoutSchema, await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const plan = parsed.data.plan;
    if (plan === 'pay_per_use' && !isMeteringConfigured()) {
      return NextResponse.json({ error: 'Pay As You Go is temporarily unavailable while billing delivery is configured.' }, { status: 503 });
    }
    if (plan === 'pay_per_use') {
      const scheduler = await admin.rpc('metering_scheduler_is_healthy');
      if (scheduler.error || !scheduler.data) {
        return NextResponse.json({ error: 'Pay As You Go is temporarily unavailable while billing delivery is verified.' }, { status: 503 });
      }
    }
    const config = PLANS[plan];
    if (!config.stripePriceId) {
      return NextResponse.json({ error: 'This plan is not configured for checkout yet.' }, { status: 503 });
    }
    const { data: subscription, error: subscriptionError } = await admin
      .from('subscriptions').select('stripe_customer_id, stripe_subscription_id')
      .eq('tenant_id', profile.tenant_id).single();
    if (subscriptionError || !subscription) throw new Error('Could not load billing account');
    // Even incomplete/unpaid/paused subscriptions must be resolved before a second
    // one is created. A canceled subscription is cleared by its webhook.
    if (subscription.stripe_subscription_id) return existingBilling();

    const price = await stripe.prices.retrieve(config.stripePriceId);
    if (!price.active || !price.recurring
      || (price.recurring.usage_type === 'metered') !== config.payPerUse) {
      throw new Error('Configured Stripe price does not match this plan billing model');
    }

    let customerId = subscription.stripe_customer_id;
    if (!customerId) {
      // Stable parameters allow two different admins/retries to share one customer.
      // Stripe Checkout collects billing details, so requester email/name need not
      // be mutable inputs to this tenant-level idempotent operation.
      const customer = await stripe.customers.create({ metadata: { tenant_id: profile.tenant_id } }, {
        idempotencyKey: `exteriorviz-customer-v1:${profile.tenant_id}`,
      });
      const { data: saved, error: saveError } = await admin.from('subscriptions')
        .update({ stripe_customer_id: customer.id }).eq('tenant_id', profile.tenant_id)
        .is('stripe_customer_id', null).select('stripe_customer_id').maybeSingle();
      if (saveError) throw new Error('Could not persist billing customer');
      if (saved) customerId = saved.stripe_customer_id;
      else {
        // Another request may have saved the same mapping while we called Stripe.
        const { data: current, error: currentError } = await admin.from('subscriptions')
          .select('stripe_customer_id').eq('tenant_id', profile.tenant_id).single();
        if (currentError || !current?.stripe_customer_id) throw new Error('Billing customer mapping is unavailable');
        customerId = current.stripe_customer_id;
      }
    }

    // Webhooks may lag behind Checkout. Check Stripe directly before offering a
    // new purchase; an incomplete or delinquent subscription still blocks another.
    const existing = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
    if (existing.has_more || existing.data.some((sub) => !['canceled', 'incomplete_expired'].includes(sub.status))) {
      return existingBilling();
    }
    const open = await stripe.checkout.sessions.list({ customer: customerId, status: 'open', limit: 100 });
    if (open.has_more) return existingBilling();
    const pending = open.data.filter((session) => session.mode === 'subscription');
    if (pending.length) {
      // Do not create competing checkouts for two plans. The existing checkout
      // must complete/expire first, or be resolved through support.
      const session = pending[0];
      if (pending.length !== 1 || session.metadata?.tenant_id !== profile.tenant_id
        || session.metadata?.plan !== plan || !session.url) {
        return NextResponse.json({ error: 'Another plan checkout is already open. Finish it before starting a different plan.', code: 'CHECKOUT_PENDING' }, { status: 409 });
      }
      const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 2 });
      if (items.has_more || items.data.length !== 1 || items.data[0].price?.id !== price.id) return existingBilling();
      return NextResponse.json({ url: session.url });
    }

    const history = await stripe.checkout.sessions.list({ customer: customerId, limit: 1 });
    const latest = history.data[0];
    // Close the race where another request opened/completed Checkout between
    // our subscription/open-session reads and the history read.
    if (latest?.mode === 'subscription' && latest.status === 'open') {
      return NextResponse.json({ error: 'A checkout was just opened. Try again to resume it.', code: 'CHECKOUT_PENDING' }, { status: 409 });
    }
    if (latest?.mode === 'subscription' && latest.status === 'complete') {
      const id = typeof latest.subscription === 'string' ? latest.subscription : latest.subscription?.id;
      if (!id) return existingBilling();
      const current = await stripe.subscriptions.retrieve(id);
      if (!['canceled', 'incomplete_expired'].includes(current.status)) return existingBilling();
    }
    const previousSession = history.data[0]?.id || 'initial';
    // Concurrent requests seeing the same history use the same key (even for
    // different plans). Stripe rejects conflicting parameters instead of opening
    // two subscriptions. Subsequent requests find and reuse the open session.
    const idempotencyKey = `exteriorviz-checkout-v1:${profile.tenant_id}:${previousSession}`;
    const suffix = createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 8)
      .split('').map((digit) => String.fromCharCode(97 + parseInt(digit, 16))).join('');
    const siteUrl = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: price.id, ...(price.recurring.usage_type === 'metered' ? {} : { quantity: 1 }) }],
      success_url: `${siteUrl}/settings/billing?success=true`,
      cancel_url: `${siteUrl}/settings/billing?canceled=true`,
      client_reference_id: profile.tenant_id,
      integration_identifier: `exteriorviz_checkout_${suffix}`,
      metadata: { tenant_id: profile.tenant_id, plan },
    }, { idempotencyKey });
    if (session.status !== 'open' || !session.url) return existingBilling();
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing checkout failed:', error);
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
