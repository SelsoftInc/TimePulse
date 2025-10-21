/**
 * Simple check of Selvakumar's data
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected\n');

    console.log('Checking Selvakumar employee...');
    try {
      const employee = await models.Employee.findOne({
        where: { email: 'selvakumar@selsoftinc.com' }
      });
      
      if (employee) {
        console.log('\n✅ Employee found:');
        console.log('  ID:', employee.id);
        console.log('  Name:', employee.firstName, employee.lastName);
        console.log('  Email:', employee.email);
        console.log('  Client ID:', employee.clientId);
        console.log('  Tenant ID:', employee.tenantId);
      } else {
        console.log('❌ Employee not found');
      }
    } catch (err) {
      console.error('Error finding employee:', err.message);
    }

    console.log('\n\nChecking all clients...');
    try {
      const clients = await models.Client.findAll();
      console.log(`\n✅ Found ${clients.length} clients:`);
      clients.forEach(c => {
        console.log(`  - ${c.clientName} [${c.id}] (tenant: ${c.tenantId})`);
      });
    } catch (err) {
      console.error('Error finding clients:', err.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
