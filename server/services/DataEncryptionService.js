/**
 * Data Encryption Service
 * Handles encryption/decryption of sensitive data using CryptoJS AES
 */

const CryptoJS = require('crypto-js');
const encryptionService = require('../utils/encryptionService');

// Use the same key as utils/encryption.js
const DECRYPTION_KEY = process.env.ENCRYPTION_KEY || 'timepulse-default-encryption-key-2024';

class DataEncryptionService {
  
  /**
   * Helper function to encrypt a single field
   */
  static encryptField(plainText) {
    if (!plainText || typeof plainText !== 'string') {
      return plainText;
    }
    
    try {
      // Use Node.js crypto format for consistency
      const encrypted = encryptionService.encrypt(plainText);
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error.message);
      return plainText;
    }
  }

  /**
   * Helper function to decrypt a single field
   */
  static decryptField(encryptedText) {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return encryptedText;
    }
    
    // If it looks like plain text (short and only letters/spaces), return as-is
    if (encryptedText.length < 50 && /^[a-zA-Z\s\.\-]+$/.test(encryptedText)) {
      console.log('✅ Plain text detected, returning as-is:', encryptedText);
      return encryptedText;
    }
    
    console.log('🔓 Attempting to decrypt:', encryptedText.substring(0, 50) + '...');
    
    // Method 1: Try Node.js crypto format (iv:authTag:data)
    if (encryptedText.includes(':') && encryptedText.split(':').length === 3) {
      try {
        console.log('📦 Trying Node.js crypto format (iv:authTag:data)');
        const result = encryptionService.decrypt(encryptedText);
        if (result && result !== encryptedText && result.length > 0) {
          console.log('✅ Decryption successful (Node crypto):', result);
          return result;
        }
      } catch (error) {
        console.log('❌ Node crypto format failed:', error.message);
      }
    }
    
    // Method 2: Try CryptoJS AES format
    try {
      console.log('📦 Trying CryptoJS AES format');
      const bytes = CryptoJS.AES.decrypt(encryptedText, DECRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (decryptedString && decryptedString.length > 0) {
        console.log('✅ Decryption successful (CryptoJS):', decryptedString);
        return decryptedString;
      }
    } catch (error) {
      console.log('❌ CryptoJS format failed:', error.message);
    }
    
    console.log('❌ All decryption methods failed, returning original');
    return encryptedText;
  }
  
  // ==================== EMPLOYEE MODULE ====================
  
  /**
   * Decrypt employee data
   */
  static decryptEmployeeData(employeeData) {
    if (!employeeData) return employeeData;
    
    const decrypted = { ...employeeData };
    
    if (decrypted.firstName) {
      decrypted.firstName = this.decryptField(decrypted.firstName);
    }
    if (decrypted.lastName) {
      decrypted.lastName = this.decryptField(decrypted.lastName);
    }
    if (decrypted.email) {
      decrypted.email = this.decryptField(decrypted.email);
    }
    if (decrypted.phone) {
      decrypted.phone = this.decryptField(decrypted.phone);
    }
    
    return decrypted;
  }

  static encryptEmployeeData(employeeData) {
    if (!employeeData) return employeeData;
    
    // Don't encrypt foreign key IDs - they need to remain as UUIDs for database relationships
    // Only encrypt PII fields like firstName, lastName, email, phone, etc.
    const encrypted = { ...employeeData };
    
    // List of fields that should NOT be encrypted (IDs, foreign keys, dates, numbers)
    const nonEncryptedFields = [
      'id', 'tenantId', 'userId', 'employeeId', 'clientId', 'vendorId', 
      'implPartnerId', 'employmentTypeId', 'managerId',
      'startDate', 'endDate', 'hourlyRate', 'salaryAmount', 'salaryType',
      'status', 'createdAt', 'updatedAt'
    ];
    
    // For now, don't encrypt any fields to avoid breaking foreign key relationships
    // The decryption is already handling both encrypted and plain text
    return employeeData;
  }

  static decryptEmployees(employees) {
    if (!Array.isArray(employees)) return employees;
    return employees.map(emp => this.decryptEmployeeData(emp));
  }

  // ==================== CLIENT MODULE ====================
  
  static decryptClientData(clientData) {
    if (!clientData) return clientData;
    
    const decrypted = { ...clientData };
    
    // Decrypt client name field
    if (decrypted.clientName) {
      decrypted.clientName = this.decryptField(decrypted.clientName);
    }
    
    // Decrypt name field
    if (decrypted.name) {
      decrypted.name = this.decryptField(decrypted.name);
    }
    
    // Decrypt legal name field
    if (decrypted.legalName) {
      decrypted.legalName = this.decryptField(decrypted.legalName);
    }
    
    // Decrypt contact person field
    if (decrypted.contactPerson) {
      decrypted.contactPerson = this.decryptField(decrypted.contactPerson);
    }
    
    // Decrypt email field
    if (decrypted.email) {
      decrypted.email = this.decryptField(decrypted.email);
    }
    
    // Decrypt phone field
    if (decrypted.phone) {
      decrypted.phone = this.decryptField(decrypted.phone);
    }
    
    return decrypted;
  }

  static encryptClientData(clientData) {
    if (!clientData) return clientData;
    // Don't encrypt
    return clientData;
  }

  /**
   * Decrypt multiple clients
   * @param {Array} clients - Array of encrypted clients
   * @returns {Array} Array of decrypted clients
   */
  static decryptClients(clients) {
    if (!Array.isArray(clients)) return clients;
    return clients.map(client => this.decryptClientData(client));
  }

  // ==================== VENDOR MODULE ====================
  
  static decryptVendorData(vendorData) {
    if (!vendorData) return vendorData;
    
    const decrypted = { ...vendorData };
    
    // Decrypt vendor name field
    if (decrypted.name) {
      decrypted.name = this.decryptField(decrypted.name);
    }
    
    // Decrypt vendorName field
    if (decrypted.vendorName) {
      decrypted.vendorName = this.decryptField(decrypted.vendorName);
    }
    
    // Decrypt contact person field
    if (decrypted.contactPerson) {
      decrypted.contactPerson = this.decryptField(decrypted.contactPerson);
    }
    
    // Decrypt email field
    if (decrypted.email) {
      decrypted.email = this.decryptField(decrypted.email);
    }
    
    // Decrypt phone field
    if (decrypted.phone) {
      decrypted.phone = this.decryptField(decrypted.phone);
    }
    
    // Decrypt address field
    if (decrypted.address) {
      decrypted.address = this.decryptField(decrypted.address);
    }
    
    // Decrypt city field
    if (decrypted.city) {
      decrypted.city = this.decryptField(decrypted.city);
    }
    
    // Decrypt state field
    if (decrypted.state) {
      decrypted.state = this.decryptField(decrypted.state);
    }
    
    // Decrypt zip field
    if (decrypted.zip) {
      decrypted.zip = this.decryptField(decrypted.zip);
    }
    
    // Decrypt country field
    if (decrypted.country) {
      decrypted.country = this.decryptField(decrypted.country);
    }
    
    return decrypted;
  }

  static encryptVendorData(vendorData) {
    if (!vendorData) return vendorData;
    // Don't encrypt
    return vendorData;
  }

  // ==================== IMPLEMENTATION PARTNER MODULE ====================
  
  static decryptImplementationPartnerData(partnerData) {
    if (!partnerData) return partnerData;
    
    const decrypted = { ...partnerData };
    
    // Decrypt name field
    if (decrypted.name) {
      decrypted.name = this.decryptField(decrypted.name);
    }
    
    // Decrypt legalName field
    if (decrypted.legalName) {
      decrypted.legalName = this.decryptField(decrypted.legalName);
    }
    
    // Decrypt contactPerson field
    if (decrypted.contactPerson) {
      decrypted.contactPerson = this.decryptField(decrypted.contactPerson);
    }
    
    // Decrypt email field
    if (decrypted.email) {
      decrypted.email = this.decryptField(decrypted.email);
    }
    
    // Decrypt phone field
    if (decrypted.phone) {
      decrypted.phone = this.decryptField(decrypted.phone);
    }
    
    // Decrypt specialization field
    if (decrypted.specialization) {
      decrypted.specialization = this.decryptField(decrypted.specialization);
    }
    
    // Decrypt notes field
    if (decrypted.notes) {
      decrypted.notes = this.decryptField(decrypted.notes);
    }
    
    return decrypted;
  }

  static encryptImplementationPartnerData(partnerData) {
    if (!partnerData) return partnerData;
    
    const encrypted = { ...partnerData };
    
    // Encrypt name field
    if (encrypted.name) {
      encrypted.name = this.encryptField(encrypted.name);
    }
    
    // Encrypt legalName field
    if (encrypted.legalName) {
      encrypted.legalName = this.encryptField(encrypted.legalName);
    }
    
    // Encrypt contactPerson field
    if (encrypted.contactPerson) {
      encrypted.contactPerson = this.encryptField(encrypted.contactPerson);
    }
    
    // Encrypt email field
    if (encrypted.email) {
      encrypted.email = this.encryptField(encrypted.email);
    }
    
    // Encrypt phone field
    if (encrypted.phone) {
      encrypted.phone = this.encryptField(encrypted.phone);
    }
    
    // Encrypt specialization field
    if (encrypted.specialization) {
      encrypted.specialization = this.encryptField(encrypted.specialization);
    }
    
    // Encrypt notes field
    if (encrypted.notes) {
      encrypted.notes = this.encryptField(encrypted.notes);
    }
    
    return encrypted;
  }

  // ==================== EMPLOYMENT TYPE MODULE ====================
  
  static decryptEmploymentTypeData(typeData) {
    if (!typeData) return typeData;
    return typeData;
  }

  static encryptEmploymentTypeData(typeData) {
    if (!typeData) return typeData;
    return typeData;
  }

  // ==================== TIMESHEET MODULE ====================
  
  static decryptTimesheetData(timesheetData) {
    if (!timesheetData) return timesheetData;
    
    const decrypted = { ...timesheetData };
    
    // Decrypt notes and overtimeComment fields
    if (decrypted.notes) {
      decrypted.notes = this.decryptField(decrypted.notes);
    }
    if (decrypted.overtimeComment) {
      decrypted.overtimeComment = this.decryptField(decrypted.overtimeComment);
    }
    
    return decrypted;
  }

  static encryptTimesheetData(timesheetData) {
    if (!timesheetData) return timesheetData;
    return timesheetData;
  }

  // ==================== INVOICE MODULE ====================
  
  static decryptInvoiceData(invoiceData) {
    if (!invoiceData) return invoiceData;
    return invoiceData;
  }

  static encryptInvoiceData(invoiceData) {
    if (!invoiceData) return invoiceData;
    return invoiceData;
  }

  // ==================== LEAVE REQUEST MODULE ====================
  
  static decryptLeaveRequestData(leaveRequestData) {
    if (!leaveRequestData) return leaveRequestData;
    
    const decrypted = { ...leaveRequestData };
    
    if (decrypted.reason) {
      decrypted.reason = this.decryptField(decrypted.reason);
    }
    if (decrypted.attachmentName) {
      decrypted.attachmentName = this.decryptField(decrypted.attachmentName);
    }
    if (decrypted.employeeName) {
      decrypted.employeeName = this.decryptField(decrypted.employeeName);
    }
    
    return decrypted;
  }

  static encryptLeaveRequestData(leaveRequestData) {
    if (!leaveRequestData) return leaveRequestData;
    
    const encrypted = { ...leaveRequestData };
    
    if (encrypted.reason) {
      encrypted.reason = this.encryptField(encrypted.reason);
    }
    if (encrypted.attachmentName) {
      encrypted.attachmentName = this.encryptField(encrypted.attachmentName);
    }
    if (encrypted.employeeName) {
      encrypted.employeeName = this.encryptField(encrypted.employeeName);
    }
    
    return encrypted;
  }

  // ==================== GENERIC METHODS ====================
  
  /**
   * Decrypt a single instance (generic method used by routes)
   * @param {Object} instance - Sequelize instance or plain object
   * @param {String} type - Type of data ('timesheet', 'invoice', 'employee', etc.)
   * @returns {Object} Plain object with decrypted data
   */
  static decryptInstance(instance, type = 'timesheet') {
    if (!instance) return instance;
    
    const plainObj = instance.get ? instance.get({ plain: true }) : instance;
    
    switch(type) {
      case 'timesheet':
        return this.decryptTimesheetData(plainObj);
      case 'invoice':
        return this.decryptInvoiceData(plainObj);
      case 'employee':
        return this.decryptEmployeeData(plainObj);
      case 'client':
        return this.decryptClientData(plainObj);
      case 'vendor':
        return this.decryptVendorData(plainObj);
      default:
        return plainObj;
    }
  }
  
  /**
   * Decrypt array of instances (generic method used by routes)
   * @param {Array} instances - Array of Sequelize instances or plain objects
   * @param {String} type - Type of data ('timesheet', 'invoice', 'employee', etc.)
   * @returns {Array} Array of plain objects with decrypted data
   */
  static decryptInstances(instances, type = 'timesheet') {
    if (!Array.isArray(instances)) return instances;
    
    return instances.map(instance => {
      // Convert Sequelize instance to plain object if needed
      const plainObj = instance.get ? instance.get({ plain: true }) : instance;
      
      // Apply appropriate decryption based on type
      switch(type) {
        case 'timesheet':
          return this.decryptTimesheetData(plainObj);
        case 'invoice':
          return this.decryptInvoiceData(plainObj);
        case 'employee':
          return this.decryptEmployeeData(plainObj);
        case 'client':
          return this.decryptClientData(plainObj);
        case 'vendor':
          return this.decryptVendorData(plainObj);
        default:
          return plainObj;
      }
    });
  }
}

module.exports = DataEncryptionService;
