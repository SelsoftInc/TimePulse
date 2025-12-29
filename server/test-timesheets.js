const { models } = require('./models');

async function checkTimesheets() {
  try {
    console.log('🔍 Checking timesheets in database...\n');
    
    // Get all timesheets
    const timesheets = await models.Timesheet.findAll({
      limit: 20,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'employeeId', 'employeeName', 'status', 'weekStart', 'weekEnd', 'tenantId', 'totalHours']
    });
    
    console.log(`📊 Found ${timesheets.length} timesheets in database\n`);
    
    if (timesheets.length === 0) {
      console.log('❌ No timesheets found in database!');
      console.log('   This is why the UI is empty.\n');
    } else {
      timesheets.forEach((ts, idx) => {
        console.log(`${idx + 1}. Timesheet ID: ${ts.id}`);
        console.log(`   Employee: ${ts.employeeName || 'N/A'} (ID: ${ts.employeeId})`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Week: ${ts.weekStart} to ${ts.weekEnd}`);
        console.log(`   Tenant: ${ts.tenantId}`);
        console.log(`   Hours: ${ts.totalHours || 0}`);
        console.log('');
      });
      
      // Group by status
      const byStatus = {
        draft: timesheets.filter(t => t.status === 'draft').length,
        submitted: timesheets.filter(t => t.status === 'submitted').length,
        approved: timesheets.filter(t => t.status === 'approved').length,
        rejected: timesheets.filter(t => t.status === 'rejected').length
      };
      
      console.log('\n📈 Timesheets by status:');
      console.log(`   Draft: ${byStatus.draft}`);
      console.log(`   Submitted (Pending): ${byStatus.submitted}`);
      console.log(`   Approved: ${byStatus.approved}`);
      console.log(`   Rejected: ${byStatus.rejected}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking timesheets:', error);
    process.exit(1);
  }
}

checkTimesheets();
