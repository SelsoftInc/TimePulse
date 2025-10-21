/**
 * Script to onboard Selsoft tenant from Excel file
 * Creates users with temporary password: test123#
 * 
 * Usage: node scripts/onboard-selsoft.js
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001/api/onboarding';
const TENANT_NAME = 'Selsoft';
const SUBDOMAIN = 'selsoft';

async function onboardSelsoft() {
  console.log('🚀 Starting Selsoft tenant onboarding...\n');

  try {
    // Step 1: Check if tenant is already onboarded
    console.log('📋 Step 1: Checking tenant status...');
    const statusResponse = await fetch(`${API_BASE}/tenants/${TENANT_NAME}/status`);
    const statusData = await statusResponse.json();

    if (statusData.status === 'onboarded') {
      console.log('⚠️  Tenant is already onboarded!');
      console.log(`   Tenant ID: ${statusData.tenant.id}`);
      console.log(`   Subdomain: ${statusData.tenant.subdomain}`);
      console.log(`   Onboarded At: ${statusData.tenant.onboardedAt}`);
      
      if (statusData.summary) {
        console.log('\n📊 Summary:');
        console.log(`   Users Created: ${statusData.summary.usersCreated}`);
        console.log(`   Employees Created: ${statusData.summary.employeesCreated}`);
        console.log(`   Clients Created: ${statusData.summary.clientsCreated}`);
      }
      
      console.log('\n💡 If you want to re-onboard, please delete the tenant from the database first.');
      return;
    }

    // Step 2: Preview the data from Excel
    console.log('\n📋 Step 2: Previewing Excel data...');
    const previewResponse = await fetch(`${API_BASE}/tenants/${TENANT_NAME}/preview`);
    const previewData = await previewResponse.json();

    if (!previewData.success) {
      console.error('❌ Failed to preview tenant data:', previewData.error);
      return;
    }

    console.log(`   ✅ Found Excel file: ${previewData.fileName}`);
    console.log(`   📊 Users to create: ${previewData.data.users.length}`);
    console.log(`   👥 Employees to create: ${previewData.data.employees.length}`);
    console.log(`   🏢 Clients to create: ${previewData.data.clients.length}`);

    // Display user details
    if (previewData.data.users.length > 0) {
      console.log('\n👤 Users to be created:');
      previewData.data.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Step 3: Onboard the tenant
    console.log('\n📋 Step 3: Onboarding tenant...');
    const onboardResponse = await fetch(`${API_BASE}/tenants/${TENANT_NAME}/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subdomain: SUBDOMAIN })
    });

    const onboardData = await onboardResponse.json();

    if (!onboardData.success) {
      console.error('❌ Failed to onboard tenant:', onboardData.error);
      if (onboardData.details) {
        console.error('   Details:', onboardData.details);
      }
      return;
    }

    // Step 4: Display success information
    console.log('\n✅ Tenant onboarded successfully!\n');
    console.log('📊 Onboarding Summary:');
    console.log(`   Tenant ID: ${onboardData.tenant.id}`);
    console.log(`   Tenant Name: ${onboardData.tenant.tenantName}`);
    console.log(`   Subdomain: ${onboardData.tenant.subdomain}`);
    console.log(`   Status: ${onboardData.tenant.status}`);
    console.log('');
    console.log(`   Users Created: ${onboardData.summary.usersCreated}`);
    console.log(`   Employees Created: ${onboardData.summary.employeesCreated}`);
    console.log(`   Clients Created: ${onboardData.summary.clientsCreated}`);
    console.log('');
    console.log(`   🔑 Default Password: ${onboardData.summary.defaultPassword}`);
    console.log('');
    console.log('🌐 Access URLs:');
    console.log(`   Frontend: http://localhost:3000/${SUBDOMAIN}`);
    console.log(`   Login Page: http://localhost:3000/${SUBDOMAIN}/login`);
    console.log('');
    console.log('📝 Login Instructions:');
    console.log('   1. Go to the login page');
    console.log('   2. Use any user email from the Excel file');
    console.log(`   3. Password: ${onboardData.summary.defaultPassword}`);
    console.log('   4. You will be prompted to change your password on first login');
    console.log('');
    console.log('✨ Onboarding complete!');

  } catch (error) {
    console.error('❌ Error during onboarding:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the onboarding
onboardSelsoft();
