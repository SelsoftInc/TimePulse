/**
 * Test timesheet submit endpoint
 */

const axios = require('axios');

async function testSubmit() {
  const baseURL = 'http://localhost:5000';
  
  const testData = {
    tenantId: '5eda5596-b1d9-4963-953d-7af9d0511ce8',
    employeeId: '2d639e96-2f26-4577-8ce7-2570e5ca0ad0', // Selvakumar
    weekStart: '2025-10-06',
    weekEnd: '2025-10-12',
    clientId: 'a3889c22-ace2-40f9-9f29-1a1556c0a444', // Cognizant
    reviewerId: 'e70433fd-c849-4433-b4bd-7588476adfd3', // Pushban
    status: 'submitted',
    totalHours: 40,
    notes: 'Test submission from script',
    dailyHours: {
      sat: 0,
      sun: 0,
      mon: 8,
      tue: 8,
      wed: 8,
      thu: 8,
      fri: 8
    }
  };
  
  console.log('Testing Submit Endpoint\n');
  console.log(`URL: ${baseURL}/api/timesheets/submit`);
  console.log('Data:', JSON.stringify(testData, null, 2));
  console.log('\n');
  
  try {
    const response = await axios.post(`${baseURL}/api/timesheets/submit`, testData);
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ Timesheet submitted successfully!');
      console.log('Timesheet ID:', response.data.timesheet?.id);
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Is the backend server running on port 5000?');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSubmit();
