/**
 * Check and create admin users for timesheet approval
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('CHECKING ADMIN/MANAGER USERS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Get all users
    const allUsers = await models.User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'tenantId', 'status']
    });

    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    // Filter admins and managers
    const admins = allUsers.filter(u => u.role === 'admin' && u.status === 'active');
    const managers = allUsers.filter(u => u.role === 'manager' && u.status === 'active');

    console.log(`👑 Active Admins: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`  - ${admin.firstName} ${admin.lastName} (${admin.email})`);
      console.log(`    ID: ${admin.id}`);
      console.log(`    Tenant: ${admin.tenantId}`);
    });

    console.log(`\n👔 Active Managers: ${managers.length}`);
    managers.forEach(manager => {
      console.log(`  - ${manager.firstName} ${manager.lastName} (${manager.email})`);
      console.log(`    ID: ${manager.id}`);
      console.log(`    Tenant: ${manager.tenantId}`);
    });

    // Check if we need to create admin users
    if (admins.length === 0 && managers.length === 0) {
      console.log('\n⚠️  No admin or manager users found!');
      console.log('Creating default admin user...\n');

      // Get the tenant ID from existing users or use a default
      const tenantId = allUsers.length > 0 ? allUsers[0].tenantId : '5eda5596-b1d9-4963-953d-7af9d0511ce8';

      // Create admin user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const adminUser = await models.User.create({
        tenantId: tenantId,
        firstName: 'Pushpan',
        lastName: 'U',
        email: 'admin@pushpan.com',
        passwordHash: hashedPassword,
        role: 'admin',
        status: 'active',
        mustChangePassword: false,
        permissions: ['all']
      });

      console.log('✅ Created admin user:');
      console.log(`  Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Password: admin123`);
      console.log(`  Role: ${adminUser.role}`);
      console.log(`  ID: ${adminUser.id}`);
      console.log(`  Tenant: ${adminUser.tenantId}`);

      // Create manager user
      const managerUser = await models.User.create({
        tenantId: tenantId,
        firstName: 'Manager',
        lastName: 'User',
        email: 'manager@company.com',
        passwordHash: hashedPassword,
        role: 'manager',
        status: 'active',
        mustChangePassword: false,
        permissions: ['timesheet_approval']
      });

      console.log('\n✅ Created manager user:');
      console.log(`  Name: ${managerUser.firstName} ${managerUser.lastName}`);
      console.log(`  Email: ${managerUser.email}`);
      console.log(`  Password: admin123`);
      console.log(`  Role: ${managerUser.role}`);
      console.log(`  ID: ${managerUser.id}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('FINAL VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    // Verify reviewers endpoint would return
    const reviewers = await models.User.findAll({
      where: {
        role: { [models.Sequelize.Op.in]: ['admin', 'manager'] },
        status: 'active'
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'tenantId']
    });

    console.log(`✅ Total reviewers available: ${reviewers.length}\n`);
    reviewers.forEach(reviewer => {
      console.log(`  ${reviewer.firstName} ${reviewer.lastName} (${reviewer.role})`);
      console.log(`    Email: ${reviewer.email}`);
      console.log(`    ID: ${reviewer.id}`);
      console.log(`    Tenant: ${reviewer.tenantId}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Restart backend server');
    console.log('2. Refresh frontend page');
    console.log('3. Check approver dropdown');
    console.log('4. Should see admin/manager users\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
