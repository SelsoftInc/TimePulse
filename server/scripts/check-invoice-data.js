/**
 * Script to check current invoice data
 */

const { models, sequelize } = require('../models');

async function checkInvoiceData() {
  try {
    console.log('🔍 Checking invoice data...\n');
    
    const invoices = await models.Invoice.findAll({
      attributes: ['id', 'invoiceNumber', 'invoiceDate', 'issueDate', 'created_at'],
      limit: 10,
      order: [['created_at', 'DESC']],
      raw: true
    });
    
    console.log(`📊 Found ${invoices.length} invoices:\n`);
    
    invoices.forEach((invoice, index) => {
      console.log(`${index + 1}. Invoice:`);
      console.log(`   ID: ${invoice.id}`);
      console.log(`   Invoice Number: ${invoice.invoiceNumber}`);
      console.log(`   Invoice Date: ${invoice.invoiceDate}`);
      console.log(`   Issue Date: ${invoice.issueDate}`);
      console.log(`   Created At: ${invoice.created_at}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkInvoiceData();
