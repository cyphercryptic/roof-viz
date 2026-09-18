'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    let requestId = 0;
    let loadedUserId: string | null = null;

    async function loadAccount(authUser?: User | null) {
      const currentRequest = ++requestId;
      if (!authUser?.id || authUser.id !== loadedUserId) setLoading(true);
      setError(null);
      try {
        if (authUser === undefined) {
          let timeout: ReturnType<typeof setTimeout> | undefined;
          try {
            const result = await Promise.race([
              supabase.auth.getUser(),
              new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Account request timed out')), 15000); }),
            ]);
            if (result.error && result.error.name !== 'AuthSessionMissingError') throw result.error;
            authUser = result.data.user;
          } finally { if (timeout) clearTimeout(timeout); }
        }
        if (!mounted || currentRequest !== requestId) return;
        setUser(authUser ?? null);
        if (!authUser) {
          setProfile(null);
          router.replace('/login');
          return;
        }
        const result = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle().abortSignal(AbortSignal.timeout(15000));
        if (result.error) throw result.error;
        if (!mounted || currentRequest !== requestId) return;
        loadedUserId = authUser.id;
        setProfile(result.data);
        // Only a successful empty read means the company is not set up yet.
        if (!result.data) router.replace('/onboarding');
      } catch {
        if (mounted && currentRequest === requestId) {
          setError('We could not load your account. Check your connection and try again.');
        }
      } finally {
        if (mounted && currentRequest === requestId) setLoading(false);
      }
    }

    void loadAccount();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // getUser above verifies the initial session; avoid racing its request with
      // INITIAL_SESSION. Defer subsequent queries until the auth callback returns.
      if (!mounted || event === 'INITIAL_SESSION') return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user.id === loadedUserId) return;
      queueMicrotask(() => { if (mounted) void loadAccount(session?.user ?? null); });
    });
    return () => { mounted = false; requestId++; subscription.unsubscribe(); };
  }, [router, attempt]);

  return { user, profile, loading, error, retry: () => setAttempt(value => value + 1), supabase: createClient() };
}
