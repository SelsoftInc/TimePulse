/**
 * Create a test notification for Pushban to verify notification system works
 */

const { sequelize, models } = require('./models');

async function createTestNotification() {
  try {
    console.log('🧪 Creating test notification for Pushban...\n');

    // Find Pushban user
    const pushbanUser = await models.User.findOne({
      where: {
        email: {
          [sequelize.Sequelize.Op.like]: '%pushban%'
        }
      }
    });

    if (!pushbanUser) {
      console.error('❌ Pushban user not found');
      process.exit(1);
    }

    console.log('✅ Found Pushban:', {
      id: pushbanUser.id,
      email: pushbanUser.email,
      role: pushbanUser.role,
      tenantId: pushbanUser.tenantId
    });

    // Create test notification
    console.log('\n📝 Creating notification...');
    
    const notification = await models.Notification.create({
      tenantId: pushbanUser.tenantId,
      userId: pushbanUser.id,
      title: 'Test: New User Registration Pending Approval',
      message: 'suresh s (s29903103@gmail.com) has registered via Google OAuth and selected Pushban User as their approver. Awaiting approval.',
      type: 'warning',
      category: 'approval',
      priority: 'high',
      actionUrl: '/user-approvals',
      metadata: {
        pendingUserId: 'test-user-id',
        pendingUserEmail: 's29903103@gmail.com',
        pendingUserName: 'suresh s',
        pendingUserRole: 'employee',
        approverId: pushbanUser.id,
        approverName: 'Pushban User',
        registrationDate: new Date()
      }
    });

    console.log('✅ Notification created successfully!');
    console.log('📋 Details:', {
      id: notification.id,
      title: notification.title,
      userId: notification.userId,
      tenantId: notification.tenantId,
      type: notification.type,
      priority: notification.priority
    });

    console.log('\n💡 Now check:');
    console.log('1. Login as Pushban (umapushban@gmail.com)');
    console.log('2. Check the notification bell');
    console.log('3. You should see the test notification');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

createTestNotification();
