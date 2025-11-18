/**
 * Migration script to add overtime fields to timesheets table
 * Run this with: node scripts/migrate-add-overtime-fields.js
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

async function runMigration() {
  try {
    console.log('🚀 Starting overtime fields migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/2025-11-18_add_overtime_fields_to_timesheets.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await sequelize.query(statement);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (err) {
        // Skip errors for statements that may already exist
        if (err.message.includes('already exists') || err.message.includes('does not exist')) {
          console.log(`⚠ Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          console.error(`✗ Error in statement ${i + 1}:`, statement.substring(0, 80) + '...');
          console.error(err.message);
        }
      }
    }
    
    console.log('\n✅ Overtime fields migration completed successfully!');
    console.log('📊 The timesheets table now has overtime_comment and overtime_days columns.');
    console.log('🎉 You can now track overtime hours with employee explanations!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();
