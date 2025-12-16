/**
 * Create a new OAuth user with pending approval status for testing
 * This simulates what happens when a user registers via Google OAuth
 */

const { models, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function createPendingUser() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected!\n');

    // User details for testing
    const testUser = {
      email: 'testpending@gmail.com',
      firstName: 'Test',
      lastName: 'Pending',
      role: 'employee',
      googleId: 'test-google-id-' + Date.now()
    };

    console.log('🔍 Checking if user already exists...');
    const existing = await models.User.findOne({
      where: { email: testUser.email }
    });

    if (existing) {
      console.log('⚠️  User already exists. Deleting old user and related records...');
      
      // Delete employee record first (foreign key constraint)
      const existingEmployee = await models.Employee.findOne({
        where: { userId: existing.id }
      });
      
      if (existingEmployee) {
        await existingEmployee.destroy();
        console.log('   ✅ Deleted employee record');
      }
      
      // Delete notifications for this user
      await models.Notification.destroy({
        where: { 
          metadata: {
            userId: existing.id
          }
        }
      });
      console.log('   ✅ Deleted notifications');
      
      // Now delete the user
      await existing.destroy();
      console.log('✅ Old user deleted');
    }

    // Find a tenant to assign the user to
    console.log('\n🔍 Finding tenant...');
    const tenant = await models.Tenant.findOne({
      where: { subdomain: 'selsoft' }
    });

    if (!tenant) {
      console.error('❌ No tenant found with subdomain "selsoft"');
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.tenantName} (${tenant.id})\n`);

    // Create random password hash (won't be used for OAuth)
    const randomPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // Create user with pending status
    console.log('🔄 Creating new OAuth user with pending status...');
    const user = await models.User.create({
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      first_name: testUser.firstName,
      last_name: testUser.lastName,
      passwordHash: passwordHash,
      role: testUser.role,
      tenant_id: tenant.id,
      tenantId: tenant.id,
      status: 'inactive',
      approvalStatus: 'pending',  // This is the key field
      googleId: testUser.googleId,
      authProvider: 'google',
      emailVerified: true,
      lastLogin: new Date()
    });

    console.log('✅ User created successfully!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Approval: ${user.approvalStatus}`);
    console.log(`   Tenant: ${user.tenantId}`);

    // Create employee record
    console.log('\n🔄 Creating employee record...');
    const employee = await models.Employee.create({
      tenantId: tenant.id,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      phone: null,
      department: 'General',
      title: 'Employee',
      status: 'active',
      startDate: new Date(),
      userId: user.id
    });

    console.log('✅ Employee record created');
    console.log(`   ID: ${employee.id}`);

    // Find all admins in the tenant
    console.log('\n🔍 Finding admin users...');
    const admins = await models.User.findAll({
      where: {
        tenantId: tenant.id,
        role: 'admin'
      }
    });

    console.log(`✅ Found ${admins.length} admin(s)`);

    // Create notifications for all admins
    console.log('\n🔔 Creating notifications for admins...');
    for (const admin of admins) {
      await models.Notification.create({
        tenantId: tenant.id,
        userId: admin.id,
        title: 'New User Registration Pending Approval',
        message: `${testUser.firstName} ${testUser.lastName} (${testUser.email}) has registered via Google OAuth and is awaiting approval.`,
        type: 'warning',
        category: 'approval',
        priority: 'high',
        actionUrl: '/user-approvals',
        metadata: {
          userId: user.id,
          pendingUserId: user.id,
          pendingUserEmail: testUser.email,
          pendingUserName: `${testUser.firstName} ${testUser.lastName}`,
          pendingUserRole: testUser.role,
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
    console.log('   4. You should see notification for testpending@gmail.com');
    console.log('   5. Click "View" button');
    console.log('   6. Modal should open with user details');
    console.log('   7. Approve or reject the user');

    console.log('\n🔍 To verify user was created:');
    console.log('   node check-all-users.js');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createPendingUser();
