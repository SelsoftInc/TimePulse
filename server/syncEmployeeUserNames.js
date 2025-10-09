/**
 * Sync Employee names to User table
 * Run this once to sync existing employee names to their linked user accounts
 */

const { models, connectDB } = require('./models');

const syncEmployeeUserNames = async () => {
  try {
    console.log('🔄 Starting employee-user name sync...');
    
    await connectDB();
    
    // Get all employees with userId
    const employees = await models.Employee.findAll({
      where: {
        userId: { [models.Sequelize.Op.ne]: null }
      }
    });

    console.log(`Found ${employees.length} employees with linked user accounts`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      const user = await models.User.findByPk(employee.userId);
      
      if (!user) {
        console.log(`⚠️  User not found for employee ${employee.firstName} ${employee.lastName} (userId: ${employee.userId})`);
        skippedCount++;
        continue;
      }

      // Check if names are different
      if (user.firstName !== employee.firstName || user.lastName !== employee.lastName) {
        console.log(`📝 Updating user: ${user.firstName} ${user.lastName} → ${employee.firstName} ${employee.lastName}`);
        
        await user.update({
          firstName: employee.firstName,
          lastName: employee.lastName
        });
        
        syncedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n✅ Sync completed!');
    console.log(`   - Synced: ${syncedCount} users`);
    console.log(`   - Skipped: ${skippedCount} users (already in sync)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing employee-user names:', error);
    process.exit(1);
  }
};

syncEmployeeUserNames();
