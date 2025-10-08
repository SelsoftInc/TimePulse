/**
 * Cleanup Orphaned Users
 * Deletes user accounts that don't have a corresponding employee record
 */

const { models, connectDB } = require('./models');

const cleanupOrphanedUsers = async () => {
  try {
    console.log('🧹 Starting orphaned users cleanup...');
    
    await connectDB();
    
    // Get all users
    const users = await models.User.findAll();
    console.log(`Found ${users.length} total users`);

    let deletedCount = 0;
    const deletedUsers = [];

    for (const user of users) {
      // Check if there's a corresponding employee
      const employee = await models.Employee.findOne({
        where: { userId: user.id }
      });

      if (!employee) {
        console.log(`🗑️  Deleting orphaned user: ${user.firstName} ${user.lastName} (${user.email})`);
        deletedUsers.push({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role
        });
        await user.destroy();
        deletedCount++;
      }
    }

    console.log('\n✅ Cleanup completed!');
    console.log(`   - Deleted: ${deletedCount} orphaned users`);
    console.log(`   - Remaining: ${users.length - deletedCount} users`);
    
    if (deletedUsers.length > 0) {
      console.log('\n📋 Deleted users:');
      deletedUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up orphaned users:', error);
    process.exit(1);
  }
};

cleanupOrphanedUsers();
