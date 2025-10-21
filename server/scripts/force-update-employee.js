/**
 * Force update Selvakumar's clientId
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

    console.log('Current employee data:');
    console.log('  ID:', employee.id);
    console.log('  Name:', employee.firstName, employee.lastName);
    console.log('  Client ID:', employee.clientId);
    console.log('  Tenant ID:', employee.tenantId);

    // Find Cognizant for this tenant
    const cognizant = await models.Client.findOne({
      where: {
        clientName: 'Cognizant',
        tenantId: employee.tenantId
      }
    });

    if (!cognizant) {
      console.error('❌ Cognizant not found for tenant:', employee.tenantId);
      process.exit(1);
    }

    console.log('\nCognizant client:');
    console.log('  ID:', cognizant.id);
    console.log('  Name:', cognizant.clientName);

    // Force update
    console.log('\n🔧 Force updating employee.clientId...');
    employee.clientId = cognizant.id;
    await employee.save();

    console.log('✅ Updated!');

    // Verify
    const verify = await models.Employee.findOne({
      where: { id: employee.id }
    });

    console.log('\nVerification:');
    console.log('  Employee clientId:', verify.clientId);
    console.log('  Cognizant ID:', cognizant.id);
    console.log('  Match:', verify.clientId === cognizant.id ? 'YES ✅' : 'NO ❌');

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
