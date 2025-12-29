/**
 * Check recent notifications in database
 */

const { sequelize, models } = require('./models');

async function checkNotifications() {
  try {
    console.log('🔍 Checking recent notifications...\n');

    // Get all notifications from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = await models.Notification.findAll({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: today
        }
      },
      include: [{
        model: models.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      }],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    console.log(`📊 Found ${notifications.length} notifications created today\n`);

    if (notifications.length === 0) {
      console.log('❌ No notifications found today!');
      console.log('💡 This means notifications are NOT being created\n');
    } else {
      notifications.forEach((notif, index) => {
        console.log(`\n📬 Notification ${index + 1}:`);
        console.log(`   ID: ${notif.id}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Message: ${notif.message.substring(0, 100)}...`);
        console.log(`   User: ${notif.user?.firstName} ${notif.user?.lastName} (${notif.user?.email})`);
        console.log(`   Role: ${notif.user?.role}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Priority: ${notif.priority}`);
        console.log(`   Read: ${notif.readAt ? 'Yes' : 'No'}`);
        console.log(`   Created: ${notif.createdAt}`);
      });
    }

    // Check for Pushban specifically
    console.log('\n\n🔍 Checking notifications for Pushban...\n');
    
    const pushbanUser = await models.User.findOne({
      where: {
        email: {
          [sequelize.Sequelize.Op.like]: '%pushban%'
        }
      }
    });

    if (pushbanUser) {
      console.log('✅ Found Pushban:', {
        id: pushbanUser.id,
        email: pushbanUser.email,
        role: pushbanUser.role,
        tenantId: pushbanUser.tenantId
      });

      const pushbanNotifs = await models.Notification.findAll({
        where: {
          userId: pushbanUser.id,
          createdAt: {
            [sequelize.Sequelize.Op.gte]: today
          }
        },
        order: [['createdAt', 'DESC']]
      });

      console.log(`\n📬 Pushban has ${pushbanNotifs.length} notifications today`);
      
      if (pushbanNotifs.length === 0) {
        console.log('❌ NO notifications for Pushban today!');
      } else {
        pushbanNotifs.forEach((notif, index) => {
          console.log(`\n   ${index + 1}. ${notif.title}`);
          console.log(`      ${notif.message.substring(0, 80)}...`);
          console.log(`      Created: ${notif.createdAt}`);
        });
      }
    } else {
      console.log('❌ Pushban user not found in database');
    }

    // Check for pending users
    console.log('\n\n🔍 Checking for pending OAuth users...\n');
    
    const pendingUsers = await models.User.findAll({
      where: {
        approval_status: 'pending'
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    console.log(`📊 Found ${pendingUsers.length} pending users\n`);
    
    pendingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Created: ${user.createdAt}`);
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

checkNotifications();
