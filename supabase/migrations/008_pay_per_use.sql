-- Add pay_per_use and business_pro as valid plan options
ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pay_per_use', 'starter', 'pro', 'business', 'business_pro'));
