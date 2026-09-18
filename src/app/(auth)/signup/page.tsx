'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, House } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { company_name: companyName.trim(), full_name: fullName.trim() },
        },
      });
      if (authError) throw authError;
      if (!authData.session) {
        setConfirmationSent(true);
        return;
      }
      router.push('/onboarding');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-brand-cream lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand-brown p-12 text-white lg:flex xl:p-16" aria-label="About ExteriorViz">
        <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-md text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><House className="size-6" aria-hidden="true" /> ExteriorViz</Link>
        <div className="max-w-md py-16">
          <p className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Help homeowners see what comes next.</p>
          <p className="mt-6 text-lg leading-relaxed text-slate-200">Bring roofing, window, and door options into the same conversation. Create a workspace for your products, previews, and team.</p>
        </div>
        <p className="text-sm text-slate-300">One home. More possibilities.</p>
      </aside>
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-brand-brown-soft hover:text-brand-brown focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"><ArrowLeft className="size-4" aria-hidden="true" /> Back to ExteriorViz</Link>
        <div className="m-auto w-full max-w-sm py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-brown">Create your account</h1>
          <p className="mt-3 mb-7 leading-relaxed text-brand-brown-soft">Start your company&apos;s ExteriorViz workspace.</p>
          {confirmationSent ? <div role="status" className="space-y-3 rounded-lg border border-brand-peach bg-white p-6">
            <h2 className="font-semibold text-brand-brown">Check your email</h2>
            <p className="text-sm leading-relaxed text-brand-brown-soft">We sent a confirmation link to {email}. Open it to verify your address, then finish setting up your company. Check your spam folder if you don&apos;t see it.</p>
            <Link href="/login" className="inline-block font-medium text-brand-orange underline-offset-4 hover:underline">Continue to sign in</Link>
          </div> : <form onSubmit={handleSignup} className="space-y-4" aria-busy={loading}>
            <div className="space-y-2"><Label htmlFor="companyName">Company name</Label><Input id="companyName" name="companyName" autoComplete="organization" placeholder="Your company" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required maxLength={100} className="h-12 bg-white" /></div>
            <div className="space-y-2"><Label htmlFor="fullName">Your name</Label><Input id="fullName" name="fullName" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={100} className="h-12 bg-white" /></div>
            <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 bg-white" /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} aria-describedby="password-help" className="h-12 bg-white" /><p id="password-help" className="text-sm text-brand-brown-soft">At least 8 characters.</p></div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
            <Button type="submit" disabled={loading} className="h-12 w-full bg-brand-orange font-semibold text-white hover:bg-brand-orange-dark">{loading ? 'Creating account…' : 'Create account'}</Button>
          </form>}
          <p className="mt-5 text-xs leading-relaxed text-brand-brown-soft">By creating an account, you agree to our <Link className="underline" href="/terms">Terms of Service</Link> and acknowledge our <Link className="underline" href="/privacy">Privacy Policy</Link>.</p>
          <p className="mt-7 text-sm text-brand-brown-soft">Already have an account? <Link href="/login" className="font-semibold text-brand-orange underline-offset-4 hover:underline">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}
