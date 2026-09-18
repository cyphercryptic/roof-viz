import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { getSiteUrl } from '@/lib/site';

export async function POST() {
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
    const rate = await checkRateLimit(createAdminClient(), user.id, '/api/billing/portal', RATE_LIMITS.general);
    if (!rate.allowed) return rateLimitResponse(rate);
    const { data: subscription, error } = await supabase.from('subscriptions')
      .select('stripe_customer_id').eq('tenant_id', profile.tenant_id).single();
    if (error || !subscription) throw new Error('Could not load billing account');
    if (!subscription.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getSiteUrl()}/settings/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal failed:', error);
    return NextResponse.json({ error: 'Billing is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
