/**
 * Add an admin user to Shunmugavel's tenant so notifications can be received
 */

const { models } = require('./models');
const bcrypt = require('bcryptjs');

async function addAdminToTenant() {
  try {
    console.log('🔧 Adding admin user to Shunmugavel tenant...\n');

    // Get Shunmugavel's tenant
    const tenant = await models.Tenant.findOne({
      where: { subdomain: 'shunmugavel' }
    });

    if (!tenant) {
      console.error('❌ Shunmugavel tenant not found');
      return;
    }

    console.log('✅ Found tenant:', tenant.tenantName);
    console.log('   ID:', tenant.id);

    // Check if admin already exists
    const existingAdmin = await models.User.findOne({
      where: {
        email: 'admin@shunmugavel.com',
        tenantId: tenant.id
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const adminUser = await models.User.create({
      tenantId: tenant.id,
      email: 'admin@shunmugavel.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'admin',
      status: 'active',
      emailVerified: true,
      approvalStatus: 'approved',
      mustChangePassword: false
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', adminUser.email);
    console.log('   Password: Admin@123');
    console.log('   Role:', adminUser.role);
    console.log('   Tenant:', tenant.subdomain);

    console.log('\n💡 Now you can:');
    console.log('1. Login as employee (shunmugavel@selsoftinc.com)');
    console.log('2. Submit a timesheet or leave request');
    console.log('3. Logout and login as admin (admin@shunmugavel.com / Admin@123)');
    console.log('4. Check the notification bell - you should see the notification!');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

addAdminToTenant();
