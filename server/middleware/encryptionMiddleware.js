/**
 * Encryption Middleware
 * Provides hooks for encrypting/decrypting model data automatically
 * Applies to Timesheet and Invoice models
 */

const encryptionService = require('../utils/encryptionService');

/**
 * Fields to encrypt for Timesheet model
 */
const TIMESHEET_ENCRYPTED_FIELDS = [
  'notes',
  'employeeName',
  'overtimeComment',
  'rejectionReason'
];

/**
 * Fields to encrypt for Invoice model
 */
const INVOICE_ENCRYPTED_FIELDS = [
  'notes'
];

/**
 * Apply encryption hooks to Timesheet model
 * @param {Object} TimesheetModel - Sequelize Timesheet model
 */
function applyTimesheetEncryption(TimesheetModel) {
  // Before creating a timesheet - encrypt sensitive fields
  TimesheetModel.beforeCreate((timesheet, options) => {
    console.log('🔒 Encrypting timesheet data before create');
    
    TIMESHEET_ENCRYPTED_FIELDS.forEach(field => {
      if (timesheet[field] && typeof timesheet[field] === 'string') {
        timesheet[field] = encryptionService.encrypt(timesheet[field]);
      }
    });
    
    // Encrypt JSONB fields
    if (timesheet.dailyHours && typeof timesheet.dailyHours === 'object') {
      timesheet.dailyHours = JSON.parse(
        encryptionService.encrypt(JSON.stringify(timesheet.dailyHours))
      );
    }
    
    if (timesheet.overtimeDays && typeof timesheet.overtimeDays === 'object') {
      timesheet.overtimeDays = JSON.parse(
        encryptionService.encrypt(JSON.stringify(timesheet.overtimeDays))
      );
    }
    
    // Encrypt numeric fields
    if (timesheet.totalHours !== null && timesheet.totalHours !== undefined) {
      timesheet.totalHours = encryptionService.encryptNumber(timesheet.totalHours);
    }
  });

  // Before updating a timesheet - encrypt sensitive fields
  TimesheetModel.beforeUpdate((timesheet, options) => {
    console.log('🔒 Encrypting timesheet data before update');
    
    TIMESHEET_ENCRYPTED_FIELDS.forEach(field => {
      if (timesheet.changed(field) && timesheet[field] && typeof timesheet[field] === 'string') {
        timesheet[field] = encryptionService.encrypt(timesheet[field]);
      }
    });
    
    // Encrypt JSONB fields if changed
    if (timesheet.changed('dailyHours') && timesheet.dailyHours && typeof timesheet.dailyHours === 'object') {
      timesheet.dailyHours = JSON.parse(
        encryptionService.encrypt(JSON.stringify(timesheet.dailyHours))
      );
    }
    
    if (timesheet.changed('overtimeDays') && timesheet.overtimeDays && typeof timesheet.overtimeDays === 'object') {
      timesheet.overtimeDays = JSON.parse(
        encryptionService.encrypt(JSON.stringify(timesheet.overtimeDays))
      );
    }
    
    // Encrypt numeric fields if changed
    if (timesheet.changed('totalHours') && timesheet.totalHours !== null && timesheet.totalHours !== undefined) {
      timesheet.totalHours = encryptionService.encryptNumber(timesheet.totalHours);
    }
  });

  // After finding timesheets - decrypt sensitive fields
  TimesheetModel.afterFind((result, options) => {
    if (!result) return;
    
    const decrypt = (timesheet) => {
      if (!timesheet) return;
      
      console.log('🔓 Decrypting timesheet data after fetch');
      
      TIMESHEET_ENCRYPTED_FIELDS.forEach(field => {
        if (timesheet[field] && typeof timesheet[field] === 'string') {
          timesheet[field] = encryptionService.decrypt(timesheet[field]);
        }
      });
      
      // Decrypt JSONB fields
      if (timesheet.dailyHours && typeof timesheet.dailyHours === 'object') {
        try {
          const decrypted = encryptionService.decrypt(JSON.stringify(timesheet.dailyHours));
          timesheet.dailyHours = JSON.parse(decrypted);
        } catch (e) {
          // If decryption fails, keep original
          console.warn('⚠️ Failed to decrypt dailyHours, keeping original');
        }
      }
      
      if (timesheet.overtimeDays && typeof timesheet.overtimeDays === 'object') {
        try {
          const decrypted = encryptionService.decrypt(JSON.stringify(timesheet.overtimeDays));
          timesheet.overtimeDays = JSON.parse(decrypted);
        } catch (e) {
          // If decryption fails, keep original
          console.warn('⚠️ Failed to decrypt overtimeDays, keeping original');
        }
      }
      
      // Decrypt numeric fields
      if (timesheet.totalHours !== null && timesheet.totalHours !== undefined) {
        timesheet.totalHours = encryptionService.decryptNumber(timesheet.totalHours);
      }
    };
    
    // Handle both single result and array of results
    if (Array.isArray(result)) {
      result.forEach(decrypt);
    } else {
      decrypt(result);
    }
  });
}

/**
 * Apply encryption hooks to Invoice model
 * @param {Object} InvoiceModel - Sequelize Invoice model
 */
function applyInvoiceEncryption(InvoiceModel) {
  // Before creating an invoice - encrypt sensitive fields
  InvoiceModel.beforeCreate((invoice, options) => {
    console.log('🔒 Encrypting invoice data before create');
    
    INVOICE_ENCRYPTED_FIELDS.forEach(field => {
      if (invoice[field] && typeof invoice[field] === 'string') {
        invoice[field] = encryptionService.encrypt(invoice[field]);
      }
    });
    
    // Encrypt JSONB lineItems
    if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
      invoice.lineItems = JSON.parse(
        encryptionService.encrypt(JSON.stringify(invoice.lineItems))
      );
    }
    
    // Encrypt numeric fields
    if (invoice.subtotal !== null && invoice.subtotal !== undefined) {
      invoice.subtotal = encryptionService.encryptNumber(invoice.subtotal);
    }
    if (invoice.taxAmount !== null && invoice.taxAmount !== undefined) {
      invoice.taxAmount = encryptionService.encryptNumber(invoice.taxAmount);
    }
    if (invoice.totalAmount !== null && invoice.totalAmount !== undefined) {
      invoice.totalAmount = encryptionService.encryptNumber(invoice.totalAmount);
    }
  });

  // Before updating an invoice - encrypt sensitive fields
  InvoiceModel.beforeUpdate((invoice, options) => {
    console.log('🔒 Encrypting invoice data before update');
    
    INVOICE_ENCRYPTED_FIELDS.forEach(field => {
      if (invoice.changed(field) && invoice[field] && typeof invoice[field] === 'string') {
        invoice[field] = encryptionService.encrypt(invoice[field]);
      }
    });
    
    // Encrypt JSONB lineItems if changed
    if (invoice.changed('lineItems') && invoice.lineItems && Array.isArray(invoice.lineItems)) {
      invoice.lineItems = JSON.parse(
        encryptionService.encrypt(JSON.stringify(invoice.lineItems))
      );
    }
    
    // Encrypt numeric fields if changed
    if (invoice.changed('subtotal') && invoice.subtotal !== null && invoice.subtotal !== undefined) {
      invoice.subtotal = encryptionService.encryptNumber(invoice.subtotal);
    }
    if (invoice.changed('taxAmount') && invoice.taxAmount !== null && invoice.taxAmount !== undefined) {
      invoice.taxAmount = encryptionService.encryptNumber(invoice.taxAmount);
    }
    if (invoice.changed('totalAmount') && invoice.totalAmount !== null && invoice.totalAmount !== undefined) {
      invoice.totalAmount = encryptionService.encryptNumber(invoice.totalAmount);
    }
  });

  // After finding invoices - decrypt sensitive fields
  InvoiceModel.afterFind((result, options) => {
    if (!result) return;
    
    const decrypt = (invoice) => {
      if (!invoice) return;
      
      console.log('🔓 Decrypting invoice data after fetch');
      
      INVOICE_ENCRYPTED_FIELDS.forEach(field => {
        if (invoice[field] && typeof invoice[field] === 'string') {
          invoice[field] = encryptionService.decrypt(invoice[field]);
        }
      });
      
      // Decrypt JSONB lineItems
      if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
        try {
          const decrypted = encryptionService.decrypt(JSON.stringify(invoice.lineItems));
          invoice.lineItems = JSON.parse(decrypted);
        } catch (e) {
          // If decryption fails, keep original
          console.warn('⚠️ Failed to decrypt lineItems, keeping original');
        }
      }
      
      // Decrypt numeric fields
      if (invoice.subtotal !== null && invoice.subtotal !== undefined) {
        invoice.subtotal = encryptionService.decryptNumber(invoice.subtotal);
      }
      if (invoice.taxAmount !== null && invoice.taxAmount !== undefined) {
        invoice.taxAmount = encryptionService.decryptNumber(invoice.taxAmount);
      }
      if (invoice.totalAmount !== null && invoice.totalAmount !== undefined) {
        invoice.totalAmount = encryptionService.decryptNumber(invoice.totalAmount);
      }
    };
    
    // Handle both single result and array of results
    if (Array.isArray(result)) {
      result.forEach(decrypt);
    } else {
      decrypt(result);
    }
  });
}

module.exports = {
  applyTimesheetEncryption,
  applyInvoiceEncryption,
  TIMESHEET_ENCRYPTED_FIELDS,
  INVOICE_ENCRYPTED_FIELDS
};
