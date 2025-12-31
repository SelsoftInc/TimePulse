/**
 * Test account request creation API
 */

const fetch = require('node-fetch');

async function testAccountCreate() {
  try {
    console.log('🧪 Testing account request creation...');
    
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser' + Date.now() + '@example.com',
      phone: '1234567890',
      countryCode: '+1',
      password: 'Test@123',
      requestedRole: 'employee',
      requestedApproverId: null,
      companyName: 'Test Company',
      department: 'IT'
    };
    
    console.log('📤 Sending request:', testData);
    
    const response = await fetch('http://localhost:5001/api/account-request/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Account request created successfully!');
      console.log('📋 Request ID:', data.requestId);
    } else {
      console.log('❌ Failed to create account request');
      console.log('Error:', data.message || data.error);
      if (data.errors) {
        console.log('Validation errors:', data.errors);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAccountCreate();
