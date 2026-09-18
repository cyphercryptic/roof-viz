'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { workspaceNavigation, managementNavigation, isNavigationActive } from './navigation';
import type { Profile } from '@/types';

export function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const initials = profile?.full_name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-brand-brown text-white md:flex">
      <Link href="/" aria-label="ExteriorViz home" className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <House className="h-7 w-7 text-brand-peach" aria-hidden="true" />
        <span className="text-xl font-semibold tracking-tight">ExteriorViz</span>
      </Link>
      <div className="px-6 py-5 text-sm leading-6 text-white/65">Roofing, windows & doors.<br />One connected workspace.</div>
      <nav aria-label="Workspace" className="flex-1 space-y-1 px-3 pb-6">
        {workspaceNavigation.map((item) => {
          const active = isNavigationActive(pathname, item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors', active ? 'bg-white text-brand-brown' : 'text-white/75 hover:bg-white/10 hover:text-white')}><item.icon className="h-5 w-5" aria-hidden="true" />{item.label}</Link>;
        })}
        {isAdmin && <>
          <p className="px-3 pb-2 pt-8 text-sm text-white/50">Manage your company</p>
          {managementNavigation.map((item) => {
            const active = isNavigationActive(pathname, item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors', active ? 'bg-white text-brand-brown' : 'text-white/75 hover:bg-white/10 hover:text-white')}><item.icon className="h-5 w-5" aria-hidden="true" />{item.label}</Link>;
          })}
        </>}
      </nav>
      <div className="space-y-4 border-t border-white/10 p-5">
        <Link href="/#examples" className="flex items-center justify-between text-sm text-white/70 hover:text-white">Explore sample previews<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        {profile && <div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{profile.full_name}</p><p className="text-xs capitalize text-white/60">{profile.role === 'demo' ? 'Demo workspace' : profile.role === 'rep' ? 'Sales representative' : profile.role}</p></div></div>}
      </div>
    </aside>
  );
}
