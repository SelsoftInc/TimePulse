require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { models, connectDB } = require('../models');

async function checkSubscription() {
  try {
    await connectDB();
    
    const tenant = await models.Tenant.findOne({
      where: { subdomain: 'selsoft' }
    });

    if (!tenant) {
      console.log('❌ Tenant not found');
      return;
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     Stripe Subscription Check                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📊 Database Info:');
    console.log(`   Tenant: ${tenant.tenantName}`);
    console.log(`   Stripe Customer ID: ${tenant.stripeCustomerId || 'none'}`);
    console.log(`   Stripe Subscription ID: ${tenant.stripeSubscriptionId || 'none'}`);
    console.log(`   Plan: ${tenant.plan || 'none'}`);
    console.log(`   Seat Limit: ${tenant.seatLimit || 'N/A'}`);
    console.log('');

    if (tenant.stripeCustomerId) {
      console.log('🔍 Checking Stripe for subscriptions...\n');
      
      const subscriptions = await stripe.subscriptions.list({
        customer: tenant.stripeCustomerId,
        limit: 10
      });

      if (subscriptions.data.length === 0) {
        console.log('⚠️  No subscriptions found in Stripe for this customer');
      } else {
        console.log(`✅ Found ${subscriptions.data.length} subscription(s) in Stripe:\n`);
        
        for (const sub of subscriptions.data) {
          console.log(`   Subscription ID: ${sub.id}`);
          console.log(`   Status: ${sub.status}`);
          console.log(`   Plan: ${sub.items.data[0]?.price?.id}`);
          console.log(`   Quantity: ${sub.items.data[0]?.quantity}`);
          console.log(`   Amount: $${(sub.items.data[0]?.price?.unit_amount * sub.items.data[0]?.quantity / 100).toFixed(2)}`);
          console.log(`   Current Period: ${new Date(sub.current_period_start * 1000).toLocaleDateString()} - ${new Date(sub.current_period_end * 1000).toLocaleDateString()}`);
          console.log('');
        }

        // Check if database needs updating
        const activeSubscription = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing');
        if (activeSubscription && tenant.stripeSubscriptionId !== activeSubscription.id) {
          console.log('⚠️  DATABASE OUT OF SYNC!');
          console.log(`   Database has: ${tenant.stripeSubscriptionId || 'null'}`);
          console.log(`   Stripe has: ${activeSubscription.id}`);
          console.log('\n💡 Updating database now...');
          
          await tenant.update({
            stripeSubscriptionId: activeSubscription.id,
            plan: activeSubscription.items.data[0]?.price?.id.includes('professional') ? 'professional' : 'starter',
            seatLimit: activeSubscription.items.data[0]?.quantity,
            status: activeSubscription.status,
            currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000)
          });
          
          console.log('✅ Database updated successfully!');
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSubscription();
