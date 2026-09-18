'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { House, Menu, X, LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { workspaceNavigation, managementNavigation, isNavigationActive } from './navigation';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

export function Header({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const navigation = [...workspaceNavigation, ...(isAdmin ? managementNavigation : [])];
  const currentPage = navigation.find((item) => isNavigationActive(pathname, item.href));
  const initials = profile?.full_name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase() || 'EV';

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace('/login');
      router.refresh();
    } catch {
      toast.error('Could not sign out. Please try again.');
    } finally { setSigningOut(false); }
  }

  return <header onKeyDown={(event) => { if (event.key === 'Escape') { setMobileMenuOpen(false); } }} className="border-b border-border bg-white">
    <div className="flex h-20 items-center justify-between gap-3 px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-2 md:hidden">
        <button type="button" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-3 text-brand-brown hover:bg-brand-peach-light">{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        <Link href="/" className="flex items-center gap-2 text-base font-semibold"><House className="hidden h-5 w-5 min-[380px]:block" aria-hidden="true" />ExteriorViz</Link>
      </div>
      <p className="hidden text-sm font-medium text-brand-brown-soft md:block">{currentPage?.label || 'Your workspace'}</p>
      <DropdownMenu>
        <DropdownMenuTrigger render={<button aria-label="Open account menu" className="flex items-center gap-3 rounded-lg p-2 text-sm hover:bg-brand-peach-light" />}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-peach-light font-semibold text-brand-brown">{initials}</span>
          <span className="hidden max-w-44 truncate sm:inline">{profile?.full_name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled className="capitalize">{profile?.role === 'rep' ? 'Sales representative' : profile?.role || 'Account'}</DropdownMenuItem>
          {isAdmin && <DropdownMenuItem onClick={() => router.push('/settings')}><Settings className="mr-2 h-4 w-4" />Company settings</DropdownMenuItem>}
          <DropdownMenuItem disabled={signingOut} onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />{signingOut ? 'Signing out…' : 'Sign out'}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    {mobileMenuOpen && <nav id="mobile-navigation" aria-label="Workspace" className="grid gap-1 border-t border-border bg-white p-3 md:hidden">{navigation.map((item) => { const active = isNavigationActive(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)} className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium', active ? 'bg-brand-orange text-white' : 'text-brand-brown hover:bg-brand-peach-light')}><item.icon className="h-5 w-5" aria-hidden="true" />{item.label}</Link>; })}</nav>}
  </header>;
}
