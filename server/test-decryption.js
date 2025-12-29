/**
 * Test script to verify encryption/decryption
 * Run with: node test-decryption.js
 */

const CryptoJS = require('crypto-js');

// The encrypted string from the screenshot
const encryptedString = '3420e3c60a612d505065b10985ac0c51efe2c09ac6cebf02ef23078b8f4e8ced3ee4b1647415fa0add1d:94511133e01a1ca6a94';

// Try different keys
const keys = [
  'timepulse-default-encryption-key-2024',
  'default-encryption-key-change-in-production-32-chars-minimum',
  'timepulse-encryption-key',
  'your-secret-encryption-key-here',
  'your-encryption-key-here'
];

console.log('🔍 Testing decryption with different keys...\n');
console.log('📋 Encrypted string:', encryptedString);
console.log('📋 Length:', encryptedString.length);
console.log('📋 Format check:', encryptedString.includes(':') ? 'Contains colons (might be new format)' : 'No colons (legacy format)');
console.log('\n' + '='.repeat(80) + '\n');

keys.forEach((key, index) => {
  console.log(`\n🔑 Test ${index + 1}: Key = "${key}"`);
  console.log('-'.repeat(80));
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedString, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (decrypted && decrypted.length > 0) {
      console.log('✅ SUCCESS!');
      console.log('📝 Decrypted value:', decrypted);
      console.log('📏 Decrypted length:', decrypted.length);
      console.log('🎯 This is the correct key!');
    } else {
      console.log('❌ FAILED: Decryption produced empty string');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n💡 If all tests failed, the data might be:');
console.log('   1. Encrypted with a different key not in our list');
console.log('   2. Encrypted with a different algorithm (not CryptoJS AES)');
console.log('   3. Not encrypted at all (just a hash or ID)');
