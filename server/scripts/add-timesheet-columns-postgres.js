/**
 * Migration script to add missing columns to timesheets table (PostgreSQL)
 * Run this with: node scripts/add-timesheet-columns-postgres.js
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function addTimesheetColumns() {
  // Create Sequelize instance for PostgreSQL
  const sequelize = new Sequelize('timepulse_db', 'postgres', 'postgres', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log,
  });

  try {
    console.log('🔧 Connecting to PostgreSQL database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if columns exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets';
    `);
    
    const existingColumns = results.map(row => row.column_name);
    console.log('📊 Existing columns:', existingColumns);

    const columnsToAdd = [];

    // Check for daily_hours column
    if (!existingColumns.includes('daily_hours')) {
      columnsToAdd.push({
        name: 'daily_hours',
        sql: `ALTER TABLE timesheets ADD COLUMN daily_hours JSONB DEFAULT '{"mon":0,"tue":0,"wed":0,"thu":0,"fri":0,"sat":0,"sun":0}'::jsonb;`
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
        sql: `ALTER TABLE timesheets ADD COLUMN reviewer_id UUID REFERENCES users(id);`
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
        if (error.message.includes('already exists')) {
          console.log(`  ℹ️  Column ${column.name} already exists, skipping`);
        } else {
          console.error(`  ❌ Error adding ${column.name}:`, error.message);
        }
      }
    }

    // Verify columns were added
    const [updatedResults] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets';
    `);
    
    const updatedColumns = updatedResults.map(row => row.column_name);
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
