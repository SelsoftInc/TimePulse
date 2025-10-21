/**
 * Link user to employee record
 */

const { models, connectDB } = require('../models');

async function linkUserToEmployee() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    const user = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    const employee = await models.Employee.findOne({
      where: {
        email: 'selvakumar@selsoftinc.com',
        tenantId: user.tenantId
      }
    });

    console.log('Before update:');
    console.log('  User employeeId:', user.employeeId);
    console.log('  Employee id:', employee.id);

    // Update user with employeeId
    await user.update({ employeeId: employee.id });

    console.log('\n✅ User linked to employee!');
    console.log('After update:');
    console.log('  User employeeId:', user.employeeId);

    console.log('\n🎯 Now you need to:');
    console.log('1. Logout from browser');
    console.log('2. Login again as selvakumar@selsoftinc.com');
    console.log('3. The login API will return employeeId');
    console.log('4. Timesheets will load!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

linkUserToEmployee();
