/**
 * Complete fix for Selvakumar - Only Cognizant client
 * This script will:
 * 1. Check database schema
 * 2. Verify/create Cognizant client
 * 3. Link Selvakumar to Cognizant
 * 4. Remove other client associations
 * 5. Display all data
 */

const { models, connectDB } = require('../models');

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('STEP 1: CHECK DATABASE SCHEMA');
    console.log('═══════════════════════════════════════════════════════\n');

    // Skip table check for now - just verify models work
    console.log('📊 Checking models...');
    console.log('  - Client model:', models.Client ? '✅' : '❌');
    console.log('  - Employee model:', models.Employee ? '✅' : '❌');
    console.log('  - Timesheet model:', models.Timesheet ? '✅' : '❌');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 2: CHECK EXISTING CLIENTS');
    console.log('═══════════════════════════════════════════════════════\n');

    const allClients = await models.Client.findAll({
      where: { tenantId: 1 },
      attributes: ['id', 'clientName', 'clientType', 'status']
    });

    console.log(`Found ${allClients.length} clients:`);
    allClients.forEach(client => {
      console.log(`  - ${client.clientName} (${client.clientType}) [${client.id}]`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 3: ENSURE COGNIZANT CLIENT EXISTS');
    console.log('═══════════════════════════════════════════════════════\n');

    let cognizant = await models.Client.findOne({
      where: { 
        clientName: 'Cognizant',
        tenantId: 1
      }
    });

    if (!cognizant) {
      console.log('Creating Cognizant client...');
      cognizant = await models.Client.create({
        clientName: 'Cognizant',
        clientType: 'external',
        tenantId: 1,
        status: 'active',
        email: 'contact@cognizant.com',
        phone: '+1-234-567-8900',
        legalName: 'Cognizant Technology Solutions',
        contactPerson: 'HR Department'
      });
      console.log('✅ Created Cognizant client:', cognizant.id);
    } else {
      console.log('✅ Cognizant client already exists:', cognizant.id);
    }

    console.log('\nCognizant Details:');
    console.log('  ID:', cognizant.id);
    console.log('  Name:', cognizant.clientName);
    console.log('  Type:', cognizant.clientType);
    console.log('  Status:', cognizant.status);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 4: FIND SELVAKUMAR EMPLOYEE');
    console.log('═══════════════════════════════════════════════════════\n');

    const employee = await models.Employee.findOne({
      where: { 
        email: 'selvakumar@selsoftinc.com',
        tenantId: 1
      }
    });

    if (!employee) {
      console.error('❌ Selvakumar employee not found!');
      console.log('\nCreating Selvakumar employee...');
      const newEmployee = await models.Employee.create({
        firstName: 'Selvakumar',
        lastName: 'Murugesan',
        email: 'selvakumar@selsoftinc.com',
        department: 'Executive',
        title: 'Executive',
        clientId: cognizant.id,
        tenantId: 1,
        status: 'active'
      });
      console.log('✅ Created Selvakumar employee:', newEmployee.id);
      console.log('✅ Linked to Cognizant');
    } else {
      console.log('✅ Found Selvakumar employee:', employee.id);
      console.log('  Name:', `${employee.firstName} ${employee.lastName}`);
      console.log('  Email:', employee.email);
      console.log('  Current Client ID:', employee.clientId);
      console.log('  Department:', employee.department);

      // Update to link to Cognizant
      if (employee.clientId !== cognizant.id) {
        console.log('\n🔧 Updating employee to link to Cognizant...');
        await employee.update({ clientId: cognizant.id });
        console.log('✅ Updated employee clientId to:', cognizant.id);
      } else {
        console.log('✅ Employee already linked to Cognizant');
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 5: UPDATE TIMESHEETS');
    console.log('═══════════════════════════════════════════════════════\n');

    const employeeRecord = await models.Employee.findOne({
      where: { email: 'selvakumar@selsoftinc.com', tenantId: 1 }
    });

    const timesheets = await models.Timesheet.findAll({
      where: {
        employeeId: employeeRecord.id,
        tenantId: 1
      }
    });

    console.log(`Found ${timesheets.length} timesheets for Selvakumar`);

    if (timesheets.length > 0) {
      console.log('\n🔧 Updating all timesheets to use Cognizant...');
      const updateResult = await models.Timesheet.update(
        { clientId: cognizant.id },
        {
          where: {
            employeeId: employeeRecord.id,
            tenantId: 1
          }
        }
      );
      console.log(`✅ Updated ${updateResult[0]} timesheets`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 6: DELETE OTHER CLIENTS (OPTIONAL)');
    console.log('═══════════════════════════════════════════════════════\n');

    const otherClients = await models.Client.findAll({
      where: {
        tenantId: 1,
        clientName: { [models.Sequelize.Op.ne]: 'Cognizant' }
      }
    });

    if (otherClients.length > 0) {
      console.log(`Found ${otherClients.length} other clients:`);
      otherClients.forEach(client => {
        console.log(`  - ${client.clientName} [${client.id}]`);
      });

      console.log('\n⚠️  Keeping other clients (they might be used by other employees)');
      console.log('   If you want to delete them, do it manually from the UI');
    } else {
      console.log('✅ No other clients found');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('STEP 7: FINAL VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    // Verify employee
    const verifyEmployee = await models.Employee.findOne({
      where: { email: 'selvakumar@selsoftinc.com', tenantId: 1 },
      include: [
        { model: models.Client, as: 'client', attributes: ['id', 'clientName', 'clientType'] }
      ]
    });

    console.log('📊 SELVAKUMAR EMPLOYEE DATA:');
    console.log(JSON.stringify({
      id: verifyEmployee.id,
      firstName: verifyEmployee.firstName,
      lastName: verifyEmployee.lastName,
      email: verifyEmployee.email,
      department: verifyEmployee.department,
      clientId: verifyEmployee.clientId,
      client: verifyEmployee.client ? {
        id: verifyEmployee.client.id,
        name: verifyEmployee.client.clientName,
        type: verifyEmployee.client.clientType
      } : null
    }, null, 2));

    // Verify timesheets
    const verifyTimesheets = await models.Timesheet.findAll({
      where: { employeeId: verifyEmployee.id, tenantId: 1 },
      include: [
        { model: models.Client, as: 'client', attributes: ['id', 'clientName'] }
      ],
      order: [['weekStart', 'DESC']],
      limit: 5
    });

    console.log('\n📊 SELVAKUMAR TIMESHEETS:');
    verifyTimesheets.forEach(ts => {
      console.log(`  Week: ${ts.weekStart} to ${ts.weekEnd}`);
      console.log(`  Client: ${ts.client?.clientName || 'No client'} [${ts.clientId}]`);
      console.log(`  Status: ${ts.status}`);
      console.log(`  Hours: ${ts.totalHours}`);
      console.log('  ---');
    });

    // Verify all clients
    const finalClients = await models.Client.findAll({
      where: { tenantId: 1 },
      attributes: ['id', 'clientName', 'clientType', 'status']
    });

    console.log('\n📊 ALL CLIENTS IN DATABASE:');
    finalClients.forEach(client => {
      console.log(`  ${client.clientName} (${client.clientType}) - ${client.status}`);
      console.log(`    ID: ${client.id}`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎯 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Cognizant client verified/created');
    console.log('✅ Selvakumar linked to Cognizant');
    console.log('✅ All timesheets updated to use Cognizant');
    console.log(`✅ Total clients in system: ${finalClients.length}`);
    console.log(`✅ Selvakumar's client: ${verifyEmployee.client?.clientName || 'None'}`);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Restart backend server');
    console.log('2. Clear browser cache (Ctrl+Shift+R)');
    console.log('3. Login as selvakumar@selsoftinc.com');
    console.log('4. Go to Timesheets page');
    console.log('5. Should see ONLY Cognizant');
    
    console.log('\n✅ Database fix complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
