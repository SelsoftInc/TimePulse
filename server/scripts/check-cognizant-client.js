/**
 * Check Cognizant client type in database
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    const tenantId = '5eda5596-b1d9-4963-953d-7af9d0511ce8';

    console.log('═══════════════════════════════════════════════════════');
    console.log('CHECKING COGNIZANT CLIENT');
    console.log('═══════════════════════════════════════════════════════\n');

    // Find Cognizant client
    const cognizant = await models.Client.findOne({
      where: {
        tenantId,
        clientName: 'Cognizant'
      }
    });

    if (!cognizant) {
      console.log('❌ Cognizant client not found!');
      
      // Show all clients
      const allClients = await models.Client.findAll({
        where: { tenantId },
        attributes: ['id', 'clientName', 'clientType']
      });
      
      console.log(`\nFound ${allClients.length} clients:`);
      allClients.forEach(c => {
        console.log(`  - ${c.clientName}: ${c.clientType || 'NO TYPE SET'}`);
      });
    } else {
      console.log('✅ Found Cognizant client:\n');
      console.log(`  ID: ${cognizant.id}`);
      console.log(`  Name: ${cognizant.clientName}`);
      console.log(`  Client Type: ${cognizant.clientType || 'NOT SET'}`);
      console.log(`  Legal Name: ${cognizant.legalName || 'N/A'}`);
      console.log(`  Hourly Rate: $${cognizant.hourlyRate || 0}/hr`);
      
      if (cognizant.clientType === 'external') {
        console.log('\n⚠️  Cognizant is marked as EXTERNAL!');
        console.log('This is why the timesheet shows upload screen instead of hour entry table.');
        console.log('\nFixing...');
        
        // Update to internal
        cognizant.clientType = 'internal';
        await cognizant.save();
        
        console.log('✅ Updated Cognizant to INTERNAL client type');
        console.log('\nNow refresh the frontend and the hour entry table should appear!');
      } else if (cognizant.clientType === 'internal') {
        console.log('\n✅ Cognizant is correctly marked as INTERNAL');
        console.log('The hour entry table should be visible.');
      } else {
        console.log('\n⚠️  Cognizant has NO client type set!');
        console.log('Setting to INTERNAL...');
        
        cognizant.clientType = 'internal';
        await cognizant.save();
        
        console.log('✅ Set Cognizant to INTERNAL client type');
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    // Verify the update
    const updated = await models.Client.findOne({
      where: {
        tenantId,
        clientName: 'Cognizant'
      }
    });

    if (updated) {
      console.log(`✅ Cognizant client type: ${updated.clientType}`);
      console.log('\nExpected behavior:');
      console.log('  - Frontend should show internal client hour entry table');
      console.log('  - NOT show external client file upload screen');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
