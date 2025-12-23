# Stripe Scripts for TimePulse

This directory contains helpful scripts for setting up and testing Stripe integration.

## 📁 Available Scripts

### 1. `setup-stripe-products.js`
**Purpose**: Creates Stripe products and prices for TimePulse subscription plans

**Usage**:
```bash
cd /Users/selva/Projects/TimePulse/server
node scripts/setup-stripe-products.js
```

**What it does**:
- Creates three products: Starter, Professional, Enterprise
- Creates monthly and annual prices for each plan
- Outputs price IDs that you need to copy to `billing.js`

**When to run**: Once during initial setup, or when you need to recreate products

---

### 2. `check-stripe-setup.js`
**Purpose**: Verifies your Stripe configuration is correct

**Usage**:
```bash
cd /Users/selva/Projects/TimePulse/server
node scripts/check-stripe-setup.js
```

**What it checks**:
- ✅ Environment variables are set
- ✅ Stripe API connectivity
- ✅ Products exist
- ✅ Prices exist
- ✅ Price IDs are configured in code
- ✅ Webhook endpoints

**When to run**: 
- After initial setup
- When troubleshooting issues
- Before testing subscriptions

---

### 3. `test-stripe-webhook.sh`
**Purpose**: Interactive tool to trigger Stripe webhook events for testing

**Usage**:
```bash
cd /Users/selva/Projects/TimePulse/server
./scripts/test-stripe-webhook.sh
```

**Features**:
- Interactive menu
- Trigger individual events
- Trigger all subscription events in sequence
- View recent events

**When to run**: During development when testing webhook handling

---

## 🚀 Complete Setup Workflow

### First Time Setup

1. **Install Dependencies**
   ```bash
   cd /Users/selva/Projects/TimePulse/server
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Create .env file and add:
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_temporary
   APP_BASE_URL=https://goggly-casteless-torri.ngrok-free.dev
   ```

3. **Create Stripe Products**
   ```bash
   node scripts/setup-stripe-products.js
   ```

4. **Update Price IDs**
   - Copy the price IDs from the output
   - Update `server/routes/billing.js` PRICE constant

5. **Verify Setup**
   ```bash
   node scripts/check-stripe-setup.js
   ```

6. **Start Development**
   ```bash
   # Terminal 1: Start server
   npm start
   
   # Terminal 2: Start Stripe CLI
   cd ..
   ./stripe-cli-start.sh
   
   # Terminal 3: Test webhooks
   ./server/scripts/test-stripe-webhook.sh
   ```

---

## 🧪 Testing Workflows

### Test New Subscription

1. Start server and Stripe CLI
2. Open frontend: https://goggly-casteless-torri.ngrok-free.dev
3. Go to Settings → Billing
4. Click on a plan
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout
7. Verify in database and Stripe Dashboard

### Test Plan Change

```bash
# Trigger subscription update event
./scripts/test-stripe-webhook.sh
# Choose option 3 (Subscription Updated)
```

### Test Payment Failure

```bash
# Trigger payment failed event
./scripts/test-stripe-webhook.sh
# Choose option 5 (Payment Failed)
```

---

## 🔍 Troubleshooting

### "Stripe is not configured"
**Solution**: Add `STRIPE_SECRET_KEY` to `.env` file

### "Price not found"
**Solution**: 
1. Run `node scripts/setup-stripe-products.js`
2. Copy price IDs to `billing.js`
3. Restart server

### "Webhook signature verification failed"
**Solution**:
1. Make sure Stripe CLI is running
2. Copy webhook secret from CLI output
3. Update `STRIPE_WEBHOOK_SECRET` in `.env`
4. Restart server

### Products not showing in Dashboard
**Solution**: Make sure you're in Test Mode in Stripe Dashboard

---

## 📊 Subscription Plans

| Plan | Monthly | Annual | Features |
|------|---------|--------|----------|
| **Starter** | $49/mo | $44.10/mo | Up to 10 users, Basic features |
| **Professional** | $99/mo | $89.10/mo | Up to 50 users, Advanced features |
| **Enterprise** | $199/mo | $179.10/mo | Unlimited users, Premium features |

Annual plans include 10% discount.

---

## 🔗 Related Files

- `../routes/billing.js` - Main Stripe integration code
- `../models/tenant.js` - Tenant model with Stripe fields
- `../../frontend/src/components/settings/BillingSettings.jsx` - Subscription UI
- `../../STRIPE_CLI_SETUP.md` - Complete CLI documentation
- `../../STRIPE_QUICK_START.md` - Quick start guide
- `../../STRIPE_SETUP.md` - Integration documentation

---

## 💡 Pro Tips

1. **Always test in Test Mode** before going live
2. **Keep Stripe CLI running** during development
3. **Monitor webhook events** to debug issues
4. **Use check-stripe-setup.js** regularly to verify configuration
5. **Clear test data** in Stripe Dashboard periodically

---

## 🆘 Getting Help

- Check script output for specific error messages
- Run `node scripts/check-stripe-setup.js` for diagnostics
- Review Stripe CLI logs for webhook issues
- Check server logs for API errors
- Visit [Stripe Documentation](https://stripe.com/docs)

---

**Happy Testing! 🚀**


