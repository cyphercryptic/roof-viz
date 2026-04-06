'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Package, Image, Users, X } from 'lucide-react';

interface OnboardingStatus {
  hasProducts: boolean;
  hasVisualizations: boolean;
  hasInvitedTeam: boolean;
  role: string;
}

const DISMISSED_KEY = 'roofviz-onboarding-dismissed';

export function OnboardingChecklist() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [dismissed, setDismissed] = useState(true); // default hidden until we check
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    setDismissed(wasDismissed);
    if (wasDismissed) {
      setLoading(false);
      return;
    }

    fetch('/api/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.role === 'owner' || data.role === 'admin') {
          setStatus(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || dismissed || !status) return null;

  const steps = [
    {
      label: 'Add products to your catalog',
      done: status.hasProducts,
      href: '/catalog',
      icon: Package,
    },
    {
      label: 'Create your first visualization',
      done: status.hasVisualizations,
      href: '/visualize',
      icon: Image,
    },
    {
      label: 'Invite your team',
      done: status.hasInvitedTeam,
      href: '/settings/team',
      icon: Users,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  return (
    <Card className="border-brand-orange/30 bg-gradient-to-r from-brand-peach-light to-white mb-6">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-brand-brown text-base">
              {allDone ? 'You\'re all set!' : 'Get started with RoofViz'}
            </h3>
            <p className="text-sm text-brand-brown/60 mt-0.5">
              {allDone
                ? 'Your account is fully set up. Happy selling!'
                : `${completedCount} of ${steps.length} steps completed`}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-brand-brown/30 hover:text-brand-brown/60 transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-brand-peach/30 rounded-full h-1.5 mb-4">
          <div
            className="bg-brand-orange h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        <div className="space-y-2">
          {steps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                step.done
                  ? 'bg-white/50 text-brand-brown/50'
                  : 'bg-white hover:bg-brand-peach-light text-brand-brown'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-brand-orange/40 shrink-0" />
              )}
              <step.icon className={`h-4 w-4 shrink-0 ${step.done ? 'text-brand-brown/30' : 'text-brand-orange'}`} />
              <span className={`text-sm font-medium ${step.done ? 'line-through' : ''}`}>
                {step.label}
              </span>
            </Link>
          ))}
        </div>

        {allDone && (
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
            className="mt-3 w-full border-brand-orange/30 text-brand-orange hover:bg-brand-orange/10"
          >
            Dismiss
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
