import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS, type PlanKey } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import type Stripe from 'stripe';

function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'canceled':
    case 'incomplete': return status;
    case 'unpaid':
    case 'paused': return 'past_due';
    case 'incomplete_expired': return 'canceled';
    default: return 'incomplete';
  }
}

function objectId(value: string | { id: string } | null | undefined): string | null {
  return typeof value === 'string' ? value : value?.id ?? null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let subscriptionId: string | null = null;
  let eventCustomerId: string | null = null;
  let tenantId: string | null = null;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      if (session.mode !== 'subscription') return NextResponse.json({ received: true });
      subscriptionId = objectId(session.subscription);
      eventCustomerId = objectId(session.customer);
      tenantId = session.metadata?.tenant_id ?? null;
      // The subscription's actual status below determines access, including
      // asynchronous payments and trialing subscriptions without a charge.
      break;
    }
    case 'invoice.paid':
    case 'invoice.payment_failed':
      subscriptionId = objectId(event.data.object.parent?.subscription_details?.subscription);
      eventCustomerId = objectId(event.data.object.customer);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      subscriptionId = event.data.object.id;
      eventCustomerId = objectId(event.data.object.customer);
      break;
    default:
      return NextResponse.json({ received: true });
  }
  if (!subscriptionId) return NextResponse.json({ received: true });

  const admin = createAdminClient();
  let syncToken: string | null = null;
  try {
    if (!eventCustomerId) throw new Error('Stripe event is missing its customer');
    const lease = await admin.rpc('acquire_stripe_sync', { p_customer_id: eventCustomerId });
    if (lease.error || !lease.data) throw new Error('Billing synchronization is busy or unavailable; retry delivery');
    syncToken = lease.data;
    // Read current Stripe state, rather than treating an old invoice or checkout
    // delivery as proof that a subscription is still paid and active.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = objectId(subscription.customer);
    const item = subscription.items.data[0];
    const deleted = subscription.status === 'canceled' || subscription.status === 'incomplete_expired';
    const matchedPlan = Object.entries(PLANS).find(([, plan]) =>
      plan.stripePriceId && plan.stripePriceId === item?.price.id,
    )?.[0] as PlanKey | undefined;
    if (!customerId || customerId !== eventCustomerId || (!deleted && !matchedPlan)) {
      throw new Error('Stripe subscription has no configured customer or price mapping');
    }

    // SQL commits the entitlement update and processed-event marker atomically.
    // A failed request leaves no marker, so Stripe's retry can complete the work.
    // It also serializes by customer, rejects older events, and ignores events
    // from subscriptions other than the tenant's current subscription.
    const { data, error } = await admin.rpc('apply_stripe_subscription_event', {
      p_event_id: event.id,
      p_created: event.created,
      p_customer_id: customerId,
      p_subscription_id: subscription.id,
      p_tenant_id: tenantId,
      p_plan: deleted ? 'free' : matchedPlan!,
      p_status: mapStatus(subscription.status),
      p_limit: deleted ? PLANS.free.visualizationLimit : PLANS[matchedPlan!].visualizationLimit,
      p_period_start: item ? new Date(item.current_period_start * 1000).toISOString() : null,
      p_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
      p_deleted: deleted,
      p_sync_token: syncToken,
    });
    if (error) throw new Error(`Subscription reconciliation failed: ${error.message}`);
    return NextResponse.json({ received: true, result: data });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return NextResponse.json({ error: 'Billing update failed; delivery can be retried.' }, { status: 500 });
  } finally {
    if (syncToken && eventCustomerId) {
      // A failure leaves no completed-event marker. Release promptly for Stripe's
      // retry; if this request dies, the lease expires and its token is fenced.
      try {
        await admin.rpc('release_stripe_sync', { p_customer_id: eventCustomerId, p_sync_token: syncToken });
      } catch (error) {
        console.error('Stripe synchronization release failed; lease will expire:', error);
      }
    }
  }
}
