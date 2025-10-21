/**
 * Add missing columns to timesheets table
 */

const { sequelize, connectDB } = require('../models');

async function fixTimesheetColumns() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Check current table structure
    const [columns] = await sequelize.query(`PRAGMA table_info(timesheets);`);
    console.log('📋 Current columns in timesheets table:');
    columns.forEach(col => console.log(`   - ${col.name} (${col.type})`));

    const columnNames = columns.map(col => col.name);

    // Add missing columns
    const columnsToAdd = [
      { name: 'notes', sql: 'ALTER TABLE timesheets ADD COLUMN notes TEXT;' },
      { name: 'attachments', sql: 'ALTER TABLE timesheets ADD COLUMN attachments TEXT DEFAULT \'[]\';' },
      { name: 'submitted_at', sql: 'ALTER TABLE timesheets ADD COLUMN submitted_at TEXT;' },
      { name: 'approved_at', sql: 'ALTER TABLE timesheets ADD COLUMN approved_at TEXT;' },
      { name: 'reviewer_id', sql: 'ALTER TABLE timesheets ADD COLUMN reviewer_id TEXT REFERENCES users(id);' },
      { name: 'approved_by', sql: 'ALTER TABLE timesheets ADD COLUMN approved_by TEXT REFERENCES users(id);' },
      { name: 'rejection_reason', sql: 'ALTER TABLE timesheets ADD COLUMN rejection_reason TEXT;' }
    ];

    console.log('\n📋 Adding missing columns...\n');

    for (const col of columnsToAdd) {
      if (!columnNames.includes(col.name)) {
        try {
          await sequelize.query(col.sql);
          console.log(`✅ Added column: ${col.name}`);
        } catch (err) {
          console.log(`⚠️  Column ${col.name} might already exist or error: ${err.message}`);
        }
      } else {
        console.log(`✓  Column ${col.name} already exists`);
      }
    }

    // Create indexes
    console.log('\n📋 Creating indexes...\n');
    
    const indexes = [
      { name: 'idx_timesheets_reviewer', sql: 'CREATE INDEX IF NOT EXISTS idx_timesheets_reviewer ON timesheets(reviewer_id);' },
      { name: 'idx_timesheets_approved_by', sql: 'CREATE INDEX IF NOT EXISTS idx_timesheets_approved_by ON timesheets(approved_by);' }
    ];

    for (const idx of indexes) {
      try {
        await sequelize.query(idx.sql);
        console.log(`✅ Created index: ${idx.name}`);
      } catch (err) {
        console.log(`⚠️  Index ${idx.name} might already exist`);
      }
    }

    // Verify final structure
    const [finalColumns] = await sequelize.query(`PRAGMA table_info(timesheets);`);
    console.log('\n📋 Final columns in timesheets table:');
    finalColumns.forEach(col => console.log(`   - ${col.name} (${col.type})`));

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixTimesheetColumns();
