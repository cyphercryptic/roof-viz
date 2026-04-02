'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Image, FolderOpen, Package, Users, Settings, Menu, LogOut } from 'lucide-react';
import type { Profile } from '@/types';
import { useState } from 'react';

interface HeaderProps {
  profile: Profile | null;
}

const navItems = [
  { href: '/visualize', label: 'Visualize', icon: Image },
  { href: '/gallery', label: 'Gallery', icon: FolderOpen },
];

const adminItems = [
  { href: '/catalog', label: 'Catalog', icon: Package },
  { href: '/settings/team', label: 'Team', icon: Users },
];

export function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const isDemo = profile?.role === 'demo';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <header className="border-b border-brand-peach/30 bg-white">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Mobile logo + menu */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-brand-peach-light text-brand-brown transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-orange">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-bold text-brand-brown">RoofViz</span>
          </div>
        </div>

        {/* Desktop: breadcrumb area */}
        <div className="hidden md:block">
          <p className="text-sm text-brand-brown/50">
            {pathname.startsWith('/visualize') && 'Roof Visualization'}
            {pathname.startsWith('/gallery') && 'Visualization Gallery'}
            {pathname.startsWith('/catalog') && 'Product Catalog'}
            {pathname.startsWith('/settings/team') && 'Team Management'}
            {pathname === '/settings' && 'Company Settings'}
          </p>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-brand-peach-light transition-colors" />
            }
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white text-xs font-bold">
              {initials}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-brand-brown">
              {profile?.full_name}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-xs text-brand-brown/40" disabled>
              {profile?.role === 'owner' ? 'Owner' : profile?.role === 'admin' ? 'Admin' : profile?.role === 'demo' ? 'Demo User' : 'Sales Rep'}
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav className="border-t border-brand-peach/30 p-3 md:hidden space-y-1 bg-white">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-brand-orange text-white'
                  : 'text-brand-brown hover:bg-brand-peach-light'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="my-2 border-t border-brand-peach/30" />
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname.startsWith(item.href)
                      ? 'bg-brand-orange text-white'
                      : 'text-brand-brown hover:bg-brand-peach-light'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
      )}
    </header>
  );
}
