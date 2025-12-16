/**
 * Check all users in the database with detailed info
 */

const { models, sequelize } = require('./models');

async function checkAllUsers() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    // Get ALL users with full details
    const allUsers = await models.User.findAll({
      attributes: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'tenantId',
        'status',
        'approvalStatus',
        'authProvider',
        ['created_at', 'createdAt']  // Map database column to JS property
      ],
      order: [['created_at', 'DESC']],  // Use database column name in order
      raw: true
    });

    console.log(`📊 Total users: ${allUsers.length}\n`);

    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Approval: ${user.approvalStatus}`);
      console.log(`  Auth: ${user.authProvider || 'password'}`);
      console.log(`  Tenant: ${user.tenantId}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });

    // Check for pending specifically
    const pendingUsers = await models.User.findAll({
      where: {
        approvalStatus: 'pending'
      },
      raw: true
    });

    console.log(`\n🔍 Pending users: ${pendingUsers.length}`);
    if (pendingUsers.length > 0) {
      pendingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
      });
    } else {
      console.log('  No pending users found!');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkAllUsers();
