/**
 * Migration script to add missing columns to timesheets table
 * Run this with: node scripts/add-timesheet-columns.js
 */

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function addTimesheetColumns() {
  // Create Sequelize instance
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_PATH || './database.sqlite',
    logging: console.log,
  });

  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if columns exist
    const [results] = await sequelize.query(`PRAGMA table_info(timesheets);`);
    const existingColumns = results.map(col => col.name);
    
    console.log('📊 Existing columns:', existingColumns);

    const columnsToAdd = [];

    // Check for daily_hours column
    if (!existingColumns.includes('daily_hours')) {
      columnsToAdd.push({
        name: 'daily_hours',
        sql: `ALTER TABLE timesheets ADD COLUMN daily_hours TEXT DEFAULT '{"mon":0,"tue":0,"wed":0,"thu":0,"fri":0,"sat":0,"sun":0}';`
      });
    }

    // Check for notes column
    if (!existingColumns.includes('notes')) {
      columnsToAdd.push({
        name: 'notes',
        sql: `ALTER TABLE timesheets ADD COLUMN notes TEXT;`
      });
    }

    // Check for reviewer_id column
    if (!existingColumns.includes('reviewer_id')) {
      columnsToAdd.push({
        name: 'reviewer_id',
        sql: `ALTER TABLE timesheets ADD COLUMN reviewer_id TEXT REFERENCES users(id);`
      });
    }

    if (columnsToAdd.length === 0) {
      console.log('✅ All columns already exist. No migration needed.');
      await sequelize.close();
      return;
    }

    console.log(`🔧 Adding ${columnsToAdd.length} missing columns...`);

    // Add each missing column
    for (const column of columnsToAdd) {
      try {
        console.log(`  Adding column: ${column.name}`);
        await sequelize.query(column.sql);
        console.log(`  ✅ Added ${column.name}`);
      } catch (error) {
        console.error(`  ❌ Error adding ${column.name}:`, error.message);
      }
    }

    // Verify columns were added
    const [updatedResults] = await sequelize.query(`PRAGMA table_info(timesheets);`);
    const updatedColumns = updatedResults.map(col => col.name);
    
    console.log('\n📊 Updated columns:', updatedColumns);
    console.log('\n✅ Migration completed successfully!');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
addTimesheetColumns();
