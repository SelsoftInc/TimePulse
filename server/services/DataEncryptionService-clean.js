/**
 * TEMPORARY BYPASS VERSION - Returns all data as-is without decryption
 * This is to diagnose whether data is actually encrypted or not
 */

const encryptionService = require('../utils/encryptionService');

class DataEncryptionService {
  
  // Bypass all employee decryption
  static decryptEmployeeData(employeeData) {
    if (!employeeData) return employeeData;
    console.log('⚠️ DECRYPTION BYPASSED');
    return employeeData;
  }

  static encryptEmployeeData(employeeData) {
    return employeeData; // Bypass encryption too
  }

  static decryptEmployees(employees) {
    if (!Array.isArray(employees)) return employees;
    return employees.map(emp => this.decryptEmployeeData(emp));
  }

  // Bypass all vendor/client decryption
  static decryptVendorData(vendorData) {
    return vendorData;
  }

  static encryptVendorData(vendorData) {
    return vendorData;
  }

  static decryptClientData(clientData) {
    return clientData;
  }

  static encryptClientData(clientData) {
    return clientData;
  }

  static decryptImplementationPartnerData(partnerData) {
    return partnerData;
  }

  static encryptImplementationPartnerData(partnerData) {
    return partnerData;
  }

  static decryptEmploymentTypeData(typeData) {
    return typeData;
  }

  static encryptEmploymentTypeData(typeData) {
    return typeData;
  }

  static decryptTimesheetData(timesheetData) {
    return timesheetData;
  }

  static encryptTimesheetData(timesheetData) {
    return timesheetData;
  }

  static decryptInvoiceData(invoiceData) {
    return invoiceData;
  }

  static encryptInvoiceData(invoiceData) {
    return invoiceData;
  }
}

module.exports = DataEncryptionService;
