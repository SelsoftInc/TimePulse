/**
 * Data Encryption Service
 * Handles encryption/decryption of sensitive data for Timesheet and Invoice modules
 * Works at the API layer - encrypts before DB save, decrypts after DB fetch
 */

const encryptionService = require('../utils/encryptionService');

class DataEncryptionService {
  /**
   * Encrypt timesheet data before saving to database
   * @param {Object} timesheetData - Plain timesheet data from frontend
   * @returns {Object} Timesheet data with encrypted sensitive fields
   */
  static encryptTimesheetData(timesheetData) {
    if (!timesheetData) return timesheetData;

    const encrypted = { ...timesheetData };

    try {
      // Encrypt text fields
      if (encrypted.notes) {
        encrypted.notes = encryptionService.encrypt(encrypted.notes);
      }
      
      if (encrypted.employeeName) {
        encrypted.employeeName = encryptionService.encrypt(encrypted.employeeName);
      }
      
      if (encrypted.overtimeComment) {
        encrypted.overtimeComment = encryptionService.encrypt(encrypted.overtimeComment);
      }
      
      if (encrypted.rejectionReason) {
        encrypted.rejectionReason = encryptionService.encrypt(encrypted.rejectionReason);
      }

      // Encrypt JSONB fields by converting to encrypted string then back to object
      if (encrypted.dailyHours && typeof encrypted.dailyHours === 'object') {
        const encryptedStr = encryptionService.encrypt(JSON.stringify(encrypted.dailyHours));
        encrypted.dailyHours = { _encrypted: encryptedStr };
      }
      
      if (encrypted.overtimeDays && typeof encrypted.overtimeDays === 'object') {
        const encryptedStr = encryptionService.encrypt(JSON.stringify(encrypted.overtimeDays));
        encrypted.overtimeDays = { _encrypted: encryptedStr };
      }

      console.log('🔒 Timesheet data encrypted');
      return encrypted;
    } catch (error) {
      console.error('❌ Error encrypting timesheet data:', error);
      // Return original data if encryption fails
      return timesheetData;
    }
  }

  /**
   * Decrypt timesheet data after fetching from database
   * @param {Object} timesheetData - Encrypted timesheet data from database
   * @returns {Object} Timesheet data with decrypted sensitive fields
   */
  static decryptTimesheetData(timesheetData) {
    if (!timesheetData) return timesheetData;

    const decrypted = { ...timesheetData };

    try {
      // Decrypt text fields
      if (decrypted.notes && typeof decrypted.notes === 'string') {
        decrypted.notes = encryptionService.decrypt(decrypted.notes);
      }
      
      if (decrypted.employeeName && typeof decrypted.employeeName === 'string') {
        decrypted.employeeName = encryptionService.decrypt(decrypted.employeeName);
      }
      
      if (decrypted.overtimeComment && typeof decrypted.overtimeComment === 'string') {
        decrypted.overtimeComment = encryptionService.decrypt(decrypted.overtimeComment);
      }
      
      if (decrypted.rejectionReason && typeof decrypted.rejectionReason === 'string') {
        decrypted.rejectionReason = encryptionService.decrypt(decrypted.rejectionReason);
      }

      // Decrypt JSONB fields
      if (decrypted.dailyHours && typeof decrypted.dailyHours === 'object' && decrypted.dailyHours._encrypted) {
        const decryptedStr = encryptionService.decrypt(decrypted.dailyHours._encrypted);
        decrypted.dailyHours = JSON.parse(decryptedStr);
      }
      
      if (decrypted.overtimeDays && typeof decrypted.overtimeDays === 'object' && decrypted.overtimeDays._encrypted) {
        const decryptedStr = encryptionService.decrypt(decrypted.overtimeDays._encrypted);
        decrypted.overtimeDays = JSON.parse(decryptedStr);
      }

      console.log('🔓 Timesheet data decrypted');
      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting timesheet data:', error);
      // Return original data if decryption fails
      return timesheetData;
    }
  }

  /**
   * Decrypt array of timesheets
   * @param {Array} timesheets - Array of encrypted timesheets
   * @returns {Array} Array of decrypted timesheets
   */
  static decryptTimesheets(timesheets) {
    if (!Array.isArray(timesheets)) return timesheets;
    return timesheets.map(ts => this.decryptTimesheetData(ts));
  }

  /**
   * Encrypt invoice data before saving to database
   * @param {Object} invoiceData - Plain invoice data from frontend
   * @returns {Object} Invoice data with encrypted sensitive fields
   */
  static encryptInvoiceData(invoiceData) {
    if (!invoiceData) return invoiceData;

    const encrypted = { ...invoiceData };

    try {
      // Encrypt text fields
      if (encrypted.notes) {
        encrypted.notes = encryptionService.encrypt(encrypted.notes);
      }

      // Encrypt JSONB lineItems
      if (encrypted.lineItems && Array.isArray(encrypted.lineItems)) {
        const encryptedStr = encryptionService.encrypt(JSON.stringify(encrypted.lineItems));
        encrypted.lineItems = { _encrypted: encryptedStr };
      }

      console.log('🔒 Invoice data encrypted');
      return encrypted;
    } catch (error) {
      console.error('❌ Error encrypting invoice data:', error);
      // Return original data if encryption fails
      return invoiceData;
    }
  }

  /**
   * Decrypt invoice data after fetching from database
   * @param {Object} invoiceData - Encrypted invoice data from database
   * @returns {Object} Invoice data with decrypted sensitive fields
   */
  static decryptInvoiceData(invoiceData) {
    if (!invoiceData) return invoiceData;

    const decrypted = { ...invoiceData };

    try {
      // Decrypt text fields
      if (decrypted.notes && typeof decrypted.notes === 'string') {
        decrypted.notes = encryptionService.decrypt(decrypted.notes);
      }

      // Decrypt JSONB lineItems
      if (decrypted.lineItems && typeof decrypted.lineItems === 'object' && decrypted.lineItems._encrypted) {
        const decryptedStr = encryptionService.decrypt(decrypted.lineItems._encrypted);
        decrypted.lineItems = JSON.parse(decryptedStr);
      }

      console.log('🔓 Invoice data decrypted');
      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting invoice data:', error);
      // Return original data if decryption fails
      return invoiceData;
    }
  }

  /**
   * Decrypt array of invoices
   * @param {Array} invoices - Array of encrypted invoices
   * @returns {Array} Array of decrypted invoices
   */
  static decryptInvoices(invoices) {
    if (!Array.isArray(invoices)) return invoices;
    return invoices.map(inv => this.decryptInvoiceData(inv));
  }

  /**
   * Convert Sequelize instance to plain object and decrypt
   * @param {Object} instance - Sequelize model instance
   * @param {string} type - 'timesheet' or 'invoice'
   * @returns {Object} Decrypted plain object
   */
  static decryptInstance(instance, type) {
    if (!instance) return instance;
    
    const plainObject = instance.toJSON ? instance.toJSON() : instance;
    
    if (type === 'timesheet') {
      return this.decryptTimesheetData(plainObject);
    } else if (type === 'invoice') {
      return this.decryptInvoiceData(plainObject);
    }
    
    return plainObject;
  }

  /**
   * Convert array of Sequelize instances to plain objects and decrypt
   * @param {Array} instances - Array of Sequelize model instances
   * @param {string} type - 'timesheet' or 'invoice'
   * @returns {Array} Array of decrypted plain objects
   */
  static decryptInstances(instances, type) {
    if (!Array.isArray(instances)) return instances;
    return instances.map(inst => this.decryptInstance(inst, type));
  }

  // ==================== EMPLOYEE MODULE ====================

  /**
   * Encrypt employee data before saving to database
   * @param {Object} employeeData - Plain employee data from frontend
   * @returns {Object} Employee data with encrypted sensitive fields
   */
  static encryptEmployeeData(employeeData) {
    if (!employeeData) return employeeData;

    const encrypted = { ...employeeData };

    try {
      // Encrypt text fields - only if they exist and are non-empty strings
      if (encrypted.firstName && typeof encrypted.firstName === 'string' && encrypted.firstName.trim()) {
        encrypted.firstName = encryptionService.encrypt(encrypted.firstName);
      }
      
      if (encrypted.lastName && typeof encrypted.lastName === 'string' && encrypted.lastName.trim()) {
        encrypted.lastName = encryptionService.encrypt(encrypted.lastName);
      }
      
      if (encrypted.email && typeof encrypted.email === 'string' && encrypted.email.trim()) {
        encrypted.email = encryptionService.encrypt(encrypted.email);
      }
      
      if (encrypted.phone && typeof encrypted.phone === 'string' && encrypted.phone.trim()) {
        encrypted.phone = encryptionService.encrypt(encrypted.phone);
      }
      
      // Handle contactInfo - can be object or string
      if (encrypted.contactInfo) {
        if (typeof encrypted.contactInfo === 'object') {
          // If it's an object, stringify it first then encrypt
          const contactInfoStr = JSON.stringify(encrypted.contactInfo);
          if (contactInfoStr !== '{}' && contactInfoStr !== 'null') {
            encrypted.contactInfo = encryptionService.encrypt(contactInfoStr);
          } else {
            // Empty object, set to null or empty JSONB
            encrypted.contactInfo = {};
          }
        } else if (typeof encrypted.contactInfo === 'string' && encrypted.contactInfo.trim()) {
          // If it's already a string, it might be a JSON string from frontend
          // Try to parse it first to validate, then encrypt
          try {
            const parsed = JSON.parse(encrypted.contactInfo);
            const contactInfoStr = JSON.stringify(parsed);
            if (contactInfoStr !== '{}' && contactInfoStr !== 'null') {
              encrypted.contactInfo = encryptionService.encrypt(contactInfoStr);
            } else {
              encrypted.contactInfo = {};
            }
          } catch (e) {
            // Not valid JSON, encrypt as plain string
            encrypted.contactInfo = encryptionService.encrypt(encrypted.contactInfo);
          }
        } else {
          // Empty or null, set to empty JSONB
          encrypted.contactInfo = {};
        }
      }
      
      // Encrypt notes if present
      if (encrypted.notes && typeof encrypted.notes === 'string' && encrypted.notes.trim()) {
        encrypted.notes = encryptionService.encrypt(encrypted.notes);
      }

      // Don't encrypt numeric fields - database columns are DECIMAL type, not encrypted
      // Keep hourlyRate and salaryAmount as plain numbers to match database schema
      if (encrypted.hourlyRate !== null && encrypted.hourlyRate !== undefined && encrypted.hourlyRate !== '') {
        encrypted.hourlyRate = parseFloat(encrypted.hourlyRate);
      }
      
      if (encrypted.salaryAmount !== null && encrypted.salaryAmount !== undefined && encrypted.salaryAmount !== '') {
        encrypted.salaryAmount = parseFloat(encrypted.salaryAmount);
      }

      console.log('🔒 Employee data encrypted');
      return encrypted;
    } catch (error) {
      console.error('❌ Error encrypting employee data:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      // Return original data if encryption fails to prevent data loss
      return employeeData;
    }
  }

  /**
   * Decrypt employee data after fetching from database
   * TEMPORARY: Decryption bypassed to diagnose issues
   * @param {Object} employeeData - Employee data from database
   * @returns {Object} Employee data as-is
   */
  static decryptEmployeeData(employeeData) {
    if (!employeeData) return employeeData;

    // TEMPORARY: Return data as-is without decryption
    console.log('⚠️ DECRYPTION BYPASSED - Returning data as-is');
    console.log('📋 Sample data:', {
      firstName: employeeData.firstName?.substring(0, 50),
      lastName: employeeData.lastName?.substring(0, 50),
      email: employeeData.email?.substring(0, 50)
    });
    return employeeData;
  }

  /**
   * Decrypt array of employees
   * @param {Array} employees - Array of employees
   * @returns {Array} Array of employees
   */
  static decryptEmployees(employees) {
    if (!Array.isArray(employees)) return employees;
    return employees.map(emp => this.decryptEmployeeData(emp));
  }

  // ==================== VENDOR MODULE ====================

  /**
   * Decrypt vendor data after fetching from database
   * @param {Object} vendorData - Vendor data from database
   * @returns {Object} Vendor data
   */
  static decryptVendorData(vendorData) {
      if (!encryptedText || typeof encryptedText !== 'string') {
        return encryptedText;
      }
      
      console.log('🔍 Attempting to decrypt:', encryptedText.substring(0, 50) + '...');
      
      // Method 1: Check if it's in the new format (iv:authTag:data)
      if (encryptedText.includes(':') && encryptedText.split(':').length === 3) {
        try {
          console.log('📦 Trying new encryption format (iv:authTag:data)');
          const result = encryptionService.decrypt(encryptedText);
          if (result && result !== encryptedText) {
            console.log('✅ Decrypted (new format):', result);
            return result;
          }
        } catch (error) {
          console.log('❌ New format failed:', error.message);
        }
      }
      
      // Method 2: Try CryptoJS AES with default key
      try {
        console.log('📦 Trying CryptoJS AES with default key');
        const bytes = CryptoJS.AES.decrypt(encryptedText, DECRYPTION_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        
        if (decryptedString && decryptedString.length > 0) {
          console.log('✅ Successfully decrypted with CryptoJS:', decryptedString);
          return decryptedString;
        }
      } catch (error) {
        console.log('❌ CryptoJS default key failed:', error.message);
      }
      
      // Method 3: Try with alternative key (timepulse-encryption-key)
      try {
        console.log('📦 Trying CryptoJS AES with alternative key');
        const altKey = 'timepulse-encryption-key';
        const bytes = CryptoJS.AES.decrypt(encryptedText, altKey);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        
        if (decryptedString && decryptedString.length > 0) {
          console.log('✅ Successfully decrypted with alternative key:', decryptedString);
          return decryptedString;
        }
      } catch (error) {
        console.log('❌ Alternative key failed:', error.message);
      }
      
      // Method 4: Check if it's already plain text (not encrypted)
      // If it looks like a readable string, return it as-is
      if (encryptedText.length < 100 && /^[a-zA-Z\s]+$/.test(encryptedText)) {
        console.log('✅ Data appears to be plain text, returning as-is');
        return encryptedText;
      }
      
      console.warn('⚠️ All decryption methods failed, returning original encrypted text');
      return encryptedText;
    };

    try {
      console.log('🔓 Starting employee data decryption...');
      console.log('📋 Original firstName:', decrypted.firstName?.substring(0, 50));
      console.log('📋 Original lastName:', decrypted.lastName?.substring(0, 50));
      
      // Decrypt text fields
      if (decrypted.firstName && typeof decrypted.firstName === 'string') {
        console.log('🔐 Decrypting firstName...');
        decrypted.firstName = decryptLegacy(decrypted.firstName);
        console.log('✅ firstName after decryption:', decrypted.firstName);
      }
      
      if (decrypted.lastName && typeof decrypted.lastName === 'string') {
        console.log('🔐 Decrypting lastName...');
        decrypted.lastName = decryptLegacy(decrypted.lastName);
        console.log('✅ lastName after decryption:', decrypted.lastName);
      }
      
      if (decrypted.email && typeof decrypted.email === 'string') {
        decrypted.email = decryptLegacy(decrypted.email);
      }
      
      if (decrypted.phone && typeof decrypted.phone === 'string') {
        decrypted.phone = decryptLegacy(decrypted.phone);
      }
      
      // Decrypt contactInfo and parse if it's a JSON string
      if (decrypted.contactInfo && typeof decrypted.contactInfo === 'string') {
        const decryptedContactInfo = decryptLegacy(decrypted.contactInfo);
        // Try to parse as JSON if it looks like JSON
        if (decryptedContactInfo && (decryptedContactInfo.startsWith('{') || decryptedContactInfo.startsWith('['))) {
          try {
            decrypted.contactInfo = JSON.parse(decryptedContactInfo);
          } catch (e) {
            // If parsing fails, keep as string
            decrypted.contactInfo = decryptedContactInfo;
          }
        } else {
          decrypted.contactInfo = decryptedContactInfo;
        }
      }
      
      if (decrypted.notes && typeof decrypted.notes === 'string') {
        decrypted.notes = decryptLegacy(decrypted.notes);
      }

      // Numeric fields are NOT encrypted (database columns are DECIMAL type)
      // Just ensure they are numbers
      if (decrypted.hourlyRate !== null && decrypted.hourlyRate !== undefined) {
        decrypted.hourlyRate = parseFloat(decrypted.hourlyRate) || 0;
      }
      
      if (decrypted.salaryAmount !== null && decrypted.salaryAmount !== undefined) {
        decrypted.salaryAmount = parseFloat(decrypted.salaryAmount) || 0;
      }

      console.log('🔓 Employee data decrypted successfully');
      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting employee data:', error);
      return employeeData;
    }
  }

  /**
   * Decrypt array of employees
   * @param {Array} employees - Array of encrypted employees
   * @returns {Array} Array of decrypted employees
   */
  static decryptEmployees(employees) {
    if (!Array.isArray(employees)) return employees;
    return employees.map(emp => this.decryptEmployeeData(emp));
  }

  // ==================== VENDOR MODULE ====================

  /**
   * Encrypt vendor data before saving to database
   * @param {Object} vendorData - Plain vendor data from frontend
   * @returns {Object} Vendor data with encrypted sensitive fields
   */
  static encryptVendorData(vendorData) {
    if (!vendorData) return vendorData;

    const encrypted = { ...vendorData };

    try {
      // Encrypt text fields
      if (encrypted.name) {
        encrypted.name = encryptionService.encrypt(encrypted.name);
      }
      
      if (encrypted.email) {
        encrypted.email = encryptionService.encrypt(encrypted.email);
      }
      
      if (encrypted.phone) {
        encrypted.phone = encryptionService.encrypt(encrypted.phone);
      }
      
      if (encrypted.contactPerson) {
        encrypted.contactPerson = encryptionService.encrypt(encrypted.contactPerson);
      }
      
      if (encrypted.address) {
        encrypted.address = encryptionService.encrypt(encrypted.address);
      }
      
      if (encrypted.taxId) {
        encrypted.taxId = encryptionService.encrypt(encrypted.taxId);
      }

      console.log('🔒 Vendor data encrypted');
      return encrypted;
    } catch (error) {
      console.error('❌ Error encrypting vendor data:', error);
      return vendorData;
    }
  }

  /**
   * Decrypt vendor data after fetching from database
   * @param {Object} vendorData - Encrypted vendor data from database
   * @returns {Object} Vendor data with decrypted sensitive fields
   */
  static decryptVendorData(vendorData) {
    if (!vendorData) return vendorData;

    const decrypted = { ...vendorData };

    try {
      // Decrypt text fields
      if (decrypted.name && typeof decrypted.name === 'string') {
        decrypted.name = encryptionService.decrypt(decrypted.name);
      }
      
      if (decrypted.email && typeof decrypted.email === 'string') {
        decrypted.email = encryptionService.decrypt(decrypted.email);
      }
      
      if (decrypted.phone && typeof decrypted.phone === 'string') {
        decrypted.phone = encryptionService.decrypt(decrypted.phone);
      }
      
      if (decrypted.contactPerson && typeof decrypted.contactPerson === 'string') {
        decrypted.contactPerson = encryptionService.decrypt(decrypted.contactPerson);
      }
      
      if (decrypted.address && typeof decrypted.address === 'string') {
        decrypted.address = encryptionService.decrypt(decrypted.address);
      }
      
      if (decrypted.taxId && typeof decrypted.taxId === 'string') {
        decrypted.taxId = encryptionService.decrypt(decrypted.taxId);
      }

      console.log('🔓 Vendor data decrypted');
      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting vendor data:', error);
      return vendorData;
    }
  }

  /**
   * Decrypt array of vendors
   * @param {Array} vendors - Array of encrypted vendors
   * @returns {Array} Array of decrypted vendors
   */
  static decryptVendors(vendors) {
    if (!Array.isArray(vendors)) return vendors;
    return vendors.map(vendor => this.decryptVendorData(vendor));
  }

  // ==================== CLIENT MODULE ====================

  /**
   * Encrypt client data before saving to database
   * @param {Object} clientData - Plain client data from frontend
   * @returns {Object} Client data with encrypted sensitive fields
   */
  static encryptClientData(clientData) {
    if (!clientData) return clientData;

    const encrypted = { ...clientData };

    try {
      // Encrypt text fields
      if (encrypted.clientName) {
        encrypted.clientName = encryptionService.encrypt(encrypted.clientName);
      }
      
      if (encrypted.name) {
        encrypted.name = encryptionService.encrypt(encrypted.name);
      }
      
      if (encrypted.legalName) {
        encrypted.legalName = encryptionService.encrypt(encrypted.legalName);
      }
      
      if (encrypted.contactPerson) {
        encrypted.contactPerson = encryptionService.encrypt(encrypted.contactPerson);
      }
      
      if (encrypted.email) {
        encrypted.email = encryptionService.encrypt(encrypted.email);
      }
      
      if (encrypted.phone) {
        encrypted.phone = encryptionService.encrypt(encrypted.phone);
      }
      
      if (encrypted.billingAddress) {
        encrypted.billingAddress = encryptionService.encrypt(encrypted.billingAddress);
      }
      
      if (encrypted.shippingAddress) {
        encrypted.shippingAddress = encryptionService.encrypt(encrypted.shippingAddress);
      }
      
      if (encrypted.taxId) {
        encrypted.taxId = encryptionService.encrypt(encrypted.taxId);
      }

      // Encrypt numeric fields
      if (encrypted.hourlyRate !== null && encrypted.hourlyRate !== undefined) {
        encrypted.hourlyRate = encryptionService.encryptNumber(encrypted.hourlyRate);
      }

      console.log('🔒 Client data encrypted');
      return encrypted;
    } catch (error) {
      console.error('❌ Error encrypting client data:', error);
      return clientData;
    }
  }

  /**
   * Decrypt client data after fetching from database
   * @param {Object} clientData - Encrypted client data from database
   * @returns {Object} Client data with decrypted sensitive fields
   */
  static decryptClientData(clientData) {
    if (!clientData) return clientData;

    const decrypted = { ...clientData };

    try {
      // Decrypt text fields
      if (decrypted.clientName && typeof decrypted.clientName === 'string') {
        decrypted.clientName = encryptionService.decrypt(decrypted.clientName);
      }
      
      if (decrypted.name && typeof decrypted.name === 'string') {
        decrypted.name = encryptionService.decrypt(decrypted.name);
      }
      
      if (decrypted.legalName && typeof decrypted.legalName === 'string') {
        decrypted.legalName = encryptionService.decrypt(decrypted.legalName);
      }
      
      if (decrypted.contactPerson && typeof decrypted.contactPerson === 'string') {
        decrypted.contactPerson = encryptionService.decrypt(decrypted.contactPerson);
      }
      
      if (decrypted.email && typeof decrypted.email === 'string') {
        decrypted.email = encryptionService.decrypt(decrypted.email);
      }
      
      if (decrypted.phone && typeof decrypted.phone === 'string') {
        decrypted.phone = encryptionService.decrypt(decrypted.phone);
      }
      
      if (decrypted.billingAddress && typeof decrypted.billingAddress === 'string') {
        decrypted.billingAddress = encryptionService.decrypt(decrypted.billingAddress);
      }
      
      if (decrypted.shippingAddress && typeof decrypted.shippingAddress === 'string') {
        decrypted.shippingAddress = encryptionService.decrypt(decrypted.shippingAddress);
      }
      
      if (decrypted.taxId && typeof decrypted.taxId === 'string') {
        decrypted.taxId = encryptionService.decrypt(decrypted.taxId);
      }

      // Decrypt numeric fields
      if (decrypted.hourlyRate !== null && decrypted.hourlyRate !== undefined) {
        decrypted.hourlyRate = encryptionService.decryptNumber(decrypted.hourlyRate);
      }

      console.log('🔓 Client data decrypted');
      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting client data:', error);
      return clientData;
    }
  }

  /**
   * Decrypt array of clients
   * @param {Array} clients - Array of encrypted clients
   * @returns {Array} Array of decrypted clients
   */
  static decryptClients(clients) {
    if (!Array.isArray(clients)) return clients;
    return clients.map(client => this.decryptClientData(client));
  }

  // ==================== IMPLEMENTATION PARTNER MODULE ====================

  /**
   * Encrypt implementation partner data before saving to database
   * @param {Object} partnerData - Plain implementation partner data from frontend
   * @returns {Object} Implementation partner data with encrypted sensitive fields
   */
  static encryptImplementationPartnerData(partnerData) {
    if (!partnerData) return partnerData;

    const encrypted = { ...partnerData };

    try {
      // Encrypt text fields
      if (encrypted.name) {
        encrypted.name = encryptionService.encrypt(encrypted.name);
      }
      
      if (encrypted.email) {
        encrypted.email = encryptionService.encrypt(encrypted.email);
      }
      
      if (encrypted.phone) {
        encrypted.phone = encryptionService.encrypt(encrypted.phone);
      }
      
      if (encrypted.contactPerson) {
        encrypted.contactPerson = encryptionService.encrypt(encrypted.contactPerson);
      }
      
      // Note: address is handled as JSONB in the route, not encrypted here

      console.log('🔒 Implementation Partner data encrypted');
      return encrypted;
    } catch (error) {
      console.error('❌ Error encrypting implementation partner data:', error);
      return partnerData;
    }
  }

  /**
   * Decrypt implementation partner data after fetching from database
   * @param {Object} partnerData - Encrypted implementation partner data from database
   * @returns {Object} Implementation partner data with decrypted sensitive fields
   */
  static decryptImplementationPartnerData(partnerData) {
    if (!partnerData) return partnerData;

    const decrypted = { ...partnerData };

    try {
      // Decrypt text fields
      if (decrypted.name && typeof decrypted.name === 'string') {
        decrypted.name = encryptionService.decrypt(decrypted.name);
      }
      
      if (decrypted.email && typeof decrypted.email === 'string') {
        decrypted.email = encryptionService.decrypt(decrypted.email);
      }
      
      if (decrypted.phone && typeof decrypted.phone === 'string') {
        decrypted.phone = encryptionService.decrypt(decrypted.phone);
      }
      
      if (decrypted.contactPerson && typeof decrypted.contactPerson === 'string') {
        decrypted.contactPerson = encryptionService.decrypt(decrypted.contactPerson);
      }
      
      // Note: address is handled as JSONB in the route, not decrypted here

      console.log('🔓 Implementation Partner data decrypted');
      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting implementation partner data:', error);
      return partnerData;
    }
  }

  /**
   * Decrypt array of implementation partners
   * @param {Array} partners - Array of encrypted implementation partners
   * @returns {Array} Array of decrypted implementation partners
   */
  static decryptImplementationPartners(partners) {
    if (!Array.isArray(partners)) return partners;
    return partners.map(partner => this.decryptImplementationPartnerData(partner));
  }

  // ==================== LEAVE MANAGEMENT MODULE ====================

  /**
   * Encrypt leave request data before saving to database
   * @param {Object} leaveData - Plain leave request data from frontend
   * @returns {Object} Leave request data with encrypted sensitive fields
   */
  static encryptLeaveRequestData(leaveData) {
    if (!leaveData) return leaveData;

    const encrypted = { ...leaveData };

    try {
      // Encrypt text fields
      if (encrypted.reason) {
        encrypted.reason = encryptionService.encrypt(encrypted.reason);
      }
      
      if (encrypted.reviewComments) {
        encrypted.reviewComments = encryptionService.encrypt(encrypted.reviewComments);
      }
      
      if (encrypted.attachmentName) {
        encrypted.attachmentName = encryptionService.encrypt(encrypted.attachmentName);
      }
      
      if (encrypted.employeeName) {
        encrypted.employeeName = encryptionService.encrypt(encrypted.employeeName);
      }

      console.log('🔒 Leave request data encrypted');
      return encrypted;
    } catch (error) {
      console.error('❌ Error encrypting leave request data:', error);
      return leaveData;
    }
  }

  /**
   * Decrypt leave request data after fetching from database
   * @param {Object} leaveData - Encrypted leave request data from database
   * @returns {Object} Leave request data with decrypted sensitive fields
   */
  static decryptLeaveRequestData(leaveData) {
    if (!leaveData) return leaveData;

    const decrypted = { ...leaveData };

    try {
      // Decrypt text fields
      if (decrypted.reason && typeof decrypted.reason === 'string') {
        decrypted.reason = encryptionService.decrypt(decrypted.reason);
      }
      
      if (decrypted.reviewComments && typeof decrypted.reviewComments === 'string') {
        decrypted.reviewComments = encryptionService.decrypt(decrypted.reviewComments);
      }
      
      if (decrypted.attachmentName && typeof decrypted.attachmentName === 'string') {
        decrypted.attachmentName = encryptionService.decrypt(decrypted.attachmentName);
      }
      
      if (decrypted.employeeName && typeof decrypted.employeeName === 'string') {
        decrypted.employeeName = encryptionService.decrypt(decrypted.employeeName);
      }

      console.log('🔓 Leave request data decrypted');
      return decrypted;
    } catch (error) {
      console.error('❌ Error decrypting leave request data:', error);
      return leaveData;
    }
  }

  /**
   * Decrypt array of leave requests
   * @param {Array} leaveRequests - Array of encrypted leave requests
   * @returns {Array} Array of decrypted leave requests
   */
  static decryptLeaveRequests(leaveRequests) {
    if (!Array.isArray(leaveRequests)) return leaveRequests;
    return leaveRequests.map(leave => this.decryptLeaveRequestData(leave));
  }
}

module.exports = DataEncryptionService;
