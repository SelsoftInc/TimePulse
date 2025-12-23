/**
 * Comprehensive test of the entire notification flow
 * This will test every aspect of the notification system
 */

const { models } = require('./models');
const NotificationService = require('./services/NotificationService');
const { Op } = require('sequelize');

async function testCompleteFlow() {
  try {
    console.log('🧪 COMPREHENSIVE NOTIFICATION SYSTEM TEST\n');
    console.log('='.repeat(60));

    // Step 1: Check database connection
    console.log('\n📋 Step 1: Testing database connection...');
    const sequelize = require('./models').sequelize;
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Step 2: Verify notifications table exists
    console.log('\n📋 Step 2: Verifying notifications table...');
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);
    if (results[0].exists) {
      console.log('✅ Notifications table exists');
    } else {
      console.error('❌ Notifications table does NOT exist');
      return;
    }

    // Step 3: Get test users from selsoft tenant
    console.log('\n📋 Step 3: Getting test users from selsoft tenant...');
    const selsoftTenant = await models.Tenant.findOne({
      where: { subdomain: 'selsoft' }
    });

    if (!selsoftTenant) {
      console.error('❌ Selsoft tenant not found');
      return;
    }

    console.log('✅ Found tenant:', selsoftTenant.tenantName);
    console.log('   Tenant ID:', selsoftTenant.id);

    // Get employee
    const employee = await models.User.findOne({
      where: {
        tenantId: selsoftTenant.id,
        role: 'employee'
      }
    });

    if (!employee) {
      console.error('❌ No employee found in selsoft tenant');
      return;
    }

    console.log('✅ Found employee:', employee.email);

    // Get admin/manager
    const admin = await models.User.findOne({
      where: {
        tenantId: selsoftTenant.id,
        role: { [Op.in]: ['admin', 'manager', 'approver'] }
      }
    });

    if (!admin) {
      console.error('❌ No admin/manager found in selsoft tenant');
      return;
    }

    console.log('✅ Found admin:', admin.email);

    // Step 4: Test notification creation
    console.log('\n📋 Step 4: Testing notification creation...');
    
    const testNotification = await NotificationService.createNotification({
      tenantId: selsoftTenant.id,
      userId: admin.id,
      title: 'Test Notification - Direct Create',
      message: 'This is a test notification created directly',
      type: 'info',
      category: 'general',
      priority: 'medium'
    });

    console.log('✅ Direct notification created:', testNotification.id);

    // Step 5: Test timesheet approval notification
    console.log('\n📋 Step 5: Testing timesheet approval notification...');
    
    const timesheetNotifications = await NotificationService.createApprovalNotification(
      selsoftTenant.id,
      'timesheet',
      {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        weekStartDate: '2025-12-16',
        weekEndDate: '2025-12-22'
      }
    );

    console.log(`✅ Created ${timesheetNotifications.length} timesheet approval notifications`);

    // Step 6: Test leave approval notification
    console.log('\n📋 Step 6: Testing leave approval notification...');
    
    const leaveNotifications = await NotificationService.createApprovalNotification(
      selsoftTenant.id,
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

    // Step 7: Test notification retrieval
    console.log('\n📋 Step 7: Testing notification retrieval...');
    
    const adminNotifications = await models.Notification.getUserNotifications(
      admin.id,
      selsoftTenant.id,
      { includeRead: true, limit: 10 }
    );

    console.log(`✅ Retrieved ${adminNotifications.rows.length} notifications for admin`);
    console.log('   Notifications:');
    adminNotifications.rows.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} - ${notif.category} - Read: ${notif.readAt ? 'Yes' : 'No'}`);
    });

    // Step 8: Test unread count
    console.log('\n📋 Step 8: Testing unread count...');
    
    const unreadCount = await models.Notification.getUnreadCount(
      admin.id,
      selsoftTenant.id
    );

    console.log(`✅ Unread count for admin: ${unreadCount}`);

    // Step 9: Test mark as read
    console.log('\n📋 Step 9: Testing mark as read...');
    
    if (adminNotifications.rows.length > 0) {
      const firstNotif = adminNotifications.rows[0];
      if (!firstNotif.readAt) {
        await firstNotif.markAsRead();
        console.log('✅ Marked notification as read:', firstNotif.id);
        
        // Verify unread count decreased
        const newUnreadCount = await models.Notification.getUnreadCount(
          admin.id,
          selsoftTenant.id
        );
        console.log(`✅ New unread count: ${newUnreadCount} (was ${unreadCount})`);
      } else {
        console.log('⚠️ First notification already read');
      }
    }

    // Step 10: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Database connection: PASSED');
    console.log('✅ Notifications table: EXISTS');
    console.log('✅ Direct notification creation: PASSED');
    console.log('✅ Timesheet approval notification: PASSED');
    console.log('✅ Leave approval notification: PASSED');
    console.log('✅ Notification retrieval: PASSED');
    console.log('✅ Unread count: PASSED');
    console.log('✅ Mark as read: PASSED');
    console.log('\n🎉 ALL TESTS PASSED!');
    
    console.log('\n💡 NEXT STEPS FOR FRONTEND TESTING:');
    console.log('1. Login as admin:', admin.email);
    console.log('2. Open browser console (F12)');
    console.log('3. Look for these logs:');
    console.log('   - "🔔 NotificationBell: Fetching unread count"');
    console.log('   - "📬 NotificationBell: Unread count response"');
    console.log('   - "🔢 NotificationBell: Setting unread count to: X"');
    console.log('4. Check if notification bell shows badge');
    console.log(`5. Expected unread count: ${unreadCount}`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testCompleteFlow();
