/**
 * Check Chandralekha's Employee Record
 * Debug script to see if chandralekha exists in employees table and what data is there
 */

const { models, connectDB } = require('../models');

async function checkChandralekhaEmployee() {
  try {
    console.log('🔍 Checking for chandralekha employee record...\n');
    
    await connectDB();
    console.log('✅ Database connected\n');

    // Find chandralekha user
    const user = await models.User.findOne({
      where: {
        email: 'chandralekha@selsoftinc.com'
      }
    });

    if (!user) {
      console.log('❌ User not found: chandralekha@selsoftinc.com');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.firstName, user.last_name);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);
    console.log('   Tenant ID:', user.tenantId || user.tenant_id);
    console.log('   Auth Provider:', user.authProvider || user.auth_provider);
    console.log('   Google ID:', user.googleId || user.google_id);
    console.log('\n');

    // Find employee record
    const employee = await models.Employee.findOne({
      where: {
        email: 'chandralekha@selsoftinc.com'
      }
    });

    if (!employee) {
      console.log('❌ Employee record NOT found for chandralekha@selsoftinc.com');
      console.log('\n🔧 Creating employee record...\n');
      
      const newEmployee = await models.Employee.create({
        tenantId: user.tenantId || user.tenant_id,
        userId: user.id,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        email: user.email,
        phone: null,
        department: 'General',
        title: user.role === 'admin' ? 'Administrator' : 'Employee',
        status: 'active',
        startDate: new Date()
      });
      
      console.log('✅ Employee record created:');
      console.log('   ID:', newEmployee.id);
      console.log('   Name:', newEmployee.firstName, newEmployee.lastName);
      console.log('   Email:', newEmployee.email);
      console.log('   Title:', newEmployee.title);
      console.log('   Status:', newEmployee.status);
      console.log('   Tenant ID:', newEmployee.tenantId);
      console.log('   User ID:', newEmployee.userId);
    } else {
      console.log('✅ Employee record found:');
      console.log('   ID:', employee.id);
      console.log('   Name:', employee.firstName, employee.lastName);
      console.log('   Email:', employee.email);
      console.log('   Title:', employee.title);
      console.log('   Department:', employee.department);
      console.log('   Status:', employee.status);
      console.log('   Tenant ID:', employee.tenantId);
      console.log('   User ID:', employee.userId);
      console.log('   Start Date:', employee.startDate);
    }

    console.log('\n');

    // Check all employees for this tenant
    const tenantId = user.tenantId || user.tenant_id;
    const allEmployees = await models.Employee.findAll({
      where: {
        tenantId: tenantId,
        status: 'active'
      }
    });

    console.log(`📊 Total active employees for tenant: ${allEmployees.length}`);
    console.log('\nEmployee List:');
    allEmployees.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.firstName} ${emp.lastName} (${emp.email}) - ${emp.title}`);
    });

    console.log('\n✅ Check completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkChandralekhaEmployee();
