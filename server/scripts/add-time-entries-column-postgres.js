const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function addTimeEntriesColumn() {
  // Use PostgreSQL configuration
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'timepulse_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log
    }
  );

  try {
    console.log('🔍 Checking for time_entries column in PostgreSQL...\n');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets' 
      AND column_name = 'time_entries';
    `);

    if (results.length === 0) {
      console.log('➕ Adding time_entries column...\n');
      
      // Add the column with JSONB type for PostgreSQL
      await sequelize.query(`
        ALTER TABLE timesheets 
        ADD COLUMN IF NOT EXISTS time_entries JSONB DEFAULT '[]'::jsonb;
      `);
      
      console.log('✅ Successfully added time_entries column\n');
    } else {
      console.log('✅ time_entries column already exists\n');
    }

    // Verify the column was added
    const [allColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'timesheets' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 All timesheet columns:');
    allColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n✅ Database update complete!');

  } catch (error) {
    console.error('❌ Error adding time_entries column:', error.message);
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
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });
