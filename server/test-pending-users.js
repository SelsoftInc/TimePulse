/**
 * Test script to check pending users in database
 * Run with: node test-pending-users.js
 */

const { models, sequelize } = require('./models');

async function testPendingUsers() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    // Get all users
    console.log('📊 All users in database:');
    const allUsers = await models.User.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'tenantId', 'approvalStatus', 'status'],
      raw: true
    });
    console.log(`Found ${allUsers.length} total users:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} | Role: ${user.role} | Status: ${user.status} | Approval: ${user.approvalStatus} | Tenant: ${user.tenantId}`);
    });

    // Get pending users
    console.log('\n🔍 Pending users:');
    const pendingUsers = await models.User.findAll({
      where: {
        approvalStatus: 'pending'
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'tenantId', 'approvalStatus', 'status', 'authProvider'],
      raw: true
    });
    console.log(`Found ${pendingUsers.length} pending users:`);
    pendingUsers.forEach(user => {
      console.log(`  - ${user.email} | Role: ${user.role} | Auth: ${user.authProvider} | Tenant: ${user.tenantId}`);
    });

    // Get all tenants
    console.log('\n🏢 All tenants:');
    const tenants = await models.Tenant.findAll({
      attributes: ['id', 'tenantName', 'subdomain', 'status'],
      raw: true
    });
    console.log(`Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`  - ${tenant.tenantName} (${tenant.subdomain}) | ID: ${tenant.id} | Status: ${tenant.status}`);
    });

    // Check for users by tenant
    if (tenants.length > 0) {
      console.log('\n👥 Users by tenant:');
      for (const tenant of tenants) {
        const usersInTenant = await models.User.findAll({
          where: {
            tenantId: tenant.id
          },
          attributes: ['email', 'role', 'approvalStatus', 'status'],
          raw: true
        });
        console.log(`\n  Tenant: ${tenant.tenantName} (${tenant.id})`);
        console.log(`  Users: ${usersInTenant.length}`);
        usersInTenant.forEach(user => {
          console.log(`    - ${user.email} | ${user.role} | Approval: ${user.approvalStatus} | Status: ${user.status}`);
        });
      }
    }

    console.log('\n✅ Test complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPendingUsers();
