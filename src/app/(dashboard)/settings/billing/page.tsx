'use client';

import { useEffect, useState } from 'react';
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

export default function BillingPage() {
  const { profile } = useUser();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! Welcome to your new plan.');
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled.');
    }
  }, [searchParams]);

  useEffect(() => {
    loadBillingData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadBillingData() {
    const [subRes, usageRes] = await Promise.all([
      supabase.from('subscriptions').select('*').single(),
      fetch('/api/billing/usage').then((r) => r.json()),
    ]);

    if (subRes.data) setSubscription(subRes.data);
    if (usageRes.used !== undefined) setUsage(usageRes);
    setLoading(false);
  }

  async function handleCheckout(plan: string) {
    if (!isAdmin) {
      toast.error('Only admins can manage billing');
      return;
    }

    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'pay_per_use';
  const isPayPerUse = currentPlan === 'pay_per_use';
  const usagePercent = usage && usage.limit > 0
    ? Math.round((usage.used / usage.limit) * 100)
    : 0;

  const currentPlanName = PLANS.find((p) => p.key === currentPlan)?.name || 'Pay As You Go';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing & Usage</h1>
        <p className="text-brand-brown/50">Manage your subscription and track usage</p>
      </div>

      {/* Usage overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-orange" />
            Current Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-brand-brown">
                {usage?.used ?? 0}
                <span className="text-base font-normal text-brand-brown/50">
                  {isPayPerUse ? (
                    <> visualizations &middot; ${((usage?.used ?? 0) * 0.75).toFixed(2)} billed</>
                  ) : (
                    <>
                      {' / '}
                      {usage?.limit === -1 ? '∞' : usage?.limit ?? 5} visualizations
                    </>
                  )}
                </span>
              </p>
              <p className="text-sm text-brand-brown/40">Current billing period</p>
            </div>
            <Badge
              variant={isPayPerUse ? 'secondary' : 'default'}
              className="text-sm px-3 py-1"
            >
              {currentPlanName} Plan
            </Badge>
          </div>

          {/* Usage bar (not shown for unlimited/pay-per-use) */}
          {usage && usage.limit > 0 && (
            <div className="w-full bg-brand-peach/30 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-brand-orange'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          )}

          {/* Manage billing button for paid plans */}
          {subscription?.stripe_subscription_id && isAdmin && (
            <Button variant="outline" size="sm" className="mt-4" onClick={handleManageBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan cards */}
      <h2 className="text-lg font-semibold mb-4">Plans</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 mb-8">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          const currentIdx = PLANS.findIndex((p) => p.key === currentPlan);
          const planIdx = PLANS.findIndex((p) => p.key === plan.key);
          const isDowngrade = currentIdx >= 0 && currentIdx > planIdx;

          return (
            <Card
              key={plan.key}
              className={`relative overflow-visible ${
                plan.popular ? 'ring-2 ring-brand-orange' : ''
              } ${isCurrent ? 'bg-brand-peach-light' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand-orange text-white shadow-sm">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">{plan.priceLabel}</span>
                  <span className="text-brand-brown/50">{plan.priceUnit}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : isAdmin ? (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={!!checkoutLoading || isDowngrade}
                    onClick={() => isDowngrade ? handleManageBilling() : handleCheckout(plan.key)}
                  >
                    {checkoutLoading === plan.key ? (
                      'Redirecting...'
                    ) : isDowngrade ? (
                      'Downgrade'
                    ) : (
                      <>
                        {isCurrent ? 'Current Plan' : isPayPerUse ? 'Switch to Plan' : plan.key === 'pay_per_use' ? 'Get Started' : 'Upgrade'} <ArrowRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="text-xs text-center text-brand-brown/40">Ask admin to upgrade</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
