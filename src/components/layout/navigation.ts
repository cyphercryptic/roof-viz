import { Image, FolderOpen, Package, Settings, Users, CreditCard, BarChart3, Palette } from 'lucide-react';

export const workspaceNavigation = [
  { href: '/visualize', label: 'Create a preview', icon: Image },
  { href: '/gallery', label: 'Saved previews', icon: FolderOpen },
];

export const managementNavigation = [
  { href: '/catalog', label: 'Product catalog', icon: Package },
  { href: '/analytics', label: 'Activity', icon: BarChart3 },
  { href: '/settings/team', label: 'Team', icon: Users },
  { href: '/settings/billing', label: 'Plans & usage', icon: CreditCard },
  { href: '/settings/branding', label: 'Your branding', icon: Palette },
  { href: '/settings', label: 'Company settings', icon: Settings },
];

export function isNavigationActive(pathname: string, href: string) {
  return href === '/settings' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
