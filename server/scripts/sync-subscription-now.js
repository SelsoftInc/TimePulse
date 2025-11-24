require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { models, connectDB } = require('../models');

async function syncSubscription() {
  try {
    await connectDB();
    
    const tenant = await models.Tenant.findOne({
      where: { subdomain: 'selsoft' }
    });

    console.log('\n🔄 Syncing Stripe subscription to database...\n');

    const subscriptions = await stripe.subscriptions.list({
      customer: tenant.stripeCustomerId,
      limit: 10
    });

    // Get the most recent active subscription
    const activeSubscription = subscriptions.data
      .filter(s => s.status === 'active' || s.status === 'trialing')
      .sort((a, b) => b.created - a.created)[0];

    if (!activeSubscription) {
      console.log('❌ No active subscription found');
      return;
    }

    console.log('✅ Found active subscription:');
    console.log(`   ID: ${activeSubscription.id}`);
    console.log(`   Status: ${activeSubscription.status}`);
    console.log(`   Quantity: ${activeSubscription.items.data[0].quantity} seats`);
    console.log(`   Amount: $${(activeSubscription.items.data[0].price.unit_amount * activeSubscription.items.data[0].quantity / 100).toFixed(2)}/month`);
    console.log(`   Period End Timestamp: ${activeSubscription.current_period_end}`);
    console.log('');

    const priceId = activeSubscription.items.data[0].price.id;
    const plan = priceId.includes('professional') ? 'professional' : 'starter';
    
    // Convert timestamp properly
    const periodEndDate = activeSubscription.current_period_end 
      ? new Date(activeSubscription.current_period_end * 1000) 
      : null;
    
    console.log(`   Period End Date: ${periodEndDate}`);

    const updateData = {
      stripeSubscriptionId: activeSubscription.id,
      plan: plan,
      seatLimit: activeSubscription.items.data[0].quantity,
      status: activeSubscription.status
    };
    
    // Only add currentPeriodEnd if it's valid
    if (periodEndDate && !isNaN(periodEndDate.getTime())) {
      updateData.currentPeriodEnd = periodEndDate;
    }

    await tenant.update(updateData);

    console.log('\n✅ Database updated successfully!');
    console.log(`   Plan: ${plan}`);
    console.log(`   Seats: ${activeSubscription.items.data[0].quantity}`);
    console.log(`   Status: ${activeSubscription.status}`);
    if (periodEndDate) {
      console.log(`   Period End: ${periodEndDate.toLocaleDateString()}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncSubscription();
