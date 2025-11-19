/**
 * Migration Runner: Complete User Roles Setup
 * This script runs the SQL migration to fix user roles
 * 
 * Usage: node scripts/run-migration.js
 */

const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../migrations/complete-user-roles-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Running migration script...\n');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('DO $$') || statement.includes('END $$')) {
        // Execute DO blocks as single statements
        await sequelize.query(statement + ';');
      } else if (statement.toLowerCase().startsWith('select')) {
        // Execute SELECT statements and show results
        const [results] = await sequelize.query(statement + ';');
        if (results && results.length > 0) {
          console.table(results);
        }
      } else {
        // Execute other statements
        await sequelize.query(statement + ';');
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Enum updated with "approver" role');
    console.log('✅ Lookups table populated with all roles');
    console.log('\n🎉 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Refresh your frontend');
    console.log('   3. Test user management role dropdown\n');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    console.error('\n💡 Try running the SQL file directly in pgAdmin or psql:');
    console.error('   psql -U postgres -d timepulse_db -f server/migrations/complete-user-roles-setup.sql\n');
    process.exit(1);
  }
}

// Run the migration
runMigration();
