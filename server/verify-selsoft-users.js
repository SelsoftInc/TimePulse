/**
 * Verify all users in selsoft tenant and test notification flow
 */

const { models } = require('./models');
const NotificationService = require('./services/NotificationService');
const { Op } = require('sequelize');

async function verifyAndTest() {
  try {
    console.log('🔍 VERIFYING SELSOFT TENANT USERS\n');
    console.log('='.repeat(60));

    // Get selsoft tenant
    const selsoftTenant = await models.Tenant.findOne({
      where: { subdomain: 'selsoft' }
    });

    if (!selsoftTenant) {
      console.error('❌ Selsoft tenant not found!');
      return;
    }

    console.log('✅ Found Selsoft Tenant');
    console.log('   Name:', selsoftTenant.tenantName);
    console.log('   ID:', selsoftTenant.id);
    console.log('   Subdomain:', selsoftTenant.subdomain);

    // Get all users in selsoft tenant
    console.log('\n📋 USERS IN SELSOFT TENANT:');
    console.log('-'.repeat(60));

    const allUsers = await models.User.findAll({
      where: { tenantId: selsoftTenant.id },
      order: [['role', 'ASC'], ['email', 'ASC']]
    });

    console.log(`\nTotal Users: ${allUsers.length}\n`);

    // Group by role
    const admins = allUsers.filter(u => u.role === 'admin');
    const managers = allUsers.filter(u => u.role === 'manager');
    const approvers = allUsers.filter(u => u.role === 'approver');
    const employees = allUsers.filter(u => u.role === 'employee');

    console.log('👑 ADMINS:', admins.length);
    admins.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
    });

    console.log('\n👔 MANAGERS:', managers.length);
    if (managers.length > 0) {
      managers.forEach(u => {
        console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
      });
    } else {
      console.log('   (none)');
    }

    console.log('\n✅ APPROVERS:', approvers.length);
    approvers.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
    });

    console.log('\n👥 EMPLOYEES:', employees.length);
    employees.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
    });

    // Test notification creation
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING NOTIFICATION CREATION');
    console.log('='.repeat(60));

    // Pick an employee
    const testEmployee = employees[0];
    if (!testEmployee) {
      console.error('❌ No employees found for testing');
      return;
    }

    console.log('\n📋 Test Scenario:');
    console.log(`   Employee: ${testEmployee.email} submits a timesheet`);
    console.log(`   Expected: All admins/managers/approvers receive notification`);

    // Create test timesheet approval notification
    console.log('\n🔔 Creating timesheet approval notification...');
    const notifications = await NotificationService.createApprovalNotification(
      selsoftTenant.id,
      'timesheet',
      {
        employeeName: `${testEmployee.firstName} ${testEmployee.lastName}`,
        weekStartDate: '2025-12-16',
        weekEndDate: '2025-12-22'
      }
    );

    console.log(`✅ Created ${notifications.length} notifications`);

    // Check unread count for each approver
    console.log('\n📊 UNREAD COUNTS FOR APPROVERS:');
    console.log('-'.repeat(60));

    const approverUsers = [...admins, ...managers, ...approvers];
    
    for (const user of approverUsers) {
      const count = await models.Notification.getUnreadCount(
        user.id,
        selsoftTenant.id
      );
      console.log(`   ${user.email}: ${count} unread notifications`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📝 SUMMARY:');
    console.log(`   - Tenant: ${selsoftTenant.subdomain}`);
    console.log(`   - Total Users: ${allUsers.length}`);
    console.log(`   - Admins: ${admins.length}`);
    console.log(`   - Managers: ${managers.length}`);
    console.log(`   - Approvers: ${approvers.length}`);
    console.log(`   - Employees: ${employees.length}`);
    console.log(`   - Test Notifications Created: ${notifications.length}`);

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Restart both frontend and backend servers');
    console.log('2. Login as employee:', testEmployee.email);
    console.log('3. Submit a timesheet or leave request');
    console.log('4. Logout and login as admin:', admins[0]?.email || 'pushban@selsoftinc.com');
    console.log('5. Check notification bell - should show badge count');
    console.log('6. Open browser console to see logs');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

verifyAndTest();
