/**
 * Check Zelsoft Tenant Employees
 * Lists all users and employees for the zelsoft tenant to identify missing OAuth users
 */

const { models, connectDB } = require('../models');

async function checkZelsoftEmployees() {
  try {
    console.log('🔍 Checking zelsoft tenant employees...\n');
    
    await connectDB();
    console.log('✅ Database connected\n');

    // Find zelsoft tenant
    const tenant = await models.Tenant.findOne({
      where: {
        subdomain: 'zelsoft'
      }
    });

    if (!tenant) {
      console.log('❌ Zelsoft tenant not found');
      process.exit(1);
    }

    console.log('✅ Tenant found:');
    console.log('   ID:', tenant.id);
    console.log('   Name:', tenant.tenantName || tenant.tenant_name);
    console.log('   Subdomain:', tenant.subdomain);
    console.log('\n');

    // Find all users for this tenant
    const users = await models.User.findAll({
      where: {
        tenantId: tenant.id
      },
      include: [{
        model: models.Employee,
        as: 'employee',
        required: false
      }]
    });

    console.log(`📊 Total users in zelsoft tenant: ${users.length}\n`);

    console.log('👥 User List:');
    console.log('═'.repeat(100));
    users.forEach((user, index) => {
      const hasEmployee = user.employee ? '✅' : '❌';
      const authProvider = user.authProvider || user.auth_provider || 'local';
      const googleId = user.googleId || user.google_id;
      
      console.log(`${index + 1}. ${hasEmployee} ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Role: ${user.role} | Status: ${user.status} | Auth: ${authProvider}${googleId ? ' (OAuth)' : ''}`);
      
      if (user.employee) {
        console.log(`   Employee: ${user.employee.firstName} ${user.employee.lastName} - ${user.employee.title}`);
      } else {
        console.log(`   ⚠️  NO EMPLOYEE RECORD`);
      }
      console.log('');
    });

    // Find all employees for this tenant
    const employees = await models.Employee.findAll({
      where: {
        tenantId: tenant.id
      }
    });

    console.log(`\n📊 Total employees in zelsoft tenant: ${employees.length}\n`);

    console.log('👔 Employee List:');
    console.log('═'.repeat(100));
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.firstName} ${emp.lastName} (${emp.email})`);
      console.log(`   Title: ${emp.title} | Department: ${emp.department} | Status: ${emp.status}`);
      console.log(`   User ID: ${emp.userId || 'NOT LINKED'}`);
      console.log('');
    });

    // Find users without employee records
    const usersWithoutEmployees = users.filter(u => !u.employee);
    
    if (usersWithoutEmployees.length > 0) {
      console.log(`\n⚠️  Found ${usersWithoutEmployees.length} users WITHOUT employee records:\n`);
      usersWithoutEmployees.forEach((user, index) => {
        const authProvider = user.authProvider || user.auth_provider || 'local';
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${authProvider}`);
      });
      
      console.log('\n🔧 Creating employee records for these users...\n');
      
      for (const user of usersWithoutEmployees) {
        try {
          let title = 'Employee';
          if (user.role === 'admin') title = 'Administrator';
          else if (user.role === 'approver') title = 'Manager';
          else if (user.role === 'accountant') title = 'Accountant';
          else if (user.role === 'hr') title = 'HR Manager';
          
          const employee = await models.Employee.create({
            tenantId: tenant.id,
            userId: user.id,
            firstName: user.firstName || user.first_name,
            lastName: user.lastName || user.last_name,
            email: user.email,
            phone: null,
            department: 'General',
            title: title,
            status: 'active',
            startDate: new Date()
          });
          
          console.log(`✅ Created employee: ${employee.firstName} ${employee.lastName} - ${employee.title}`);
        } catch (error) {
          console.error(`❌ Error creating employee for ${user.email}:`, error.message);
        }
      }
    } else {
      console.log('\n✅ All users have employee records!');
    }

    console.log('\n✅ Check completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkZelsoftEmployees();
