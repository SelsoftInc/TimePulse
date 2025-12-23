# Stripe CLI Quick Start Guide for TimePulse

## 🚀 Get Started in 5 Minutes

This quick start guide will get you up and running with Stripe CLI for testing subscriptions locally.

### Step 1: Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Verify installation
stripe --version
```

### Step 2: Login to Stripe

```bash
stripe login
```

This will open your browser to authenticate.

### Step 3: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Test Mode** Secret Key (starts with `sk_test_`)
3. Add it to `/Users/selva/Projects/TimePulse/server/.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_temporary
APP_BASE_URL=https://goggly-casteless-torri.ngrok-free.dev
```

### Step 4: Set Up Stripe Products (One-time setup)

```bash
cd /Users/selva/Projects/TimePulse/server
node scripts/setup-stripe-products.js
```

This will create three subscription plans in your Stripe account:
- **Starter**: $49/month ($44.10/month annually)
- **Professional**: $99/month ($89.10/month annually)
- **Enterprise**: $199/month ($179.10/month annually)

**Important**: Copy the Price IDs from the output and update them in `server/routes/billing.js`:

```javascript
const PRICE = {
  starter_monthly: "price_xxxxxxxxxx",    // Replace with your IDs
  starter_annual: "price_xxxxxxxxxx",
  pro_monthly: "price_xxxxxxxxxx",
  pro_annual: "price_xxxxxxxxxx",
  enterprise_monthly: "price_xxxxxxxxxx",
  enterprise_annual: "price_xxxxxxxxxx",
};
```

### Step 5: Start Your Backend Server

```bash
cd /Users/selva/Projects/TimePulse/server
npm install  # If you haven't already
npm start
```

Your server should start on port 5000.

### Step 6: Start Stripe Webhook Forwarding

Open a new terminal and run our automated script:

```bash
cd /Users/selva/Projects/TimePulse
./stripe-cli-start.sh
```

This script will:
- ✅ Check if Stripe CLI is installed
- ✅ Verify authentication
- ✅ Check if your server is running
- ✅ Start webhook forwarding
- ✅ Display the webhook signing secret

**Critical**: When you see the webhook secret (looks like `whsec_xxxxxx`), copy it and update your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_the_secret_from_cli_output
```

Then restart your server.

### Step 7: Start Your Frontend

Open another terminal:

```bash
cd /Users/selva/Projects/TimePulse/frontend
npm start
```

Your app should open at https://goggly-casteless-torri.ngrok-free.dev

### Step 8: Test It!

1. **Login to TimePulse** at https://goggly-casteless-torri.ngrok-free.dev
2. **Go to Settings** → **Billing**
3. **Click on a plan** (e.g., Professional)
4. **Use test card**: `4242 4242 4242 4242`
5. **Use any future date** for expiration
6. **Use any 3 digits** for CVC
7. **Complete checkout**

Watch the magic happen:
- ✅ Stripe CLI terminal shows webhook events
- ✅ Server logs show webhook processing
- ✅ Database updates with subscription info
- ✅ Redirect to success page

## 🧪 Testing Webhook Events

Use our test script to trigger events manually:

```bash
cd /Users/selva/Projects/TimePulse/server
./scripts/test-stripe-webhook.sh
```

This interactive script lets you:
- Trigger checkout completion
- Simulate subscription updates
- Test payment failures
- View recent events

## 📊 Common Test Scenarios

### Test Successful Subscription
```bash
stripe trigger checkout.session.completed
```

### Test Payment Failure
```bash
stripe trigger invoice.payment_failed
```

### Test Subscription Cancellation
```bash
stripe trigger customer.subscription.deleted
```

## 🔍 Monitoring

### Watch all events in real-time
```bash
stripe listen --print-json
```

### View recent events
```bash
stripe events list --limit 10
```

### Check your products
```bash
stripe products list
```

### Check your prices
```bash
stripe prices list
```

## ✅ Verification Checklist

- [ ] Stripe CLI installed and authenticated
- [ ] Server running on port 5000
- [ ] Frontend running on port 3000
- [ ] Stripe products created
- [ ] Price IDs updated in `billing.js`
- [ ] `.env` file has correct `STRIPE_SECRET_KEY`
- [ ] `.env` file has correct `STRIPE_WEBHOOK_SECRET` from CLI
- [ ] Webhook forwarding is running
- [ ] Can access https://goggly-casteless-torri.ngrok-free.dev
- [ ] Can complete test checkout with card `4242 4242 4242 4242`

## 🐛 Troubleshooting

### "Stripe CLI not found"
```bash
brew install stripe/stripe-cli/stripe
```

### "Server not running"
```bash
cd /Users/selva/Projects/TimePulse/server
npm start
```

### "Webhook signature verification failed"
1. Check that `STRIPE_WEBHOOK_SECRET` in `.env` matches CLI output
2. Restart your server after updating `.env`

### "Price not found"
1. Run `node scripts/setup-stripe-products.js`
2. Copy the price IDs to `billing.js`
3. Restart your server

## 📁 Project Structure

```
TimePulse/
├── stripe-cli-start.sh              ← Start this to run Stripe CLI
├── STRIPE_CLI_SETUP.md              ← Full documentation
├── STRIPE_QUICK_START.md            ← This file
├── server/
│   ├── .env                         ← Add your Stripe keys here
│   ├── routes/
│   │   └── billing.js               ← Stripe integration code
│   └── scripts/
│       ├── setup-stripe-products.js ← Create products/prices
│       └── test-stripe-webhook.sh   ← Test webhook events
└── frontend/
    └── src/
        └── components/
            └── settings/
                └── BillingSettings.jsx  ← Subscription UI
```

## 🎯 What's Next?

After basic setup:

1. **Test all subscription flows**:
   - New subscription
   - Plan upgrade/downgrade
   - Seat quantity changes
   - Cancellation

2. **Test edge cases**:
   - Payment failures
   - Expired cards
   - 3D Secure authentication

3. **Review webhook logs** to ensure all events are handled

4. **Check database** to verify subscription data is saved correctly

## 🔗 Helpful Links

- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Test Cards](https://stripe.com/docs/testing)
- [Webhook Events](https://stripe.com/docs/api/events)
- [Full Setup Guide](./STRIPE_CLI_SETUP.md)

## 💡 Pro Tips

1. **Keep Stripe CLI running** in a dedicated terminal
2. **Monitor the logs** to see events in real-time
3. **Use the test webhook script** for rapid testing
4. **Check Stripe Dashboard** to see test data
5. **Clear test data** in Stripe Dashboard periodically

## 🆘 Need Help?

If you're stuck:
1. Check the [Full Setup Guide](./STRIPE_CLI_SETUP.md)
2. Review [STRIPE_SETUP.md](./STRIPE_SETUP.md) for integration details
3. Check Stripe CLI logs for errors
4. Verify all environment variables are set

---

**Happy Testing! 🎉**


