/**
 * Script to set a user to pending approval status for testing
 * Run with: node set-user-pending.js <email>
 */

const { models, sequelize } = require('./models');

async function setUserPending() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Please provide an Email');
      console.log('Usage: node set-user-pending.js <email>');
      process.exit(1);
    }

    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    // Find user
    console.log(`🔍 Looking for user: ${email}`);
    const user = await models.User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);
    console.log(`   Current status: ${user.status}`);
    console.log(`   Current approval: ${user.approvalStatus}`);
    console.log(`   Tenant ID: ${user.tenantId}`);

    // Update to pending
    console.log('\n🔄 Setting user to pending approval...');
    await user.update({
      approvalStatus: 'pending',
      status: 'inactive'
    });

    console.log('✅ User updated successfully!');
    console.log(`   New status: inactive`);
    console.log(`   New approval: pending`);

    // Create notification for admin
    console.log('\n🔔 Creating notification for admin...');
    const admins = await models.User.findAll({
      where: {
        tenantId: user.tenantId,
        role: 'admin'
      }
    });

    for (const admin of admins) {
      await models.Notification.create({
        tenantId: user.tenantId,
        userId: admin.id,
        title: 'New User Registration Pending Approval',
        message: `${user.firstName} ${user.lastName} (${user.email}) has registered and is awaiting approval.`,
        type: 'warning',
        category: 'approval',
        priority: 'high',
        actionUrl: '/user-approvals',
        metadata: {
          userId: user.id,
          pendingUserId: user.id,
          pendingUserEmail: user.email,
          pendingUserName: `${user.firstName} ${user.lastName}`,
          pendingUserRole: user.role,
          registrationDate: new Date()
        }
      });
      console.log(`   ✅ Notification created for: ${admin.email}`);
    }

    console.log('\n✅ All done!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart the server');
    console.log('   2. Login as admin');
    console.log('   3. Go to notifications page');
    console.log('   4. Click "View" button');
    console.log('   5. Approve or reject the user');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

setUserPending();
