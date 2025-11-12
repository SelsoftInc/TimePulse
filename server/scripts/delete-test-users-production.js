/**
 * Script to delete test users from production database
 * 
 * This script deletes the following test users:
 * - Approver User
 * - Employee User
 * - Manager User
 * 
 * IMPORTANT: This script is designed for production database cleanup
 * Run with caution and ensure you have a backup before executing
 */

const { Sequelize } = require('sequelize');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Production database configuration
// Update these values with your actual production database credentials
const DB_CONFIG = {
  database: process.env.PROD_DB_NAME || 'timepulse_prod',
  username: process.env.PROD_DB_USER || 'postgres',
  password: process.env.PROD_DB_PASSWORD || '',
  host: process.env.PROD_DB_HOST || 'localhost',
  port: process.env.PROD_DB_PORT || 5432,
  dialect: 'postgres',
  logging: console.log,
};

// Test users to delete (based on screenshot)
const TEST_USERS = [
  'approver@selsoft.com',
  'employee@selsoft.com',
  'manager@selsoft.com',
];

async function deleteTestUsers() {
  let sequelize;
  
  try {
    console.log('🔌 Connecting to production database...');
    console.log(`   Host: ${DB_CONFIG.host}`);
    console.log(`   Database: ${DB_CONFIG.database}`);
    console.log(`   User: ${DB_CONFIG.username}`);
    
    sequelize = new Sequelize(
      DB_CONFIG.database,
      DB_CONFIG.username,
      DB_CONFIG.password,
      {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        dialect: DB_CONFIG.dialect,
        logging: false, // Disable query logging for cleaner output
      }
    );

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully\n');

    // Initialize models
    User.init(User.getAttributes(), { sequelize, modelName: 'User' });
    Employee.init(Employee.getAttributes(), { sequelize, modelName: 'Employee' });

    console.log('🔍 Searching for test users...\n');

    for (const email of TEST_USERS) {
      console.log(`\n📧 Processing: ${email}`);
      
      // Find user
      const user = await User.findOne({
        where: { email },
        include: [{
          model: Employee,
          as: 'employee',
          required: false
        }]
      });

      if (!user) {
        console.log(`   ⚠️  User not found: ${email}`);
        continue;
      }

      console.log(`   ✓ Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      console.log(`   ✓ Tenant ID: ${user.tenantId}`);
      console.log(`   ✓ Role: ${user.role}`);

      // Check for associated employee record
      const employee = await Employee.findOne({
        where: { 
          id: user.id,
          tenantId: user.tenantId 
        }
      });

      if (employee) {
        console.log(`   ✓ Found associated employee record`);
        console.log(`   🗑️  Deleting employee record...`);
        await employee.destroy();
        console.log(`   ✅ Employee record deleted`);
      } else {
        console.log(`   ℹ️  No associated employee record found`);
      }

      // Delete user
      console.log(`   🗑️  Deleting user account...`);
      await user.destroy();
      console.log(`   ✅ User account deleted successfully`);
    }

    console.log('\n\n✅ All test users have been deleted successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Processed ${TEST_USERS.length} test user emails`);
    console.log(`   - Deleted users and their associated employee records`);
    console.log(`   - Database: ${DB_CONFIG.database}`);

  } catch (error) {
    console.error('\n❌ Error occurred:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This script will DELETE test users from the PRODUCTION database!');
console.log('\nTest users to be deleted:');
TEST_USERS.forEach(email => console.log(`   - ${email}`));
console.log('\nDatabase:', DB_CONFIG.database);
console.log('Host:', DB_CONFIG.host);
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

setTimeout(() => {
  deleteTestUsers();
}, 5000);
