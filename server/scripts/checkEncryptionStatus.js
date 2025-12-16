/**
 * Encryption Status Check Script
 * 
 * This script checks the current encryption status of your database
 * Shows how many records are encrypted vs plain text
 * 
 * Usage: node scripts/checkEncryptionStatus.js
 */

require('dotenv').config();
const { models, sequelize } = require('../models');

const { Employee, Vendor, Client, ImplementationPartner, LeaveRequest } = models;

// Helper function to check if data is encrypted
function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
}

// Helper function to check if numeric field is encrypted
function isNumericEncrypted(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return false;
  return isEncrypted(String(value));
}

/**
 * Check employee encryption status
 */
async function checkEmployees() {
  console.log('\n👥 EMPLOYEE MODULE');
  console.log('─'.repeat(50));
  
  try {
    const employees = await Employee.findAll();
    const total = employees.length;
    
    let encrypted = 0;
    let plainText = 0;
    
    const fieldStats = {
      firstName: { encrypted: 0, plain: 0 },
      lastName: { encrypted: 0, plain: 0 },
      email: { encrypted: 0, plain: 0 },
      phone: { encrypted: 0, plain: 0 },
      contactInfo: { encrypted: 0, plain: 0 },
      hourlyRate: { encrypted: 0, plain: 0 },
      salaryAmount: { encrypted: 0, plain: 0 }
    };
    
    for (const emp of employees) {
      let empEncrypted = true;
      
      if (emp.firstName) {
        if (isEncrypted(emp.firstName)) fieldStats.firstName.encrypted++;
        else { fieldStats.firstName.plain++; empEncrypted = false; }
      }
      
      if (emp.lastName) {
        if (isEncrypted(emp.lastName)) fieldStats.lastName.encrypted++;
        else { fieldStats.lastName.plain++; empEncrypted = false; }
      }
      
      if (emp.email) {
        if (isEncrypted(emp.email)) fieldStats.email.encrypted++;
        else { fieldStats.email.plain++; empEncrypted = false; }
      }
      
      if (emp.phone) {
        if (isEncrypted(emp.phone)) fieldStats.phone.encrypted++;
        else { fieldStats.phone.plain++; empEncrypted = false; }
      }
      
      if (emp.contactInfo) {
        if (isEncrypted(emp.contactInfo)) fieldStats.contactInfo.encrypted++;
        else { fieldStats.contactInfo.plain++; empEncrypted = false; }
      }
      
      if (emp.hourlyRate !== null && emp.hourlyRate !== undefined) {
        if (isNumericEncrypted(emp.hourlyRate)) fieldStats.hourlyRate.encrypted++;
        else { fieldStats.hourlyRate.plain++; empEncrypted = false; }
      }
      
      if (emp.salaryAmount !== null && emp.salaryAmount !== undefined) {
        if (isNumericEncrypted(emp.salaryAmount)) fieldStats.salaryAmount.encrypted++;
        else { fieldStats.salaryAmount.plain++; empEncrypted = false; }
      }
      
      if (empEncrypted) encrypted++;
      else plainText++;
    }
    
    console.log(`Total Employees: ${total}`);
    console.log(`✅ Fully Encrypted: ${encrypted}`);
    console.log(`❌ Has Plain Text: ${plainText}\n`);
    
    console.log('Field-by-Field Status:');
    for (const [field, stats] of Object.entries(fieldStats)) {
      const totalField = stats.encrypted + stats.plain;
      if (totalField > 0) {
        const status = stats.plain === 0 ? '✅' : '❌';
        console.log(`  ${status} ${field}: ${stats.encrypted}/${totalField} encrypted`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking employees:', error.message);
  }
}

/**
 * Check vendor encryption status
 */
async function checkVendors() {
  console.log('\n🏢 VENDOR MODULE');
  console.log('─'.repeat(50));
  
  try {
    const vendors = await Vendor.findAll();
    const total = vendors.length;
    
    let encrypted = 0;
    let plainText = 0;
    
    const fieldStats = {
      name: { encrypted: 0, plain: 0 },
      email: { encrypted: 0, plain: 0 },
      phone: { encrypted: 0, plain: 0 },
      contactPerson: { encrypted: 0, plain: 0 },
      address: { encrypted: 0, plain: 0 },
      taxId: { encrypted: 0, plain: 0 }
    };
    
    for (const vendor of vendors) {
      let vendorEncrypted = true;
      
      if (vendor.name) {
        if (isEncrypted(vendor.name)) fieldStats.name.encrypted++;
        else { fieldStats.name.plain++; vendorEncrypted = false; }
      }
      
      if (vendor.email) {
        if (isEncrypted(vendor.email)) fieldStats.email.encrypted++;
        else { fieldStats.email.plain++; vendorEncrypted = false; }
      }
      
      if (vendor.phone) {
        if (isEncrypted(vendor.phone)) fieldStats.phone.encrypted++;
        else { fieldStats.phone.plain++; vendorEncrypted = false; }
      }
      
      if (vendor.contactPerson) {
        if (isEncrypted(vendor.contactPerson)) fieldStats.contactPerson.encrypted++;
        else { fieldStats.contactPerson.plain++; vendorEncrypted = false; }
      }
      
      if (vendor.address) {
        if (isEncrypted(vendor.address)) fieldStats.address.encrypted++;
        else { fieldStats.address.plain++; vendorEncrypted = false; }
      }
      
      if (vendor.taxId) {
        if (isEncrypted(vendor.taxId)) fieldStats.taxId.encrypted++;
        else { fieldStats.taxId.plain++; vendorEncrypted = false; }
      }
      
      if (vendorEncrypted) encrypted++;
      else plainText++;
    }
    
    console.log(`Total Vendors: ${total}`);
    console.log(`✅ Fully Encrypted: ${encrypted}`);
    console.log(`❌ Has Plain Text: ${plainText}\n`);
    
    console.log('Field-by-Field Status:');
    for (const [field, stats] of Object.entries(fieldStats)) {
      const totalField = stats.encrypted + stats.plain;
      if (totalField > 0) {
        const status = stats.plain === 0 ? '✅' : '❌';
        console.log(`  ${status} ${field}: ${stats.encrypted}/${totalField} encrypted`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking vendors:', error.message);
  }
}

/**
 * Check client encryption status
 */
async function checkClients() {
  console.log('\n🏪 CLIENT MODULE');
  console.log('─'.repeat(50));
  
  try {
    const clients = await Client.findAll();
    const total = clients.length;
    
    let encrypted = 0;
    let plainText = 0;
    
    const fieldStats = {
      clientName: { encrypted: 0, plain: 0 },
      legalName: { encrypted: 0, plain: 0 },
      contactPerson: { encrypted: 0, plain: 0 },
      email: { encrypted: 0, plain: 0 },
      phone: { encrypted: 0, plain: 0 },
      billingAddress: { encrypted: 0, plain: 0 },
      shippingAddress: { encrypted: 0, plain: 0 },
      taxId: { encrypted: 0, plain: 0 },
      hourlyRate: { encrypted: 0, plain: 0 }
    };
    
    for (const client of clients) {
      let clientEncrypted = true;
      
      if (client.clientName) {
        if (isEncrypted(client.clientName)) fieldStats.clientName.encrypted++;
        else { fieldStats.clientName.plain++; clientEncrypted = false; }
      }
      
      if (client.legalName) {
        if (isEncrypted(client.legalName)) fieldStats.legalName.encrypted++;
        else { fieldStats.legalName.plain++; clientEncrypted = false; }
      }
      
      if (client.contactPerson) {
        if (isEncrypted(client.contactPerson)) fieldStats.contactPerson.encrypted++;
        else { fieldStats.contactPerson.plain++; clientEncrypted = false; }
      }
      
      if (client.email) {
        if (isEncrypted(client.email)) fieldStats.email.encrypted++;
        else { fieldStats.email.plain++; clientEncrypted = false; }
      }
      
      if (client.phone) {
        if (isEncrypted(client.phone)) fieldStats.phone.encrypted++;
        else { fieldStats.phone.plain++; clientEncrypted = false; }
      }
      
      if (client.billingAddress) {
        if (isEncrypted(client.billingAddress)) fieldStats.billingAddress.encrypted++;
        else { fieldStats.billingAddress.plain++; clientEncrypted = false; }
      }
      
      if (client.shippingAddress) {
        if (isEncrypted(client.shippingAddress)) fieldStats.shippingAddress.encrypted++;
        else { fieldStats.shippingAddress.plain++; clientEncrypted = false; }
      }
      
      if (client.taxId) {
        if (isEncrypted(client.taxId)) fieldStats.taxId.encrypted++;
        else { fieldStats.taxId.plain++; clientEncrypted = false; }
      }
      
      if (client.hourlyRate !== null && client.hourlyRate !== undefined) {
        if (isNumericEncrypted(client.hourlyRate)) fieldStats.hourlyRate.encrypted++;
        else { fieldStats.hourlyRate.plain++; clientEncrypted = false; }
      }
      
      if (clientEncrypted) encrypted++;
      else plainText++;
    }
    
    console.log(`Total Clients: ${total}`);
    console.log(`✅ Fully Encrypted: ${encrypted}`);
    console.log(`❌ Has Plain Text: ${plainText}\n`);
    
    console.log('Field-by-Field Status:');
    for (const [field, stats] of Object.entries(fieldStats)) {
      const totalField = stats.encrypted + stats.plain;
      if (totalField > 0) {
        const status = stats.plain === 0 ? '✅' : '❌';
        console.log(`  ${status} ${field}: ${stats.encrypted}/${totalField} encrypted`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking clients:', error.message);
  }
}

/**
 * Check implementation partner encryption status
 */
async function checkImplementationPartners() {
  console.log('\n🤝 IMPLEMENTATION PARTNER MODULE');
  console.log('─'.repeat(50));
  
  try {
    const partners = await ImplementationPartner.findAll();
    const total = partners.length;
    
    let encrypted = 0;
    let plainText = 0;
    
    const fieldStats = {
      name: { encrypted: 0, plain: 0 },
      email: { encrypted: 0, plain: 0 },
      phone: { encrypted: 0, plain: 0 },
      contactPerson: { encrypted: 0, plain: 0 },
      address: { encrypted: 0, plain: 0 }
    };
    
    for (const partner of partners) {
      let partnerEncrypted = true;
      
      if (partner.name) {
        if (isEncrypted(partner.name)) fieldStats.name.encrypted++;
        else { fieldStats.name.plain++; partnerEncrypted = false; }
      }
      
      if (partner.email) {
        if (isEncrypted(partner.email)) fieldStats.email.encrypted++;
        else { fieldStats.email.plain++; partnerEncrypted = false; }
      }
      
      if (partner.phone) {
        if (isEncrypted(partner.phone)) fieldStats.phone.encrypted++;
        else { fieldStats.phone.plain++; partnerEncrypted = false; }
      }
      
      if (partner.contactPerson) {
        if (isEncrypted(partner.contactPerson)) fieldStats.contactPerson.encrypted++;
        else { fieldStats.contactPerson.plain++; partnerEncrypted = false; }
      }
      
      if (partner.address) {
        if (isEncrypted(partner.address)) fieldStats.address.encrypted++;
        else { fieldStats.address.plain++; partnerEncrypted = false; }
      }
      
      if (partnerEncrypted) encrypted++;
      else plainText++;
    }
    
    console.log(`Total Implementation Partners: ${total}`);
    console.log(`✅ Fully Encrypted: ${encrypted}`);
    console.log(`❌ Has Plain Text: ${plainText}\n`);
    
    console.log('Field-by-Field Status:');
    for (const [field, stats] of Object.entries(fieldStats)) {
      const totalField = stats.encrypted + stats.plain;
      if (totalField > 0) {
        const status = stats.plain === 0 ? '✅' : '❌';
        console.log(`  ${status} ${field}: ${stats.encrypted}/${totalField} encrypted`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking implementation partners:', error.message);
  }
}

/**
 * Check leave request encryption status
 */
async function checkLeaveRequests() {
  console.log('\n📅 LEAVE MANAGEMENT MODULE');
  console.log('─'.repeat(50));
  
  try {
    const requests = await LeaveRequest.findAll();
    const total = requests.length;
    
    let encrypted = 0;
    let plainText = 0;
    
    const fieldStats = {
      reason: { encrypted: 0, plain: 0 },
      reviewComments: { encrypted: 0, plain: 0 },
      attachmentName: { encrypted: 0, plain: 0 }
    };
    
    for (const request of requests) {
      let requestEncrypted = true;
      
      if (request.reason) {
        if (isEncrypted(request.reason)) fieldStats.reason.encrypted++;
        else { fieldStats.reason.plain++; requestEncrypted = false; }
      }
      
      if (request.reviewComments) {
        if (isEncrypted(request.reviewComments)) fieldStats.reviewComments.encrypted++;
        else { fieldStats.reviewComments.plain++; requestEncrypted = false; }
      }
      
      if (request.attachmentName) {
        if (isEncrypted(request.attachmentName)) fieldStats.attachmentName.encrypted++;
        else { fieldStats.attachmentName.plain++; requestEncrypted = false; }
      }
      
      if (requestEncrypted) encrypted++;
      else plainText++;
    }
    
    console.log(`Total Leave Requests: ${total}`);
    console.log(`✅ Fully Encrypted: ${encrypted}`);
    console.log(`❌ Has Plain Text: ${plainText}\n`);
    
    console.log('Field-by-Field Status:');
    for (const [field, stats] of Object.entries(fieldStats)) {
      const totalField = stats.encrypted + stats.plain;
      if (totalField > 0) {
        const status = stats.plain === 0 ? '✅' : '❌';
        console.log(`  ${status} ${field}: ${stats.encrypted}/${totalField} encrypted`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking leave requests:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🔍 ========================================');
  console.log('🔍 ENCRYPTION STATUS CHECK');
  console.log('🔍 ========================================');
  
  if (!process.env.ENCRYPTION_KEY) {
    console.log('\n⚠️  WARNING: ENCRYPTION_KEY not set in .env file');
    console.log('Encryption will not work without this key!\n');
  } else {
    console.log('\n✅ Encryption key is configured\n');
  }
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    await checkEmployees();
    await checkVendors();
    await checkClients();
    await checkImplementationPartners();
    await checkLeaveRequests();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 SUMMARY');
    console.log('─'.repeat(50));
    console.log('\nIf you see ❌ (plain text data):');
    console.log('  → Run the migration script to encrypt existing data');
    console.log('  → Command: node scripts/encryptExistingData.js');
    console.log('\nIf you see ✅ (all encrypted):');
    console.log('  → Your data is secure!');
    console.log('  → API responses will show decrypted data');
    console.log('\n' + '='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the check
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
