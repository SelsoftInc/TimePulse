/**
 * Set an existing user to pending status (simpler alternative)
 * This updates the user instead of deleting and recreating
 */

const { models, sequelize } = require('./models');

async function setUserPending() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    // Email to set to pending
    const email = 'testpending@gmail.com';

    console.log(`🔍 Looking for user: ${email}`);
    const user = await models.User.findOne({
      where: { email: email }
    });

    if (!user) {
      console.log('❌ User not found!');
      console.log('\n💡 Tip: Run create-pending-oauth-user.js to create a new test user');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);
    console.log(`   Current status: ${user.status}`);
    console.log(`   Current approval: ${user.approvalStatus}`);
    console.log(`   Tenant ID: ${user.tenantId}`);

    // Update user to pending
    console.log('\n🔄 Setting user to pending approval...');
    await user.update({
      status: 'inactive',
      approvalStatus: 'pending',
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null
    });

    console.log('✅ User updated successfully!');
    console.log(`   New status: ${user.status}`);
    console.log(`   New approval: ${user.approvalStatus}`);

    // Find all admins in the tenant
    console.log('\n🔍 Finding admin users...');
    const admins = await models.User.findAll({
      where: {
        tenantId: user.tenantId,
        role: 'admin'
      }
    });

    console.log(`✅ Found ${admins.length} admin(s)`);

    // Delete old notifications for this user
    await models.Notification.destroy({
      where: {
        category: 'approval',
        metadata: {
          userId: user.id
        }
      }
    });

    // Create fresh notifications for all admins
    console.log('\n🔔 Creating notifications for admins...');
    for (const admin of admins) {
      await models.Notification.create({
        tenantId: user.tenantId,
        userId: admin.id,
        title: 'New User Registration Pending Approval',
        message: `${user.firstName} ${user.lastName} (${user.email}) has registered via Google OAuth and is awaiting approval.`,
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
    console.log('   1. Restart the server (npm start)');
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
