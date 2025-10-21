/**
 * Check submitted timesheets in database
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    const tenantId = '5eda5596-b1d9-4963-953d-7af9d0511ce8';

    console.log('═══════════════════════════════════════════════════════');
    console.log('CHECKING SUBMITTED TIMESHEETS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Get all timesheets
    const allTimesheets = await models.Timesheet.findAll({
      where: { tenantId },
      include: [
        { 
          model: models.Employee, 
          as: 'employee', 
          attributes: ['firstName', 'lastName', 'email'] 
        },
        { 
          model: models.User, 
          as: 'reviewer', 
          attributes: ['firstName', 'lastName', 'email'], 
          required: false 
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`📊 Total timesheets: ${allTimesheets.length}\n`);

    // Group by status
    const byStatus = {};
    allTimesheets.forEach(ts => {
      const status = ts.status || 'unknown';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(ts);
    });

    console.log('Timesheets by status:');
    Object.keys(byStatus).forEach(status => {
      console.log(`  ${status}: ${byStatus[status].length}`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SUBMITTED TIMESHEETS DETAILS');
    console.log('═══════════════════════════════════════════════════════\n');

    const submitted = allTimesheets.filter(ts => ts.status === 'submitted');
    
    if (submitted.length === 0) {
      console.log('❌ NO SUBMITTED TIMESHEETS FOUND!');
      console.log('\nThis is why the approval page is empty.');
      console.log('\nAll timesheets:');
      allTimesheets.forEach((ts, i) => {
        console.log(`\n${i + 1}. Timesheet ID: ${ts.id}`);
        console.log(`   Employee: ${ts.employee?.firstName} ${ts.employee?.lastName} (${ts.employee?.email})`);
        console.log(`   Week: ${ts.weekStart} to ${ts.weekEnd}`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Total Hours: ${ts.totalHours}`);
        console.log(`   Reviewer ID: ${ts.reviewerId || 'None'}`);
        console.log(`   Submitted At: ${ts.submittedAt || 'Not submitted'}`);
        console.log(`   Created At: ${ts.createdAt}`);
      });
    } else {
      console.log(`✅ Found ${submitted.length} submitted timesheets:\n`);
      
      submitted.forEach((ts, i) => {
        console.log(`${i + 1}. Timesheet ID: ${ts.id}`);
        console.log(`   Employee: ${ts.employee?.firstName} ${ts.employee?.lastName}`);
        console.log(`   Email: ${ts.employee?.email}`);
        console.log(`   Week: ${ts.weekStart} to ${ts.weekEnd}`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Total Hours: ${ts.totalHours}`);
        console.log(`   Reviewer: ${ts.reviewer ? `${ts.reviewer.firstName} ${ts.reviewer.lastName} (${ts.reviewer.email})` : 'None assigned'}`);
        console.log(`   Reviewer ID: ${ts.reviewerId}`);
        console.log(`   Submitted At: ${ts.submittedAt}`);
        console.log(`   Notes: ${ts.notes || 'None'}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('WHAT THE API WOULD RETURN');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Query: GET /api/timesheets/pending-approval?tenantId=...');
    console.log(`Filter: status = 'submitted'\n`);
    console.log(`Result: ${submitted.length} timesheets would be returned\n`);

    if (submitted.length > 0) {
      console.log('These timesheets should appear in admin approval page.');
    } else {
      console.log('⚠️  No timesheets with status="submitted" found!');
      console.log('Check if timesheets were saved with correct status.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
