export interface Subscription {
  id: string;
  tenant_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pay_per_use' | 'starter' | 'pro' | 'business' | 'business_pro';
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
  visualization_limit: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}
