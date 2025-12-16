/**
 * Data Migration Script: Encrypt Existing Plain Text Data
 * 
 * This script encrypts all existing plain text data in the database
 * for Employee, Vendor, Client, Implementation Partner, and Leave Management modules
 * 
 * IMPORTANT: 
 * - Backup your database before running this script
 * - Ensure ENCRYPTION_KEY is set in .env file
 * - Run this script only once
 * 
 * Usage: node scripts/encryptExistingData.js
 */

require('dotenv').config();
const { models, sequelize } = require('../models');
const DataEncryptionService = require('../services/DataEncryptionService');
const encryptionService = require('../utils/encryptionService');

const { Employee, Vendor, Client, ImplementationPartner, LeaveRequest } = models;

// Helper function to check if data is already encrypted
function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  // Encrypted format: iv:authTag:encryptedData (3 parts separated by colons)
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
}

// Helper function to check if a numeric field is encrypted
function isNumericEncrypted(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return false; // Plain number
  return isEncrypted(String(value));
}

/**
 * Encrypt all employees
 */
async function encryptEmployees() {
  console.log('\n📋 Starting Employee encryption...');
  
  try {
    const employees = await Employee.findAll();
    console.log(`Found ${employees.length} employees to process`);
    
    let encrypted = 0;
    let skipped = 0;
    
    for (const employee of employees) {
      let needsUpdate = false;
      const updates = {};
      
      // Check and encrypt text fields
      if (employee.firstName && !isEncrypted(employee.firstName)) {
        updates.firstName = encryptionService.encrypt(employee.firstName);
        needsUpdate = true;
      }
      
      if (employee.lastName && !isEncrypted(employee.lastName)) {
        updates.lastName = encryptionService.encrypt(employee.lastName);
        needsUpdate = true;
      }
      
      if (employee.email && !isEncrypted(employee.email)) {
        updates.email = encryptionService.encrypt(employee.email);
        needsUpdate = true;
      }
      
      if (employee.phone && !isEncrypted(employee.phone)) {
        updates.phone = encryptionService.encrypt(employee.phone);
        needsUpdate = true;
      }
      
      if (employee.contactInfo && !isEncrypted(employee.contactInfo)) {
        updates.contactInfo = encryptionService.encrypt(employee.contactInfo);
        needsUpdate = true;
      }
      
      // Check and encrypt numeric fields
      if (employee.hourlyRate !== null && employee.hourlyRate !== undefined && !isNumericEncrypted(employee.hourlyRate)) {
        updates.hourlyRate = encryptionService.encryptNumber(employee.hourlyRate);
        needsUpdate = true;
      }
      
      if (employee.salaryAmount !== null && employee.salaryAmount !== undefined && !isNumericEncrypted(employee.salaryAmount)) {
        updates.salaryAmount = encryptionService.encryptNumber(employee.salaryAmount);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await employee.update(updates);
        encrypted++;
        console.log(`✅ Encrypted employee: ${employee.id}`);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n✅ Employee encryption complete: ${encrypted} encrypted, ${skipped} skipped (already encrypted)`);
  } catch (error) {
    console.error('❌ Error encrypting employees:', error);
    throw error;
  }
}

/**
 * Encrypt all vendors
 */
async function encryptVendors() {
  console.log('\n📋 Starting Vendor encryption...');
  
  try {
    const vendors = await Vendor.findAll();
    console.log(`Found ${vendors.length} vendors to process`);
    
    let encrypted = 0;
    let skipped = 0;
    
    for (const vendor of vendors) {
      let needsUpdate = false;
      const updates = {};
      
      if (vendor.name && !isEncrypted(vendor.name)) {
        updates.name = encryptionService.encrypt(vendor.name);
        needsUpdate = true;
      }
      
      if (vendor.email && !isEncrypted(vendor.email)) {
        updates.email = encryptionService.encrypt(vendor.email);
        needsUpdate = true;
      }
      
      if (vendor.phone && !isEncrypted(vendor.phone)) {
        updates.phone = encryptionService.encrypt(vendor.phone);
        needsUpdate = true;
      }
      
      if (vendor.contactPerson && !isEncrypted(vendor.contactPerson)) {
        updates.contactPerson = encryptionService.encrypt(vendor.contactPerson);
        needsUpdate = true;
      }
      
      if (vendor.address && !isEncrypted(vendor.address)) {
        updates.address = encryptionService.encrypt(vendor.address);
        needsUpdate = true;
      }
      
      if (vendor.taxId && !isEncrypted(vendor.taxId)) {
        updates.taxId = encryptionService.encrypt(vendor.taxId);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await vendor.update(updates);
        encrypted++;
        console.log(`✅ Encrypted vendor: ${vendor.id} - ${vendor.name}`);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n✅ Vendor encryption complete: ${encrypted} encrypted, ${skipped} skipped (already encrypted)`);
  } catch (error) {
    console.error('❌ Error encrypting vendors:', error);
    throw error;
  }
}

/**
 * Encrypt all clients
 */
async function encryptClients() {
  console.log('\n📋 Starting Client encryption...');
  
  try {
    const clients = await Client.findAll();
    console.log(`Found ${clients.length} clients to process`);
    
    let encrypted = 0;
    let skipped = 0;
    
    for (const client of clients) {
      let needsUpdate = false;
      const updates = {};
      
      if (client.clientName && !isEncrypted(client.clientName)) {
        updates.clientName = encryptionService.encrypt(client.clientName);
        needsUpdate = true;
      }
      
      if (client.legalName && !isEncrypted(client.legalName)) {
        updates.legalName = encryptionService.encrypt(client.legalName);
        needsUpdate = true;
      }
      
      if (client.contactPerson && !isEncrypted(client.contactPerson)) {
        updates.contactPerson = encryptionService.encrypt(client.contactPerson);
        needsUpdate = true;
      }
      
      if (client.email && !isEncrypted(client.email)) {
        updates.email = encryptionService.encrypt(client.email);
        needsUpdate = true;
      }
      
      if (client.phone && !isEncrypted(client.phone)) {
        updates.phone = encryptionService.encrypt(client.phone);
        needsUpdate = true;
      }
      
      if (client.billingAddress && !isEncrypted(client.billingAddress)) {
        updates.billingAddress = encryptionService.encrypt(client.billingAddress);
        needsUpdate = true;
      }
      
      if (client.shippingAddress && !isEncrypted(client.shippingAddress)) {
        updates.shippingAddress = encryptionService.encrypt(client.shippingAddress);
        needsUpdate = true;
      }
      
      if (client.taxId && !isEncrypted(client.taxId)) {
        updates.taxId = encryptionService.encrypt(client.taxId);
        needsUpdate = true;
      }
      
      if (client.hourlyRate !== null && client.hourlyRate !== undefined && !isNumericEncrypted(client.hourlyRate)) {
        updates.hourlyRate = encryptionService.encryptNumber(client.hourlyRate);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await client.update(updates);
        encrypted++;
        console.log(`✅ Encrypted client: ${client.id}`);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n✅ Client encryption complete: ${encrypted} encrypted, ${skipped} skipped (already encrypted)`);
  } catch (error) {
    console.error('❌ Error encrypting clients:', error);
    throw error;
  }
}

/**
 * Encrypt all implementation partners
 */
async function encryptImplementationPartners() {
  console.log('\n📋 Starting Implementation Partner encryption...');
  
  try {
    const partners = await ImplementationPartner.findAll();
    console.log(`Found ${partners.length} implementation partners to process`);
    
    let encrypted = 0;
    let skipped = 0;
    
    for (const partner of partners) {
      let needsUpdate = false;
      const updates = {};
      
      if (partner.name && !isEncrypted(partner.name)) {
        updates.name = encryptionService.encrypt(partner.name);
        needsUpdate = true;
      }
      
      if (partner.email && !isEncrypted(partner.email)) {
        updates.email = encryptionService.encrypt(partner.email);
        needsUpdate = true;
      }
      
      if (partner.phone && !isEncrypted(partner.phone)) {
        updates.phone = encryptionService.encrypt(partner.phone);
        needsUpdate = true;
      }
      
      if (partner.contactPerson && !isEncrypted(partner.contactPerson)) {
        updates.contactPerson = encryptionService.encrypt(partner.contactPerson);
        needsUpdate = true;
      }
      
      if (partner.address && !isEncrypted(partner.address)) {
        updates.address = encryptionService.encrypt(partner.address);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await partner.update(updates);
        encrypted++;
        console.log(`✅ Encrypted implementation partner: ${partner.id}`);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n✅ Implementation Partner encryption complete: ${encrypted} encrypted, ${skipped} skipped (already encrypted)`);
  } catch (error) {
    console.error('❌ Error encrypting implementation partners:', error);
    throw error;
  }
}

/**
 * Encrypt all leave requests
 */
async function encryptLeaveRequests() {
  console.log('\n📋 Starting Leave Request encryption...');
  
  try {
    const leaveRequests = await LeaveRequest.findAll();
    console.log(`Found ${leaveRequests.length} leave requests to process`);
    
    let encrypted = 0;
    let skipped = 0;
    
    for (const request of leaveRequests) {
      let needsUpdate = false;
      const updates = {};
      
      if (request.reason && !isEncrypted(request.reason)) {
        updates.reason = encryptionService.encrypt(request.reason);
        needsUpdate = true;
      }
      
      if (request.reviewComments && !isEncrypted(request.reviewComments)) {
        updates.reviewComments = encryptionService.encrypt(request.reviewComments);
        needsUpdate = true;
      }
      
      if (request.attachmentName && !isEncrypted(request.attachmentName)) {
        updates.attachmentName = encryptionService.encrypt(request.attachmentName);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await request.update(updates);
        encrypted++;
        console.log(`✅ Encrypted leave request: ${request.id}`);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n✅ Leave Request encryption complete: ${encrypted} encrypted, ${skipped} skipped (already encrypted)`);
  } catch (error) {
    console.error('❌ Error encrypting leave requests:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔐 ========================================');
  console.log('🔐 DATA ENCRYPTION MIGRATION SCRIPT');
  console.log('🔐 ========================================\n');
  
  // Check if encryption key is set
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ERROR: ENCRYPTION_KEY not set in .env file');
    console.error('Please set ENCRYPTION_KEY before running this script');
    console.error('Generate a key using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }
  
  console.log('✅ Encryption key found');
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  // Confirm before proceeding
  console.log('⚠️  WARNING: This script will encrypt all plain text data in the database');
  console.log('⚠️  Make sure you have backed up your database before proceeding\n');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Encrypt all modules
      await encryptEmployees();
      await encryptVendors();
      await encryptClients();
      await encryptImplementationPartners();
      await encryptLeaveRequests();
      
      // Commit transaction
      await transaction.commit();
      
      console.log('\n🎉 ========================================');
      console.log('🎉 ENCRYPTION MIGRATION COMPLETED SUCCESSFULLY');
      console.log('🎉 ========================================\n');
      
      console.log('✅ All existing data has been encrypted');
      console.log('✅ New data will be automatically encrypted');
      console.log('✅ API responses will return decrypted data\n');
      
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('\n❌ Error during encryption, rolling back changes');
      throw error;
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('👋 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
