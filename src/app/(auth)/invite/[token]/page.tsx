'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { House } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Invite = { email: string; companyName: string; role: string };

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [validating, setValidating] = useState(true);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [retry, setRetry] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const correctAccount = user?.email?.toLowerCase() === invite?.email.toLowerCase();
  const readyToAccept = !!user && correctAccount && !!user.email_confirmed_at;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function validateInvite() {
      try {
        const [response, auth] = await Promise.all([
          fetch(`/api/invite/validate?token=${encodeURIComponent(token)}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }),
          supabase.auth.getUser(),
        ]);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'This invite is invalid or has expired. Ask your team owner for a new link.');
        if (active) {
          setInvite(data);
          setUser(auth.data.user);
          setFullName(auth.data.user?.user_metadata?.full_name || '');
          setError('');
        }
      } catch (error) {
        if (active) setError(error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'Could not check this invite. Check your connection and try again.');
      } finally {
        if (active) setValidating(false);
      }
    }
    void validateInvite();
    return () => { active = false; controller.abort(); };
  }, [token, supabase, retry]);

  async function acceptInvite() {
    const response = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, fullName: fullName.trim() }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not join this workspace. Please try again.');
    router.push('/visualize');
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!invite) return;
    if (!fullName.trim()) { setError('Enter your name to join the workspace.'); return; }
    setLoading(true);
    setError('');
    try {
      if (readyToAccept) {
        await acceptInvite();
        return;
      }
      if (user && !correctAccount) throw new Error('Sign out of the current account, then sign in with the invited email address.');
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: invite.email, password });
        if (error) throw error;
        setUser(data.user);
        if (!data.user?.email_confirmed_at) throw new Error('Confirm your email address before joining this workspace.');
        await acceptInvite();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: invite.email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/invite/${token}`)}`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session || !data.user?.email_confirmed_at) {
          setConfirmationSent(true);
          setMode('signin');
          setPassword('');
          return;
        }
        setUser(data.user);
        await acceptInvite();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not join the workspace. Check your connection and try again.');
    } finally { setLoading(false); }
  }

  async function switchAccount() {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setMode('signin');
      setPassword('');
    } catch { setError('Could not sign out. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-brand-cream px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 inline-flex items-center gap-3 rounded-md text-xl font-semibold text-brand-brown focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"><House className="size-6 text-brand-orange" aria-hidden="true" /> ExteriorViz</Link>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-brown">{validating ? 'Your team invitation' : invite ? `Join ${invite.companyName}` : 'Invitation unavailable'}</h1>
        {validating ? <p role="status" className="mt-5 text-brand-brown-soft">Checking your invitation…</p> : !invite ? <div className="mt-6 space-y-5"><p role="alert" className="text-red-800">{error}</p><p className="text-sm text-brand-brown-soft">If this link has expired or was already used, ask your team owner for a new invitation.</p><Button onClick={() => { setValidating(true); setRetry((value) => value + 1); }}>Try again</Button><Link href="/login" className="ml-4 text-sm font-medium text-brand-orange">Go to sign in</Link></div> : <>
          <p className="mt-3 mb-7 leading-relaxed text-brand-brown-soft">{invite.role === 'demo' ? 'Explore roofing, windows, and doors with a demo account.' : `You’ve been invited to this workspace as ${invite.role === 'admin' ? 'an administrator' : 'a sales representative'}.`}</p>
          {confirmationSent && <div role="status" className="mb-6 rounded-lg border border-brand-peach bg-white p-5"><h2 className="font-semibold text-brand-brown">Check your email</h2><p className="mt-2 text-sm leading-relaxed text-brand-brown-soft">Open the confirmation link sent to {invite.email}, then return here to join the team. Already confirmed? Sign in below. If you already have an account, use your existing password.</p></div>}
          {user && !correctAccount ? <div className="space-y-5"><p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">You are signed in as {user.email}. This invitation is for {invite.email}.</p><Button onClick={switchAccount} disabled={loading}>{loading ? 'Signing out…' : 'Use the invited account'}</Button>{error && <p role="alert" className="text-sm text-red-800">{error}</p>}</div> : <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
            <div className="space-y-2"><Label htmlFor="email">Invited email address</Label><Input id="email" name="email" type="email" autoComplete="email" value={invite.email} readOnly className="h-12 bg-brand-peach-light" /></div>
            <div className="space-y-2"><Label htmlFor="fullName">Your name</Label><Input id="fullName" name="fullName" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={100} className="h-12 bg-white" /></div>
            {!readyToAccept && <div className="space-y-2"><Label htmlFor="password">{mode === 'signup' ? 'Create a password' : 'Your password'}</Label><Input id="password" name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === 'signup' ? 8 : undefined} aria-describedby={mode === 'signup' ? 'password-help' : undefined} className="h-12 bg-white" />{mode === 'signup' && <p id="password-help" className="text-sm text-brand-brown-soft">At least 8 characters.</p>}</div>}
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
            <Button type="submit" disabled={loading} className="h-12 w-full bg-brand-orange font-semibold text-white hover:bg-brand-orange-dark">{loading ? 'Joining workspace…' : readyToAccept ? 'Join workspace' : mode === 'signup' ? 'Create account to join' : 'Sign in and join'}</Button>
            {!readyToAccept && <button type="button" disabled={loading} onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setPassword(''); }} className="rounded-md text-sm font-medium text-brand-orange underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange">{mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Create one'}</button>}
          </form>}
          <p className="mt-8 text-xs leading-relaxed text-brand-brown-soft">By joining, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and acknowledge our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
        </>}
      </div>
    </main>
  );
}
