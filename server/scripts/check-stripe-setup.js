/**
 * Script to verify Stripe setup for TimePulse
 * Checks environment variables, products, prices, and connectivity
 * 
 * Usage: node check-stripe-setup.js
 */

require('dotenv').config();
const Stripe = require('stripe');

const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'APP_BASE_URL'
];

const REQUIRED_PRICE_KEYS = [
  'starter_monthly',
  'starter_annual',
  'pro_monthly',
  'pro_annual',
  'enterprise_monthly',
  'enterprise_annual'
];

async function checkSetup() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     TimePulse Stripe Setup Verification               ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  let hasErrors = false;

  // Check 1: Environment Variables
  console.log('📋 1. Checking Environment Variables');
  console.log('─────────────────────────────────────────────────────────');
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (process.env[envVar]) {
      if (envVar === 'STRIPE_SECRET_KEY') {
        const masked = process.env[envVar].substring(0, 10) + '...';
        console.log(`   ✅ ${envVar}: ${masked}`);
      } else if (envVar === 'STRIPE_WEBHOOK_SECRET') {
        const masked = process.env[envVar].substring(0, 10) + '...';
        console.log(`   ✅ ${envVar}: ${masked}`);
      } else {
        console.log(`   ✅ ${envVar}: ${process.env[envVar]}`);
      }
    } else {
      console.log(`   ❌ ${envVar}: NOT SET`);
      hasErrors = true;
    }
  }
  console.log('');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ Cannot proceed without STRIPE_SECRET_KEY');
    console.log('');
    console.log('Add this to your .env file:');
    console.log('  STRIPE_SECRET_KEY=sk_test_your_key_here');
    console.log('');
    process.exit(1);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Check 2: Stripe API Connectivity
  console.log('🌐 2. Testing Stripe API Connectivity');
  console.log('─────────────────────────────────────────────────────────');
  
  try {
    const account = await stripe.accounts.retrieve();
    console.log(`   ✅ Connected to Stripe`);
    console.log(`   ✅ Account: ${account.email || account.id}`);
    console.log(`   ✅ Mode: ${account.id.startsWith('acct_') ? 'Live/Test' : 'Unknown'}`);
  } catch (error) {
    console.log(`   ❌ Failed to connect: ${error.message}`);
    hasErrors = true;
  }
  console.log('');

  // Check 3: Products
  console.log('📦 3. Checking Stripe Products');
  console.log('─────────────────────────────────────────────────────────');
  
  try {
    const products = await stripe.products.list({ limit: 10 });
    
    if (products.data.length === 0) {
      console.log('   ⚠️  No products found');
      console.log('   Run: node scripts/setup-stripe-products.js');
      hasErrors = true;
    } else {
      console.log(`   ✅ Found ${products.data.length} product(s):`);
      for (const product of products.data) {
        console.log(`      - ${product.name} (${product.id})`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Failed to fetch products: ${error.message}`);
    hasErrors = true;
  }
  console.log('');

  // Check 4: Prices
  console.log('💰 4. Checking Stripe Prices');
  console.log('─────────────────────────────────────────────────────────');
  
  try {
    const prices = await stripe.prices.list({ limit: 20 });
    
    if (prices.data.length === 0) {
      console.log('   ⚠️  No prices found');
      console.log('   Run: node scripts/setup-stripe-products.js');
      hasErrors = true;
    } else {
      console.log(`   ✅ Found ${prices.data.length} price(s):`);
      for (const price of prices.data) {
        const amount = price.unit_amount / 100;
        const interval = price.recurring?.interval || 'one-time';
        console.log(`      - ${price.nickname || price.id}: $${amount}/${interval} (${price.id})`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Failed to fetch prices: ${error.message}`);
    hasErrors = true;
  }
  console.log('');

  // Check 5: Price IDs in billing.js
  console.log('🔑 5. Checking Price IDs in Code');
  console.log('─────────────────────────────────────────────────────────');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const billingPath = path.join(__dirname, '..', 'routes', 'billing.js');
    
    if (!fs.existsSync(billingPath)) {
      console.log('   ❌ billing.js not found');
      hasErrors = true;
    } else {
      const content = fs.readFileSync(billingPath, 'utf8');
      
      // Check if placeholder price IDs are still present
      if (content.includes('price_starter_monthly') || 
          content.includes('price_pro_monthly') ||
          content.includes('price_enterprise_monthly')) {
        console.log('   ⚠️  Placeholder price IDs detected');
        console.log('   Update billing.js with real Stripe price IDs');
        console.log('   Run: node scripts/setup-stripe-products.js');
        hasErrors = true;
      } else {
        console.log('   ✅ Price IDs appear to be configured');
      }
    }
  } catch (error) {
    console.log(`   ❌ Failed to check billing.js: ${error.message}`);
  }
  console.log('');

  // Check 6: Webhooks
  console.log('🔔 6. Checking Webhook Configuration');
  console.log('─────────────────────────────────────────────────────────');
  
  try {
    const webhooks = await stripe.webhookEndpoints.list();
    
    if (webhooks.data.length === 0) {
      console.log('   ⚠️  No webhook endpoints configured in Stripe Dashboard');
      console.log('   For local development, use Stripe CLI:');
      console.log('   ./stripe-cli-start.sh');
    } else {
      console.log(`   ✅ Found ${webhooks.data.length} webhook endpoint(s):`);
      for (const webhook of webhooks.data) {
        console.log(`      - ${webhook.url}`);
        console.log(`        Events: ${webhook.enabled_events.join(', ')}`);
      }
    }
  } catch (error) {
    console.log(`   ⚠️  ${error.message}`);
  }
  console.log('');

  // Summary
  console.log('╔════════════════════════════════════════════════════════╗');
  
  if (hasErrors) {
    console.log('║     ⚠️  Setup Incomplete - Action Required            ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('');
    console.log('1. Fix any ❌ errors above');
    console.log('2. Set missing environment variables in .env');
    console.log('3. Run: node scripts/setup-stripe-products.js');
    console.log('4. Update price IDs in routes/billing.js');
    console.log('5. Start Stripe CLI: ./stripe-cli-start.sh');
    console.log('6. Restart your server');
    console.log('');
    process.exit(1);
  } else {
    console.log('║     ✅ Setup Complete - Ready to Go!                  ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🚀 You\'re ready to test subscriptions!');
    console.log('');
    console.log('Quick Start:');
    console.log('1. Start your server: npm start');
    console.log('2. Start Stripe CLI: ./stripe-cli-start.sh');
    console.log('3. Open http://localhost:3000');
    console.log('4. Go to Settings → Billing');
    console.log('5. Test with card: 4242 4242 4242 4242');
    console.log('');
  }
}

checkSetup().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});


