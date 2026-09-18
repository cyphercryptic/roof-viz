'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (mounted) {
        setProfile(data);
        if (!data) router.replace('/onboarding');
      }
    }

    // Initial fetch
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      const authUser = data.user;
      if (!mounted) return;
      setUser(authUser);
      if (authUser) {
        fetchProfile(authUser.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User } | null) => {
        if (!mounted) return;
        const newUser = session?.user ?? null;
        setUser(newUser);
        if (newUser) {
          fetchProfile(newUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return { user, profile, loading, supabase: createClient() };
}
