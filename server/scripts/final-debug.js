/**
 * Final debug - Check everything
 */

const { models, connectDB } = require('../models');

async function finalDebug() {
  try {
    await connectDB();
    console.log('✅ Connected\n');

    // Get user with employeeId
    const user = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' },
      attributes: ['id', 'email', 'tenantId', 'employeeId', 'role']
    });

    console.log('📊 User from database:');
    console.log(JSON.stringify(user.toJSON(), null, 2));

    console.log('\n🔍 What login API should return:');
    const loginResponse = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        employeeId: user.employeeId,
        role: user.role
      }
    };
    console.log(JSON.stringify(loginResponse, null, 2));

    console.log('\n📡 Test API call:');
    if (user.employeeId) {
      console.log(`GET /api/timesheets/employee/${user.employeeId}/all?tenantId=${user.tenantId}`);
      
      const timesheets = await models.Timesheet.findAll({
        where: {
          tenantId: user.tenantId,
          employeeId: user.employeeId
        }
      });
      
      console.log(`\n✅ Found ${timesheets.length} timesheets`);
    } else {
      console.log('❌ employeeId is NULL - this is the problem!');
      console.log('\nRun: node scripts/add-employee-id-column.js');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

finalDebug();
