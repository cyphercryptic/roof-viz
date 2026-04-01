'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [validating, setValidating] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function validateInvite() {
      const res = await fetch(`/api/invite/validate?token=${token}`);
      if (!res.ok) {
        setError('This invite link is invalid or has expired.');
        setValidating(false);
        return;
      }
      const data = await res.json();
      setInviteEmail(data.email);
      setCompanyName(data.companyName);
      setValidating(false);
    }
    validateInvite();
  }, [token]);

  async function handleAcceptInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inviteEmail,
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

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: authData.user.id, fullName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to accept invite');
      setLoading(false);
      return;
    }

    router.push('/visualize');
    router.refresh();
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-orange border-t-transparent" />
          <p className="text-brand-brown/50 text-sm">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-brand-brown">RoofViz</span>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-brand-brown">Join {companyName}</h2>
          <p className="text-brand-brown/50 mt-1">You&apos;ve been invited to join as a sales rep</p>
        </div>

        <form onSubmit={handleAcceptInvite} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-brand-brown/70 text-sm font-medium">Email</Label>
            <Input value={inviteEmail} disabled className="h-11 bg-brand-peach-light border-brand-peach/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-brand-brown/70 text-sm font-medium">Your Name</Label>
            <Input
              id="fullName"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 bg-white border-brand-peach/40 focus:border-brand-orange"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-brand-brown/70 text-sm font-medium">Create Password</Label>
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
            className="w-full h-11 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold shadow-lg shadow-brand-orange/20"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Team'}
          </Button>
        </form>
      </div>
    </div>
  );
}
