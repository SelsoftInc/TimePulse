/**
 * Verification Script: Check Employee Table Columns
 * Verifies that all required columns exist in the employees table
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verifyColumns() {
  console.log('🔍 Verifying Employee Table Columns...');
  
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
    console.log('✅ Database connection established.');

    // Query to get all columns from employees table
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length, column_default
      FROM information_schema.columns
      WHERE table_name = 'employees'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Employees Table Columns:');
    console.log('═'.repeat(80));
    
    const requiredColumns = ['country', 'alternative_mobile', 'alternative_country', 'pan_number', 'position'];
    const foundColumns = {};
    
    columns.forEach(col => {
      const isRequired = requiredColumns.includes(col.column_name);
      const marker = isRequired ? '✅' : '  ';
      console.log(`${marker} ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.column_default || 'NULL'}`);
      if (isRequired) {
        foundColumns[col.column_name] = true;
      }
    });

    console.log('═'.repeat(80));
    console.log('\n🔍 Required Columns Check:');
    requiredColumns.forEach(col => {
      if (foundColumns[col]) {
        console.log(`✅ ${col} - EXISTS`);
      } else {
        console.log(`❌ ${col} - MISSING`);
      }
    });

    // Query sample data to see what's actually stored
    console.log('\n📦 Sample Data from Employees Table:');
    const [sampleData] = await sequelize.query(`
      SELECT id, email, phone, country, alternative_mobile, alternative_country, pan_number, position
      FROM employees
      LIMIT 5;
    `);

    if (sampleData.length > 0) {
      console.log('═'.repeat(80));
      sampleData.forEach((row, idx) => {
        console.log(`\nRecord ${idx + 1}:`);
        console.log(`  Email: ${row.email}`);
        console.log(`  Phone: ${row.phone || 'NULL'}`);
        console.log(`  Country: ${row.country || 'NULL'}`);
        console.log(`  Alt Mobile: ${row.alternative_mobile || 'NULL'}`);
        console.log(`  Alt Country: ${row.alternative_country || 'NULL'}`);
        console.log(`  PAN: ${row.pan_number || 'NULL'}`);
        console.log(`  Position: ${row.position || 'NULL'}`);
      });
    } else {
      console.log('No data found in employees table.');
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

verifyColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
