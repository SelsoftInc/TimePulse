/**
 * Script to add missing daily_hours column to timesheets table
 * This column is required by the Sequelize model but may be missing in production
 * 
 * Usage:
 *   node server/scripts/add-daily-hours-column.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

// Load database configuration
const getDbConfig = () => {
  const env = process.env.NODE_ENV || "development";
  const isLocal = env === "development" || process.env.USE_LOCAL_DB === "true";

  if (isLocal) {
    const localConfig = require("../config/database.local.js");
    return localConfig.development;
  } else {
    const remoteConfig = require("../config/database.remote.js");
    return remoteConfig[env] || remoteConfig.production;
  }
};

const dbConfig = getDbConfig();

async function addDailyHoursColumn() {
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );

  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets' 
      AND column_name = 'daily_hours';
    `);

    if (results.length > 0) {
      console.log('✅ Column daily_hours already exists. No migration needed.');
      await sequelize.close();
      return;
    }

    console.log('🔧 Adding daily_hours column to timesheets table...');

    // Add the column
    await sequelize.query(`
      ALTER TABLE timesheets 
      ADD COLUMN daily_hours JSONB DEFAULT '{"mon":0,"tue":0,"wed":0,"thu":0,"fri":0,"sat":0,"sun":0}'::jsonb;
    `);

    console.log('✅ Successfully added daily_hours column');

    // Also check and add other missing columns that might be needed
    const [allColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets';
    `);

    const existingColumns = allColumns.map(row => row.column_name);
    console.log('📊 Existing columns:', existingColumns);

    // Check for notes column
    if (!existingColumns.includes('notes')) {
      console.log('🔧 Adding notes column...');
      await sequelize.query(`
        ALTER TABLE timesheets 
        ADD COLUMN notes TEXT;
      `);
      console.log('✅ Added notes column');
    }

    // Check for attachments column
    if (!existingColumns.includes('attachments')) {
      console.log('🔧 Adding attachments column...');
      await sequelize.query(`
        ALTER TABLE timesheets 
        ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
      `);
      console.log('✅ Added attachments column');
    }

    // Check for reviewer_id column
    if (!existingColumns.includes('reviewer_id')) {
      console.log('🔧 Adding reviewer_id column...');
      await sequelize.query(`
        ALTER TABLE timesheets 
        ADD COLUMN reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL;
      `);
      console.log('✅ Added reviewer_id column');
    }

    console.log('✅ All required columns added successfully!');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  addDailyHoursColumn();
}

module.exports = { addDailyHoursColumn };

