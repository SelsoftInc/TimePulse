/**
 * Test if notification creation is working during OAuth registration
 */

const { sequelize, models } = require('./models');

async function testNotificationCreation() {
  try {
    console.log('🧪 Testing notification creation for OAuth registration...\n');

    // Find Pushban (admin user)
    const pushbanUser = await models.User.findOne({
      where: {
        email: 'pushban@selsoftinc.com'
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

    // Find the pending user (suresh s)
    const pendingUser = await models.User.findOne({
      where: {
        email: 's29903103@gmail.com',
        approval_status: 'pending'
      }
    });

    if (!pendingUser) {
      console.error('❌ Pending user (suresh s) not found');
      process.exit(1);
    }

    console.log('✅ Found pending user:', {
      id: pendingUser.id,
      email: pendingUser.email,
      name: `${pendingUser.firstName} ${pendingUser.lastName}`,
      status: pendingUser.approvalStatus
    });

    // Check if notification already exists
    const existingNotif = await models.Notification.findOne({
      where: {
        user_id: pushbanUser.id,
        metadata: {
          pendingUserEmail: 's29903103@gmail.com'
        }
      }
    });

    if (existingNotif) {
      console.log('\n⚠️ Notification already exists for this registration!');
      console.log('Notification ID:', existingNotif.id);
      console.log('Created at:', existingNotif.created_at);
      console.log('Read at:', existingNotif.readAt || 'Not read');
      console.log('\n💡 This means notifications ARE being created, but may not be showing in UI');
    } else {
      console.log('\n❌ NO notification found for this registration!');
      console.log('💡 This confirms notifications are NOT being created during OAuth registration');
      
      // Create a test notification manually
      console.log('\n📝 Creating test notification manually...');
      
      const notification = await models.Notification.create({
        tenantId: pushbanUser.tenantId,
        userId: pushbanUser.id,
        title: 'New User Registration Pending Approval',
        message: `${pendingUser.firstName} ${pendingUser.lastName} (${pendingUser.email}) has registered via Google OAuth and is awaiting approval.`,
        type: 'warning',
        category: 'approval',
        priority: 'high',
        actionUrl: '/user-approvals',
        metadata: {
          pendingUserId: pendingUser.id,
          pendingUserEmail: pendingUser.email,
          pendingUserName: `${pendingUser.firstName} ${pendingUser.lastName}`,
          pendingUserRole: pendingUser.role,
          registrationDate: pendingUser.created_at
        }
      });

      console.log('✅ Test notification created successfully!');
      console.log('Notification ID:', notification.id);
    }

    // Check unread count
    console.log('\n🔢 Checking unread count for Pushban...');
    const unreadCount = await models.Notification.getUnreadCount(
      pushbanUser.id,
      pushbanUser.tenantId
    );
    console.log(`📬 Unread notifications: ${unreadCount}`);

    // List all notifications for Pushban
    console.log('\n📋 All notifications for Pushban:');
    const allNotifs = await models.Notification.findAll({
      where: {
        user_id: pushbanUser.id
      },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    allNotifs.forEach((notif, index) => {
      console.log(`\n${index + 1}. ${notif.title}`);
      console.log(`   Message: ${notif.message.substring(0, 80)}...`);
      console.log(`   Type: ${notif.type} | Priority: ${notif.priority}`);
      console.log(`   Read: ${notif.readAt ? 'Yes' : 'No'}`);
      console.log(`   Created: ${notif.created_at}`);
    });

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

testNotificationCreation();
