'use client';

import { useState } from 'react';
import Link from 'next/link';
import { House } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 8) { setError('Use at least 8 characters for your new password.'); return; }
    if (password !== confirmPassword) { setError('Your passwords do not match. Enter the same password in both fields.'); return; }
    setLoading(true);
    try {
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) { setError('This reset link has expired or is no longer valid. Return to sign in and request a new link.'); return; }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update your password. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-brand-cream px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-12 inline-flex items-center gap-3 rounded-md text-xl font-semibold text-brand-brown focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"><House className="size-6 text-brand-orange" aria-hidden="true" /> ExteriorViz</Link>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-brown">{success ? 'Password updated' : 'Set a new password'}</h1>
        {success ? <div className="mt-6 space-y-6"><p role="status" className="text-brand-brown-soft">Your new password is ready to use. You can continue to your workspace.</p><Link href="/onboarding" className="flex h-12 items-center justify-center rounded-lg bg-brand-orange font-semibold text-white hover:bg-brand-orange-dark">Continue to ExteriorViz</Link></div> : <>
          <p className="mt-3 mb-8 text-brand-brown-soft">Choose a strong password you don&apos;t use elsewhere.</p>
          <form onSubmit={handleReset} className="space-y-5" aria-busy={loading}>
            <div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} aria-describedby="password-help" className="h-12 bg-white" /><p id="password-help" className="text-sm text-brand-brown-soft">At least 8 characters.</p></div>
            <div className="space-y-2"><Label htmlFor="confirm">Confirm new password</Label><Input id="confirm" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} className="h-12 bg-white" /></div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
            <Button type="submit" disabled={loading} className="h-12 w-full bg-brand-orange font-semibold text-white hover:bg-brand-orange-dark">{loading ? 'Updating password…' : 'Update password'}</Button>
          </form>
        </>}
        <Link href="/login" className="mt-8 inline-block text-sm font-medium text-brand-orange underline-offset-4 hover:underline">Back to sign in</Link>
      </div>
    </main>
  );
}
