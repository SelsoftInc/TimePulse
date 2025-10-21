/**
 * Check Timesheet Data in Database
 */

const { models, connectDB } = require('../models');

async function checkTimesheetData() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all timesheets with employee and client info
    const timesheets = await models.Timesheet.findAll({
      include: [
        { 
          model: models.Employee, 
          as: 'employee', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId'] 
        },
        { 
          model: models.Client, 
          as: 'client', 
          attributes: ['id', 'clientName'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`📊 Found ${timesheets.length} timesheets in database\n`);

    if (timesheets.length === 0) {
      console.log('ℹ️  No timesheet data found. The database is empty.');
      console.log('\n💡 You can create test timesheet data by:');
      console.log('   1. Having employees submit timesheets through the UI');
      console.log('   2. Running a seed script to create sample data\n');
    } else {
      console.log('📋 Timesheet Details:\n');
      timesheets.forEach((ts, idx) => {
        console.log(`${idx + 1}. Timesheet ID: ${ts.id}`);
        console.log(`   Employee: ${ts.employee?.firstName} ${ts.employee?.lastName} (${ts.employee?.email})`);
        console.log(`   Client: ${ts.client?.clientName || 'Not assigned'}`);
        console.log(`   Week: ${ts.weekStart} to ${ts.weekEnd}`);
        console.log(`   Total Hours: ${ts.totalHours}`);
        console.log(`   Status: ${ts.status}`);
        console.log(`   Daily Hours:`, ts.dailyHours);
        if (ts.submittedAt) {
          console.log(`   Submitted At: ${ts.submittedAt}`);
        }
        if (ts.approvedAt) {
          console.log(`   Approved At: ${ts.approvedAt}`);
          if (ts.approvedBy) {
            console.log(`   Approved By: ${ts.approvedBy}`);
          }
        }
        if (ts.rejectionReason) {
          console.log(`   Rejection Reason: ${ts.rejectionReason}`);
        }
        if (ts.notes) {
          console.log(`   Notes: ${ts.notes}`);
        }
        console.log('');
      });

      // Summary by status
      const statusCounts = timesheets.reduce((acc, ts) => {
        acc[ts.status] = (acc[ts.status] || 0) + 1;
        return acc;
      }, {});

      console.log('📈 Summary by Status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTimesheetData();
