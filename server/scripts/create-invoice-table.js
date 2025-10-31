const { connectDB, models } = require('../models');

async function createInvoiceTable() {
  try {
    console.log('🔧 Creating Invoice table...\n');
    
    await connectDB();
    console.log('✅ Connected to database\n');

    // Force sync the Invoice model to create the table
    await models.Invoice.sync({ force: false, alter: true });
    
    console.log('✅ Invoice table created successfully!\n');
    
    // Verify table exists
    const tableExists = await models.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices')",
      { type: models.sequelize.QueryTypes.SELECT }
    );
    
    console.log('📊 Table verification:', tableExists);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Invoice table:', error);
    process.exit(1);
  }
}

createInvoiceTable();
