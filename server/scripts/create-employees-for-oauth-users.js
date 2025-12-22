/**
 * Create Employee Records for OAuth Users
 * This script finds all OAuth users who don't have Employee records and creates them
 * This ensures OAuth users (like those who signed in via Google) appear in the employee list
 */

const { models, connectDB } = require('../models');

async function createEmployeesForOAuthUsers() {
  try {
    console.log('🔄 Starting OAuth user Employee record creation...\n');
    
    await connectDB();
    console.log('✅ Database connected\n');

    // Find all users (including OAuth users)
    const allUsers = await models.User.findAll({
      where: {
        status: 'active'
      },
      include: [{
        model: models.Employee,
        as: 'employee',
        required: false
      }]
    });

    console.log(`📊 Found ${allUsers.length} active users\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        // Check if user already has an employee record
        if (user.employee) {
          console.log(`⏭️  User already has employee record: ${user.email}`);
          skipped++;
          continue;
        }

        // Check if employee exists by email (might be linked differently)
        const existingEmployee = await models.Employee.findOne({
          where: {
            email: user.email,
            tenantId: user.tenantId || user.tenant_id
          }
        });

        if (existingEmployee) {
          // Link existing employee to user
          await existingEmployee.update({ userId: user.id });
          console.log(`🔗 Linked existing employee to user: ${user.email}`);
          created++;
          continue;
        }

        // Determine title based on role
        let title = 'Employee';
        if (user.role === 'admin') {
          title = 'Administrator';
        } else if (user.role === 'approver') {
          title = 'Manager';
        } else if (user.role === 'accountant') {
          title = 'Accountant';
        } else if (user.role === 'hr') {
          title = 'HR Manager';
        }

        // Create new employee record
        const employee = await models.Employee.create({
          tenantId: user.tenantId || user.tenant_id,
          userId: user.id,
          firstName: user.firstName || user.first_name,
          lastName: user.lastName || user.last_name,
          email: user.email,
          phone: null,
          department: 'General',
          title: title,
          status: 'active',
          startDate: new Date()
        });

        console.log(`✅ Created employee record for: ${user.email} (${user.firstName} ${user.lastName}) - ${title}`);
        created++;

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created/Linked: ${created}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📋 Total processed: ${allUsers.length}\n`);

    console.log('✅ Script completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
createEmployeesForOAuthUsers();
