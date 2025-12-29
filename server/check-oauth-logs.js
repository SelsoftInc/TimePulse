/**
 * Check if OAuth registration is happening and if notifications are being created
 */

const { sequelize, models } = require('./models');

async function checkOAuthLogs() {
  try {
    console.log('🔍 Checking OAuth registration data...\n');

    // Check for recent pending users
    const pendingUsers = await models.User.findAll({
      where: {
        approval_status: 'pending'
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'googleId', 'tenantId', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    console.log(`📊 Found ${pendingUsers.length} pending users:\n`);
    
    if (pendingUsers.length === 0) {
      console.log('❌ No pending users found!');
      console.log('💡 This means OAuth registration is not creating users\n');
    } else {
      for (const user of pendingUsers) {
        console.log(`👤 ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Tenant: ${user.tenantId}`);
        console.log(`   Created: ${user.created_at}`);
        
        // Check if employee record exists
        const employee = await models.Employee.findOne({
          where: { userId: user.id }
        });
        
        if (employee) {
          console.log(`   ✅ Employee record exists (ID: ${employee.id})`);
          console.log(`   Approver ID: ${employee.approverId || 'None'}`);
        } else {
          console.log(`   ❌ No employee record found`);
        }
        
        // Check for notifications for this user registration
        const notifications = await models.Notification.findAll({
          where: {
            metadata: {
              pendingUserEmail: user.email
            }
          }
        });
        
        console.log(`   📬 Notifications created: ${notifications.length}`);
        if (notifications.length === 0) {
          console.log(`   ❌ NO NOTIFICATIONS CREATED FOR THIS USER!`);
        }
        console.log('');
      }
    }

    // Check admin users who should receive notifications
    console.log('\n🔍 Checking admin users...\n');
    
    const adminUsers = await models.User.findAll({
      where: {
        role: 'admin',
        status: 'active'
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'tenantId']
    });

    console.log(`📊 Found ${adminUsers.length} active admin users:\n`);
    
    adminUsers.forEach(admin => {
      console.log(`👤 ${admin.firstName} ${admin.lastName} (${admin.email})`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Tenant: ${admin.tenantId}`);
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

checkOAuthLogs();
