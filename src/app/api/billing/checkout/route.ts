import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe, PLANS } from '@/lib/stripe';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { billingCheckoutSchema, parseBody } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    return NextResponse.json({ error: 'Only admins can manage billing' }, { status: 403 });
  }

  // Rate limit by user
  const adminSupabaseRL = createAdminClient();
  const rateCheck = await checkRateLimit(adminSupabaseRL, user.id, '/api/billing/checkout', RATE_LIMITS.general);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  const body = await request.json();
  const parsed = parseBody(billingCheckoutSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const plan = parsed.data.plan;

  const planConfig = PLANS[plan];
  if (!planConfig.stripePriceId) {
    return NextResponse.json({ error: 'Plan not configured' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Get or create Stripe customer
  const { data: subscription } = await adminSupabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .single();

  let customerId = subscription?.stripe_customer_id;

  if (!customerId) {
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('name')
      .eq('id', profile.tenant_id)
      .single();

    const customer = await stripe.customers.create({
      email: user.email,
      name: tenant?.name || undefined,
      metadata: { tenant_id: profile.tenant_id },
    });

    customerId = customer.id;

    await adminSupabase
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('tenant_id', profile.tenant_id);
  }

  // Pay-per-use uses subscription mode with metered billing
  // Regular plans use standard subscription mode
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: `${request.nextUrl.origin}/settings/billing?success=true`,
    cancel_url: `${request.nextUrl.origin}/settings/billing?canceled=true`,
    metadata: {
      tenant_id: profile.tenant_id,
      plan,
    },
  });

  return NextResponse.json({ url: session.url });
}
