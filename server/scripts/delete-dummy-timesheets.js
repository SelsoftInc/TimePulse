/**
 * Delete Dummy Timesheet Data
 * Removes test/dummy timesheets for employees: Uma, Lalitha, Asvini
 * These timesheets were not actually submitted and should be removed
 */

const { models, connectDB } = require('../models');
const { Op } = require('sequelize');

async function deleteDummyTimesheets() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   DELETE DUMMY TIMESHEET DATA                      ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    await connectDB();
    console.log('✅ Database connected\n');

    // Find employees by name (Uma, Lalitha, Asvini)
    const employeeNames = ['Uma Sivalingam', 'Lalitha Prabhu', 'Asvini .V', 'Asvini V'];
    
    console.log('🔍 Step 1: Finding employees...\n');
    const employees = await models.Employee.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: 'Uma%' } },
          { firstName: { [Op.iLike]: 'Lalitha%' } },
          { firstName: { [Op.iLike]: 'Asvini%' } },
          { firstName: { [Op.iLike]: 'Aswini%' } }
        ]
      },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    if (employees.length === 0) {
      console.log('⚠️  No employees found matching the criteria');
      process.exit(0);
    }

    console.log(`Found ${employees.length} employees:`);
    employees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName} (ID: ${emp.id})`);
    });

    const employeeIds = employees.map(e => e.id);

    // Find timesheets for these employees
    console.log('\n🔍 Step 2: Finding timesheets...\n');
    const timesheets = await models.Timesheet.findAll({
      where: {
        employeeId: { [Op.in]: employeeIds },
        status: { [Op.ne]: 'deleted' }
      },
      attributes: ['id', 'employeeId', 'weekStart', 'weekEnd', 'totalHours', 'status'],
      order: [['weekStart', 'ASC']]
    });

    if (timesheets.length === 0) {
      console.log('✅ No timesheets found for these employees');
      process.exit(0);
    }

    console.log(`Found ${timesheets.length} timesheets:\n`);
    
    // Group by employee
    const timesheetsByEmployee = {};
    timesheets.forEach(ts => {
      if (!timesheetsByEmployee[ts.employeeId]) {
        timesheetsByEmployee[ts.employeeId] = [];
      }
      timesheetsByEmployee[ts.employeeId].push(ts);
    });

    // Display summary
    employees.forEach(emp => {
      const empTimesheets = timesheetsByEmployee[emp.id] || [];
      console.log(`   ${emp.firstName} ${emp.lastName}:`);
      console.log(`   - ${empTimesheets.length} timesheets`);
      if (empTimesheets.length > 0) {
        empTimesheets.forEach(ts => {
          console.log(`     • Week ${ts.weekStart} to ${ts.weekEnd} - ${ts.totalHours}h - ${ts.status}`);
        });
      }
      console.log('');
    });

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will DELETE all timesheets for these employees!\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete timesheets
    console.log('🗑️  Step 3: Deleting timesheets...\n');
    
    const deletedCount = await models.Timesheet.destroy({
      where: {
        employeeId: { [Op.in]: employeeIds }
      }
    });

    console.log(`✅ Deleted ${deletedCount} timesheets\n`);

    // Verify deletion
    console.log('🔍 Step 4: Verifying deletion...\n');
    const remainingTimesheets = await models.Timesheet.count({
      where: {
        employeeId: { [Op.in]: employeeIds },
        status: { [Op.ne]: 'deleted' }
      }
    });

    if (remainingTimesheets === 0) {
      console.log('✅ All dummy timesheets have been successfully deleted!\n');
    } else {
      console.log(`⚠️  Warning: ${remainingTimesheets} timesheets still remain\n`);
    }

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   CLEANUP COMPLETED                                ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
deleteDummyTimesheets();
