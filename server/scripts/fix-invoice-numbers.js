/**
 * Script to fix invoice numbers with proper year
 */

const { models, sequelize } = require('../models');

async function fixInvoiceNumbers() {
  try {
    console.log('🔄 Fixing invoice numbers...\n');
    
    const invoices = await models.Invoice.findAll({
      attributes: ['id', 'invoiceNumber', 'invoiceDate', 'created_at'],
      order: [['created_at', 'ASC']],
      raw: true
    });
    
    console.log(`📊 Found ${invoices.length} invoices to fix\n`);
    
    // Group by year
    const invoicesByYear = {};
    invoices.forEach(invoice => {
      const dateToUse = invoice.invoiceDate || invoice.created_at;
      const year = new Date(dateToUse).getFullYear();
      if (!invoicesByYear[year]) {
        invoicesByYear[year] = [];
      }
      invoicesByYear[year].push(invoice);
    });
    
    // Update each year
    for (const [year, yearInvoices] of Object.entries(invoicesByYear)) {
      console.log(`📅 Processing ${yearInvoices.length} invoices for year ${year}...`);
      
      for (let i = 0; i < yearInvoices.length; i++) {
        const invoice = yearInvoices[i];
        const sequenceNumber = String(i + 1).padStart(3, '0');
        const newInvoiceNumber = `IN-${year}-${sequenceNumber}`;
        
        await sequelize.query(
          'UPDATE invoices SET invoice_number = :newNumber WHERE id = :id',
          {
            replacements: { newNumber: newInvoiceNumber, id: invoice.id },
            type: sequelize.QueryTypes.UPDATE
          }
        );
        
        console.log(`  ✅ ${invoice.invoiceNumber} → ${newInvoiceNumber}`);
      }
    }
    
    console.log('\n✅ All invoice numbers fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixInvoiceNumbers();
