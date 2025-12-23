/**
 * Database Migration Runner for Implementation Partners Field Lengths
 * Updates field lengths to accommodate encrypted data
 */

const { sequelize } = require('./models');

async function runMigration() {
  try {
    console.log('🔄 Starting implementation partners field length migration...');
    console.log('');

    // Load the migration
    const migration = require('./migrations/update-implementation-partners-field-lengths');
    
    console.log('📄 Migration file loaded successfully');
    console.log('⏳ Executing migration...');
    console.log('');

    // Execute the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Verifying migration...');

    // Verify the columns were updated
    const [columns] = await sequelize.query(`
      SELECT column_name, character_maximum_length, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'implementation_partners' 
        AND column_name IN ('name', 'legal_name', 'contact_person', 'email', 'phone', 'specialization')
      ORDER BY column_name;
    `);

    if (columns.length > 0) {
      console.log('✅ Columns verified:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}(${col.character_maximum_length})`);
      });
    } else {
      console.log('⚠️  Warning: Columns not found');
    }

    console.log('');
    console.log('🎉 Migration process complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart the backend server: npm start');
    console.log('2. Test implementation partner creation');
    console.log('3. Verify encrypted data is stored correctly');
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
    
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  TimePulse Database Migration');
console.log('  Update Implementation Partners Field Lengths');
console.log('═══════════════════════════════════════════════════════');
console.log('');

runMigration();
