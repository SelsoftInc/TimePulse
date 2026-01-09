/**
 * Migration Script: Add Profile Fields to Employee Table
 * Adds: country, alternative_mobile, alternative_country, pan_number, position
 * Date: January 2026
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runMigration() {
  console.log('🚀 Starting Employee Profile Fields Migration...');
  
  // Database configuration
  const dbConfig = {
    database: process.env.DB_NAME || 'timepulse',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  };

  const sequelize = new Sequelize(dbConfig);

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      console.log('\n📝 Adding new columns to employees table...');

      // Add country column
      await sequelize.query(
        `ALTER TABLE employees 
         ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States';`,
        { transaction }
      );
      console.log('✅ Added country column');

      // Add alternative_mobile column
      await sequelize.query(
        `ALTER TABLE employees 
         ADD COLUMN IF NOT EXISTS alternative_mobile VARCHAR(500);`,
        { transaction }
      );
      console.log('✅ Added alternative_mobile column');

      // Add alternative_country column
      await sequelize.query(
        `ALTER TABLE employees 
         ADD COLUMN IF NOT EXISTS alternative_country VARCHAR(100) DEFAULT 'United States';`,
        { transaction }
      );
      console.log('✅ Added alternative_country column');

      // Add pan_number column
      await sequelize.query(
        `ALTER TABLE employees 
         ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50);`,
        { transaction }
      );
      console.log('✅ Added pan_number column');

      // Add position column
      await sequelize.query(
        `ALTER TABLE employees 
         ADD COLUMN IF NOT EXISTS position VARCHAR(100);`,
        { transaction }
      );
      console.log('✅ Added position column');

      // Commit transaction
      await transaction.commit();
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📊 Summary:');
      console.log('   - Added country column (VARCHAR(100), default: United States)');
      console.log('   - Added alternative_mobile column (VARCHAR(500))');
      console.log('   - Added alternative_country column (VARCHAR(100), default: United States)');
      console.log('   - Added pan_number column (VARCHAR(50))');
      console.log('   - Added position column (VARCHAR(100))');

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('❌ Migration failed, rolling back:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
