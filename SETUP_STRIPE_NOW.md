# 🚀 Complete Stripe CLI Setup - Action Required

## Current Status
- ❌ Stripe CLI not installed
- ❌ Environment variables not configured
- ✅ Scripts and documentation ready

## 🎯 Follow These Steps (10 minutes)

### Step 1: Install Stripe CLI

Open a **new terminal** (outside of Cursor) and run:

```bash
# Fix Homebrew permissions first
sudo chown -R selva /opt/homebrew/Cellar
sudo chown -R selva /opt/homebrew/Library/Taps

# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Verify installation
stripe --version
```

**Expected output**: `stripe version X.X.X`

---

### Step 2: Authenticate with Stripe

```bash
stripe login
```

This will:
- Open your browser
- Ask you to log in to Stripe
- Grant CLI access to your account

---

### Step 3: Get Your Stripe API Key

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Make sure you're in **Test Mode** (toggle in top right)
3. Click "Reveal test key" for the **Secret key**
4. Copy the key (starts with `sk_test_`)

---

### Step 4: Create Environment File

I'll create the `.env` file template for you now. After this runs, you need to add your actual Stripe key.

**File location**: `/Users/selva/Projects/TimePulse/server/.env`

**Add your key where it says**: `YOUR_TEST_KEY_FROM_STRIPE_DASHBOARD`

---

### Step 5: Create Stripe Products

After adding your key to `.env`, run:

```bash
cd /Users/selva/Projects/TimePulse/server
node scripts/setup-stripe-products.js
```

This creates:
- **Starter Plan**: $49/month
- **Professional Plan**: $99/month  
- **Enterprise Plan**: $199/month

**IMPORTANT**: Copy the price IDs from the output!

---

### Step 6: Update Price IDs

Open `server/routes/billing.js` and find the `PRICE` constant (around line 22).

Replace the placeholder IDs with the real IDs from Step 5:

```javascript
const PRICE = {
  starter_monthly: "price_xxxxx",     // ← Paste from Step 5
  starter_annual: "price_xxxxx",
  pro_monthly: "price_xxxxx",
  pro_annual: "price_xxxxx",
  enterprise_monthly: "price_xxxxx",
  enterprise_annual: "price_xxxxx",
};
```

---

### Step 7: Start Development Environment

**Terminal 1** - Backend Server:
```bash
cd /Users/selva/Projects/TimePulse/server
npm start
```

**Terminal 2** - Stripe Webhook Forwarding:
```bash
cd /Users/selva/Projects/TimePulse
stripe listen --forward-to http://localhost:5000/api/billing/webhook
```

**CRITICAL**: When you see the webhook secret, copy it!
```
Ready! Your webhook signing secret is whsec_xxxxx
```

Update `/Users/selva/Projects/TimePulse/server/.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # ← Paste the secret from above
```

**Then restart your server** (Terminal 1).

**Terminal 3** - Frontend:
```bash
cd /Users/selva/Projects/TimePulse/frontend
npm start
```

---

### Step 8: Test Subscription Flow

1. Open: https://goggly-casteless-torri.ngrok-free.dev
2. Login to TimePulse
3. Go to: **Settings** → **Billing**
4. Click on a plan (e.g., Professional)
5. Enter test card: **4242 4242 4242 4242**
6. Expiry: Any future date (e.g., 12/25)
7. CVC: Any 3 digits (e.g., 123)
8. Complete checkout

**Watch for**:
- ✅ Terminal 2 shows webhook events
- ✅ Server logs show processing
- ✅ Redirect to success page
- ✅ Subscription saved in database

---

## ✅ Verification

After completing all steps, verify everything works:

```bash
cd /Users/selva/Projects/TimePulse/server
node scripts/check-stripe-setup.js
```

You should see all green checkmarks! ✅

---

## 🧪 Test Webhooks

Use the interactive testing tool:

```bash
cd /Users/selva/Projects/TimePulse/server
./scripts/test-stripe-webhook.sh
```

---

## 🆘 Troubleshooting

### "stripe: command not found"
**Solution**: Run Step 1 again to install Stripe CLI

### "STRIPE_SECRET_KEY: NOT SET"
**Solution**: Complete Step 3 and Step 4

### "Webhook signature verification failed"
**Solution**: 
1. Make sure Terminal 2 (Stripe CLI) is running
2. Copy the `whsec_` secret from Terminal 2
3. Update `.env` file with the secret
4. Restart your server (Terminal 1)

### "Price not found"
**Solution**:
1. Complete Step 5 (create products)
2. Complete Step 6 (update price IDs)
3. Restart server

---

## 📁 Quick Reference

**Environment File**: `/Users/selva/Projects/TimePulse/server/.env`

**Update Price IDs**: `/Users/selva/Projects/TimePulse/server/routes/billing.js`

**Start Stripe CLI**: 
```bash
cd /Users/selva/Projects/TimePulse
stripe listen --forward-to http://localhost:5000/api/billing/webhook
```

**Test Cards**: 
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
- Insufficient funds: 4000 0000 0000 9995

---

## 📚 More Help

- **Quick Start**: `STRIPE_QUICK_START.md`
- **Full Guide**: `STRIPE_CLI_SETUP.md`
- **Scripts**: `server/scripts/README_STRIPE.md`
- **Integration**: `STRIPE_SETUP.md`

---

## ⚡ Super Quick Start (Copy/Paste)

After installing Stripe CLI and getting your API key, run these commands:

```bash
# Navigate to server directory
cd /Users/selva/Projects/TimePulse/server

# Create products (after adding STRIPE_SECRET_KEY to .env)
node scripts/setup-stripe-products.js

# Verify setup
node scripts/check-stripe-setup.js

# Start server (Terminal 1)
npm start
```

In a new terminal:
```bash
# Start Stripe CLI (Terminal 2)
cd /Users/selva/Projects/TimePulse
stripe listen --forward-to http://localhost:5000/api/billing/webhook
# Copy the whsec_ secret to .env and restart server
```

In another terminal:
```bash
# Start frontend (Terminal 3)
cd /Users/selva/Projects/TimePulse/frontend
npm start
```

**Done!** Test at https://goggly-casteless-torri.ngrok-free.dev → Settings → Billing

---

**Need help?** All documentation is ready in the project root! 🎉


