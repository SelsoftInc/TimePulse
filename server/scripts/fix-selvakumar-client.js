/**
 * Fix Selvakumar's client to be only Cognizant
 * Remove hardcoded mock data and ensure all data comes from database
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Step 1: Find or create Cognizant client
    console.log('📋 Step 1: Ensuring Cognizant client exists...');
    
    const [cognizant, created] = await models.Client.findOrCreate({
      where: { 
        clientName: 'Cognizant',
        tenantId: 1  // Assuming tenant ID 1 for Selsoft
      },
      defaults: {
        clientName: 'Cognizant',
        clientType: 'external',
        tenantId: 1,
        status: 'active',
        email: 'contact@cognizant.com',
        phone: '+1-234-567-8900'
      }
    });

    if (created) {
      console.log('✅ Created Cognizant client:', cognizant.id);
    } else {
      console.log('✅ Cognizant client already exists:', cognizant.id);
    }

    // Step 2: Find Selvakumar employee
    console.log('\n📋 Step 2: Finding Selvakumar employee...');
    
    const employee = await models.Employee.findOne({
      where: { 
        email: 'selvakumar@selsoftinc.com',
        tenantId: 1
      }
    });

    if (!employee) {
      console.error('❌ Selvakumar employee not found!');
      process.exit(1);
    }

    console.log('✅ Found Selvakumar:', {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      currentClient: employee.clientId
    });

    // Step 3: Update Selvakumar's client to Cognizant
    console.log('\n📋 Step 3: Updating Selvakumar\'s client to Cognizant...');
    
    await employee.update({ clientId: cognizant.id });
    console.log('✅ Updated Selvakumar\'s client to Cognizant');

    // Step 4: List all clients
    console.log('\n📋 Step 4: All clients in database:');
    const allClients = await models.Client.findAll({
      where: { tenantId: 1 },
      attributes: ['id', 'clientName', 'clientType', 'status']
    });

    allClients.forEach(client => {
      console.log(`   ${client.id}. ${client.clientName} (${client.clientType}) - ${client.status}`);
    });

    // Step 5: Verify Selvakumar's timesheets
    console.log('\n📋 Step 5: Checking Selvakumar\'s timesheets...');
    const timesheets = await models.Timesheet.findAll({
      where: {
        employeeId: employee.id,
        tenantId: 1
      },
      include: [
        { model: models.Client, as: 'client', attributes: ['id', 'clientName'] }
      ],
      order: [['weekStart', 'DESC']],
      limit: 5
    });

    console.log(`✅ Found ${timesheets.length} timesheets for Selvakumar:`);
    timesheets.forEach(ts => {
      console.log(`   - Week: ${ts.weekStart} to ${ts.weekEnd}`);
      console.log(`     Client: ${ts.client?.clientName || 'No client'}`);
      console.log(`     Status: ${ts.status}`);
      console.log(`     Hours: ${ts.totalHours}`);
    });

    // Step 6: Update all Selvakumar's timesheets to use Cognizant
    console.log('\n📋 Step 6: Updating all timesheets to use Cognizant...');
    const updateResult = await models.Timesheet.update(
      { clientId: cognizant.id },
      {
        where: {
          employeeId: employee.id,
          tenantId: 1
        }
      }
    );

    console.log(`✅ Updated ${updateResult[0]} timesheets to use Cognizant`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎯 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Cognizant client created/verified');
    console.log('✅ Selvakumar linked to Cognizant');
    console.log('✅ All timesheets updated to use Cognizant');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Restart backend server');
    console.log('2. Login as selvakumar@selsoftinc.com');
    console.log('3. Go to Timesheets page');
    console.log('4. You should see only Cognizant as the client');
    console.log('\n✅ Fix complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
