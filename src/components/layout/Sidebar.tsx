'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Image, FolderOpen, Package, Settings, Users, CreditCard } from 'lucide-react';
import type { Profile } from '@/types';

interface SidebarProps {
  profile: Profile | null;
}

const navItems = [
  { href: '/visualize', label: 'Visualize', icon: Image },
  { href: '/gallery', label: 'Gallery', icon: FolderOpen },
];

const adminItems = [
  { href: '/catalog', label: 'Product Catalog', icon: Package },
  { href: '/settings/team', label: 'Team', icon: Users },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = profile?.role === 'admin';

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-brand-brown">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight">RoofViz</span>
          <span className="text-[10px] block text-brand-peach -mt-1 uppercase tracking-widest">Pro</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-brand-peach/50">
          Main
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
              pathname.startsWith(item.href)
                ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20'
                : 'text-white/70 hover:bg-white/8 hover:text-white'
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="my-5 border-t border-white/10" />
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-brand-peach/50">
              Admin
            </p>
            {adminItems.map((item) => {
              const isActive = item.href === '/settings'
                ? pathname === '/settings'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom user info */}
      {profile && (
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold">
              {profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-[11px] text-white/40 capitalize">{profile.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
