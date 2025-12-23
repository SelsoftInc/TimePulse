/**
 * Test script to simulate approval notification creation
 * This simulates what happens when an employee submits a timesheet or leave request
 */

const { models } = require('./models');
const NotificationService = require('./services/NotificationService');
const { Op } = require('sequelize');

async function testApprovalNotification() {
  try {
    console.log('🧪 Testing approval notification flow...\n');

    // Get tenant
    const tenant = await models.Tenant.findOne();
    if (!tenant) {
      console.error('❌ No tenant found');
      return;
    }

    console.log('✅ Found tenant:', tenant.subdomain);

    // Get an employee user
    const employee = await models.User.findOne({
      where: { role: 'employee', tenantId: tenant.id }
    });

    if (!employee) {
      console.error('❌ No employee user found');
      return;
    }

    console.log('✅ Found employee:', employee.email);

    // Get admin/manager users
    const approvers = await models.User.findAll({
      where: {
        tenantId: tenant.id,
        role: { [Op.in]: ['admin', 'manager', 'approver'] }
      }
    });

    console.log(`✅ Found ${approvers.length} approvers:`, approvers.map(a => ({ email: a.email, role: a.role })));

    // Test 1: Create timesheet approval notification
    console.log('\n📋 Test 1: Creating timesheet approval notification...');
    const timesheetNotifications = await NotificationService.createApprovalNotification(
      tenant.id,
      'timesheet',
      {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        weekStartDate: '2025-12-16',
        weekEndDate: '2025-12-22'
      }
    );

    console.log(`✅ Created ${timesheetNotifications.length} timesheet approval notifications`);

    // Test 2: Create leave approval notification
    console.log('\n📋 Test 2: Creating leave approval notification...');
    const leaveNotifications = await NotificationService.createApprovalNotification(
      tenant.id,
      'leave',
      {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        startDate: '2025-12-25',
        endDate: '2025-12-27',
        leaveType: 'vacation',
        totalDays: 3
      }
    );

    console.log(`✅ Created ${leaveNotifications.length} leave approval notifications`);

    // Check unread count for each approver
    console.log('\n🔢 Checking unread counts for approvers:');
    for (const approver of approvers) {
      const count = await models.Notification.getUnreadCount(approver.id, tenant.id);
      console.log(`  📬 ${approver.email} (${approver.role}): ${count} unread notifications`);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Login as an approver (admin/manager)');
    console.log('2. Check the notification bell - should show badge count');
    console.log('3. Click bell to see notifications');
    console.log('4. Navigate to approval pages');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testApprovalNotification();
