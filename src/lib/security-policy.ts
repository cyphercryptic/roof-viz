/** Customer media must stay inside the tenant folder, including legacy rows. */
export function isTenantMediaPath(path: unknown, tenantId: string): path is string {
  return typeof path === 'string'
    && path.startsWith(`${tenantId}/`)
    && !/[\u0000-\u001f\u007f?#]/.test(path)
    && !path.includes('\\')
    && !path.includes('%')
    && !path.split('/').some((segment) => segment === '..' || segment === '.' || segment === '');
}

/** Scheduled cancellation keeps Stripe status active until the paid period ends. */
export function hasGenerationAccess(
  subscription: { plan: string; status: string; current_period_end: string | null },
  now = Date.now(),
): boolean {
  if (!['active', 'trialing'].includes(subscription.status)) return false;
  if (subscription.plan === 'free') return true;
  return !!subscription.current_period_end && Date.parse(subscription.current_period_end) > now;
}
