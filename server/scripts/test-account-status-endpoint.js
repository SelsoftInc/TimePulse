/**
 * Test Account Status Endpoint
 * Verify the /api/account-request/status/:email endpoint works correctly
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001';

async function testStatusEndpoint() {
  console.log('🧪 Testing Account Status Endpoint\n');

  // Test emails from database
  const testEmails = [
    'karan100@gmail.com',
    'karan@gmail.com',
    'dilip@gmail.com',
    'nonexistent@test.com'
  ];

  for (const email of testEmails) {
    console.log(`\n📧 Testing email: ${email}`);
    console.log('─'.repeat(50));

    try {
      const url = `${API_BASE}/api/account-request/status/${encodeURIComponent(email)}`;
      console.log(`🌐 URL: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (data.success) {
        console.log('✅ Success!');
        console.log('📋 Request Details:');
        console.log(`   - Name: ${data.request.firstName} ${data.request.lastName}`);
        console.log(`   - Email: ${data.request.email}`);
        console.log(`   - Status: ${data.request.status}`);
        console.log(`   - Role: ${data.request.requestedRole}`);
        console.log(`   - Created: ${new Date(data.request.createdAt).toLocaleString()}`);
        if (data.request.approverName) {
          console.log(`   - Approver: ${data.request.approverName}`);
        }
      } else {
        console.log('❌ Failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  console.log('\n\n✅ Test completed');
}

testStatusEndpoint();
