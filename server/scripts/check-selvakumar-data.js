/**
 * Check Selvakumar's current data
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Check employee
    const employee = await models.Employee.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    if (!employee) {
      console.log('❌ Selvakumar employee not found');
      process.exit(1);
    }

    console.log('Employee:', {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      clientId: employee.clientId,
      tenantId: employee.tenantId
    });

    // Check client
    if (employee.clientId) {
      const client = await models.Client.findByPk(employee.clientId);
      console.log('\nCurrent Client:', {
        id: client.id,
        name: client.clientName,
        type: client.clientType
      });
    } else {
      console.log('\nNo client assigned');
    }

    // Check all clients
    console.log('\nAll Clients:');
    const clients = await models.Client.findAll({
      where: { tenantId: employee.tenantId }
    });
    clients.forEach(c => {
      console.log(`  ${c.id}. ${c.clientName} (${c.clientType})`);
    });

    // Check timesheets
    console.log('\nTimesheets:');
    const timesheets = await models.Timesheet.findAll({
      where: { employeeId: employee.id },
      limit: 5,
      order: [['weekStart', 'DESC']]
    });
    timesheets.forEach(ts => {
      console.log(`  Week: ${ts.weekStart} - ${ts.weekEnd}, Client: ${ts.clientId}, Status: ${ts.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
