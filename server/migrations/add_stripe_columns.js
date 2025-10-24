/**
 * Migration: Add Stripe billing columns to tenants table
 * This fixes the login error caused by missing columns
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

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

async function migrate() {
  try {
    console.log('🔄 Starting migration: Add Stripe billing columns...\n');

    // Check if columns exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'plan', 'billing_interval', 'seat_limit', 'current_period_end');
    `);

    const existingColumns = results.map(r => r.column_name);
    console.log('📊 Existing Stripe columns:', existingColumns.length > 0 ? existingColumns : 'None');

    // Add missing columns
    const columnsToAdd = [
      { name: 'stripe_customer_id', type: 'VARCHAR(100)', nullable: true },
      { name: 'stripe_subscription_id', type: 'VARCHAR(100)', nullable: true },
      { name: 'plan', type: 'VARCHAR(30)', nullable: true },
      { name: 'billing_interval', type: 'VARCHAR(10)', nullable: true },
      { name: 'seat_limit', type: 'INTEGER', nullable: true },
      { name: 'current_period_end', type: 'TIMESTAMP', nullable: true }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        await sequelize.query(`
          ALTER TABLE tenants 
          ADD COLUMN ${column.name} ${column.type} ${column.nullable ? 'NULL' : 'NOT NULL'};
        `);
        console.log(`✅ Added column: ${column.name}`);
      } else {
        console.log(`⏭️  Column already exists: ${column.name}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

migrate();
