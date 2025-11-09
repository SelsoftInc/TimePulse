const { sequelize } = require('../models');

async function checkInvoiceTable() {
  try {
    const [results] = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices')"
    );
    
    if (results[0].exists) {
      console.log('✅ Invoice table EXISTS in database');
      
      // Count invoices
      const [count] = await sequelize.query("SELECT COUNT(*) as count FROM invoices");
      console.log(`📊 Current invoice count: ${count[0].count}`);
      
      process.exit(0);
    } else {
      console.log('❌ Invoice table DOES NOT EXIST');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkInvoiceTable();
