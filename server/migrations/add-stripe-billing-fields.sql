-- =====================================================
-- Stripe Billing Integration - Database Migration
-- =====================================================
-- This migration adds Stripe-related fields to the tenants table
-- Run this on production database before deploying the new code
-- =====================================================

-- Add Stripe billing columns to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS plan VARCHAR(30),
ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(10),
ADD COLUMN IF NOT EXISTS seat_limit INTEGER,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_subscription_id ON tenants(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);

-- Add comments for documentation
COMMENT ON COLUMN tenants.stripe_customer_id IS 'Stripe customer ID (e.g., cus_xxxxx)';
COMMENT ON COLUMN tenants.stripe_subscription_id IS 'Stripe subscription ID (e.g., sub_xxxxx)';
COMMENT ON COLUMN tenants.plan IS 'Subscription plan: starter, professional, or enterprise';
COMMENT ON COLUMN tenants.billing_interval IS 'Billing interval: monthly or annual';
COMMENT ON COLUMN tenants.seat_limit IS 'Number of user seats included in subscription';
COMMENT ON COLUMN tenants.current_period_end IS 'End date of current billing period';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN (
    'stripe_customer_id',
    'stripe_subscription_id',
    'plan',
    'billing_interval',
    'seat_limit',
    'current_period_end'
)
ORDER BY column_name;

-- Check if any existing tenants need default values
SELECT 
    id,
    tenant_name,
    subdomain,
    stripe_customer_id,
    stripe_subscription_id,
    plan,
    seat_limit
FROM tenants;

