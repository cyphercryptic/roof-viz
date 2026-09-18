'use client';

import Link from 'next/link';
import { House } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useUser } from '@/hooks/useUser';
import { Toaster } from '@/components/ui/sonner';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser();

  if (loading) {
    return (
      <main id="main-content" aria-label="Loading workspace" aria-busy="true" className="flex min-h-screen items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange shadow-lg shadow-brand-orange/20">
            <House className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-brand-peach/30">
            <div className="h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-brand-orange" />
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return <main id="main-content" className="flex min-h-screen items-center justify-center bg-brand-cream p-6"><div className="max-w-md space-y-4 rounded-xl border border-border bg-white p-8"><House className="h-8 w-8 text-brand-orange" /><h1 className="text-2xl font-semibold">Finish setting up your workspace</h1><p className="text-brand-brown-soft">Connect your account to your company to start creating previews.</p><Link href="/onboarding" className="inline-flex rounded-lg bg-brand-orange px-5 py-3 font-medium text-white">Continue setup</Link></div></main>;
  }

  return (
    <div className="flex min-h-screen bg-brand-cream">
      <Sidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header profile={profile} />
        <main id="main-content" className="mx-auto w-full max-w-[1500px] flex-1 p-4 md:p-8">
          <OnboardingChecklist userId={profile.id} />
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
