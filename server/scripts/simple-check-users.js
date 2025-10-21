/**
 * Simple check of users in database
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected\n');

    console.log('Checking users...');
    try {
      const users = await models.User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'tenantId']
      });
      
      console.log(`\n✅ Found ${users.length} users:\n`);
      users.forEach(user => {
        console.log(`  ${user.firstName} ${user.lastName}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Role: ${user.role}`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Tenant: ${user.tenantId}`);
        console.log('');
      });

      // Filter admins and managers
      const reviewers = users.filter(u => u.role === 'admin' || u.role === 'manager');
      console.log(`\n📊 Potential Reviewers (admin/manager): ${reviewers.length}`);
      reviewers.forEach(r => {
        console.log(`  - ${r.firstName} ${r.lastName} (${r.role})`);
      });

      if (reviewers.length === 0) {
        console.log('\n⚠️  NO ADMIN OR MANAGER USERS FOUND!');
        console.log('This is why the approver dropdown is empty.');
        console.log('\nYou need to:');
        console.log('1. Create admin/manager users in the database');
        console.log('2. Or update existing users to have admin/manager role');
      }

    } catch (err) {
      console.error('Error finding users:', err.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
