'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, House } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function handleForgotPassword() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter your email address above to receive a password reset link.');
      return;
    }
    setResetLoading(true);
    setResetSent(false);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not send the reset link. Please try again.');
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.push('/onboarding');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not sign in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-brand-cream lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand-brown p-12 text-white lg:flex xl:p-16" aria-label="About ExteriorViz">
        <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-md text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><House className="size-6" aria-hidden="true" /> ExteriorViz</Link>
        <div className="max-w-md py-16">
          <p className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">A clearer picture of every possibility.</p>
          <p className="mt-6 text-lg leading-relaxed text-slate-200">Explore roofing, windows, and doors on a homeowner&apos;s own photo. Keep your products, previews, and team in one workspace.</p>
        </div>
        <p className="text-sm text-slate-300">Built for the conversation at the kitchen table.</p>
      </aside>
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-brand-brown-soft hover:text-brand-brown focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"><ArrowLeft className="size-4" aria-hidden="true" /> Back to ExteriorViz</Link>
        <div className="m-auto w-full max-w-sm py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-brown">Welcome back</h1>
          <p className="mt-3 mb-8 leading-relaxed text-brand-brown-soft">Sign in to your ExteriorViz workspace.</p>
          {searchParams.get('error') === 'confirmation' && <p role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">That email link could not be verified. Try the latest link in your inbox, or use Forgot password to regain access.</p>}
          <form onSubmit={handleLogin} className="space-y-5" aria-busy={loading || resetLoading}>
            <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 bg-white" /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 bg-white" /></div>
            <button type="button" onClick={handleForgotPassword} disabled={resetLoading || loading} className="rounded-md text-sm font-medium text-brand-orange underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange disabled:opacity-60">{resetLoading ? 'Sending reset link…' : 'Forgot password?'}</button>
            {resetSent && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">If an account exists for that address, you&apos;ll receive a password reset email. Check your inbox and spam folder.</p>}
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
            <Button type="submit" disabled={loading || resetLoading} className="h-12 w-full bg-brand-orange font-semibold text-white hover:bg-brand-orange-dark">{loading ? 'Signing in…' : 'Sign in'}</Button>
          </form>
          <p className="mt-8 text-sm text-brand-brown-soft">New to ExteriorViz? <Link href="/signup" className="font-semibold text-brand-orange underline-offset-4 hover:underline">Create your workspace</Link></p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main id="main-content" className="flex min-h-screen items-center justify-center bg-brand-cream"><p role="status">Loading sign in…</p></main>}><LoginForm /></Suspense>;
}
