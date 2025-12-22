/**
 * Check Employee Visibility
 * Determines which employees should be visible for each tenant
 */

const { models, connectDB } = require('../models');

async function checkEmployeeVisibility() {
  try {
    console.log('🔍 Checking employee visibility across tenants...\n');
    
    await connectDB();
    console.log('✅ Database connected\n');

    // Find all tenants
    const tenants = await models.Tenant.findAll();

    for (const tenant of tenants) {
      console.log('═'.repeat(100));
      console.log(`🏢 Tenant: ${tenant.tenantName || tenant.tenant_name}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log(`   ID: ${tenant.id}\n`);

      // Find all employees for this tenant
      const employees = await models.Employee.findAll({
        where: {
          tenantId: tenant.id
        },
        include: [{
          model: models.User,
          as: 'user',
          required: false,
          attributes: ['email', 'role', 'status', 'authProvider', 'googleId']
        }]
      });

      console.log(`   📊 Total employees: ${employees.length}`);
      console.log(`   📊 Active employees: ${employees.filter(e => e.status === 'active').length}\n`);

      if (employees.length > 0) {
        console.log('   Employee List:');
        employees.forEach((emp, index) => {
          const status = emp.status === 'active' ? '✅' : '❌';
          const authProvider = emp.user?.authProvider || 'N/A';
          const hasGoogleId = emp.user?.googleId ? '🔐' : '';
          
          console.log(`   ${index + 1}. ${status} ${emp.firstName} ${emp.lastName} (${emp.email})`);
          console.log(`      Title: ${emp.title} | Status: ${emp.status} | Auth: ${authProvider} ${hasGoogleId}`);
          
          if (emp.user) {
            console.log(`      User Role: ${emp.user.role} | User Status: ${emp.user.status}`);
          } else {
            console.log(`      ⚠️  No linked user account`);
          }
          console.log('');
        });
      }

      // Check for chandralekha specifically
      const chandralekha = employees.find(e => 
        e.email?.toLowerCase().includes('chandralekha') || 
        e.firstName?.toLowerCase().includes('chandralekha')
      );

      if (chandralekha) {
        console.log('   🎯 CHANDRALEKHA FOUND IN THIS TENANT!');
        console.log(`      Name: ${chandralekha.firstName} ${chandralekha.lastName}`);
        console.log(`      Email: ${chandralekha.email}`);
        console.log(`      Status: ${chandralekha.status}`);
        console.log(`      Title: ${chandralekha.title}`);
        console.log(`      User ID: ${chandralekha.userId || 'NOT LINKED'}\n`);
      }
    }

    console.log('═'.repeat(100));
    console.log('\n✅ Check completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEmployeeVisibility();
