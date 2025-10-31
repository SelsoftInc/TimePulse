const { sequelize, models } = require('../models');

async function setupInvoiceTable() {
  try {
    console.log('🔧 Setting up Invoice table...\n');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Sync Invoice model (create table if not exists)
    console.log('📊 Creating Invoice table...');
    await models.Invoice.sync({ alter: true });
    console.log('✅ Invoice table created/updated successfully!\n');

    // Verify table exists
    const [results] = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices')"
    );
    
    if (results[0].exists) {
      console.log('✅ Invoice table verified in database\n');
      
      // Show table structure
      const [columns] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'invoices' 
         ORDER BY ordinal_position`
      );
      
      console.log('📋 Invoice table structure:');
      console.table(columns);
      
      // Count existing invoices
      const count = await models.Invoice.count();
      console.log(`\n📊 Current invoice count: ${count}`);
      
    } else {
      console.error('❌ Invoice table was not created!');
      process.exit(1);
    }

    console.log('\n✅ Setup complete! You can now:');
    console.log('   1. Restart the server: npm start');
    console.log('   2. Generate invoices from approved timesheets');
    console.log('   3. View invoices in the Invoice module\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up Invoice table:', error);
    console.error('Error details:', error.message);
    if (error.parent) {
      console.error('Database error:', error.parent.message);
    }
    process.exit(1);
  }
}

setupInvoiceTable();
