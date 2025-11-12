/**
 * Script to delete test users from AWS RDS Production database
 * 
 * This script deletes the following test users:
 * - Approver User (approver@selsoft.com)
 * - Employee User (employee@selsoft.com)
 * - Manager User (manager@selsoft.com)
 * 
 * IMPORTANT: 
 * - This script is designed for AWS RDS production database cleanup
 * - Ensure you have a database backup before executing
 * - Set environment variables for AWS RDS connection
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// AWS RDS Production database configuration
const DB_CONFIG = {
  database: process.env.AWS_DB_NAME || process.env.DB_NAME || 'timepulse',
  username: process.env.AWS_DB_USER || process.env.DB_USER || 'postgres',
  password: process.env.AWS_DB_PASSWORD || process.env.DB_PASSWORD || '',
  host: process.env.AWS_DB_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.AWS_DB_PORT || process.env.DB_PORT || 5432,
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.AWS_DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Test users to delete (from screenshot)
const TEST_USERS = [
  { email: 'approver@selsoft.com', name: 'Approver User' },
  { email: 'employee@selsoft.com', name: 'Employee User' },
  { email: 'manager@selsoft.com', name: 'Manager User' },
];

// Define User model inline
const UserModel = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  role: DataTypes.STRING,
  status: DataTypes.STRING,
};

// Define Employee model inline
const EmployeeModel = {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: DataTypes.STRING,
  status: DataTypes.STRING,
};

async function deleteTestUsers() {
  let sequelize;
  let deletedCount = 0;
  let notFoundCount = 0;
  
  try {
    console.log('🔌 Connecting to AWS RDS Production database...');
    console.log(`   Host: ${DB_CONFIG.host}`);
    console.log(`   Database: ${DB_CONFIG.database}`);
    console.log(`   User: ${DB_CONFIG.username}`);
    console.log(`   SSL: ${DB_CONFIG.dialectOptions.ssl ? 'Enabled' : 'Disabled'}`);
    
    sequelize = new Sequelize(
      DB_CONFIG.database,
      DB_CONFIG.username,
      DB_CONFIG.password,
      DB_CONFIG
    );

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully\n');

    // Initialize models
    const User = sequelize.define('User', UserModel, {
      tableName: 'Users',
      timestamps: true,
    });

    const Employee = sequelize.define('Employee', EmployeeModel, {
      tableName: 'Employees',
      timestamps: true,
    });

    console.log('🔍 Searching for test users in production database...\n');
    console.log('=' .repeat(70));

    for (const testUser of TEST_USERS) {
      console.log(`\n📧 Processing: ${testUser.name} (${testUser.email})`);
      console.log('-'.repeat(70));
      
      // Find user
      const user = await User.findOne({
        where: { email: testUser.email }
      });

      if (!user) {
        console.log(`   ⚠️  User not found in database`);
        notFoundCount++;
        continue;
      }

      console.log(`   ✓ Found user in database:`);
      console.log(`     - Name: ${user.firstName} ${user.lastName}`);
      console.log(`     - ID: ${user.id}`);
      console.log(`     - Tenant ID: ${user.tenantId}`);
      console.log(`     - Role: ${user.role}`);
      console.log(`     - Status: ${user.status}`);

      // Check for associated employee record
      const employee = await Employee.findOne({
        where: { 
          id: user.id,
          tenantId: user.tenantId 
        }
      });

      if (employee) {
        console.log(`\n   ✓ Found associated employee record:`);
        console.log(`     - Employee ID: ${employee.id}`);
        console.log(`     - Status: ${employee.status}`);
        console.log(`   🗑️  Deleting employee record...`);
        
        await employee.destroy();
        console.log(`   ✅ Employee record deleted`);
      } else {
        console.log(`\n   ℹ️  No associated employee record found`);
      }

      // Check for related data (timesheets, leave requests, etc.)
      const relatedDataQuery = `
        SELECT 
          (SELECT COUNT(*) FROM "Timesheets" WHERE "employeeId" = :userId) as timesheet_count,
          (SELECT COUNT(*) FROM "LeaveRequests" WHERE "employeeId" = :userId) as leave_count,
          (SELECT COUNT(*) FROM "Invoices" WHERE "employeeId" = :userId) as invoice_count
      `;
      
      const [relatedData] = await sequelize.query(relatedDataQuery, {
        replacements: { userId: user.id },
        type: sequelize.QueryTypes.SELECT
      });

      if (relatedData) {
        console.log(`\n   📊 Related data found:`);
        console.log(`     - Timesheets: ${relatedData.timesheet_count || 0}`);
        console.log(`     - Leave Requests: ${relatedData.leave_count || 0}`);
        console.log(`     - Invoices: ${relatedData.invoice_count || 0}`);
        
        if (relatedData.timesheet_count > 0 || relatedData.leave_count > 0 || relatedData.invoice_count > 0) {
          console.log(`   ⚠️  Warning: This user has related data that will be orphaned`);
        }
      }

      // Delete user
      console.log(`\n   🗑️  Deleting user account from database...`);
      await user.destroy();
      console.log(`   ✅ User account deleted successfully`);
      deletedCount++;
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Test user deletion completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Total test users processed: ${TEST_USERS.length}`);
    console.log(`   - Successfully deleted: ${deletedCount}`);
    console.log(`   - Not found: ${notFoundCount}`);
    console.log(`   - Database: ${DB_CONFIG.database}`);
    console.log(`   - Host: ${DB_CONFIG.host}`);
    console.log('\n✅ Production database cleanup complete!');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ Error occurred during deletion:');
    console.error('='.repeat(70));
    console.error(`\nError Message: ${error.message}`);
    console.error(`\nError Type: ${error.name}`);
    
    if (error.original) {
      console.error(`\nDatabase Error: ${error.original.message}`);
    }
    
    console.error('\nFull Error Stack:');
    console.error(error.stack);
    
    console.error('\n⚠️  Database connection details:');
    console.error(`   Host: ${DB_CONFIG.host}`);
    console.error(`   Database: ${DB_CONFIG.database}`);
    console.error(`   User: ${DB_CONFIG.username}`);
    
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Main execution with confirmation
console.log('\n' + '='.repeat(70));
console.log('⚠️  WARNING: PRODUCTION DATABASE DELETION SCRIPT');
console.log('='.repeat(70));
console.log('\nThis script will DELETE the following test users from PRODUCTION:');
console.log('');
TEST_USERS.forEach((user, index) => {
  console.log(`   ${index + 1}. ${user.name} (${user.email})`);
});
console.log('\nDatabase Configuration:');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Database: ${DB_CONFIG.database}`);
console.log(`   User: ${DB_CONFIG.username}`);
console.log('\n⚠️  IMPORTANT:');
console.log('   - Ensure you have a recent database backup');
console.log('   - This action cannot be undone');
console.log('   - Related data (timesheets, leaves) will be orphaned');
console.log('\n' + '='.repeat(70));
console.log('\nPress Ctrl+C to CANCEL, or wait 5 seconds to proceed...\n');

setTimeout(() => {
  deleteTestUsers();
}, 5000);
