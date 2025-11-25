/**
 * Migration: Add employee_name column to timesheets table
 * Purpose: Store employee name in timesheet for invoice generation
 * Date: 2025-11-25
 */

const { Sequelize } = require('sequelize');
const config = require('../config/database.local').development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: console.log,
  }
);

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add employee_name to timesheets table');

    // Add employee_name column
    await sequelize.query(`
      ALTER TABLE timesheets 
      ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
    `);
    console.log('✅ Added employee_name column');

    // Add comment to column
    await sequelize.query(`
      COMMENT ON COLUMN timesheets.employee_name IS 'Employee full name stored for invoice generation';
    `);
    console.log('✅ Added column comment');

    // Create index for faster lookups
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_timesheets_employee_name ON timesheets(employee_name);
    `);
    console.log('✅ Created index on employee_name');

    // Update existing records with employee names from employees table
    const [results] = await sequelize.query(`
      UPDATE timesheets t
      SET employee_name = CONCAT(e.first_name, ' ', e.last_name)
      FROM employees e
      WHERE t.employee_id = e.id
      AND t.employee_name IS NULL;
    `);
    console.log(`✅ Updated ${results.rowCount || 0} existing timesheet records with employee names`);

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
