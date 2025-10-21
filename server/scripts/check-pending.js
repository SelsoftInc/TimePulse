const { models, connectDB } = require('../models');

async function checkPending() {
  try {
    await connectDB();
    
    const timesheets = await models.Timesheet.findAll({
      where: {
        tenantId: '5eda5596-b1d9-4963-953d-7af9d0511ce8',
        status: 'submitted'
      },
      include: [
        { model: models.Employee, as: 'employee', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    console.log(`Found ${timesheets.length} submitted timesheets:`);
    timesheets.forEach(ts => {
      console.log({
        id: ts.id,
        employee: `${ts.employee.firstName} ${ts.employee.lastName}`,
        week: `${ts.weekStart} to ${ts.weekEnd}`,
        status: ts.status,
        hours: ts.totalHours
      });
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPending();
