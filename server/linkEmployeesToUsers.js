/**
 * Link Employees to Users
 * Links employee records to their corresponding user accounts by matching email addresses
 */

const { models, connectDB } = require('./models');

const linkEmployeesToUsers = async () => {
  try {
    console.log('🔗 Starting employee-user linking...');
    
    await connectDB();
    
    // Get all employees
    const employees = await models.Employee.findAll();
    console.log(`Found ${employees.length} employees`);

    let linkedCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      // Find matching user by email
      const user = await models.User.findOne({
        where: { email: employee.email }
      });

      if (user) {
        console.log(`🔗 Linking: ${employee.firstName} ${employee.lastName} → User (${user.role})`);
        await employee.update({ userId: user.id });
        linkedCount++;
      } else {
        console.log(`⚠️  No user found for: ${employee.firstName} ${employee.lastName} (${employee.email})`);
        skippedCount++;
      }
    }

    console.log('\n✅ Linking completed!');
    console.log(`   - Linked: ${linkedCount} employees`);
    console.log(`   - Skipped: ${skippedCount} employees (no matching user)`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error linking employees to users:', error);
    process.exit(1);
  }
};

linkEmployeesToUsers();
