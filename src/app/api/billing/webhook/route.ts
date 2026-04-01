import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS, type PlanKey } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import type Stripe from 'stripe';

/** Extract billing period from the first subscription item */
function getPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  if (!item) return { start: null, end: null };
  return {
    start: new Date(item.current_period_start * 1000).toISOString(),
    end: new Date(item.current_period_end * 1000).toISOString(),
  };
}

/** Extract subscription ID from an invoice (Stripe v21 structure) */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subDetails = invoice.parent?.subscription_details;
  if (subDetails?.subscription) {
    return typeof subDetails.subscription === 'string'
      ? subDetails.subscription
      : subDetails.subscription.id;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const tenantId = session.metadata?.tenant_id;
      const plan = session.metadata?.plan as PlanKey;

      if (!tenantId || !plan) break;

      const subscriptionId = session.subscription as string;
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      const period = getPeriod(stripeSub);

      await adminSupabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: session.customer as string,
          plan,
          status: 'active',
          visualization_limit: PLANS[plan].visualizationLimit,
          current_period_start: period.start,
          current_period_end: period.end,
        })
        .eq('tenant_id', tenantId);

      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (!subscriptionId) break;

      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      const period = getPeriod(stripeSub);
      const customerId = invoice.customer as string;

      const { data: sub } = await adminSupabase
        .from('subscriptions')
        .select('tenant_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (sub) {
        await adminSupabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: period.start,
            current_period_end: period.end,
          })
          .eq('tenant_id', sub.tenant_id);
      }

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      await adminSupabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', customerId);

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const period = getPeriod(subscription);

      const status = subscription.cancel_at_period_end ? 'canceled' : 'active';

      await adminSupabase
        .from('subscriptions')
        .update({
          status,
          current_period_start: period.start,
          current_period_end: period.end,
        })
        .eq('stripe_customer_id', customerId);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      // Downgrade to free
      await adminSupabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'active',
          visualization_limit: PLANS.free.visualizationLimit,
          stripe_subscription_id: null,
          current_period_start: null,
          current_period_end: null,
        })
        .eq('stripe_customer_id', customerId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
