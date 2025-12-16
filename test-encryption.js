#!/usr/bin/env node

/**
 * Test Encryption/Decryption
 * Verifies that encryption keys match and encryption/decryption works
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

console.log('🔐 Testing Encryption/Decryption...\n');

// Read backend encryption key
const serverEnvPath = path.join(__dirname, 'server', '.env');
const serverEnv = fs.readFileSync(serverEnvPath, 'utf8');
const backendKeyMatch = serverEnv.match(/ENCRYPTION_KEY=(.+)/);
const backendKey = backendKeyMatch ? backendKeyMatch[1].trim() : null;

// Read frontend encryption key
const frontendEnvPath = path.join(__dirname, 'nextjs-app', '.env.local');
if (!fs.existsSync(frontendEnvPath)) {
  console.log('❌ Frontend .env.local file not found!');
  console.log('   Run: node setup-encryption-keys.js\n');
  process.exit(1);
}

const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
const frontendKeyMatch = frontendEnv.match(/NEXT_PUBLIC_ENCRYPTION_KEY=(.+)/);
const frontendKey = frontendKeyMatch ? frontendKeyMatch[1].trim() : null;

console.log('📋 Encryption Keys:');
console.log('   Backend:  ', backendKey ? backendKey.substring(0, 20) + '...' : 'NOT FOUND');
console.log('   Frontend: ', frontendKey ? frontendKey.substring(0, 20) + '...' : 'NOT FOUND');
console.log();

// Check if keys match
if (backendKey === frontendKey) {
  console.log('✅ Keys Match!\n');
} else {
  console.log('❌ Keys DO NOT Match!');
  console.log('   Backend:  ', backendKey);
  console.log('   Frontend: ', frontendKey);
  console.log('\n   Run: node setup-encryption-keys.js\n');
  process.exit(1);
}

// Test encryption/decryption
console.log('🧪 Testing Encryption/Decryption...\n');

const testData = {
  success: true,
  user: {
    id: '123',
    email: 'test@example.com',
    name: 'Test User'
  },
  token: 'test-token-123'
};

console.log('Original Data:');
console.log(JSON.stringify(testData, null, 2));
console.log();

// Encrypt (like backend does)
const dataString = JSON.stringify(testData);
const encrypted = CryptoJS.AES.encrypt(dataString, backendKey).toString();
console.log('Encrypted Data:');
console.log(encrypted.substring(0, 50) + '...');
console.log();

// Decrypt (like frontend does)
try {
  const bytes = CryptoJS.AES.decrypt(encrypted, frontendKey);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  const decrypted = JSON.parse(decryptedString);
  
  console.log('Decrypted Data:');
  console.log(JSON.stringify(decrypted, null, 2));
  console.log();
  
  // Verify data matches
  if (JSON.stringify(testData) === JSON.stringify(decrypted)) {
    console.log('✅ Encryption/Decryption Test PASSED!');
    console.log('   Data matches perfectly!\n');
  } else {
    console.log('❌ Encryption/Decryption Test FAILED!');
    console.log('   Data does not match!\n');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Decryption Failed!');
  console.log('   Error:', error.message);
  console.log('\n   Keys may not match or encryption is corrupted.\n');
  process.exit(1);
}

console.log('🎉 All Tests Passed!');
console.log('\n📋 Summary:');
console.log('   ✅ Backend encryption key found');
console.log('   ✅ Frontend decryption key found');
console.log('   ✅ Keys match exactly');
console.log('   ✅ Encryption works');
console.log('   ✅ Decryption works');
console.log('   ✅ Data integrity verified');
console.log('\n🚀 Your application is ready to use!\n');
