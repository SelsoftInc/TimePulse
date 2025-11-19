/**
 * Migration Script: Add 'approver' role to users table
 * This script updates the database enum to include the 'approver' role
 * 
 * Usage: node scripts/add-approver-role.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Load database configuration
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const isLocal = env === 'development' || process.env.USE_LOCAL_DB === 'true';

  if (isLocal) {
    const localConfig = require('../config/database.local.js');
    return localConfig.development;
  } else {
    const remoteConfig = require('../config/database.remote.js');
    return remoteConfig[env] || remoteConfig.production;
  }
};

const dbConfig = getDbConfig();

async function addApproverRole() {
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );

  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('\n📝 Checking current enum values...');
    const [currentValues] = await sequelize.query(`
      SELECT enum_range(NULL::users_role) as current_values;
    `);
    console.log('Current role values:', currentValues[0]?.current_values);

    // Check if 'approver' already exists
    if (currentValues[0]?.current_values?.includes('approver')) {
      console.log('✅ Role "approver" already exists in the enum');
      return;
    }

    console.log('\n🔄 Adding "approver" to users_role enum...');
    
    // Try to add the value directly (PostgreSQL 9.1+)
    try {
      await sequelize.query(`
        ALTER TYPE users_role ADD VALUE IF NOT EXISTS 'approver';
      `);
      console.log('✅ Successfully added "approver" role using ADD VALUE');
    } catch (error) {
      // If ADD VALUE doesn't work, use the migration approach
      console.log('⚠️  ADD VALUE failed, using migration approach...');
      
      // Create new enum type
      await sequelize.query(`
        CREATE TYPE users_role_new AS ENUM ('admin', 'manager', 'approver', 'employee', 'accountant', 'hr');
      `);
      console.log('✅ Created new enum type: users_role_new');

      // Update the column to use new type
      await sequelize.query(`
        ALTER TABLE users 
        ALTER COLUMN role TYPE users_role_new 
        USING role::text::users_role_new;
      `);
      console.log('✅ Updated users table to use new enum type');

      // Drop old enum and rename new one
      await sequelize.query(`DROP TYPE users_role;`);
      await sequelize.query(`ALTER TYPE users_role_new RENAME TO users_role;`);
      console.log('✅ Replaced old enum with new one');
    }

    // Verify the change
    console.log('\n📝 Verifying updated enum values...');
    const [newValues] = await sequelize.query(`
      SELECT enum_range(NULL::users_role) as new_values;
    `);
    console.log('Updated role values:', newValues[0]?.new_values);

    console.log('\n✅ Migration completed successfully!');
    console.log('You can now use "approver" as a role value.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
addApproverRole()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
