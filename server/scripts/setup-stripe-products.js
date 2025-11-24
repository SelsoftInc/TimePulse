/**
 * Script to create Stripe products and prices for TimePulse
 * Run this once to set up your Stripe products
 * 
 * Usage: node setup-stripe-products.js
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
      'Basic time tracking',
      'Project management',
      'Basic reporting',
      'Email support'
    ],
    monthlyPrice: 4900, // $49.00
    annualPrice: 4410,  // $44.10 (10% discount)
    priceKey: 'starter'
  },
  {
    name: 'TimePulse Professional',
    description: 'For growing teams that need advanced features',
    features: [
      'Up to 50 users',
      'Advanced time tracking',
      'Project & task management',
      'Advanced reporting & analytics',
      'Integrations',
      'Priority support',
      'Custom fields'
    ],
    monthlyPrice: 9900, // $99.00
    annualPrice: 8910,  // $89.10 (10% discount)
    priceKey: 'pro'
  },
  {
    name: 'TimePulse Enterprise',
    description: 'For large organizations with complex needs',
    features: [
      'Unlimited users',
      'All Professional features',
      'Advanced security',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 priority support',
      'SLA guarantee',
      'Custom training'
    ],
    monthlyPrice: 19900, // $199.00
    annualPrice: 17910,  // $179.10 (10% discount)
    priceKey: 'enterprise'
  }
];

async function createProducts() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     TimePulse Stripe Product Setup                    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const priceIds = {};

  for (const plan of plans) {
    console.log(`\n🔧 Creating: ${plan.name}`);
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

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        unit_amount: plan.monthlyPrice,
        nickname: `${plan.name} - Monthly`
      });

      console.log(`✅ Monthly price created: ${monthlyPrice.id}`);
      priceIds[`${plan.priceKey}_monthly`] = monthlyPrice.id;

      // Create annual price
      const annualPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        unit_amount: plan.annualPrice * 12, // Annual total
        nickname: `${plan.name} - Annual`
      });

      console.log(`✅ Annual price created: ${annualPrice.id}`);
      priceIds[`${plan.priceKey}_annual`] = annualPrice.id;

      console.log(`   💰 Monthly: $${plan.monthlyPrice / 100}/month`);
      console.log(`   💰 Annual: $${(plan.annualPrice * 12) / 100}/year ($${plan.annualPrice / 100}/month)`);

    } catch (error) {
      console.error(`❌ Error creating ${plan.name}:`, error.message);
    }
  }

  console.log('\n');
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
  console.log('};');
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('1. Copy the price IDs above');
  console.log('2. Update server/routes/billing.js PRICE constant');
  console.log('3. Restart your server');
  console.log('4. Test the subscription flow');
  console.log('');
}

createProducts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


