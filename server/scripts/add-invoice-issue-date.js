/**
 * Migration Script: Add issue_date column to invoices table
 * This script adds the issue_date column to track when invoices are generated
 */

const { sequelize } = require('../models');

async function addIssueDateColumn() {
  try {
    console.log('🔄 Adding issue_date column to invoices table...');
    
    // Add the column
    await sequelize.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);
    
    console.log('✅ Successfully added issue_date column');
    
    // Update existing invoices to set issue_date = created_at if null
    await sequelize.query(`
      UPDATE invoices 
      SET issue_date = created_at 
      WHERE issue_date IS NULL;
    `);
    
    console.log('✅ Updated existing invoices with issue_date');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding issue_date column:', error);
    process.exit(1);
  }
}

addIssueDateColumn();
