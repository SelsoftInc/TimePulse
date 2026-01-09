/**
 * Test script to verify profile data save and retrieve
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testProfileSave() {
  console.log('🧪 Testing Profile Save and Retrieve...\n');
  
  const dbConfig = {
    database: process.env.DB_NAME || 'timepulse',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  };

  const sequelize = new Sequelize(dbConfig);

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const userId = '1b56de83-b23a-428e-974e-2726cc4e6783';
    const email = 'shanmugavel251@gmail.com';

    // Test 1: Read current data
    console.log('📖 Step 1: Reading current data...');
    const [currentData] = await sequelize.query(`
      SELECT phone, country, alternative_mobile, alternative_country, pan_number, position
      FROM employees
      WHERE email = '${email}'
      LIMIT 1;
    `);
    
    if (currentData.length > 0) {
      console.log('Current data:', JSON.stringify(currentData[0], null, 2));
    } else {
      console.log('❌ No employee record found');
      return;
    }

    // Test 2: Update data
    console.log('\n💾 Step 2: Updating data...');
    const testData = {
      phone: '9999999999',
      country: 'United States',
      alternativeMobile: '8888888888',
      alternativeCountry: 'Canada',
      panNumber: 'TEST12345Z',
      position: 'Senior Developer'
    };

    console.log('Test data to save:', JSON.stringify(testData, null, 2));

    await sequelize.query(`
      UPDATE employees
      SET 
        phone = '${testData.phone}',
        country = '${testData.country}',
        alternative_mobile = '${testData.alternativeMobile}',
        alternative_country = '${testData.alternativeCountry}',
        pan_number = '${testData.panNumber}',
        position = '${testData.position}'
      WHERE email = '${email}';
    `);

    console.log('✅ Data updated');

    // Test 3: Immediately read back
    console.log('\n📖 Step 3: Reading data immediately after update...');
    const [updatedData] = await sequelize.query(`
      SELECT phone, country, alternative_mobile, alternative_country, pan_number, position
      FROM employees
      WHERE email = '${email}'
      LIMIT 1;
    `);

    if (updatedData.length > 0) {
      console.log('Updated data:', JSON.stringify(updatedData[0], null, 2));
      
      // Verify data matches
      const saved = updatedData[0];
      let allMatch = true;
      
      console.log('\n🔍 Verification:');
      if (saved.phone !== testData.phone) {
        console.log(`❌ Phone mismatch: expected "${testData.phone}", got "${saved.phone}"`);
        allMatch = false;
      } else {
        console.log(`✅ Phone matches: ${saved.phone}`);
      }
      
      if (saved.country !== testData.country) {
        console.log(`❌ Country mismatch: expected "${testData.country}", got "${saved.country}"`);
        allMatch = false;
      } else {
        console.log(`✅ Country matches: ${saved.country}`);
      }
      
      if (saved.alternative_mobile !== testData.alternativeMobile) {
        console.log(`❌ Alt Mobile mismatch: expected "${testData.alternativeMobile}", got "${saved.alternative_mobile}"`);
        allMatch = false;
      } else {
        console.log(`✅ Alt Mobile matches: ${saved.alternative_mobile}`);
      }
      
      if (saved.alternative_country !== testData.alternativeCountry) {
        console.log(`❌ Alt Country mismatch: expected "${testData.alternativeCountry}", got "${saved.alternative_country}"`);
        allMatch = false;
      } else {
        console.log(`✅ Alt Country matches: ${saved.alternative_country}`);
      }
      
      if (saved.pan_number !== testData.panNumber) {
        console.log(`❌ PAN mismatch: expected "${testData.panNumber}", got "${saved.pan_number}"`);
        allMatch = false;
      } else {
        console.log(`✅ PAN matches: ${saved.pan_number}`);
      }
      
      if (saved.position !== testData.position) {
        console.log(`❌ Position mismatch: expected "${testData.position}", got "${saved.position}"`);
        allMatch = false;
      } else {
        console.log(`✅ Position matches: ${saved.position}`);
      }
      
      if (allMatch) {
        console.log('\n✅ All data saved and retrieved correctly!');
      } else {
        console.log('\n❌ Some data did not save correctly');
      }
    }

    // Test 4: Restore original data
    console.log('\n🔄 Step 4: Restoring original data...');
    if (currentData.length > 0) {
      const original = currentData[0];
      await sequelize.query(`
        UPDATE employees
        SET 
          phone = '${original.phone || ''}',
          country = '${original.country || 'United States'}',
          alternative_mobile = '${original.alternative_mobile || ''}',
          alternative_country = '${original.alternative_country || 'United States'}',
          pan_number = '${original.pan_number || ''}',
          position = '${original.position || ''}'
        WHERE email = '${email}';
      `);
      console.log('✅ Original data restored');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testProfileSave()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
