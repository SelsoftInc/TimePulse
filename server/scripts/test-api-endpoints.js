/**
 * Test API endpoints to verify data is correct
 */

const axios = require('axios');

async function testEndpoints() {
  const baseURL = 'http://localhost:5001';
  
  console.log('Testing API Endpoints...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Test 1: Get all clients
    console.log('TEST 1: GET /api/clients?tenantId=5eda5596-b1d9-4963-953d-7af9d0511ce8');
    const clientsResponse = await axios.get(`${baseURL}/api/clients`, {
      params: { tenantId: '5eda5596-b1d9-4963-953d-7af9d0511ce8' }
    });
    
    console.log('Status:', clientsResponse.status);
    console.log('Success:', clientsResponse.data.success);
    console.log('Clients:', JSON.stringify(clientsResponse.data.clients, null, 2));
    
    // Test 2: Get employee by email
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('TEST 2: GET /api/timesheets/employees/by-email/selvakumar@selsoftinc.com');
    const employeeResponse = await axios.get(
      `${baseURL}/api/timesheets/employees/by-email/selvakumar@selsoftinc.com`,
      {
        params: { tenantId: '5eda5596-b1d9-4963-953d-7af9d0511ce8' }
      }
    );
    
    console.log('Status:', employeeResponse.status);
    console.log('Success:', employeeResponse.data.success);
    console.log('Employee:', JSON.stringify(employeeResponse.data.employee, null, 2));
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const clients = clientsResponse.data.clients || [];
    const cognizant = clients.find(c => c.clientName === 'Cognizant');
    
    console.log('✅ Total clients:', clients.length);
    console.log('✅ Cognizant found:', cognizant ? 'YES' : 'NO');
    if (cognizant) {
      console.log('   - ID:', cognizant.id);
      console.log('   - Name:', cognizant.clientName);
      console.log('   - Type:', cognizant.clientType);
    }
    
    console.log('\n✅ Employee found:', employeeResponse.data.employee ? 'YES' : 'NO');
    if (employeeResponse.data.employee) {
      const emp = employeeResponse.data.employee;
      console.log('   - ID:', emp.id);
      console.log('   - Name:', emp.firstName, emp.lastName);
      console.log('   - Email:', emp.email);
      console.log('   - Client ID:', emp.clientId || 'undefined (column does not exist)');
    }
    
    console.log('\n✅ API endpoints working correctly!');
    console.log('\nFrontend should receive this data when page loads.');
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEndpoints();
