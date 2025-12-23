/**
 * Test script to create a sample notification
 * This helps verify the notification system is working
 */

const { models } = require('./models');
const NotificationService = require('./services/NotificationService');

async function testNotificationCreation() {
  try {
    console.log('🧪 Starting notification test...\n');

    // Get a test user (admin/manager)
    const testUser = await models.User.findOne({
      where: {
        role: ['admin', 'manager', 'approver']
      }
    });

    if (!testUser) {
      console.error('❌ No admin/manager user found in database');
      console.log('💡 Please create an admin or manager user first');
      return;
    }

    console.log('✅ Found test user:', {
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      tenantId: testUser.tenantId
    });

    // Create a test notification
    console.log('\n📝 Creating test notification...');
    const notification = await NotificationService.createNotification({
      tenantId: testUser.tenantId,
      userId: testUser.id,
      title: 'Test Notification',
      message: 'This is a test notification to verify the notification system is working.',
      type: 'info',
      category: 'general',
      priority: 'medium',
      actionUrl: '/dashboard'
    });

    console.log('✅ Test notification created:', {
      id: notification.id,
      title: notification.title,
      userId: notification.userId,
      tenantId: notification.tenantId
    });

    // Verify notification was created
    console.log('\n🔍 Verifying notification in database...');
    const savedNotification = await models.Notification.findByPk(notification.id);
    
    if (savedNotification) {
      console.log('✅ Notification verified in database');
      console.log('📋 Notification details:', {
        id: savedNotification.id,
        title: savedNotification.title,
        message: savedNotification.message,
        readAt: savedNotification.readAt,
        createdAt: savedNotification.createdAt
      });
    } else {
      console.error('❌ Notification not found in database');
    }

    // Check unread count
    console.log('\n🔢 Checking unread count...');
    const unreadCount = await models.Notification.getUnreadCount(
      testUser.id,
      testUser.tenantId
    );
    console.log(`📬 Unread notifications for user: ${unreadCount}`);

    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Login as this user:', testUser.email);
    console.log('2. Check the notification bell in the header');
    console.log('3. You should see a badge with count:', unreadCount);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the test
testNotificationCreation();
