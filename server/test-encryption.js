/**
 * Encryption Test Script
 * Run this to verify encryption/decryption is working correctly
 * 
 * Usage: node test-encryption.js
 */

const encryptionService = require('./utils/encryptionService');
const DataEncryptionService = require('./services/DataEncryptionService');

console.log('🔐 Testing Encryption Service\n');

// Test 1: Basic string encryption/decryption
console.log('Test 1: Basic String Encryption');
console.log('================================');
const testString = 'This is sensitive data that needs to be encrypted';
console.log('Original:', testString);

const encrypted = encryptionService.encrypt(testString);
console.log('Encrypted:', encrypted);

const decrypted = encryptionService.decrypt(encrypted);
console.log('Decrypted:', decrypted);

const test1Pass = testString === decrypted;
console.log('Result:', test1Pass ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 2: Timesheet data encryption/decryption
console.log('Test 2: Timesheet Data Encryption');
console.log('==================================');
const timesheetData = {
  employeeName: 'John Doe',
  notes: 'Worked on feature development',
  dailyHours: {
    mon: 8,
    tue: 8,
    wed: 7,
    thu: 8,
    fri: 6,
    sat: 0,
    sun: 0
  },
  overtimeComment: 'Extra hours for project deadline',
  overtimeDays: ['wed', 'thu']
};

console.log('Original Timesheet Data:');
console.log(JSON.stringify(timesheetData, null, 2));

const encryptedTimesheet = DataEncryptionService.encryptTimesheetData(timesheetData);
console.log('\nEncrypted Timesheet Data:');
console.log(JSON.stringify(encryptedTimesheet, null, 2));

const decryptedTimesheet = DataEncryptionService.decryptTimesheetData(encryptedTimesheet);
console.log('\nDecrypted Timesheet Data:');
console.log(JSON.stringify(decryptedTimesheet, null, 2));

const test2Pass = 
  timesheetData.employeeName === decryptedTimesheet.employeeName &&
  timesheetData.notes === decryptedTimesheet.notes &&
  JSON.stringify(timesheetData.dailyHours) === JSON.stringify(decryptedTimesheet.dailyHours);

console.log('\nResult:', test2Pass ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 3: Invoice data encryption/decryption
console.log('Test 3: Invoice Data Encryption');
console.log('================================');
const invoiceData = {
  notes: 'Payment due within 30 days',
  lineItems: [
    {
      description: 'Software Development - Week 1',
      hours: 40,
      rate: 75,
      amount: 3000
    },
    {
      description: 'Code Review',
      hours: 5,
      rate: 75,
      amount: 375
    }
  ]
};

console.log('Original Invoice Data:');
console.log(JSON.stringify(invoiceData, null, 2));

const encryptedInvoice = DataEncryptionService.encryptInvoiceData(invoiceData);
console.log('\nEncrypted Invoice Data:');
console.log(JSON.stringify(encryptedInvoice, null, 2));

const decryptedInvoice = DataEncryptionService.decryptInvoiceData(encryptedInvoice);
console.log('\nDecrypted Invoice Data:');
console.log(JSON.stringify(decryptedInvoice, null, 2));

const test3Pass = 
  invoiceData.notes === decryptedInvoice.notes &&
  JSON.stringify(invoiceData.lineItems) === JSON.stringify(decryptedInvoice.lineItems);

console.log('\nResult:', test3Pass ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 4: Encryption format validation
console.log('Test 4: Encryption Format Validation');
console.log('=====================================');
const encryptedFormat = encryptionService.encrypt('test');
const parts = encryptedFormat.split(':');
const test4Pass = parts.length === 3;
console.log('Encrypted format:', encryptedFormat);
console.log('Format parts (should be 3):', parts.length);
console.log('Result:', test4Pass ? '✅ PASS' : '❌ FAIL');
console.log('');

// Summary
console.log('Test Summary');
console.log('============');
const allPassed = test1Pass && test2Pass && test3Pass && test4Pass;
console.log('Test 1 (Basic String):', test1Pass ? '✅' : '❌');
console.log('Test 2 (Timesheet Data):', test2Pass ? '✅' : '❌');
console.log('Test 3 (Invoice Data):', test3Pass ? '✅' : '❌');
console.log('Test 4 (Format Validation):', test4Pass ? '✅' : '❌');
console.log('');
console.log('Overall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

if (allPassed) {
  console.log('\n🎉 Encryption is working correctly!');
  console.log('You can now use the encryption service in your application.');
} else {
  console.log('\n⚠️ Some tests failed. Please check the encryption configuration.');
  console.log('Make sure ENCRYPTION_KEY is set in your .env file.');
}

process.exit(allPassed ? 0 : 1);
