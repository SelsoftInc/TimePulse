# Stripe Billing Integration Setup

This document explains how to set up Stripe billing integration for TimePulse.

## Prerequisites

1. Stripe account (https://stripe.com)
2. Node.js server running on port 5000
3. PostgreSQL database with tenants table

## Setup Steps

### 1. Stripe Dashboard Configuration

1. Log into your Stripe Dashboard
2. Go to Products → Create Product
3. Create the following products and prices:

#### Starter Plan

- **Product Name**: TimePulse Starter
- **Monthly Price**: $49/month (price_starter_monthly)
- **Annual Price**: $44.10/month (price_starter_annual) - 10% discount

#### Professional Plan

- **Product Name**: TimePulse Professional
- **Monthly Price**: $99/month (price_pro_monthly)
- **Annual Price**: $89.10/month (price_pro_annual) - 10% discount

#### Enterprise Plan

- **Product Name**: TimePulse Enterprise
- **Monthly Price**: $199/month (price_enterprise_monthly)
- **Annual Price**: $179.10/month (price_enterprise_annual) - 10% discount

### 2. Environment Variables

Add these to your `.env` file in the server directory:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
APP_BASE_URL=https://goggly-casteless-torri.ngrok-free.dev
```

### 3. Webhook Configuration

1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/billing/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copy the webhook signing secret to your `.env` file

### 4. Database Migration

The migration has already been run to add Stripe fields to the tenants table:

```sql
-- Stripe fields added to tenants table
ALTER TABLE tenants ADD COLUMN stripe_customer_id VARCHAR(100) NULL;
ALTER TABLE tenants ADD COLUMN stripe_subscription_id VARCHAR(100) NULL;
ALTER TABLE tenants ADD COLUMN plan VARCHAR(30) NULL;
ALTER TABLE tenants ADD COLUMN billing_interval VARCHAR(10) NULL;
ALTER TABLE tenants ADD COLUMN seat_limit INTEGER NULL;
ALTER TABLE tenants ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE NULL;
```

### 5. API Endpoints

The following endpoints are now available:

- `POST /api/billing/checkout` - Start new subscription
- `POST /api/billing/portal` - Open customer portal
- `POST /api/billing/change-plan` - Change subscription plan
- `POST /api/billing/update-seats` - Update seat count
- `GET /api/billing/status` - Get subscription status
- `POST /api/billing/webhook` - Stripe webhook handler

### 6. Frontend Integration

The BillingSettings component has been updated to use real Stripe integration:

- **Plan Selection**: Clicking a plan will start Stripe Checkout for new subscriptions
- **Plan Changes**: Existing subscribers can change plans through the API
- **Billing Management**: "Manage Billing" button opens Stripe Customer Portal
- **Real-time Updates**: Subscription status is fetched from the database

### 7. Testing

1. Use Stripe test mode for development
2. Test cards: https://stripe.com/docs/testing
3. Common test card: `4242 4242 4242 4242`
4. Use any future expiry date and CVC

### 8. Production Deployment

1. Switch to live Stripe keys
2. Update `APP_BASE_URL` to your production domain
3. Configure production webhook endpoint
4. Test with real payment methods

## Usage

### Starting a New Subscription

```javascript
// Frontend code
const startCheckout = async (plan, interval) => {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId: user.tenantId,
      email: user.email,
      plan,
      interval,
      seats: 1,
    }),
  });
  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
};
```

### Opening Customer Portal

```javascript
// Frontend code
const openPortal = async () => {
  const response = await fetch("/api/billing/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId: user.tenantId }),
  });
  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Portal
};
```

## Troubleshooting

1. **Webhook not receiving events**: Check webhook endpoint URL and signing secret
2. **Database errors**: Ensure migration was run successfully
3. **CORS issues**: Check server CORS configuration
4. **Authentication errors**: Verify JWT token is being sent correctly

## Security Notes

- Never expose Stripe secret keys in frontend code
- Always validate webhook signatures
- Use HTTPS in production
- Implement proper error handling and logging
