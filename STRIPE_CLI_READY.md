# ✅ Stripe CLI Setup Complete!

Your Stripe CLI setup for TimePulse is ready to use! Here's what has been prepared for you.

## 📦 What's Been Set Up

### Documentation
- ✅ **STRIPE_CLI_SETUP.md** - Complete Stripe CLI documentation
- ✅ **STRIPE_QUICK_START.md** - 5-minute quick start guide
- ✅ **STRIPE_SETUP.md** - Integration documentation (existing)

### Scripts
- ✅ **stripe-cli-start.sh** - Automated Stripe CLI launcher
- ✅ **server/scripts/setup-stripe-products.js** - Product creation script
- ✅ **server/scripts/check-stripe-setup.js** - Configuration verification
- ✅ **server/scripts/test-stripe-webhook.sh** - Webhook testing tool
- ✅ **server/scripts/README_STRIPE.md** - Scripts documentation

### Integration
- ✅ **server/routes/billing.js** - Stripe billing API (existing)
- ✅ **frontend/src/components/settings/BillingSettings.jsx** - Subscription UI (existing)

---

## 🚀 Quick Start (5 Minutes)

### 1️⃣ Install Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### 2️⃣ Configure Environment
Create or update `/Users/selva/Projects/TimePulse/server/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
STRIPE_WEBHOOK_SECRET=whsec_temporary
APP_BASE_URL=https://goggly-casteless-torri.ngrok-free.dev
```

Get your test key from: https://dashboard.stripe.com/test/apikeys

### 3️⃣ Create Stripe Products (One-time)
```bash
cd /Users/selva/Projects/TimePulse/server
node scripts/setup-stripe-products.js
```

**Important**: Copy the price IDs from the output and update `server/routes/billing.js`:
```javascript
const PRICE = {
  starter_monthly: "price_xxxxx",    // Paste your IDs here
  starter_annual: "price_xxxxx",
  pro_monthly: "price_xxxxx",
  pro_annual: "price_xxxxx",
  enterprise_monthly: "price_xxxxx",
  enterprise_annual: "price_xxxxx",
};
```

### 4️⃣ Verify Setup
```bash
cd /Users/selva/Projects/TimePulse/server
node scripts/check-stripe-setup.js
```

This will check everything and tell you if anything is missing.

### 5️⃣ Start Development Environment

**Terminal 1** - Backend Server:
```bash
cd /Users/selva/Projects/TimePulse/server
npm start
```

**Terminal 2** - Stripe CLI:
```bash
cd /Users/selva/Projects/TimePulse
./stripe-cli-start.sh
```

**IMPORTANT**: When you see the webhook secret (starts with `whsec_`), copy it and update your `.env` file:
```bash
STRIPE_WEBHOOK_SECRET=whsec_the_secret_from_cli
```

Then **restart your server** (Terminal 1).

**Terminal 3** - Frontend:
```bash
cd /Users/selva/Projects/TimePulse/frontend
npm start
```

### 6️⃣ Test It!
1. Open https://goggly-casteless-torri.ngrok-free.dev
2. Login to TimePulse
3. Go to **Settings** → **Billing**
4. Click on a subscription plan
5. Use test card: **4242 4242 4242 4242**
6. Any future expiry date
7. Any 3-digit CVC
8. Complete checkout

Watch the magic:
- ✅ Terminal 2 shows webhook events
- ✅ Server logs show webhook processing
- ✅ Database updates with subscription
- ✅ Redirect to success page

---

## 🧪 Testing Tools

### Interactive Webhook Tester
```bash
cd /Users/selva/Projects/TimePulse/server
./scripts/test-stripe-webhook.sh
```

Select from menu:
1. Checkout Session Completed
2. Subscription Created
3. Subscription Updated
4. Payment Succeeded
5. Payment Failed
6. Customer Created
7. Trigger all events
8. View recent events

### Manual Event Triggers
```bash
# New subscription
stripe trigger checkout.session.completed

# Payment success
stripe trigger invoice.payment_succeeded

# Payment failure
stripe trigger invoice.payment_failed

# Subscription update
stripe trigger customer.subscription.updated
```

### View Events
```bash
# List recent events
stripe events list --limit 10

# Watch events in real-time
stripe listen --print-json

# View specific event
stripe events retrieve evt_xxxxx
```

---

## 📊 Subscription Plans

Your TimePulse subscription plans:

| Plan | Monthly | Annual (10% off) | Users | Features |
|------|---------|------------------|-------|----------|
| **Starter** | $49/mo | $529/year ($44.10/mo) | Up to 10 | Basic time tracking, project management |
| **Professional** | $99/mo | $1,069/year ($89.10/mo) | Up to 50 | Advanced features, analytics, integrations |
| **Enterprise** | $199/mo | $2,149/year ($179.10/mo) | Unlimited | All features, dedicated support, SLA |

---

## 🔧 Troubleshooting

### "Stripe CLI not found"
```bash
brew install stripe/stripe-cli/stripe
```

### "Not authenticated"
```bash
stripe login
```

### "Server not running"
```bash
cd /Users/selva/Projects/TimePulse/server
npm start
```

### "Webhook signature verification failed"
1. Check Stripe CLI is running
2. Copy webhook secret from CLI output (starts with `whsec_`)
3. Update `STRIPE_WEBHOOK_SECRET` in `.env`
4. **Restart your server**

### "Price not found"
1. Run: `node scripts/setup-stripe-products.js`
2. Copy price IDs to `server/routes/billing.js`
3. Restart server

### "Stripe is not configured"
Add `STRIPE_SECRET_KEY` to your `.env` file

### Products not showing
Make sure you're in **Test Mode** in Stripe Dashboard

---

## 📁 File Structure

```
TimePulse/
├── 📄 STRIPE_CLI_READY.md           ← You are here!
├── 📄 STRIPE_QUICK_START.md         ← Quick start guide
├── 📄 STRIPE_CLI_SETUP.md           ← Full documentation
├── 📄 STRIPE_SETUP.md               ← Integration docs
├── 🔧 stripe-cli-start.sh           ← Run this to start CLI
│
├── server/
│   ├── 📁 routes/
│   │   └── billing.js               ← Stripe API endpoints
│   ├── 📁 models/
│   │   └── tenant.js                ← Subscription data model
│   └── 📁 scripts/
│       ├── setup-stripe-products.js ← Create products
│       ├── check-stripe-setup.js    ← Verify config
│       ├── test-stripe-webhook.sh   ← Test webhooks
│       └── README_STRIPE.md         ← Scripts guide
│
└── frontend/
    └── src/
        └── components/
            └── settings/
                └── BillingSettings.jsx  ← Subscription UI
```

---

## ✅ Pre-Launch Checklist

Before testing subscriptions, verify:

- [ ] Stripe CLI installed (`stripe --version`)
- [ ] Authenticated with Stripe (`stripe login`)
- [ ] `.env` file has `STRIPE_SECRET_KEY`
- [ ] Products created (`node scripts/setup-stripe-products.js`)
- [ ] Price IDs updated in `billing.js`
- [ ] Setup verified (`node scripts/check-stripe-setup.js`)
- [ ] Server running on port 5000
- [ ] Stripe CLI running (`./stripe-cli-start.sh`)
- [ ] Webhook secret updated in `.env`
- [ ] Server restarted after updating `.env`
- [ ] Frontend running on port 3000
- [ ] Can access https://goggly-casteless-torri.ngrok-free.dev
- [ ] Can see Billing page in Settings

---

## 🎯 Development Workflow

### Daily Development
```bash
# Terminal 1: Backend
cd /Users/selva/Projects/TimePulse/server
npm start

# Terminal 2: Stripe CLI
cd /Users/selva/Projects/TimePulse
./stripe-cli-start.sh

# Terminal 3: Frontend
cd /Users/selva/Projects/TimePulse/frontend
npm start

# Terminal 4: Testing (optional)
cd /Users/selva/Projects/TimePulse/server
./scripts/test-stripe-webhook.sh
```

### When You Need to...

**Create new products**:
```bash
node scripts/setup-stripe-products.js
```

**Verify configuration**:
```bash
node scripts/check-stripe-setup.js
```

**Test webhooks**:
```bash
./scripts/test-stripe-webhook.sh
```

**View Stripe data**:
```bash
stripe products list
stripe prices list
stripe customers list
stripe subscriptions list
```

**Clear test data**:
Go to Stripe Dashboard → Developers → Test Data → Delete all test data

---

## 🔒 Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Card declined |
| 4000 0000 0000 9995 | ❌ Insufficient funds |
| 4000 0000 0000 0341 | 🔐 Requires authentication |

All test cards:
- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any billing ZIP code (e.g., 12345)

---

## 🌐 Useful Stripe Dashboard Links

- [Test API Keys](https://dashboard.stripe.com/test/apikeys)
- [Products](https://dashboard.stripe.com/test/products)
- [Customers](https://dashboard.stripe.com/test/customers)
- [Subscriptions](https://dashboard.stripe.com/test/subscriptions)
- [Webhooks](https://dashboard.stripe.com/test/webhooks)
- [Events & Logs](https://dashboard.stripe.com/test/events)
- [Test Cards](https://stripe.com/docs/testing)

---

## 📚 Documentation

1. **Quick Start**: Read `STRIPE_QUICK_START.md` (5 min)
2. **Full CLI Guide**: Read `STRIPE_CLI_SETUP.md` (detailed)
3. **Integration**: Read `STRIPE_SETUP.md` (API details)
4. **Scripts**: Read `server/scripts/README_STRIPE.md` (tools)

---

## 🚀 Production Deployment

When ready for production:

1. **Switch to Live Mode**
   - Get live keys from Stripe Dashboard
   - Update `.env` with live keys

2. **Configure Production Webhooks**
   - Add webhook endpoint in Stripe Dashboard
   - Use your production URL: `https://yourdomain.com/api/billing/webhook`
   - Select events: checkout.session.completed, customer.subscription.*, invoice.payment_*
   - Copy webhook secret to production `.env`

3. **Update URLs**
   - Set `APP_BASE_URL` to production domain
   - Update success/cancel URLs in billing.js

4. **Test Thoroughly**
   - Test with real payment methods
   - Verify webhooks work
   - Check database updates
   - Test all subscription flows

---

## 💡 Pro Tips

1. **Keep Stripe CLI running** during development
2. **Monitor webhook events** to debug issues
3. **Use check-stripe-setup.js** regularly
4. **Clear test data** periodically in Stripe Dashboard
5. **Test with different cards** (success, failure, 3D Secure)
6. **Check server logs** for detailed error messages
7. **Use --print-json** flag with Stripe CLI for detailed output
8. **Trigger events manually** with test-stripe-webhook.sh

---

## 🆘 Getting Help

### Check Configuration
```bash
node scripts/check-stripe-setup.js
```

### View Logs
- **Stripe CLI**: Check Terminal 2 for webhook delivery
- **Server**: Check Terminal 1 for API processing
- **Browser**: Check DevTools Console for frontend errors

### Common Issues

1. **Webhook not received**: Check Stripe CLI is running and forwarding to correct URL
2. **Signature failed**: Update webhook secret and restart server
3. **Price not found**: Run setup-stripe-products.js and update billing.js
4. **Stripe not configured**: Add STRIPE_SECRET_KEY to .env

### Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Test Cards](https://stripe.com/docs/testing)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)

---

## ✨ You're All Set!

Everything is ready for you to:
1. Test subscriptions locally
2. Develop new features
3. Debug webhook handling
4. Prepare for production

**Next Step**: Follow the Quick Start above to start testing!

---

**Questions?** Check the documentation files or run the verification script!

**Happy Coding! 🎉**


