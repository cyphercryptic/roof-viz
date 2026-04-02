const SHARING_PLANS = ['pro', 'business', 'business_pro'];
const PDF_PLANS = ['pro', 'business', 'business_pro'];
const ANALYTICS_PLANS = ['business', 'business_pro'];
const SUPPORT_PLANS = ['business', 'business_pro'];
const WHITE_LABEL_PLANS = ['business_pro'];

export function canShare(plan: string | undefined | null): boolean {
  return SHARING_PLANS.includes(plan || '');
}

export function canGeneratePdf(plan: string | undefined | null): boolean {
  return PDF_PLANS.includes(plan || '');
}

export function canViewAnalytics(plan: string | undefined | null): boolean {
  return ANALYTICS_PLANS.includes(plan || '');
}

export function hasSupport(plan: string | undefined | null): boolean {
  return SUPPORT_PLANS.includes(plan || '');
}

export function canWhiteLabel(plan: string | undefined | null): boolean {
  return WHITE_LABEL_PLANS.includes(plan || '');
}
