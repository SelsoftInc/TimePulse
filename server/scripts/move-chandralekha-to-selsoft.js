/**
 * Move Chandralekha to Selsoft Tenant
 * Moves chandralekha's user and employee records to the main Selsoft tenant
 */

const { models, connectDB } = require('../models');

async function moveChandralekhaToSelsoft() {
  try {
    console.log('🔄 Moving Chandralekha to Selsoft tenant...\n');
    
    await connectDB();
    console.log('✅ Database connected\n');

    // Find Selsoft tenant (the main one with subdomain "selsoft")
    const selsoftTenant = await models.Tenant.findOne({
      where: {
        subdomain: 'selsoft',
        id: '5eda5596-b1d9-4963-953d-7af9d0511ce8'
      }
    });

    if (!selsoftTenant) {
      console.log('❌ Selsoft tenant not found');
      process.exit(1);
    }

    console.log('✅ Target Tenant found:');
    console.log(`   Name: ${selsoftTenant.tenantName || selsoftTenant.tenant_name}`);
    console.log(`   Subdomain: ${selsoftTenant.subdomain}`);
    console.log(`   ID: ${selsoftTenant.id}\n`);

    // Find chandralekha user
    const chandralekhaUser = await models.User.findOne({
      where: {
        email: 'chandralekha@selsoftinc.com'
      }
    });

    if (!chandralekhaUser) {
      console.log('❌ Chandralekha user not found');
      process.exit(1);
    }

    console.log('✅ Chandralekha user found:');
    console.log(`   Name: ${chandralekhaUser.firstName} ${chandralekhaUser.lastName}`);
    console.log(`   Email: ${chandralekhaUser.email}`);
    console.log(`   Current Tenant ID: ${chandralekhaUser.tenantId || chandralekhaUser.tenant_id}`);
    console.log(`   Role: ${chandralekhaUser.role}\n`);

    // Find chandralekha employee
    const chandralekhaEmployee = await models.Employee.findOne({
      where: {
        email: 'chandralekha@selsoftinc.com'
      }
    });

    if (!chandralekhaEmployee) {
      console.log('❌ Chandralekha employee record not found');
      process.exit(1);
    }

    console.log('✅ Chandralekha employee found:');
    console.log(`   Name: ${chandralekhaEmployee.firstName} ${chandralekhaEmployee.lastName}`);
    console.log(`   Title: ${chandralekhaEmployee.title}`);
    console.log(`   Current Tenant ID: ${chandralekhaEmployee.tenantId}\n`);

    // Ask for confirmation
    console.log('⚠️  This will move Chandralekha from her current tenant to the Selsoft tenant.');
    console.log('   Current tenant: chandralekha (81acbb0e-74ba-4436-b1b3-40b52c155932)');
    console.log('   Target tenant: selsoft (5eda5596-b1d9-4963-953d-7af9d0511ce8)\n');

    // Update user tenant
    await chandralekhaUser.update({
      tenantId: selsoftTenant.id,
      tenant_id: selsoftTenant.id
    });
    console.log('✅ Updated user tenant');

    // Update employee tenant
    await chandralekhaEmployee.update({
      tenantId: selsoftTenant.id
    });
    console.log('✅ Updated employee tenant');

    console.log('\n✅ Chandralekha successfully moved to Selsoft tenant!');
    console.log('   She will now appear in the employee list for the selsoft subdomain.\n');

    // Verify the move
    const updatedUser = await models.User.findOne({
      where: { email: 'chandralekha@selsoftinc.com' }
    });

    const updatedEmployee = await models.Employee.findOne({
      where: { email: 'chandralekha@selsoftinc.com' }
    });

    console.log('📊 Verification:');
    console.log(`   User Tenant ID: ${updatedUser.tenantId || updatedUser.tenant_id}`);
    console.log(`   Employee Tenant ID: ${updatedEmployee.tenantId}`);
    console.log(`   Match: ${(updatedUser.tenantId || updatedUser.tenant_id) === updatedEmployee.tenantId ? '✅' : '❌'}\n`);

    console.log('✅ Migration completed successfully!');
    console.log('   Refresh the employee list page to see Chandralekha.\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

moveChandralekhaToSelsoft();
