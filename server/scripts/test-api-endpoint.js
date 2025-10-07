/**
 * Test the API endpoint directly
 */

const { models, connectDB } = require('../models');

async function testAPIEndpoint() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get user and employee
    const user = await models.User.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    const employee = await models.Employee.findOne({
      where: {
        email: 'selvakumar@selsoftinc.com',
        tenantId: user.tenantId
      }
    });

    console.log('User Info:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Tenant ID:', user.tenantId);
    console.log('  Employee ID:', user.employeeId || 'NOT SET');

    console.log('\nEmployee Info:');
    console.log('  ID:', employee.id);
    console.log('  Email:', employee.email);

    // Simulate the API call
    const employeeId = user.employeeId || employee.id;
    const tenantId = user.tenantId;

    console.log('\n📡 Testing API endpoint...');
    console.log(`GET /api/timesheets/employee/${employeeId}/all?tenantId=${tenantId}`);

    const timesheets = await models.Timesheet.findAll({
      where: { 
        tenantId,
        employeeId 
      },
      include: [
        { model: models.Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'title'] },
        { model: models.Client, as: 'client', attributes: ['id', 'clientName'], required: false },
        { model: models.User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email', 'role'], required: false }
      ],
      order: [['weekStart', 'DESC']]
    });

    console.log(`\n✅ Found ${timesheets.length} timesheets\n`);

    if (timesheets.length > 0) {
      timesheets.forEach((ts, i) => {
        console.log(`${i + 1}. Timesheet:`);
        console.log('   ID:', ts.id);
        console.log('   Week:', ts.weekStart, 'to', ts.weekEnd);
        console.log('   Status:', ts.status);
        console.log('   Hours:', ts.totalHours);
        console.log('   Employee:', ts.employee ? `${ts.employee.firstName} ${ts.employee.lastName}` : 'N/A');
        console.log('   Reviewer:', ts.reviewer ? `${ts.reviewer.firstName} ${ts.reviewer.lastName}` : 'N/A');
        console.log('');
      });

      // Format like the API does
      const formatted = timesheets.map((r) => ({
        id: r.id,
        employee: {
          id: r.employee?.id,
          name: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
          role: r.employee?.title || 'Employee'
        },
        client: r.client?.clientName || 'No client assigned',
        week: `${new Date(r.weekStart).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} To ${new Date(r.weekEnd).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`,
        hours: Number(r.totalHours).toFixed(2),
        status: { 
          label: r.status.replace('_', ' ').toUpperCase()
        }
      }));

      console.log('📊 Formatted API Response:');
      console.log(JSON.stringify({ success: true, timesheets: formatted }, null, 2));
    } else {
      console.log('❌ No timesheets found!');
      console.log('\nPossible issues:');
      console.log('1. employeeId mismatch');
      console.log('2. tenantId mismatch');
      console.log('3. Timesheet not created');
    }

    console.log('\n🔍 What should be in localStorage (userInfo):');
    console.log(JSON.stringify({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      employeeId: user.employeeId || employee.id,
      role: user.role
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAPIEndpoint();
