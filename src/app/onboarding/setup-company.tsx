'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SetupCompany(props: { companyName: string; fullName: string }) {
  const [companyName, setCompanyName] = useState(props.companyName);
  const [fullName, setFullName] = useState(props.fullName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), fullName: fullName.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not set up your workspace.');
      router.replace('/visualize');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Check your connection and try again.');
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-brand-cream px-5 py-16 flex items-center justify-center">
    <div className="w-full max-w-md">
      <Link href="/" className="text-xl font-semibold text-brand-brown">ExteriorViz</Link>
      <div className="mt-8 rounded-2xl border border-brand-peach/40 bg-white p-7 shadow-sm">
        <Building2 className="h-8 w-8 text-brand-orange mb-5" />
        <h1 className="text-2xl font-semibold text-brand-brown">Set up your workspace</h1>
        <p className="text-sm text-brand-brown/65 mt-2 mb-6">One place for your roofing, window and door projects.</p>
        <p className="flex items-center gap-2 text-sm text-emerald-700 mb-6"><Check className="h-4 w-4" />Your email is verified</p>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="company">Company name</Label><Input id="company" value={companyName} onChange={e => setCompanyName(e.target.value)} required maxLength={100} autoComplete="organization" /></div>
          <div className="space-y-2"><Label htmlFor="name">Your name</Label><Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} required maxLength={100} autoComplete="name" /></div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button disabled={loading} type="submit" className="w-full bg-brand-orange text-white hover:bg-brand-orange-dark">{loading ? 'Setting up…' : 'Open my workspace'}</Button>
        </form>
      </div>
    </div>
  </main>;
}
