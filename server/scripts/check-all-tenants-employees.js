/**
 * Check All Tenants and Their Employees
 * Lists all tenants and identifies users without employee records
 */

const { models, connectDB } = require('../models');

async function checkAllTenantsEmployees() {
  try {
    console.log('🔍 Checking all tenants and their employees...\n');
    
    await connectDB();
    console.log('✅ Database connected\n');

    // Find all tenants
    const tenants = await models.Tenant.findAll();

    console.log(`📊 Total tenants: ${tenants.length}\n`);

    for (const tenant of tenants) {
      console.log('═'.repeat(100));
      console.log(`🏢 Tenant: ${tenant.tenantName || tenant.tenant_name}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log('');

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

      console.log(`   👥 Total users: ${users.length}`);

      // Find users without employee records
      const usersWithoutEmployees = users.filter(u => !u.employee);
      
      if (usersWithoutEmployees.length > 0) {
        console.log(`   ⚠️  Users WITHOUT employee records: ${usersWithoutEmployees.length}\n`);
        
        usersWithoutEmployees.forEach((user, index) => {
          const authProvider = user.authProvider || user.auth_provider || 'local';
          const googleId = user.googleId || user.google_id;
          console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
          console.log(`      Role: ${user.role} | Status: ${user.status} | Auth: ${authProvider}${googleId ? ' 🔐' : ''}`);
        });
        
        console.log('\n   🔧 Creating employee records...\n');
        
        for (const user of usersWithoutEmployees) {
          try {
            // Check if employee exists by email
            const existingEmployee = await models.Employee.findOne({
              where: {
                email: user.email,
                tenantId: tenant.id
              }
            });

            if (existingEmployee) {
              await existingEmployee.update({ userId: user.id });
              console.log(`   🔗 Linked existing employee: ${user.email}`);
              continue;
            }

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
            
            console.log(`   ✅ Created: ${employee.firstName} ${employee.lastName} - ${employee.title}`);
          } catch (error) {
            console.error(`   ❌ Error for ${user.email}:`, error.message);
          }
        }
      } else {
        console.log(`   ✅ All users have employee records!`);
      }

      // Count employees
      const employees = await models.Employee.findAll({
        where: {
          tenantId: tenant.id,
          status: 'active'
        }
      });

      console.log(`   👔 Total active employees: ${employees.length}\n`);
    }

    console.log('═'.repeat(100));
    console.log('\n✅ Check completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllTenantsEmployees();
