/**
 * Database Migration Runner for Implementation Partners Table
 * Creates the implementation_partners table with all required fields
 */

const { sequelize } = require('./models');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Starting implementation partners table migration...');
    console.log('');

    // Load the migration
    const migration = require('./migrations/create-implementation-partners-table');
    
    console.log('📄 Migration file loaded successfully');
    console.log('⏳ Executing migration...');
    console.log('');

    // Execute the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Verifying migration...');

    // Verify the table was created
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'implementation_partners';
    `);

    if (results.length > 0) {
      console.log('✅ Table verified: implementation_partners');
      
      // Check columns
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'implementation_partners' 
        ORDER BY ordinal_position;
      `);
      
      console.log('✅ Columns created:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('⚠️  Warning: Table not found after migration');
    }

    console.log('');
    console.log('🎉 Migration process complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart the backend server: npm start');
    console.log('2. Test implementation partner creation');
    console.log('3. Verify data displays correctly');
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
    console.error('3. The tenants table exists (foreign key dependency)');
    console.error('');
    
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  TimePulse Database Migration');
console.log('  Create Implementation Partners Table');
console.log('═══════════════════════════════════════════════════════');
console.log('');

runMigration();
