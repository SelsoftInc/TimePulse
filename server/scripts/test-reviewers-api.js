/**
 * Test reviewers API endpoint directly
 */

const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:5000';
  const tenantId = '5eda5596-b1d9-4963-953d-7af9d0511ce8';
  
  console.log('Testing Reviewers API Endpoint\n');
  console.log(`URL: ${baseURL}/api/timesheets/reviewers?tenantId=${tenantId}\n`);
  
  try {
    const response = await axios.get(`${baseURL}/api/timesheets/reviewers`, {
      params: { tenantId }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.reviewers) {
      console.log(`\n✅ Found ${response.data.reviewers.length} reviewers:`);
      response.data.reviewers.forEach(r => {
        console.log(`  - ${r.name} (${r.role}) - ${r.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Is the backend server running on port 5001?');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAPI();
