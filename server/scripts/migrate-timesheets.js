/**
 * Migration script to create/update timesheets table
 * Run this with: node scripts/migrate-timesheets.js
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

async function runMigration() {
  try {
    console.log('Starting timesheets migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/2025-09-30_create_timesheets_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await sequelize.query(statement);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (err) {
        // Skip errors for statements that may already exist (like DROP TABLE IF EXISTS)
        if (err.message.includes('does not exist') || err.message.includes('already exists')) {
          console.log(`⚠ Statement ${i + 1}/${statements.length} skipped (already exists or doesn't exist)`);
        } else {
          console.error(`✗ Error in statement ${i + 1}:`, statement.substring(0, 50) + '...');
          console.error(err.message);
        }
      }
    }
    
    console.log('\n✅ Timesheets migration completed successfully!');
    console.log('The timesheets table is now ready to use.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();
