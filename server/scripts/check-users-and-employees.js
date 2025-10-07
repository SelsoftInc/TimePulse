/**
 * Check users and employees in database
 */

const { models, connectDB } = require('../models');

async function checkUsersAndEmployees() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find all users
    const users = await models.User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'tenantId'],
      order: [['email', 'ASC']]
    });

    console.log(`📊 Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log('');
    });

    // Find all employees
    const employees = await models.Employee.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'department', 'tenantId'],
      order: [['email', 'ASC']]
    });

    console.log(`\n📊 Found ${employees.length} employees:\n`);
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.firstName} ${emp.lastName}`);
      console.log(`   Email: ${emp.email}`);
      console.log(`   Department: ${emp.department || 'N/A'}`);
      console.log(`   ID: ${emp.id}`);
      console.log(`   Tenant ID: ${emp.tenantId}`);
      console.log('');
    });

    // Check for Selvakumar
    console.log('\n🔍 Checking for Selvakumar...');
    const selvakumarUser = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });
    
    if (selvakumarUser) {
      console.log('✅ Selvakumar user found');
    } else {
      console.log('❌ Selvakumar user NOT found - need to create');
    }

    const selvakumarEmployee = await models.Employee.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });
    
    if (selvakumarEmployee) {
      console.log('✅ Selvakumar employee found');
    } else {
      console.log('❌ Selvakumar employee NOT found - need to create');
    }

    // Check for Pushpan
    console.log('\n🔍 Checking for Pushpan...');
    const pushpanUser = await models.User.findOne({
      where: { email: 'pushpan@selsoftinc.com' }
    });
    
    if (pushpanUser) {
      console.log('✅ Pushpan user found');
      console.log(`   Role: ${pushpanUser.role}`);
    } else {
      console.log('❌ Pushpan user NOT found - need to create');
    }

    // Check existing timesheets
    const timesheets = await models.Timesheet.findAll({
      include: [
        { model: models.Employee, as: 'employee', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    console.log(`\n📊 Found ${timesheets.length} existing timesheets:\n`);
    timesheets.forEach((ts, index) => {
      console.log(`${index + 1}. ${ts.employee?.firstName} ${ts.employee?.lastName}`);
      console.log(`   Week: ${ts.weekStart} to ${ts.weekEnd}`);
      console.log(`   Status: ${ts.status}`);
      console.log(`   Total Hours: ${ts.totalHours}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsersAndEmployees();
