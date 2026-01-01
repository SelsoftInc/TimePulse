/**
 * Migration Script: Add password_hash column to account_requests table
 * Run this with: node scripts/add-password-hash-column.js
 */

const { Sequelize, DataTypes } = require('sequelize');
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

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

async function addPasswordHashColumn() {
  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'account_requests' 
      AND column_name = 'password_hash'
    `);

    if (results.length > 0) {
      console.log('ℹ️  Column password_hash already exists in account_requests table');
      await sequelize.close();
      return;
    }

    console.log('📝 Adding password_hash column to account_requests table...');
    
    await sequelize.query(`
      ALTER TABLE account_requests 
      ADD COLUMN password_hash VARCHAR(255)
    `);

    console.log('✅ Successfully added password_hash column');
    console.log('');
    console.log('Column details:');
    console.log('  - Table: account_requests');
    console.log('  - Column: password_hash');
    console.log('  - Type: VARCHAR(255)');
    console.log('  - Nullable: Yes');
    console.log('');
    console.log('✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
addPasswordHashColumn();
