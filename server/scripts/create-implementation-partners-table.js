#!/usr/bin/env node

/**
 * Create Implementation Partners Table
 * This script creates the implementation_partners table if it doesn't exist
 */

const { sequelize, models } = require('../models');

const createImplementationPartnersTable = async () => {
  try {
    console.log('🔧 Creating implementation_partners table...');
    
    // Sync only the ImplementationPartner model
    await models.ImplementationPartner.sync({ force: false });
    
    console.log('✅ Implementation partners table created successfully!');
    console.log('📊 Table: implementation_partners');
    
    // Verify table exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'implementation_partners'
    `);
    
    if (results.length > 0) {
      console.log('✅ Table verified in database');
    } else {
      console.log('⚠️  Table not found after creation');
    }
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to create implementation_partners table:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  createImplementationPartnersTable();
}

module.exports = createImplementationPartnersTable;
