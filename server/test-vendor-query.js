// Test script to check vendor data in invoices
const { models, sequelize } = require('./models');
const DataEncryptionService = require('./services/DataEncryptionService');

async function testVendorQuery() {
  try {
    console.log('🔍 Testing vendor data in invoices...\n');

    // Get invoice INV-2025-00028 specifically
    const invoice = await models.Invoice.findOne({
      where: {
        tenantId: '5eda5596-b1d9-4963-953d-7af9d0511ce8',
        invoiceNumber: 'INV-2025-00028'
      },
      include: [
        {
          model: models.Vendor,
          as: 'vendor',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: models.Client,
          as: 'client',
          attributes: ['id', 'clientName'],
          required: false
        }
      ]
    });

    if (!invoice) {
      console.log('❌ No invoice found');
      process.exit(1);
    }

    const plainInvoice = invoice.toJSON();
    
    console.log('📋 Invoice Data:');
    console.log('  Invoice Number:', plainInvoice.invoiceNumber);
    console.log('  Vendor ID:', plainInvoice.vendorId);
    console.log('  Client ID:', plainInvoice.clientId);
    console.log('  Has Vendor Object:', !!plainInvoice.vendor);
    console.log('  Has Client Object:', !!plainInvoice.client);
    
    if (plainInvoice.vendor) {
      console.log('\n🔐 Encrypted Vendor Data:');
      console.log('  ID:', plainInvoice.vendor.id);
      console.log('  Name:', plainInvoice.vendor.name);
      console.log('  Email:', plainInvoice.vendor.email);
      
      const decryptedVendor = DataEncryptionService.decryptVendorData(plainInvoice.vendor);
      console.log('\n🔓 Decrypted Vendor Data:');
      console.log('  ID:', decryptedVendor.id);
      console.log('  Name:', decryptedVendor.name);
      console.log('  Email:', decryptedVendor.email);
    } else {
      console.log('\n⚠️ No vendor object found!');
      console.log('This means the invoice has vendorId but vendor is not being loaded.');
    }
    
    if (plainInvoice.client) {
      console.log('\n📊 Client Data:');
      console.log('  Client Name (encrypted):', plainInvoice.client.clientName);
      const decryptedClient = DataEncryptionService.decryptClientData({ clientName: plainInvoice.client.clientName });
      console.log('  Client Name (decrypted):', decryptedClient.clientName);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testVendorQuery();
