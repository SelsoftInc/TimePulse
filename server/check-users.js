/**
 * Check all users and their tenants
 */

const { models } = require('./models');

async function checkUsers() {
  try {
    console.log('🔍 Checking all users and tenants...\n');

    // Get all tenants
    const tenants = await models.Tenant.findAll();
    console.log(`📋 Found ${tenants.length} tenants:\n`);

    for (const tenant of tenants) {
      console.log(`\n🏢 Tenant: ${tenant.tenantName} (${tenant.subdomain})`);
      console.log(`   ID: ${tenant.id}`);

      // Get all users in this tenant
      const users = await models.User.findAll({
        where: { tenantId: tenant.id },
        attributes: ['id', 'email', 'firstName', 'lastName', 'role']
      });

      console.log(`   👥 Users (${users.length}):`);
      users.forEach(user => {
        console.log(`      - ${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role}`);
      });

      // Count by role
      const admins = users.filter(u => u.role === 'admin').length;
      const managers = users.filter(u => u.role === 'manager').length;
      const approvers = users.filter(u => u.role === 'approver').length;
      const employees = users.filter(u => u.role === 'employee').length;

      console.log(`   📊 Role breakdown:`);
      console.log(`      Admin: ${admins}, Manager: ${managers}, Approver: ${approvers}, Employee: ${employees}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
