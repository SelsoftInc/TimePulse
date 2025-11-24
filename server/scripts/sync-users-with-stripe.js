/**
 * Script to sync existing users with Stripe subscription
 * This updates the Stripe subscription quantity to match actual user count
 * 
 * Usage: node sync-users-with-stripe.js <tenantId>
 */

require('dotenv').config();
const Stripe = require('stripe');
const { models, connectDB } = require('../models');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function syncUsersWithStripe() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get tenantId from command line or find all tenants
    const tenantId = process.argv[2];

    let tenants = [];
    if (tenantId) {
      const tenant = await models.Tenant.findByPk(tenantId);
      if (tenant) tenants = [tenant];
    } else {
      tenants = await models.Tenant.findAll({
        where: {
          stripeSubscriptionId: { [require('sequelize').Op.ne]: null }
        }
      });
    }

    if (tenants.length === 0) {
      console.log('❌ No tenants found with active subscriptions');
      process.exit(1);
    }

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     Sync Users with Stripe Subscriptions              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    for (const tenant of tenants) {
      console.log(`\n📊 Processing Tenant: ${tenant.tenantName || tenant.id}`);
      console.log('─────────────────────────────────────────────────────────');

      // Count actual users
      const userCount = await models.User.count({
        where: { tenantId: tenant.id }
      });

      console.log(`   Current users in system: ${userCount}`);

      if (!tenant.stripeSubscriptionId) {
        console.log('   ⚠️  No Stripe subscription found');
        continue;
      }

      // Get Stripe subscription
      const subscription = await stripe.subscriptions.retrieve(
        tenant.stripeSubscriptionId
      );

      const currentQuantity = subscription.items.data[0].quantity;
      console.log(`   Current Stripe quantity: ${currentQuantity}`);

      if (userCount === currentQuantity) {
        console.log('   ✅ Already in sync!');
        continue;
      }

      // Update Stripe subscription quantity
      console.log(`   🔄 Updating Stripe quantity to ${userCount}...`);

      const updated = await stripe.subscriptions.update(
        tenant.stripeSubscriptionId,
        {
          items: [{
            id: subscription.items.data[0].id,
            quantity: userCount
          }],
          proration_behavior: 'create_prorations' // This will charge/credit the difference
        }
      );

      // Update tenant record
      await tenant.update({
        seatLimit: userCount
      });

      console.log('   ✅ Synced successfully!');
      console.log(`   💰 New amount: $${(updated.items.data[0].price.unit_amount * userCount / 100).toFixed(2)}/month`);
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     Sync Complete!                                     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncUsersWithStripe();

