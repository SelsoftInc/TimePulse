/**
 * Script to list all users for Selsoft tenant
 * Shows all user logins that were created from the Excel file
 * 
 * Usage: node scripts/list-selsoft-users.js
 */

const { models, connectDB } = require('../models');

async function listSelsoftUsers() {
  console.log('🔍 Fetching Selsoft tenant users...\n');

  try {
    // Connect to database
    await connectDB();

    // Find Selsoft tenant
    const tenant = await models.Tenant.findOne({
      where: { subdomain: 'selsoft' }
    });

    if (!tenant) {
      console.log('❌ Selsoft tenant not found in database');
      return;
    }

    console.log('✅ Found Selsoft tenant:');
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Tenant Name: ${tenant.tenantName}`);
    console.log(`   Subdomain: ${tenant.subdomain}`);
    console.log(`   Onboarded At: ${tenant.onboardedAt}\n`);

    // Fetch all users for this tenant
    const users = await models.User.findAll({
      where: { tenantId: tenant.id },
      order: [['created_at', 'ASC']]
    });

    console.log(`📊 Total Users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found for this tenant');
      return;
    }

    console.log('👥 User List:');
    console.log('─'.repeat(100));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Department: ${user.department || 'N/A'}`);
      console.log(`   Title: ${user.title || 'N/A'}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Must Change Password: ${user.mustChangePassword ? 'Yes' : 'No'}`);
      console.log(`   Created At: ${user.createdAt}`);
      console.log('─'.repeat(100));
    });

    // Fetch all employees for this tenant
    const employees = await models.Employee.findAll({
      where: { tenantId: tenant.id },
      order: [['created_at', 'ASC']]
    });

    console.log(`\n👔 Total Employees: ${employees.length}\n`);

    if (employees.length > 0) {
      console.log('👔 Employee List:');
      console.log('─'.repeat(100));
      employees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.firstName} ${emp.lastName}`);
        console.log(`   Employee ID: ${emp.employeeId || 'N/A'}`);
        console.log(`   Email: ${emp.email}`);
        console.log(`   Department: ${emp.department || 'N/A'}`);
        console.log(`   Title: ${emp.title || 'N/A'}`);
        console.log(`   User ID: ${emp.userId || 'Not linked to user'}`);
        console.log(`   Status: ${emp.status}`);
        console.log('─'.repeat(100));
      });
    }

    // Check onboarding log
    const onboardingLog = await models.OnboardingLog.findOne({
      where: { tenantId: tenant.id },
      order: [['created_at', 'DESC']]
    });

    if (onboardingLog) {
      console.log('\n📋 Onboarding Log:');
      console.log(`   Source File: ${onboardingLog.sourceFile}`);
      console.log(`   Users Created: ${onboardingLog.usersCreated}`);
      console.log(`   Employees Created: ${onboardingLog.employeesCreated}`);
      console.log(`   Clients Created: ${onboardingLog.clientsCreated}`);
      console.log(`   Status: ${onboardingLog.status}`);
      
      if (onboardingLog.onboardingData?.defaultPassword) {
        console.log(`\n🔑 Default Password: ${onboardingLog.onboardingData.defaultPassword}`);
      }
    }

    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
listSelsoftUsers();
