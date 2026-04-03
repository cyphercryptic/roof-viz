'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleForgotPassword() {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setResetLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setResetLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
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
            Show them their <span className="text-brand-orange">new roof</span> before the first shingle is laid.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            AI-powered roof visualization that turns your sales pitch into an unforgettable experience.
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
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
            <h2 className="text-2xl font-bold text-brand-brown">Welcome back</h2>
            <p className="text-brand-brown/50 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-brown/70 text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white border-brand-peach/40 focus:border-brand-orange focus:ring-brand-orange/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-brand-brown/70 text-sm font-medium">Password</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-xs text-brand-orange hover:text-brand-orange-dark font-medium transition-colors"
                >
                  {resetLoading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-white border-brand-peach/40 focus:border-brand-orange focus:ring-brand-orange/20"
              />
            </div>
            {resetSent && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-sm text-green-700">Password reset link sent! Check your email.</p>
              </div>
            )}
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
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-brand-brown/40">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-orange font-medium hover:text-brand-orange-dark transition-colors">
              Sign up your company
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
