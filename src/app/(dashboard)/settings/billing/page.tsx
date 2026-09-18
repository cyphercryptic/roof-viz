'use client';

import { Suspense, useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Zap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Subscription } from '@/types/billing';

const PLANS = [
  {
    key: 'pay_per_use' as const,
    name: 'Pay As You Go',
    price: 0,
    priceLabel: '$0.75',
    priceUnit: '/viz',
    limit: -1,
    popular: false,
    features: ['No monthly fee', 'Unlimited visualizations', '1 user', 'High quality', 'Pay only for what you use'],
  },
  {
    key: 'starter' as const,
    name: 'Starter',
    price: 44,
    priceLabel: '$44',
    priceUnit: '/mo',
    limit: 100,
    popular: false,
    features: ['100 visualizations/month', '3 team members', 'High quality', 'Email support'],
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: 99,
    priceLabel: '$99',
    priceUnit: '/mo',
    limit: 250,
    popular: true,
    features: ['250 visualizations/month', '10 team members', 'High quality', 'Priority support', 'Gallery sharing', 'PDF proposals'],
  },
  {
    key: 'business' as const,
    name: 'Business',
    price: 299,
    priceLabel: '$299',
    priceUnit: '/mo',
    limit: 1000,
    popular: false,
    features: ['1,000 visualizations/month', 'Unlimited team members', 'High quality', 'Dedicated support', 'Gallery sharing', 'PDF proposals', 'Analytics dashboard'],
  },
  {
    key: 'business_pro' as const,
    name: 'Business Pro',
    price: 1199,
    priceLabel: '$1,199',
    priceUnit: '/mo',
    limit: 5000,
    popular: false,
    features: ['5,000 visualizations/month', 'Unlimited team members', 'High quality', 'Dedicated support', 'Gallery sharing', 'PDF proposals', 'Analytics dashboard', 'White-label branding'],
  },
];

interface UsageSummary {
  used: number;
  limit: number;
  plan: string;
}

interface BillingSnapshot {
  tenantId: string;
  attempt: number;
  subscription: Subscription | null;
  usage: UsageSummary | null;
  error: string | null;
}

function BillingLoading() {
  return <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-20 text-brand-brown-soft"><span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />Loading billing and usage…</div>;
}

export default function BillingPage() {
  return <Suspense fallback={<BillingLoading />}><BillingContent /></Suspense>;
}

function BillingContent() {
  const { profile, loading: profileLoading } = useUser();
  const searchParams = useSearchParams();
  const tenantId = profile?.tenant_id;
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    async function loadBillingData() {
      try {
        const [subResult, usageResult] = await Promise.allSettled([
          createClient().from('subscriptions').select('*').eq('tenant_id', tenantId!).maybeSingle().abortSignal(controller.signal),
          fetch('/api/billing/usage', { cache: 'no-store', signal: controller.signal }).then(async (response) => {
            if (!response.ok) throw new Error('Usage unavailable');
            const data = await response.json();
            if (!Number.isFinite(data.used) || data.used < 0 || !Number.isFinite(data.limit) || data.limit < -1 || typeof data.plan !== 'string') {
              throw new Error('Usage unavailable');
            }
            return data as UsageSummary;
          }),
        ]);
        if (!active) return;
        if (subResult.status === 'rejected' || subResult.value.error) {
          throw new Error('Billing unavailable');
        }
        setSnapshot({
          tenantId: tenantId!, attempt,
          subscription: subResult.value.data,
          usage: usageResult.status === 'fulfilled' ? usageResult.value : null,
          error: null,
        });
      } catch {
        if (active) setSnapshot({ tenantId: tenantId!, attempt, subscription: null, usage: null, error: 'We couldn’t load your billing details. Please try again.' });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadBillingData();
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [tenantId, attempt]);

  async function handleCheckout(plan: string) {
    if (!isAdmin || checkoutLoading || portalLoading) return;
    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        toast.error(res.status === 409 ? 'Use Manage billing to change your existing subscription.' : 'Checkout is unavailable. Please try again or contact support.');
        return;
      }
      const data = await res.json();
      const destination = new URL(data.url);
      if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') throw new Error('Invalid checkout URL');
      window.location.assign(destination.href);
    } catch {
      toast.error('Could not open checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleManageBilling() {
    if (!isAdmin || portalLoading || checkoutLoading) return;
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST', signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error('Portal unavailable');
      const data = await res.json();
      const destination = new URL(data.url);
      if (destination.protocol !== 'https:' || destination.hostname !== 'billing.stripe.com') throw new Error('Invalid portal URL');
      window.location.assign(destination.href);
    } catch {
      toast.error('Could not open billing management. Please try again or contact support.');
    } finally {
      setPortalLoading(false);
    }
  }

  if (profileLoading || (tenantId && (snapshot?.tenantId !== tenantId || snapshot.attempt !== attempt))) return <BillingLoading />;
  if (!tenantId) return <p role="alert" className="py-8 text-brand-brown-soft">Sign in to your company workspace to view billing.</p>;
  if (!snapshot || snapshot.error) return <div className="space-y-4 py-8"><h1 className="text-2xl font-bold">Billing & usage</h1><p role="alert">{snapshot?.error || 'Billing details are unavailable.'}</p><Button onClick={() => setAttempt((value) => value + 1)}>Try again</Button></div>;

  const { subscription, usage } = snapshot;
  const currentPlan = subscription?.plan || 'free';
  const isPayPerUse = currentPlan === 'pay_per_use';
  const hasPaidSubscription = !!subscription?.stripe_subscription_id && currentPlan !== 'free';
  const activeStatus = !subscription || ['active', 'trialing'].includes(subscription.status);
  const visibleUsage = activeStatus ? usage : null;
  const usagePercent = visibleUsage && visibleUsage.limit > 0 ? Math.round((visibleUsage.used / visibleUsage.limit) * 100) : 0;
  const currentPlanName = currentPlan === 'free' ? 'Free' : PLANS.find((plan) => plan.key === currentPlan)?.name || 'Unknown plan';
  const statusLabels: Record<Subscription['status'], string> = { active: 'Active', trialing: 'Trial', past_due: 'Payment past due', canceled: 'Canceled', incomplete: 'Payment incomplete' };
  const statusLabel = subscription ? statusLabels[subscription.status] || 'Status unavailable' : 'No paid subscription';

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Billing & usage</h1><p className="text-brand-brown-soft">Manage your subscription and track usage.</p></div>
        <Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>Refresh billing</Button>
      </div>

      {searchParams.get('success') === 'true' && <p role="status" className="mb-6 rounded-lg border border-border bg-brand-peach-light p-4 text-sm text-brand-brown">Checkout complete. Your plan updates after payment confirmation. Refresh billing to check the latest status.</p>}
      {searchParams.get('canceled') === 'true' && <p role="status" className="mb-6 rounded-lg border border-border bg-white p-4 text-sm text-brand-brown">Checkout was canceled. No new plan was confirmed here.</p>}

      <Card className="mb-8">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Zap aria-hidden="true" className="h-5 w-5 text-brand-orange" />Current usage</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              {visibleUsage ? <>
                <p className="text-2xl font-bold text-brand-brown">{visibleUsage.used}<span className="text-base font-normal text-brand-brown-soft">{visibleUsage.limit === -1 ? ' visualizations' : ` / ${visibleUsage.limit} visualizations`}</span></p>
                <p className="text-sm text-brand-brown-soft">{subscription?.current_period_start ? 'Current billing period' : 'Current calendar month'} · includes previews still processing</p>
                {isPayPerUse && <p className="mt-2 text-sm text-brand-brown-soft">Estimated usage cost: ${(visibleUsage.used * 0.75).toFixed(2)}. Your Stripe invoice shows final charges, taxes, and adjustments.</p>}
              </> : <p role="status" className="max-w-lg text-sm text-brand-brown-soft">{activeStatus ? 'Usage is temporarily unavailable. Refresh billing to try again.' : 'Usage is unavailable while your subscription needs attention. Open billing management to review your account.'}</p>}
            </div>
            <div className="space-y-2"><Badge variant={currentPlan === 'free' ? 'secondary' : 'default'} className="px-3 py-1 text-sm">{currentPlanName} plan</Badge><p className="text-sm text-brand-brown-soft">Status: {statusLabel}</p></div>
          </div>
          {visibleUsage && visibleUsage.limit > 0 && <div role="progressbar" aria-label="Visualization allowance used" aria-valuemin={0} aria-valuemax={visibleUsage.limit} aria-valuenow={Math.min(visibleUsage.used, visibleUsage.limit)} aria-valuetext={`${visibleUsage.used} of ${visibleUsage.limit} visualizations used`} className="h-3 w-full overflow-hidden rounded-full bg-brand-peach/30"><div className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-600' : usagePercent >= 70 ? 'bg-amber-600' : 'bg-brand-orange'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} /></div>}
          {subscription?.stripe_customer_id && isAdmin && <Button variant="outline" size="sm" className="mt-4" disabled={portalLoading || !!checkoutLoading} onClick={handleManageBilling}><CreditCard aria-hidden="true" className="mr-2 h-4 w-4" />{portalLoading ? 'Opening billing…' : 'Manage billing'}</Button>}
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Plans</h2>
      {hasPaidSubscription && <p className="mb-4 text-sm text-brand-brown-soft">Change your existing plan in billing management. Review any price change there before confirming.</p>}
      <div className="mb-8 grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          return <Card key={plan.key} className={`relative overflow-visible ${plan.popular ? 'ring-2 ring-brand-orange' : ''} ${isCurrent ? 'bg-brand-peach-light' : ''}`}>
            {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-brand-orange text-white shadow-sm">Most Popular</Badge></div>}
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mb-4 mt-2"><span className="text-3xl font-bold">{plan.priceLabel}</span><span className="text-brand-brown-soft">{plan.priceUnit}</span></div>
              <ul className="mb-6 space-y-2">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />{feature}</li>)}</ul>
              {isCurrent ? <Button variant="outline" className="w-full" disabled>Selected plan · {statusLabel}</Button> : isAdmin ? <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} disabled={!!checkoutLoading || portalLoading} onClick={() => hasPaidSubscription ? handleManageBilling() : handleCheckout(plan.key)}>{checkoutLoading === plan.key ? 'Opening checkout…' : portalLoading ? 'Opening billing…' : <>{hasPaidSubscription ? 'Change in billing' : 'Choose plan'}<ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></>}</Button> : <p className="text-center text-sm text-brand-brown-soft">Ask your administrator to change plans.</p>}
            </CardContent>
          </Card>;
        })}
      </div>
    </div>
  );
}
