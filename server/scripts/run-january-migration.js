/**
 * Run January 2026 Timesheet Migration
 * 
 * This script adds timesheet data for January 2026 to resolve the issue
 * where Reports & Analytics shows billing data but 0 hours.
 */

const path = require('path');
const { sequelize } = require('../models');

async function runMigration() {
  console.log('🚀 Starting January 2026 Timesheet Migration');
  console.log('================================================\n');

  try {
    // Load the migration
    const migration = require('../migrations/add_january_2026_timesheets');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('\n================================================');
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Navigate to Reports & Analytics');
    console.log('   3. Select January 2026');
    console.log('   4. Verify Total Hours now displays correctly\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();
