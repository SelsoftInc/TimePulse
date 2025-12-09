/**
 * Run OAuth Migration Script
 * Adds OAuth fields to the users table
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Load database configuration
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const isLocal = env === 'development' || process.env.USE_LOCAL_DB === 'true';

  if (isLocal) {
    const localConfig = require('./config/database.local.js');
    return localConfig.development;
  } else {
    const remoteConfig = require('./config/database.remote.js');
    return remoteConfig[env] || remoteConfig.production;
  }
};

const dbConfig = getDbConfig();

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    ...dbConfig,
    logging: console.log,
  }
);

async function runMigration() {
  try {
    console.log('🚀 Starting OAuth migration...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Load and run migration
    const migration = require('./migrations/add-oauth-fields.js');
    await migration.up(sequelize.getQueryInterface(), DataTypes);

    console.log('\n✅ OAuth migration completed successfully!');
    console.log('📝 The following fields have been added to the users table:');
    console.log('   - google_id (STRING)');
    console.log('   - auth_provider (STRING, default: "local")');
    console.log('   - email_verified (BOOLEAN, default: false)');
    console.log('   - password_hash is now nullable\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();
