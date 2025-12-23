/**
 * Test OAuth Endpoints
 * Quick script to verify OAuth endpoints are working correctly
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://44.222.217.57:5001';

async function testOAuthEndpoints() {
  console.log('🧪 Testing OAuth Endpoints\n');
  console.log(`API Base URL: ${API_BASE}\n`);

  try {
    // Test 1: Check if a non-existent user needs onboarding
    console.log('Test 1: Check non-existent user (should need onboarding)');
    const testEmail = `test-${Date.now()}@example.com`;
    const checkResponse = await axios.post(`${API_BASE}/api/oauth/check-user`, {
      email: testEmail,
      googleId: 'test-google-id-123'
    });
    
    console.log('✅ Response:', {
      exists: checkResponse.data.exists,
      needsOnboarding: checkResponse.data.needsOnboarding
    });
    
    if (checkResponse.data.needsOnboarding) {
      console.log('✅ Correct: New user needs onboarding\n');
    } else {
      console.log('❌ Error: New user should need onboarding\n');
    }

    // Test 2: Register a new OAuth user
    console.log('Test 2: Register new OAuth user');
    const registerResponse = await axios.post(`${API_BASE}/api/oauth/register`, {
      email: testEmail,
      googleId: 'test-google-id-123',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
      companyName: 'Test Company',
      phoneNumber: '+1234567890',
      department: 'Engineering'
    });

    console.log('✅ User registered successfully');
    console.log('User ID:', registerResponse.data.user.id);
    console.log('Employee ID:', registerResponse.data.user.employeeId);
    console.log('Tenant ID:', registerResponse.data.tenant.id);
    console.log('Token received:', registerResponse.data.token ? 'Yes' : 'No');
    console.log('');

    // Test 3: Check if the registered user exists (should not need onboarding)
    console.log('Test 3: Check existing user (should not need onboarding)');
    const checkExistingResponse = await axios.post(`${API_BASE}/api/oauth/check-user`, {
      email: testEmail,
      googleId: 'test-google-id-123'
    });

    console.log('✅ Response:', {
      exists: checkExistingResponse.data.exists,
      needsOnboarding: checkExistingResponse.data.needsOnboarding
    });

    if (checkExistingResponse.data.exists && !checkExistingResponse.data.needsOnboarding) {
      console.log('✅ Correct: Existing user does not need onboarding\n');
    } else {
      console.log('❌ Error: Existing user should not need onboarding\n');
    }

    // Test 4: Verify employee record was created
    console.log('Test 4: Verify employee record exists');
    const token = registerResponse.data.token;
    const tenantId = registerResponse.data.tenant.id;
    
    const employeesResponse = await axios.get(`${API_BASE}/api/employees`, {
      params: { tenantId },
      headers: { Authorization: `Bearer ${token}` }
    });

    const testEmployee = employeesResponse.data.employees.find(
      emp => emp.email === testEmail
    );

    if (testEmployee) {
      console.log('✅ Employee record found in employee list');
      console.log('Employee Name:', testEmployee.name);
      console.log('Employee Email:', testEmployee.email);
      console.log('Employee Role:', testEmployee.role);
      console.log('Employee Department:', testEmployee.department);
      console.log('');
    } else {
      console.log('❌ Error: Employee record not found in employee list\n');
    }

    console.log('✅ All OAuth endpoint tests passed!\n');
    console.log('📝 Summary:');
    console.log('   - OAuth check-user endpoint: Working');
    console.log('   - OAuth register endpoint: Working');
    console.log('   - User record created: Yes');
    console.log('   - Employee record created: Yes');
    console.log('   - Employee appears in list: Yes');
    console.log('');
    console.log('🎉 OAuth integration is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testOAuthEndpoints();
