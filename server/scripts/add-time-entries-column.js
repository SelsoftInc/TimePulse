const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function addTimeEntriesColumn() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: console.log
  });

  try {
    console.log('🔍 Checking for time_entries column...\n');

    // Check if column exists
    const [results] = await sequelize.query(`PRAGMA table_info(timesheets);`);
    const existingColumns = results.map(col => col.name);

    console.log('📋 Existing columns:', existingColumns.join(', '));

    if (!existingColumns.includes('time_entries')) {
      console.log('\n➕ Adding time_entries column...');
      
      // Add the column
      await sequelize.query(`
        ALTER TABLE timesheets ADD COLUMN time_entries TEXT DEFAULT '[]';
      `);
      
      console.log('✅ Successfully added time_entries column\n');
    } else {
      console.log('\n✅ time_entries column already exists\n');
    }

    // Verify the column was added
    const [updatedResults] = await sequelize.query(`PRAGMA table_info(timesheets);`);
    const updatedColumns = updatedResults.map(col => col.name);
    
    console.log('📋 Updated columns:', updatedColumns.join(', '));
    console.log('\n✅ Database update complete!');

  } catch (error) {
    console.error('❌ Error adding time_entries column:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addTimeEntriesColumn()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
