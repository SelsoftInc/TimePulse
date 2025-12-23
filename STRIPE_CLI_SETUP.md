# Stripe CLI Setup for TimePulse

This guide will help you set up the Stripe CLI for local development and webhook testing.

## What is Stripe CLI?

The Stripe CLI is a developer tool that allows you to:
- Test webhooks locally without deploying your code
- Forward Stripe events to your local development server
- Trigger test events manually
- Monitor API requests in real-time

## Installation

### macOS (using Homebrew)
```bash
brew install stripe/stripe-cli/stripe
```

### macOS/Linux (using script)
```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

### Windows (using Scoop)
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Verify Installation
```bash
stripe --version
```

## Setup Steps

### 1. Login to Stripe

Run the login command to authenticate:

```bash
stripe login
```

This will:
- Open your browser
- Ask you to authenticate with your Stripe account
- Grant CLI access to your account
- Save your credentials locally

### 2. Configure Your Server

Make sure your TimePulse server has the correct environment variables in `/server/.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_cli
APP_BASE_URL=https://goggly-casteless-torri.ngrok-free.dev
```

### 3. Start Your Server

Make sure your TimePulse backend server is running on port 5000:

```bash
cd /Users/selva/Projects/TimePulse/server
npm start
```

### 4. Start Stripe Webhook Forwarding

In a new terminal, run:

```bash
stripe listen --forward-to http://localhost:5000/api/billing/webhook
```

**Important**: Copy the webhook signing secret that appears (starts with `whsec_`) and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

Example output:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef (^C to quit)
```

## Quick Start Script

We've created a helper script to automate the setup. Run:

```bash
cd /Users/selva/Projects/TimePulse
chmod +x stripe-cli-start.sh
./stripe-cli-start.sh
```

## Testing Webhooks

### Method 1: Trigger Test Events

You can manually trigger Stripe events for testing:

```bash
# Test a successful payment
stripe trigger payment_intent.succeeded

# Test a checkout session completion
stripe trigger checkout.session.completed

# Test a subscription creation
stripe trigger customer.subscription.created

# Test a failed payment
stripe trigger invoice.payment_failed
```

### Method 2: Use Stripe Checkout

1. Start your frontend (port 3000) and backend (port 5000)
2. Navigate to Settings → Billing in TimePulse
3. Click on a subscription plan
4. Complete the checkout flow using test card: `4242 4242 4242 4242`
5. Watch webhook events in your Stripe CLI terminal

## Monitoring Events

### View All Events
```bash
stripe events list
```

### View Recent Events
```bash
stripe events list --limit 10
```

### View Specific Event
```bash
stripe events retrieve evt_xxxxxxxxxxxxxxx
```

### Tail Events in Real-time
```bash
stripe listen --print-json
```

## Testing Subscription Flows

### 1. Test New Subscription
```bash
# Trigger checkout completion
stripe trigger checkout.session.completed \
  --add checkout_session:metadata.tenant_id=1 \
  --add checkout_session:metadata.plan=professional \
  --add checkout_session:metadata.interval=monthly
```

### 2. Test Subscription Update
```bash
stripe trigger customer.subscription.updated
```

### 3. Test Payment Failure
```bash
stripe trigger invoice.payment_failed
```

### 4. Test Successful Payment
```bash
stripe trigger invoice.payment_succeeded
```

## Common Commands

### List Products
```bash
stripe products list
```

### List Prices
```bash
stripe prices list
```

### List Customers
```bash
stripe customers list
```

### List Subscriptions
```bash
stripe subscriptions list
```

### Create Test Customer
```bash
stripe customers create \
  --email="test@example.com" \
  --name="Test Customer" \
  --description="Test customer for TimePulse"
```

## Debugging

### Check Webhook Status
```bash
stripe webhooks list
```

### View Webhook Logs
```bash
stripe logs tail
```

### Test Webhook Endpoint
```bash
curl -X POST http://localhost:5000/api/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test.event"}'
```

## Development Workflow

1. **Start Backend Server**
   ```bash
   cd /Users/selva/Projects/TimePulse/server
   npm start
   ```

2. **Start Stripe CLI Forwarding** (in new terminal)
   ```bash
   stripe listen --forward-to http://localhost:5000/api/billing/webhook
   ```

3. **Copy Webhook Secret** to `.env` file

4. **Start Frontend** (in another terminal)
   ```bash
   cd /Users/selva/Projects/TimePulse/frontend
   npm start
   ```

5. **Test Subscription Flow**
   - Navigate to https://goggly-casteless-torri.ngrok-free.dev
   - Go to Settings → Billing
   - Select a plan
   - Use test card: `4242 4242 4242 4242`

6. **Watch Events** in Stripe CLI terminal

## Production Deployment

When deploying to production:

1. **Don't use CLI webhook secret** - Use dashboard webhook secret instead
2. **Update webhook endpoint** in Stripe Dashboard to your production URL
3. **Switch to live keys** - Replace test keys with live keys
4. **Configure production events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Troubleshooting

### CLI Not Receiving Events
- Check if server is running on port 5000
- Verify webhook endpoint path: `/api/billing/webhook`
- Check firewall settings

### Webhook Signature Verification Failed
- Make sure `STRIPE_WEBHOOK_SECRET` in `.env` matches CLI output
- Restart your server after updating `.env`
- Check that webhook handler uses raw body parser

### Server Not Found
- Verify server is running: `curl http://localhost:5000/health`
- Check port number in forward command
- Ensure no other service is using port 5000

## Stripe Test Cards

| Card Number         | Description                    |
|---------------------|--------------------------------|
| 4242 4242 4242 4242 | Success                        |
| 4000 0000 0000 0002 | Card declined                  |
| 4000 0000 0000 9995 | Insufficient funds             |
| 4000 0000 0000 0341 | Attaching this card requires authentication |
| 4000 0025 0000 3155 | Requires 3D Secure authentication |

Use any future expiration date and any 3-digit CVC.

## Useful Links

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Testing Guide](https://stripe.com/docs/webhooks/test)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe API Reference](https://stripe.com/docs/api)

## Support

If you encounter issues:
1. Check the Stripe CLI logs
2. Verify environment variables
3. Check server logs for errors
4. Review webhook event details in Stripe Dashboard


