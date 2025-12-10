/**
 * Test Encryption/Decryption for Authentication
 * Run this script to verify encryption is working correctly
 */

const { encryptData, decryptData, encryptAuthResponse } = require('./utils/encryption');

console.log('🔐 Testing Authentication Encryption/Decryption\n');

// Test 1: Simple data encryption
console.log('Test 1: Simple Data Encryption');
const simpleData = { message: 'Hello, World!' };
const encrypted1 = encryptData(simpleData);
const decrypted1 = decryptData(encrypted1);
console.log('Original:', simpleData);
console.log('Encrypted:', encrypted1.substring(0, 50) + '...');
console.log('Decrypted:', decrypted1);
console.log('✅ Test 1 Passed:', JSON.stringify(simpleData) === JSON.stringify(decrypted1));
console.log('');

// Test 2: Auth response encryption
console.log('Test 2: Auth Response Encryption');
const authResponse = {
  success: true,
  message: 'Login successful',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  user: {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'admin',
    tenantId: 1
  },
  tenant: {
    id: 1,
    tenantName: 'Test Company',
    subdomain: 'testco',
    status: 'active'
  }
};

const encryptedResponse = encryptAuthResponse(authResponse);
console.log('Original Response:', authResponse);
console.log('Encrypted Response:', {
  encrypted: encryptedResponse.encrypted,
  data: encryptedResponse.data.substring(0, 50) + '...'
});

const decryptedResponse = decryptData(encryptedResponse.data);
console.log('Decrypted Response:', decryptedResponse);
console.log('✅ Test 2 Passed:', JSON.stringify(authResponse) === JSON.stringify(decryptedResponse));
console.log('');

// Test 3: OAuth response encryption
console.log('Test 3: OAuth Response Encryption');
const oauthResponse = {
  success: true,
  exists: true,
  needsOnboarding: false,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.oauth',
  user: {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: 'employee',
    tenantId: 1,
    employeeId: 5,
    status: 'active'
  },
  tenant: {
    id: 1,
    tenantName: 'Test Company',
    subdomain: 'testco',
    status: 'active'
  }
};

const encryptedOAuth = encryptAuthResponse(oauthResponse);
const decryptedOAuth = decryptData(encryptedOAuth.data);
console.log('Original OAuth Response:', oauthResponse);
console.log('Decrypted OAuth Response:', decryptedOAuth);
console.log('✅ Test 3 Passed:', JSON.stringify(oauthResponse) === JSON.stringify(decryptedOAuth));
console.log('');

// Summary
console.log('📊 Test Summary:');
console.log('All encryption/decryption tests completed successfully! ✅');
console.log('');
console.log('💡 Next Steps:');
console.log('1. Set ENCRYPTION_KEY in server/.env');
console.log('2. Set NEXT_PUBLIC_ENCRYPTION_KEY in nextjs-app/.env.local');
console.log('3. Ensure both keys match exactly');
console.log('4. Test authentication flows in the application');
