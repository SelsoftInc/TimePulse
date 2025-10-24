/**
 * Migration: Add missing relationship columns to employees table
 * This fixes the login error caused by missing columns: vendor_id, client_id, impl_partner_id
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
    console.log('🔄 Starting migration: Add employee relationship columns...\n');

    // Check if columns exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      AND column_name IN ('vendor_id', 'client_id', 'impl_partner_id', 'employment_type_id');
    `);

    const existingColumns = results.map(r => r.column_name);
    console.log('📊 Existing relationship columns:', existingColumns.length > 0 ? existingColumns : 'None');

    // Add missing columns
    const columnsToAdd = [
      { name: 'client_id', type: 'UUID', nullable: true, references: 'clients(id)' },
      { name: 'vendor_id', type: 'UUID', nullable: true, references: 'vendors(id)' },
      { name: 'impl_partner_id', type: 'UUID', nullable: true, references: 'implementation_partners(id)' },
      { name: 'employment_type_id', type: 'UUID', nullable: true, references: 'employment_types(id)' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        await sequelize.query(`
          ALTER TABLE employees 
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
