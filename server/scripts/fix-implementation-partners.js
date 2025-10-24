#!/usr/bin/env node

/**
 * Fix Implementation Partners Table
 * Creates the implementation_partners table if it doesn't exist
 */

const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

const fixImplementationPartnersTable = async () => {
  try {
    console.log('🔧 Fixing implementation_partners table...\n');
    
    // Check if table exists
    const [tableCheck] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'implementation_partners'
    `);
    
    if (tableCheck.length > 0) {
      console.log('✅ Table already exists: implementation_partners');
      console.log('ℹ️  No action needed.\n');
    } else {
      console.log('📝 Table not found. Creating implementation_partners table...\n');
      
      // Read and execute SQL file
      const sqlPath = path.join(__dirname, '../database/add-implementation-partners.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      await sequelize.query(sql);
      
      console.log('✅ Implementation partners table created successfully!\n');
      
      // Verify creation
      const [verifyCheck] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'implementation_partners'
      `);
      
      if (verifyCheck.length > 0) {
        console.log('✅ Table verified in database\n');
        
        // Show table structure
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'implementation_partners'
          ORDER BY ordinal_position
        `);
        
        console.log('📊 Table Structure:');
        console.log('─'.repeat(60));
        columns.forEach(col => {
          console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        console.log('─'.repeat(60));
        console.log('');
      }
    }
    
    console.log('🎉 Implementation partners module is ready to use!\n');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to fix implementation_partners table:', error.message);
    console.error('\n📋 Error details:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure the database is running');
    console.error('   2. Check your database connection settings in .env');
    console.error('   3. Ensure you have CREATE TABLE permissions');
    console.error('');
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  fixImplementationPartnersTable();
}

module.exports = fixImplementationPartnersTable;
