# 🚀 Stripe Billing Integration - Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Status
- [x] All Stripe changes committed to git
- [x] Code pushed to `main` branch (commits: 3e4e6ae, 73598bd, 6fbcb9b)
- [ ] Code deployed to AWS (App Runner/Amplify)

### 2. Database Migration Required ⚠️

**IMPORTANT**: Run this SQL migration on production database BEFORE deploying code!

```bash
# Connect to production database
psql -h <production-db-host> -U <db-user> -d <db-name>

# Or use AWS RDS Query Editor / pgAdmin
```

**Migration File**: `server/migrations/add-stripe-billing-fields.sql`

**Fields Added to `tenants` table**:
- `stripe_customer_id` (VARCHAR 100)
- `stripe_subscription_id` (VARCHAR 100)
- `plan` (VARCHAR 30)
- `billing_interval` (VARCHAR 10)
- `seat_limit` (INTEGER)
- `current_period_end` (TIMESTAMP WITH TIME ZONE)

### 3. Environment Variables Required

Add these to your AWS App Runner / Secrets Manager:

```bash
# Stripe API Keys (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_xxxxx  # ⚠️ Use LIVE key, not test key!
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Get from webhook setup

# Application URL
APP_BASE_URL=https://app.timepulse.io  # Your production domain
```

### 4. Stripe Dashboard Setup

#### A. Get Live API Keys
1. Go to: https://dashboard.stripe.com/apikeys
2. **Toggle to LIVE mode** (top right)
3. Copy **Secret key** (sk_live_...)
4. Add to AWS Secrets Manager

#### B. Create Products & Prices
Run this script to create production products:

```bash
cd server
STRIPE_SECRET_KEY=sk_live_xxxxx node scripts/setup-stripe-products-per-user.js
```

This creates:
- **Starter**: $1.99/user/month
- **Professional**: $3.99/user/month
- **Enterprise**: Contact sales

**Save the Price IDs** and update `server/routes/billing.js`:

```javascript
const PRICE = {
  starter_monthly: "price_xxxxx",      // ← Update these
  starter_annual: "price_xxxxx",
  professional_monthly: "price_xxxxx",
  professional_annual: "price_xxxxx",
  enterprise_monthly: "contact_sales",
  enterprise_annual: "contact_sales",
};
```

#### C. Setup Webhook Endpoint
1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://app.timepulse.io/api/billing/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing secret** (whsec_...)
6. Add to AWS Secrets Manager as `STRIPE_WEBHOOK_SECRET`

---

## 📋 Deployment Steps

### Step 1: Run Database Migration

```sql
-- Connect to production database and run:
-- File: server/migrations/add-stripe-billing-fields.sql

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS plan VARCHAR(30),
ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(10),
ADD COLUMN IF NOT EXISTS seat_limit INTEGER,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Verify
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name LIKE 'stripe%' OR column_name IN ('plan', 'billing_interval', 'seat_limit');
```

### Step 2: Update Environment Variables

**AWS Secrets Manager** (if using):
```bash
aws secretsmanager update-secret \
  --secret-id timepulse-prod-secrets \
  --secret-string '{
    "STRIPE_SECRET_KEY": "sk_live_xxxxx",
    "STRIPE_WEBHOOK_SECRET": "whsec_xxxxx",
    "APP_BASE_URL": "https://app.timepulse.io"
  }'
```

**Or App Runner Environment Variables**:
- Add via AWS Console → App Runner → Configuration → Environment variables

### Step 3: Create Stripe Products

```bash
# SSH to production or run locally with production credentials
cd server
STRIPE_SECRET_KEY=sk_live_xxxxx node scripts/setup-stripe-products-per-user.js

# Copy the output Price IDs
```

### Step 4: Update Price IDs in Code

Edit `server/routes/billing.js`:
```javascript
const PRICE = {
  starter_monthly: "price_LIVE_xxxxx",      // ← Update with real IDs
  starter_annual: "price_LIVE_xxxxx",
  professional_monthly: "price_LIVE_xxxxx",
  professional_annual: "price_LIVE_xxxxx",
  enterprise_monthly: "contact_sales",
  enterprise_annual: "contact_sales",
};
```

Commit and push:
```bash
git add server/routes/billing.js
git commit -m "Update Stripe Price IDs for production"
git push origin main
```

### Step 5: Deploy Code

**If using AWS Amplify (Frontend)**:
- Push to main branch triggers auto-deployment
- Or manually trigger: AWS Console → Amplify → Redeploy

**If using AWS App Runner (Backend)**:
- Push to main branch triggers auto-deployment
- Or manually trigger: AWS Console → App Runner → Deploy

### Step 6: Setup Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://app.timepulse.io/api/billing/webhook`
3. Select all subscription and payment events
4. Copy webhook secret → Add to AWS Secrets Manager
5. **Restart backend** to load new secret

### Step 7: Verify Deployment

```bash
# Test API endpoint
curl https://app.timepulse.io/api/billing/status?tenantId=<tenant-id>

# Should return:
# { "plan": "none", "status": "inactive", ... }
```

---

## 🧪 Testing in Production

### Test Checkout Flow

1. Login to production: https://app.timepulse.io
2. Go to Settings → Billing & Subscription
3. Select a plan and number of seats
4. Click "Start Free Trial"
5. Use Stripe test card: `4242 4242 4242 4242`
6. Complete checkout
7. Verify:
   - Redirected to success page
   - Database updated with subscription
   - "Current Plan" badge shows on billing page

### Verify Database

```sql
SELECT 
    tenant_name,
    stripe_customer_id,
    stripe_subscription_id,
    plan,
    seat_limit,
    status
FROM tenants
WHERE stripe_subscription_id IS NOT NULL;
```

### Check Webhook Events

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. View recent events
4. All should show ✓ Success (200 OK)

---

## 🔧 Troubleshooting

### Issue: Webhook failing (500 error)

**Check**:
```bash
# Verify STRIPE_WEBHOOK_SECRET is set
echo $STRIPE_WEBHOOK_SECRET

# Check backend logs
aws logs tail /aws/apprunner/<service-name> --follow
```

**Fix**: Update secret in AWS Secrets Manager and restart backend

### Issue: "No active subscription" after checkout

**Check**:
1. Stripe Dashboard → Customers → Find customer
2. Check if subscription was created
3. Check webhook events for `checkout.session.completed`

**Fix**: Manually sync subscription:
```bash
cd server
node scripts/sync-subscription-now.js
```

### Issue: Wrong pricing displayed

**Check**: `server/routes/billing.js` has correct Price IDs

**Fix**: Update PRICE constant with production price IDs

---

## 📊 Monitoring

### Key Metrics to Monitor

1. **Stripe Dashboard**:
   - New subscriptions
   - Failed payments
   - Webhook delivery rate

2. **Application Logs**:
   - Checkout errors
   - Webhook processing
   - Database sync issues

3. **Database**:
   - Tenants with subscriptions
   - Seat utilization
   - Subscription status

### Alerts to Set Up

- Webhook failure rate > 5%
- Failed payment notifications
- Subscription cancellations
- Seat limit exceeded

---

## 🎯 Post-Deployment

- [ ] Test complete checkout flow
- [ ] Verify webhook events processing
- [ ] Check database has correct data
- [ ] Test "Manage Billing" portal
- [ ] Test plan upgrades
- [ ] Monitor for 24 hours
- [ ] Document any issues
- [ ] Update team on deployment

---

## 📝 Rollback Plan

If issues occur:

1. **Revert code**:
   ```bash
   git revert 3e4e6ae 73598bd 6fbcb9b
   git push origin main
   ```

2. **Database** (columns are nullable, safe to leave):
   - No rollback needed
   - Data persists for future deployment

3. **Stripe**:
   - Products/prices remain (no impact)
   - Webhook can be disabled temporarily

---

## ✅ Deployment Complete Checklist

- [ ] Database migration executed successfully
- [ ] Environment variables added to AWS
- [ ] Stripe products created (Price IDs saved)
- [ ] Price IDs updated in code
- [ ] Code deployed to production
- [ ] Webhook endpoint configured
- [ ] Test checkout completed successfully
- [ ] Database shows subscription data
- [ ] UI displays "Current Plan" correctly
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment

---

## 📞 Support Contacts

- **Stripe Support**: https://support.stripe.com
- **AWS Support**: AWS Console → Support Center
- **Development Team**: [Your team contact]

---

**Last Updated**: November 24, 2025
**Version**: 1.0
**Prepared By**: AI Assistant

