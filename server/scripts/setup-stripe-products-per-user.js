/**
 * Script to create Stripe products with PER-USER pricing for TimePulse
 * Run this to set up correct pricing model
 * 
 * Usage: node setup-stripe-products-per-user.js
 */

require('dotenv').config();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  console.error('Please add it to your .env file');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const plans = [
  {
    name: 'TimePulse Starter',
    description: 'Perfect for small teams getting started with time tracking',
    features: [
      'Up to 10 users',
      'AI-powered uploads',
      'MSA/SOW mapping',
      'Auto invoicing to QuickBooks/NetSuite',
      '1-level approval workflow',
      'Basic timesheet digitization',
      'Email support'
    ],
    pricePerUser: 199, // $1.99 per user/month in cents
    priceKey: 'starter'
  },
  {
    name: 'TimePulse Professional',
    description: 'Advanced automation for growing teams',
    features: [
      'Up to 50 users',
      'Everything in Starter',
      'Multi-level approvals',
      'Real-time analytics dashboard',
      'Integrations',
      'Priority support'
    ],
    pricePerUser: 399, // $3.99 per user/month in cents
    priceKey: 'professional'
  }
];

async function createProducts() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     TimePulse Per-User Pricing Setup                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const priceIds = {};

  // First, archive old products
  console.log('🗑️  Archiving old products...');
  try {
    const oldProducts = await stripe.products.list({ limit: 100 });
    for (const product of oldProducts.data) {
      if (product.name.includes('TimePulse')) {
        await stripe.products.update(product.id, { active: false });
        console.log(`   ✅ Archived: ${product.name}`);
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not archive old products:', error.message);
  }
  console.log('');

  for (const plan of plans) {
    console.log(`🔧 Creating: ${plan.name}`);
    console.log('─────────────────────────────────────────────────────────');

    try {
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          features: plan.features.join('|')
        }
      });

      console.log(`✅ Product created: ${product.id}`);

      // Create monthly PER-USER price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        unit_amount: plan.pricePerUser,
        nickname: `${plan.name} - Monthly (Per User)`
      });

      console.log(`✅ Monthly per-user price created: ${monthlyPrice.id}`);
      priceIds[`${plan.priceKey}_monthly`] = monthlyPrice.id;

      // Create annual PER-USER price (10% discount)
      const annualPricePerUser = Math.round(plan.pricePerUser * 0.9);
      const annualPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        unit_amount: annualPricePerUser,
        nickname: `${plan.name} - Annual (Per User)`
      });

      console.log(`✅ Annual per-user price created: ${annualPrice.id}`);
      priceIds[`${plan.priceKey}_annual`] = annualPrice.id;

      console.log(`   💰 Monthly: $${plan.pricePerUser / 100} per user/month`);
      console.log(`   💰 Annual: $${annualPricePerUser / 100} per user/month (10% off)`);

    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
    }

    console.log('');
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Setup Complete!                                    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📝 Update your billing.js file with these Price IDs:');
  console.log('');
  console.log('const PRICE = {');
  for (const [key, value] of Object.entries(priceIds)) {
    console.log(`  ${key}: "${value}",`);
  }
  console.log('  enterprise_monthly: "contact_sales",');
  console.log('  enterprise_annual: "contact_sales",');
  console.log('};');
  console.log('');
  console.log('🎯 Pricing Model: PER-USER');
  console.log('   • Starter: $1.99 per user/month');
  console.log('   • Professional: $3.99 per user/month');
  console.log('   • Enterprise: Custom pricing (contact sales)');
  console.log('');
}

createProducts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

