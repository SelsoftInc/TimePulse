/**
 * Migration: Add password reset fields to users table
 * Adds reset_password_token and reset_password_expires columns
 */

const { Sequelize } = require('sequelize');
const path = require('path');
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

async function runMigration() {
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('reset_password_token', 'reset_password_expires')
    `);

    if (results.length > 0) {
      console.log('⚠️ Password reset columns already exist, skipping migration');
      await sequelize.close();
      return;
    }

    console.log('🔄 Adding password reset fields to users table...');

    // Add reset_password_token column
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255) NULL
    `);
    console.log('✅ Added reset_password_token column');

    // Add reset_password_expires column
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP NULL
    `);
    console.log('✅ Added reset_password_expires column');

    console.log('✅ Migration completed successfully');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
