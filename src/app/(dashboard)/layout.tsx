'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useUser } from '@/hooks/useUser';
import { Toaster } from '@/components/ui/sonner';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange shadow-lg shadow-brand-orange/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-brand-peach/30">
            <div className="h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-brand-orange" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-cream">
      <Sidebar profile={profile} />
      <div className="flex flex-1 flex-col">
        <Header profile={profile} />
        <main className="flex-1 p-4 md:p-8">
          <OnboardingChecklist />
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
