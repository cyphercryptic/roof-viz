'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Failed to create account');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        companyName,
        fullName,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to set up company');
      setLoading(false);
      return;
    }

    router.push('/visualize');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-brown relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-80 h-80 rounded-full bg-brand-orange" />
          <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full bg-brand-peach" />
        </div>
        <div className="relative z-10 max-w-md px-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange mb-8 shadow-2xl shadow-brand-orange/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Close more deals with <span className="text-brand-orange">visual proof</span>.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Your sales reps show homeowners exactly what their new roof will look like. No more guessing, no more imagination required.
          </p>
        </div>
      </div>

      {/* Right signup form */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-brand-brown">RoofViz</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-brand-brown">Create your account</h2>
            <p className="text-brand-brown/50 mt-1">Sign up your roofing company</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-brand-brown/70 text-sm font-medium">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Acme Roofing LLC"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-11 bg-white border-brand-peach/40 focus:border-brand-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-brand-brown/70 text-sm font-medium">Your Name</Label>
              <Input
                id="fullName"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 bg-white border-brand-peach/40 focus:border-brand-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-brown/70 text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@acmeroofing.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white border-brand-peach/40 focus:border-brand-orange"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-brand-brown/70 text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 bg-white border-brand-peach/40 focus:border-brand-orange"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold shadow-lg shadow-brand-orange/20 transition-all"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-brand-brown/40">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-orange font-medium hover:text-brand-orange-dark transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
