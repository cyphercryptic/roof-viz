import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

/**
 * Plan configuration — maps plan names to Stripe price IDs and limits.
 * Set STRIPE_PRICE_* env vars after creating products in the Stripe dashboard.
 */
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    visualizationLimit: 5,
    teamMemberLimit: 1,
    stripePriceId: null,
    payPerUse: false,
    features: [
      '5 visualizations/month',
      '1 team member',
      'Standard quality',
    ],
  },
  pay_per_use: {
    name: 'Pay As You Go',
    price: 0.75,
    visualizationLimit: -1, // unlimited, charged per use
    teamMemberLimit: 1,
    stripePriceId: process.env.STRIPE_PRICE_PAY_PER_USE,
    payPerUse: true,
    features: [
      '$0.75 per visualization',
      '1 team member',
      'High quality',
      'No monthly commitment',
    ],
  },
  starter: {
    name: 'Starter',
    price: 44,
    visualizationLimit: 100,
    teamMemberLimit: 3,
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
    payPerUse: false,
    features: [
      '100 visualizations/month',
      '3 team members',
      'High quality',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 99,
    visualizationLimit: 250,
    teamMemberLimit: 10,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    payPerUse: false,
    features: [
      '250 visualizations/month',
      '10 team members',
      'High quality',
      'Priority support',
      'Gallery sharing',
    ],
  },
  business: {
    name: 'Business',
    price: 299,
    visualizationLimit: 1000,
    teamMemberLimit: -1, // unlimited
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS,
    payPerUse: false,
    features: [
      '1,000 visualizations/month',
      'Unlimited team members',
      'High quality',
      'Dedicated support',
      'Gallery sharing',
    ],
  },
  business_pro: {
    name: 'Business Pro',
    price: 1199,
    visualizationLimit: 5000,
    teamMemberLimit: -1, // unlimited
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS_PRO,
    payPerUse: false,
    features: [
      '5,000 visualizations/month',
      'Unlimited team members',
      'High quality',
      'Dedicated support',
      'Gallery sharing',
      'White-label options',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
