/**
 * Database Migration Runner
 * Adds employee_id, vendor_id, approved_by, and approved_at columns to invoices table
 */

const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');
    console.log('📋 Migration: Add approver_id column to employees table');
    console.log('');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add-employee-approver-field.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('⏳ Executing migration...');
    console.log('');

    // Execute the entire migration as a single transaction
    // PostgreSQL DO blocks need to be executed together
    try {
      const result = await sequelize.query(migrationSQL, {
        logging: (msg) => {
          // Log NOTICE messages from PostgreSQL
          if (msg.includes('NOTICE:')) {
            const notice = msg.replace(/^.*NOTICE:\s*/, '');
            console.log(`  ℹ️  ${notice}`);
          }
        }
      });
      
      console.log('  ✅ Migration executed successfully');
    } catch (error) {
      throw error;
    }

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Verifying migration...');

    // Verify the columns were added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'invoices'
        AND column_name IN ('employee_id', 'vendor_id', 'approved_by', 'approved_at')
      ORDER BY column_name;
    `);

    if (results.length === 4) {
      console.log('✅ All columns verified:');
      results.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log(`⚠️  Warning: Expected 4 columns, found ${results.length}`);
    }

    console.log('');
    console.log('🎉 Migration process complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart the backend server: npm start');
    console.log('2. Test invoice generation from timesheet summary');
    console.log('3. Verify invoice details modal opens correctly');
    console.log('');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    console.error('Please check:');
    console.error('1. Database connection is working');
    console.error('2. You have sufficient database privileges');
    console.error('3. The invoices table exists');
    console.error('');
    
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  TimePulse Database Migration');
console.log('  Add approver_id to employees table');
console.log('═══════════════════════════════════════════════════════');
console.log('');

runMigration();
