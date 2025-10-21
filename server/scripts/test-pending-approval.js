/**
 * Test the pending-approval API endpoint
 */

const { models, connectDB } = require('../models');

async function testPendingApproval() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all tenants
    const tenants = await models.Tenant.findAll();
    console.log(`Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🏢 TENANT: ${tenant.tenantName} (${tenant.subdomain})`);
      console.log(`   Tenant ID: ${tenant.id}`);
      console.log(`${'='.repeat(80)}\n`);

      // Simulate the API call: GET /api/timesheets/pending-approval?tenantId=...
      const whereClause = {
        tenantId: tenant.id,
        status: 'submitted'
      };

      console.log('📡 Simulating API call:');
      console.log(`   GET /api/timesheets/pending-approval?tenantId=${tenant.id}\n`);
      console.log('   Where clause:', whereClause, '\n');

      const timesheets = await models.Timesheet.findAll({
        where: whereClause,
        include: [
          { 
            model: models.Employee, 
            as: 'employee', 
            attributes: ['id', 'firstName', 'lastName', 'email', 'department', 'title'] 
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
        order: [['submitted_at', 'DESC']]
      });

      console.log(`   ✅ Found ${timesheets.length} timesheets with status='submitted'\n`);

      if (timesheets.length === 0) {
        console.log('   ⚠️  NO SUBMITTED TIMESHEETS FOUND!\n');
        
        // Check all timesheets for this tenant
        const allTimesheets = await models.Timesheet.findAll({
          where: { tenantId: tenant.id },
          include: [
            { model: models.Employee, as: 'employee', attributes: ['firstName', 'lastName'] }
          ]
        });

        console.log(`   ℹ️  Total timesheets in database: ${allTimesheets.length}`);
        
        if (allTimesheets.length > 0) {
          console.log('\n   📋 Existing timesheets (by status):');
          const byStatus = {};
          allTimesheets.forEach(ts => {
            if (!byStatus[ts.status]) byStatus[ts.status] = [];
            byStatus[ts.status].push(ts);
          });
          
          Object.keys(byStatus).forEach(status => {
            console.log(`      - ${status}: ${byStatus[status].length}`);
            byStatus[status].forEach((ts, i) => {
              const empName = ts.employee ? `${ts.employee.firstName} ${ts.employee.lastName}` : 'Unknown';
              console.log(`        ${i + 1}. ${empName} - Week: ${ts.weekStart} - Hours: ${ts.totalHours}`);
            });
          });

          console.log('\n   💡 To display in UI, timesheets must have status="submitted"');
          console.log('   💡 You can update a timesheet status using:');
          console.log(`      UPDATE timesheets SET status='submitted', submitted_at=NOW() WHERE id='<timesheet-id>';`);
        }
      } else {
        // Format like the API does
        const formattedTimesheets = timesheets.map(ts => ({
          id: ts.id,
          employeeName: `${ts.employee?.firstName || ''} ${ts.employee?.lastName || ''}`.trim(),
          employeeEmail: ts.employee?.email,
          department: ts.employee?.department,
          weekRange: `${new Date(ts.weekStart).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} To ${new Date(ts.weekEnd).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          weekStart: ts.weekStart,
          weekEnd: ts.weekEnd,
          status: ts.status,
          billableProjectHrs: Number(ts.totalHours).toFixed(2),
          timeOffHolidayHrs: '0.00',
          totalTimeHours: Number(ts.totalHours).toFixed(2),
          attachments: ts.attachments || [],
          notes: ts.notes || '',
          submittedDate: ts.submittedAt ? new Date(ts.submittedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
          clientName: ts.client?.clientName || 'No Client',
          clientType: ts.client?.clientType || 'N/A',
          reviewer: ts.reviewer ? {
            name: `${ts.reviewer.firstName} ${ts.reviewer.lastName}`,
            email: ts.reviewer.email,
            role: ts.reviewer.role
          } : null
        }));

        console.log('   📊 API Response Data:\n');
        formattedTimesheets.forEach((ts, i) => {
          console.log(`   ${i + 1}. ${ts.employeeName}`);
          console.log(`      Week: ${ts.weekRange}`);
          console.log(`      Hours: ${ts.totalTimeHours}`);
          console.log(`      Status: ${ts.status}`);
          console.log(`      Submitted: ${ts.submittedDate}`);
          console.log('');
        });

        console.log('\n   📤 Full API Response (JSON):');
        console.log(JSON.stringify({ success: true, timesheets: formattedTimesheets }, null, 2));
      }

      // Show what users exist for this tenant
      const users = await models.User.findAll({
        where: { tenantId: tenant.id },
        attributes: ['id', 'email', 'role', 'tenantId']
      });

      console.log(`\n   👥 Users in this tenant (${users.length}):`);
      users.forEach((u, i) => {
        console.log(`      ${i + 1}. ${u.email} (${u.role}) - tenantId: ${u.tenantId}`);
      });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ TEST COMPLETE');
    console.log(`${'='.repeat(80)}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPendingApproval();
