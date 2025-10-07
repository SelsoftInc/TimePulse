/**
 * Add reviewer_id column to timesheets table
 */

const { sequelize, connectDB } = require('../models');

async function addReviewerColumn() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');

    // Check if column exists
    const [results] = await sequelize.query(`
      PRAGMA table_info(timesheets);
    `);

    const columnExists = results.some(col => col.name === 'reviewer_id');

    if (columnExists) {
      console.log('ℹ️  reviewer_id column already exists in timesheets table');
    } else {
      // Add the column
      await sequelize.query(`
        ALTER TABLE timesheets ADD COLUMN reviewer_id TEXT REFERENCES users(id);
      `);
      console.log('✅ Added reviewer_id column to timesheets table');

      // Create index for better performance
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_timesheets_reviewer ON timesheets(reviewer_id);
      `);
      console.log('✅ Created index on reviewer_id column');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addReviewerColumn();
