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
}

module.exports = DataEncryptionService;
