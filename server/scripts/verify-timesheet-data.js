/**
 * Verify timesheet data exists
 */

const { models, connectDB } = require('../models');

async function verifyData() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Find Selvakumar user
    const user = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      employeeId: user.employeeId
    });

    // Find employee
    const employee = await models.Employee.findOne({
      where: {
        email: 'selvakumar@selsoftinc.com',
        tenantId: user.tenantId
      }
    });

    if (!employee) {
      console.log('❌ Employee not found');
      process.exit(1);
    }

    console.log('✅ Employee found:', {
      id: employee.id,
      email: employee.email
    });

    // Check timesheets
    const timesheets = await models.Timesheet.findAll({
      where: {
        tenantId: user.tenantId,
        employeeId: employee.id
      }
    });

    console.log(`\n📊 Found ${timesheets.length} timesheets for Selvakumar\n`);

    if (timesheets.length === 0) {
      console.log('❌ NO TIMESHEETS FOUND!');
      console.log('\n💡 Creating timesheet now...\n');

      // Find reviewer
      const reviewer = await models.User.findOne({
        where: { email: 'pushban@selsoftinc.com' }
      });

      // Create timesheet
      const timesheet = await models.Timesheet.create({
        tenantId: user.tenantId,
        employeeId: employee.id,
        clientId: null,
        weekStart: '2025-09-29',
        weekEnd: '2025-10-05',
        dailyHours: {
          mon: 8,
          tue: 8,
          wed: 8,
          thu: 8,
          fri: 8,
          sat: 0,
          sun: 0
        },
        totalHours: 40,
        status: 'submitted',
        reviewerId: reviewer?.id,
        notes: 'Worked on TimePulse timesheet approval feature',
        submittedAt: new Date()
      });

      console.log('✅ Created timesheet:', timesheet.id);
    } else {
      timesheets.forEach((ts, i) => {
        console.log(`${i + 1}. ID: ${ts.id}`);
        console.log(`   Week: ${ts.weekStart} to ${ts.weekEnd}`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Hours: ${ts.totalHours}`);
        console.log('');
      });
    }

    // Test the API endpoint format
    console.log('\n📡 API Endpoint to test:');
    console.log(`GET /api/timesheets/employee/${employee.id}/all?tenantId=${user.tenantId}`);
    
    console.log('\n🔍 User info that should be in localStorage:');
    console.log(JSON.stringify({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      employeeId: employee.id
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyData();
