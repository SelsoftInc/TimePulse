/**
 * Migration Script: Update existing invoice numbers to new format
 * This script updates all invoices to use the new IN-YYYY-XXX format
 */

const { models, sequelize } = require('../models');
const { Op } = require('sequelize');

async function updateInvoiceNumbers() {
  try {
    console.log('🔄 Updating invoice numbers to new format...');
    
    // Get all invoices that don't have the new format
    const invoices = await models.Invoice.findAll({
      where: {
        [Op.or]: [
          { invoiceNumber: { [Op.like]: 'INV-%' } },
          { invoiceNumber: { [Op.notLike]: 'IN-%' } }
        ]
      },
      order: [['created_at', 'ASC']]
    });
    
    console.log(`📊 Found ${invoices.length} invoices to update`);
    
    // Group invoices by year
    const invoicesByYear = {};
    invoices.forEach(invoice => {
      // Use invoiceDate or current year as fallback
      const dateToUse = invoice.invoiceDate || invoice.dataValues.created_at || new Date();
      const year = new Date(dateToUse).getFullYear();
      if (!invoicesByYear[year]) {
        invoicesByYear[year] = [];
      }
      invoicesByYear[year].push(invoice);
    });
    
    // Update each year's invoices
    let totalUpdated = 0;
    for (const [year, yearInvoices] of Object.entries(invoicesByYear)) {
      console.log(`\n📅 Processing ${yearInvoices.length} invoices for year ${year}...`);
      
      for (let i = 0; i < yearInvoices.length; i++) {
        const invoice = yearInvoices[i];
        const sequenceNumber = String(i + 1).padStart(3, '0');
        const newInvoiceNumber = `IN-${year}-${sequenceNumber}`;
        
        await invoice.update({
          invoiceNumber: newInvoiceNumber
        });
        
        totalUpdated++;
        console.log(`  ✅ Updated ${invoice.invoiceNumber} → ${newInvoiceNumber}`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${totalUpdated} invoice numbers`);
    
    // Verify the update
    const updatedInvoices = await models.Invoice.findAll({
      where: {
        invoiceNumber: { [Op.like]: 'IN-%' }
      }
    });
    
    console.log(`\n✅ Verification: ${updatedInvoices.length} invoices now have the new format`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating invoice numbers:', error);
    process.exit(1);
  }
}

updateInvoiceNumbers();
