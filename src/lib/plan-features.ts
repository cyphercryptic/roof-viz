const SHARING_PLANS = ['pro', 'business', 'business_pro'];
const SUPPORT_PLANS = ['business', 'business_pro'];
const WHITE_LABEL_PLANS = ['business_pro'];

export function canShare(plan: string | undefined | null): boolean {
  return SHARING_PLANS.includes(plan || '');
}

export function hasSupport(plan: string | undefined | null): boolean {
  return SUPPORT_PLANS.includes(plan || '');
}

export function canWhiteLabel(plan: string | undefined | null): boolean {
  return WHITE_LABEL_PLANS.includes(plan || '');
}
