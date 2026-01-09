/**
 * Delete Specific Invoices
 * Removes invoices IN-2026-002 and IN-2026-001 from the database
 */

const { models, connectDB } = require('../models');

async function deleteSpecificInvoices() {
  try {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   DELETE SPECIFIC INVOICES                         ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    await connectDB();
    console.log('✅ Database connected\n');

    const invoiceNumbers = ['IN-2026-002', 'IN-2026-001'];
    
    console.log('🔍 Step 1: Finding invoices...\n');
    
    const invoices = await models.Invoice.findAll({
      where: {
        invoiceNumber: invoiceNumbers
      },
      attributes: ['id', 'invoiceNumber', 'totalAmount', 'status', 'vendorId']
    });

    if (invoices.length === 0) {
      console.log('⚠️  No invoices found with these numbers');
      process.exit(0);
    }

    console.log(`Found ${invoices.length} invoices:\n`);
    invoices.forEach(inv => {
      console.log(`   - ${inv.invoiceNumber}: $${inv.totalAmount} (${inv.status})`);
    });

    console.log('\n⚠️  WARNING: This will DELETE these invoices permanently!\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Step 2: Deleting invoices...\n');
    
    const deletedCount = await models.Invoice.destroy({
      where: {
        invoiceNumber: invoiceNumbers
      }
    });

    console.log(`✅ Deleted ${deletedCount} invoices\n`);

    console.log('🔍 Step 3: Verifying deletion...\n');
    const remainingInvoices = await models.Invoice.count({
      where: {
        invoiceNumber: invoiceNumbers
      }
    });

    if (remainingInvoices === 0) {
      console.log('✅ All specified invoices have been successfully deleted!\n');
    } else {
      console.log(`⚠️  Warning: ${remainingInvoices} invoices still remain\n`);
    }

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   DELETION COMPLETED                               ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
deleteSpecificInvoices();
