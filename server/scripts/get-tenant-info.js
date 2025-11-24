const { models, connectDB } = require('../models');

async function getTenantInfo() {
  try {
    await connectDB();
    
    const tenants = await models.Tenant.findAll({
      attributes: ['id', 'tenantName', 'subdomain', 'stripeCustomerId', 'stripeSubscriptionId', 'plan', 'seatLimit'],
      raw: true
    });

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     Tenant Information                                 ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    for (const tenant of tenants) {
      console.log(`📊 Tenant: ${tenant.tenantName || 'N/A'}`);
      console.log(`   🆔 ID: ${tenant.id}`);
      console.log(`   🌐 Subdomain: ${tenant.subdomain || 'N/A'}`);
      console.log(`   📦 Plan: ${tenant.plan || 'none'}`);
      console.log(`   💺 Seat Limit: ${tenant.seatLimit || 'N/A'}`);
      console.log(`   💳 Stripe Customer: ${tenant.stripeCustomerId ? '✓' : '✗'}`);
      console.log(`   📊 Stripe Subscription: ${tenant.stripeSubscriptionId ? '✓' : '✗'}`);
      
      // Count users
      const userCount = await models.User.count({ where: { tenantId: tenant.id } });
      console.log(`   👥 Actual Users: ${userCount}`);
      
      if (tenant.stripeSubscriptionId && tenant.seatLimit !== userCount) {
        console.log(`   ⚠️  NEEDS SYNC: ${tenant.seatLimit} seats → ${userCount} users`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getTenantInfo();
