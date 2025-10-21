/**
 * Display all timesheet data from database
 */

const { models, connectDB } = require('../models');

async function displayTimesheets() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all tenants
    const tenants = await models.Tenant.findAll();
    console.log(`📊 Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🏢 TENANT: ${tenant.tenantName} (${tenant.subdomain})`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`${'='.repeat(80)}\n`);

      // Get all timesheets for this tenant
      const timesheets = await models.Timesheet.findAll({
        where: { tenantId: tenant.id },
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
        order: [['created_at', 'DESC']]
      });

      console.log(`   Total Timesheets: ${timesheets.length}\n`);

      if (timesheets.length === 0) {
        console.log('   ⚠️  No timesheets found for this tenant\n');
        
        // Check if there are employees
        const employees = await models.Employee.findAll({
          where: { tenantId: tenant.id },
          limit: 5
        });
        
        if (employees.length > 0) {
          console.log(`   ℹ️  Found ${employees.length} employee(s) in this tenant:`);
          employees.forEach((emp, i) => {
            console.log(`      ${i + 1}. ${emp.firstName} ${emp.lastName} (${emp.email})`);
          });
          console.log('\n   💡 You can create timesheets for these employees\n');
        } else {
          console.log('   ⚠️  No employees found in this tenant\n');
        }
        continue;
      }

      // Group by status
      const byStatus = {
        draft: timesheets.filter(t => t.status === 'draft'),
        submitted: timesheets.filter(t => t.status === 'submitted'),
        approved: timesheets.filter(t => t.status === 'approved'),
        rejected: timesheets.filter(t => t.status === 'rejected')
      };

      console.log('   📈 Timesheets by Status:');
      console.log(`      - Draft: ${byStatus.draft.length}`);
      console.log(`      - Submitted (Pending Approval): ${byStatus.submitted.length}`);
      console.log(`      - Approved: ${byStatus.approved.length}`);
      console.log(`      - Rejected: ${byStatus.rejected.length}\n`);

      // Show submitted timesheets (these should appear in Timesheet Approval page)
      if (byStatus.submitted.length > 0) {
        console.log('   🔍 SUBMITTED TIMESHEETS (Should appear in Approval page):\n');
        byStatus.submitted.forEach((ts, index) => {
          console.log(`      ${index + 1}. ID: ${ts.id}`);
          console.log(`         Employee: ${ts.employee?.firstName} ${ts.employee?.lastName} (${ts.employee?.email})`);
          console.log(`         Department: ${ts.employee?.department || 'N/A'}`);
          console.log(`         Client: ${ts.client?.clientName || 'No client'}`);
          console.log(`         Week: ${ts.weekStart} to ${ts.weekEnd}`);
          console.log(`         Total Hours: ${ts.totalHours}`);
          console.log(`         Status: ${ts.status}`);
          console.log(`         Submitted At: ${ts.submittedAt || 'N/A'}`);
          console.log(`         Reviewer: ${ts.reviewer ? `${ts.reviewer.firstName} ${ts.reviewer.lastName}` : 'Not assigned'}`);
          console.log(`         Notes: ${ts.notes || 'None'}`);
          console.log('');
        });
      } else {
        console.log('   ℹ️  No submitted timesheets (status = "submitted")\n');
        console.log('   💡 Timesheets must have status="submitted" to appear in Approval page\n');
      }

      // Show all timesheets summary
      if (timesheets.length > 0) {
        console.log('   📋 All Timesheets Summary:\n');
        timesheets.forEach((ts, index) => {
          const empName = ts.employee ? `${ts.employee.firstName} ${ts.employee.lastName}` : 'Unknown';
          console.log(`      ${index + 1}. ${empName} - ${ts.status.toUpperCase()} - Week: ${ts.weekStart} - Hours: ${ts.totalHours}`);
        });
        console.log('');
      }

      // Show API endpoint info
      console.log('   📡 API Endpoint for this tenant:');
      console.log(`      GET /api/timesheets/pending-approval?tenantId=${tenant.id}\n`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ SUMMARY');
    console.log(`${'='.repeat(80)}`);
    
    const allTimesheets = await models.Timesheet.findAll();
    const submittedCount = allTimesheets.filter(t => t.status === 'submitted').length;
    
    console.log(`Total Timesheets in Database: ${allTimesheets.length}`);
    console.log(`Submitted (Pending Approval): ${submittedCount}`);
    
    if (submittedCount === 0) {
      console.log('\n⚠️  WARNING: No timesheets with status="submitted" found!');
      console.log('💡 The Timesheet Approval page only shows timesheets with status="submitted"');
      console.log('💡 You need to create or update timesheets to have status="submitted"\n');
    } else {
      console.log(`\n✅ Found ${submittedCount} submitted timesheet(s) that should appear in the UI\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

displayTimesheets();
