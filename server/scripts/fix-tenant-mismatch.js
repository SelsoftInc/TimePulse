/**
 * Fix tenant ID mismatch between Selvakumar and Cognizant
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected\n');

    // Find Selvakumar
    const employee = await models.Employee.findOne({
      where: { email: 'selvakumar@selsoftinc.com' }
    });

    if (!employee) {
      console.error('❌ Selvakumar not found');
      process.exit(1);
    }

    console.log('✅ Selvakumar found:');
    console.log('  Employee ID:', employee.id);
    console.log('  Tenant ID:', employee.tenantId);
    console.log('  Client ID:', employee.clientId);

    const selvakumarTenantId = employee.tenantId;

    // Check if Cognizant exists for this tenant
    let cognizant = await models.Client.findOne({
      where: {
        clientName: 'Cognizant',
        tenantId: selvakumarTenantId
      }
    });

    if (!cognizant) {
      console.log('\n❌ Cognizant not found for tenant:', selvakumarTenantId);
      console.log('Creating Cognizant for correct tenant...');
      
      cognizant = await models.Client.create({
        clientName: 'Cognizant',
        clientType: 'external',
        tenantId: selvakumarTenantId,
        status: 'active',
        email: 'contact@cognizant.com',
        phone: '+1-234-567-8900',
        legalName: 'Cognizant Technology Solutions',
        contactPerson: 'HR Department'
      });
      
      console.log('✅ Created Cognizant:', cognizant.id);
    } else {
      console.log('\n✅ Cognizant found:', cognizant.id);
    }

    // Update employee to link to correct Cognizant
    if (employee.clientId !== cognizant.id) {
      console.log('\n🔧 Updating employee clientId...');
      await employee.update({ clientId: cognizant.id });
      console.log('✅ Updated employee clientId to:', cognizant.id);
    } else {
      console.log('\n✅ Employee already linked to correct Cognizant');
    }

    // Update timesheets
    console.log('\n🔧 Updating timesheets...');
    const updateResult = await models.Timesheet.update(
      { clientId: cognizant.id },
      {
        where: {
          employeeId: employee.id,
          tenantId: selvakumarTenantId
        }
      }
    );
    console.log(`✅ Updated ${updateResult[0]} timesheets`);

    // Final verification
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('FINAL VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    const verifyEmployee = await models.Employee.findOne({
      where: { id: employee.id }
    });

    const verifyClient = await models.Client.findOne({
      where: { id: cognizant.id }
    });

    console.log('Employee:');
    console.log('  ID:', verifyEmployee.id);
    console.log('  Name:', verifyEmployee.firstName, verifyEmployee.lastName);
    console.log('  Email:', verifyEmployee.email);
    console.log('  Tenant ID:', verifyEmployee.tenantId);
    console.log('  Client ID:', verifyEmployee.clientId);

    console.log('\nClient:');
    console.log('  ID:', verifyClient.id);
    console.log('  Name:', verifyClient.clientName);
    console.log('  Type:', verifyClient.clientType);
    console.log('  Tenant ID:', verifyClient.tenantId);

    console.log('\n✅ Tenant IDs match:', verifyEmployee.tenantId === verifyClient.tenantId ? 'YES' : 'NO');
    console.log('✅ Employee linked to client:', verifyEmployee.clientId === verifyClient.id ? 'YES' : 'NO');

    console.log('\n✅ Fix complete!');
    console.log('\nNext steps:');
    console.log('1. Restart backend server');
    console.log('2. Clear browser cache');
    console.log('3. Login and test');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
