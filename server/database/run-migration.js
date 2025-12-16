/**
 * Migration Runner Script
 * Runs the clients table VARCHAR limit increase migration
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
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
  console.log('🔧 Connecting to database...');
  
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: console.log
    }
  );

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('\n📝 Running migration: Increase VARCHAR limits for clients table...\n');

    // Run migration queries
    await sequelize.query(`
      ALTER TABLE clients 
        ALTER COLUMN phone TYPE VARCHAR(500);
    `);
    console.log('✅ Updated phone column to VARCHAR(500)');

    await sequelize.query(`
      ALTER TABLE clients 
        ALTER COLUMN tax_id TYPE VARCHAR(500);
    `);
    console.log('✅ Updated tax_id column to VARCHAR(500)');

    await sequelize.query(`
      ALTER TABLE clients 
        ALTER COLUMN client_name TYPE VARCHAR(500);
    `);
    console.log('✅ Updated client_name column to VARCHAR(500)');

    await sequelize.query(`
      ALTER TABLE clients 
        ALTER COLUMN legal_name TYPE VARCHAR(500);
    `);
    console.log('✅ Updated legal_name column to VARCHAR(500)');

    await sequelize.query(`
      ALTER TABLE clients 
        ALTER COLUMN contact_person TYPE VARCHAR(500);
    `);
    console.log('✅ Updated contact_person column to VARCHAR(500)');

    await sequelize.query(`
      ALTER TABLE clients 
        ALTER COLUMN email TYPE VARCHAR(500);
    `);
    console.log('✅ Updated email column to VARCHAR(500)');

    // Add comments
    await sequelize.query(`
      COMMENT ON COLUMN clients.phone IS 'Stores encrypted phone number (VARCHAR(500) to accommodate encryption)';
    `);
    await sequelize.query(`
      COMMENT ON COLUMN clients.tax_id IS 'Stores encrypted tax ID (VARCHAR(500) to accommodate encryption)';
    `);
    console.log('✅ Added column comments');

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 All VARCHAR fields in clients table now support encrypted data.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed.');
  }
}

// Run the migration
runMigration();
