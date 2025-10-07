/**
 * Check Timesheets in Database
 */

const { models, connectDB } = require('../models');

async function checkTimesheets() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all timesheets
    const timesheets = await models.Timesheet.findAll({
      include: [
        { 
          model: models.Employee, 
          as: 'employee', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'department'] 
        },
        { 
          model: models.Client, 
          as: 'client', 
          attributes: ['id', 'clientName', 'clientType'],
          required: false
        },
        { 
          model: models.User, 
          as: 'reviewer', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'], 
          required: false 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`📊 Total Timesheets: ${timesheets.length}\n`);

    if (timesheets.length === 0) {
      console.log('⚠️  No timesheets found in database');
      process.exit(0);
    }

    // Group by status
    const byStatus = {
      draft: timesheets.filter(t => t.status === 'draft'),
      submitted: timesheets.filter(t => t.status === 'submitted'),
      approved: timesheets.filter(t => t.status === 'approved'),
      rejected: timesheets.filter(t => t.status === 'rejected')
    };

    console.log('📈 Timesheets by Status:');
    console.log(`  - Draft: ${byStatus.draft.length}`);
    console.log(`  - Submitted: ${byStatus.submitted.length}`);
    console.log(`  - Approved: ${byStatus.approved.length}`);
    console.log(`  - Rejected: ${byStatus.rejected.length}\n`);

    // Show submitted timesheets (pending approval)
    if (byStatus.submitted.length > 0) {
      console.log('🔍 Submitted Timesheets (Pending Approval):');
      byStatus.submitted.forEach((ts, index) => {
        console.log(`\n  ${index + 1}. ID: ${ts.id}`);
        console.log(`     Employee: ${ts.employee?.firstName} ${ts.employee?.lastName}`);
        console.log(`     Email: ${ts.employee?.email}`);
        console.log(`     Department: ${ts.employee?.department || 'N/A'}`);
        console.log(`     Client: ${ts.client?.clientName || 'No client'}`);
        console.log(`     Week: ${ts.weekStart} to ${ts.weekEnd}`);
        console.log(`     Total Hours: ${ts.totalHours}`);
        console.log(`     Status: ${ts.status}`);
        console.log(`     Submitted At: ${ts.submittedAt || 'N/A'}`);
        console.log(`     Reviewer: ${ts.reviewer ? `${ts.reviewer.firstName} ${ts.reviewer.lastName}` : 'Not assigned'}`);
        console.log(`     Tenant ID: ${ts.tenantId}`);
      });
    } else {
      console.log('ℹ️  No submitted timesheets found (status = "submitted")');
    }

    // Show all timesheets summary
    console.log('\n\n📋 All Timesheets Summary:');
    timesheets.forEach((ts, index) => {
      console.log(`  ${index + 1}. ${ts.employee?.firstName} ${ts.employee?.lastName} - ${ts.status} - Week: ${ts.weekStart} - Hours: ${ts.totalHours}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTimesheets();
