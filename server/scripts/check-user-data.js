/**
 * Check specific user's data
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkUserData() {
  console.log('🔍 Checking User Data...');
  
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

    // Find user by email
    const [users] = await sequelize.query(`
      SELECT id, first_name, last_name, email, role, tenant_id
      FROM users
      WHERE email LIKE '%shanmugavel%'
      LIMIT 5;
    `);

    if (users.length === 0) {
      console.log('❌ No users found with email containing "shanmugavel"');
      return;
    }

    console.log('\n📊 Found Users:');
    console.log('═'.repeat(80));
    
    for (const user of users) {
      console.log(`\nUser: ${user.first_name} ${user.last_name}`);
      console.log(`Email: ${user.email}`);
      console.log(`ID: ${user.id}`);
      console.log(`Tenant ID: ${user.tenant_id}`);

      // Find corresponding employee record
      const [employees] = await sequelize.query(`
        SELECT id, employee_id, phone, country, alternative_mobile, 
               alternative_country, pan_number, position, department
        FROM employees
        WHERE user_id = '${user.id}' OR email = '${user.email}'
        LIMIT 1;
      `);

      if (employees.length > 0) {
        const emp = employees[0];
        console.log('\n  📦 Employee Record:');
        console.log(`    Employee ID: ${emp.employee_id || 'NULL'}`);
        console.log(`    Phone: ${emp.phone || 'NULL'}`);
        console.log(`    Country: ${emp.country || 'NULL'}`);
        console.log(`    Alt Mobile: ${emp.alternative_mobile || 'NULL'}`);
        console.log(`    Alt Country: ${emp.alternative_country || 'NULL'}`);
        console.log(`    PAN Number: ${emp.pan_number || 'NULL'}`);
        console.log(`    Position: ${emp.position || 'NULL'}`);
        console.log(`    Department: ${emp.department || 'NULL'}`);
      } else {
        console.log('\n  ❌ No employee record found for this user');
      }
    }

    console.log('\n═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

checkUserData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
