/**
 * Script to run the leave type ENUM migration
 * This updates the database ENUM types and migrates data
 */

const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Starting leave type ENUM migration...\n');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../database/migrations/2025-01-06_update_leave_type_enum.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and filter out comments and empty lines
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`SQL: ${statement.substring(0, 100)}...`);
      
      try {
        await sequelize.query(statement);
        console.log(`✅ Statement ${i + 1} completed\n`);
      } catch (error) {
        // Ignore "already exists" errors for ALTER TYPE ADD VALUE
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
        } else {
          throw error;
        }
      }
    }
    
    // Verification
    console.log('📊 Verification:\n');
    
    const [balanceCounts] = await sequelize.query(`
      SELECT leave_type, COUNT(*) as count, SUM(total_days) as total_days 
      FROM leave_balances 
      GROUP BY leave_type 
      ORDER BY leave_type
    `);
    
    console.log('Leave Balance Summary:');
    balanceCounts.forEach(b => {
      console.log(`  - ${b.leave_type}: ${b.count} records, ${b.total_days} total days`);
    });
    
    const [requestCounts] = await sequelize.query(`
      SELECT leave_type, COUNT(*) as count 
      FROM leave_requests 
      GROUP BY leave_type 
      ORDER BY leave_type
    `);
    
    console.log('\nLeave Request Summary:');
    requestCounts.forEach(r => {
      console.log(`  - ${r.leave_type}: ${r.count} requests`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📌 New leave structure: Sick (6 days), Casual (6 days), Earned (6 days) = 18 days total\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
runMigration();
