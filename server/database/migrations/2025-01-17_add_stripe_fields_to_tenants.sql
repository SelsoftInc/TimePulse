-- Add Stripe billing fields to tenants table
-- This migration adds Stripe integration fields to support subscription management

-- Add Stripe customer and subscription fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100) NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100) NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan VARCHAR(30) NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(10) NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS seat_limit INTEGER NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'inactive';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_subscription_id ON tenants(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Add comments for documentation
COMMENT ON COLUMN tenants.stripe_customer_id IS 'Stripe customer ID for billing management';
COMMENT ON COLUMN tenants.stripe_subscription_id IS 'Stripe subscription ID for plan management';
COMMENT ON COLUMN tenants.plan IS 'Current subscription plan (starter, professional, enterprise)';
COMMENT ON COLUMN tenants.billing_interval IS 'Billing interval (monthly, annual)';
COMMENT ON COLUMN tenants.seat_limit IS 'Maximum number of seats/users allowed';
COMMENT ON COLUMN tenants.current_period_end IS 'End date of current billing period';
COMMENT ON COLUMN tenants.status IS 'Subscription status (active, past_due, cancelled, inactive)';
