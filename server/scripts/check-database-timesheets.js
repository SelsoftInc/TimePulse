/**
 * Check timesheets in database
 */

const { models, connectDB } = require('../models');

async function checkDatabaseTimesheets() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find Selvakumar
    const selvakumar = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    if (!selvakumar) {
      console.error('❌ Selvakumar user not found');
      process.exit(1);
    }

    console.log('✅ Found Selvakumar user:', {
      id: selvakumar.id,
      email: selvakumar.email,
      tenantId: selvakumar.tenantId,
      role: selvakumar.role
    });
    
    console.log('\n🔍 Checking if user.employeeId exists...');
    console.log(`   user.employeeId: ${selvakumar.employeeId || 'NOT SET'}`);
    console.log(`   This is important for frontend to fetch timesheets!`);

    // Find Selvakumar employee record
    const employee = await models.Employee.findOne({
      where: { 
        email: 'selvakumar@selsoftinc.com',
        tenantId: selvakumar.tenantId
      }
    });

    if (!employee) {
      console.error('❌ Selvakumar employee record not found');
      process.exit(1);
    }

    console.log('✅ Found Selvakumar employee:', {
      id: employee.id,
      email: employee.email
    });

    // Check all timesheets for this employee
    console.log('\n📋 Checking timesheets for Selvakumar...\n');
    
    const timesheets = await models.Timesheet.findAll({
      where: {
        tenantId: selvakumar.tenantId,
        employeeId: employee.id
      },
      include: [
        { model: models.Employee, as: 'employee', attributes: ['firstName', 'lastName', 'email'] },
        { model: models.Client, as: 'client', attributes: ['clientName'], required: false },
        { model: models.User, as: 'reviewer', attributes: ['firstName', 'lastName', 'email'], required: false }
      ],
      order: [['weekStart', 'DESC']]
    });

    console.log(`Found ${timesheets.length} timesheets:\n`);

    if (timesheets.length === 0) {
      console.log('❌ No timesheets found for Selvakumar!');
      console.log('\n💡 You need to create a timesheet first.');
      console.log('   Run: node scripts/setup-and-create-timesheet.js');
    } else {
      timesheets.forEach((ts, index) => {
        console.log(`${index + 1}. Timesheet ID: ${ts.id}`);
        console.log(`   Week: ${ts.weekStart} to ${ts.weekEnd}`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Total Hours: ${ts.totalHours}`);
        console.log(`   Daily Hours:`, ts.dailyHours);
        console.log(`   Reviewer: ${ts.reviewer ? `${ts.reviewer.firstName} ${ts.reviewer.lastName}` : 'Not assigned'}`);
        console.log(`   Submitted At: ${ts.submittedAt || 'Not submitted'}`);
        console.log(`   Notes: ${ts.notes || 'No notes'}`);
        console.log('');
      });
    }

    // Test the API endpoint
    console.log('\n📋 Testing API endpoint format...\n');
    console.log(`API URL would be: /api/timesheets/employee/${employee.id}/all?tenantId=${selvakumar.tenantId}`);
    console.log(`\nEmployee ID: ${employee.id}`);
    console.log(`Tenant ID: ${selvakumar.tenantId}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabaseTimesheets();
