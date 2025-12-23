/**
 * Test Dashboard API Endpoints
 * This script tests all dashboard API endpoints to verify they return real data
 */

const fetch = require('node-fetch');

const API_BASE = 'http://44.222.217.57:5001';
const TENANT_ID = '5eda5596-b1d9-4963-953d-7af9d0511ce8'; // Replace with actual tenant ID
const TOKEN = 'your-auth-token'; // Replace with actual token

async function testDashboardAPIs() {
  console.log('🧪 Testing Dashboard API Endpoints\n');
  console.log('='.repeat(60));

  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Main Dashboard API
    console.log('\n1️⃣ Testing Main Dashboard API (/api/dashboard)');
    console.log('-'.repeat(60));
    const dashboardUrl = `${API_BASE}/api/dashboard?tenantId=${TENANT_ID}&scope=company`;
    console.log(`URL: ${dashboardUrl}`);
    
    const dashboardRes = await fetch(dashboardUrl, { headers });
    const dashboardData = await dashboardRes.json();
    
    console.log('\n📊 Dashboard KPIs:');
    console.log(`  - Total Revenue: $${dashboardData.kpis?.total_revenue || 0}`);
    console.log(`  - AR Outstanding: $${dashboardData.kpis?.ar_outstanding || 0}`);
    console.log(`  - Active Employees: ${dashboardData.kpis?.active_employees || 0}`);
    console.log(`  - Pending Timesheets: ${dashboardData.kpis?.ts_pending || 0}`);
    console.log(`  - Approved Timesheets: ${dashboardData.kpis?.ts_approved || 0}`);
    
    // Test 2: Recent Activity API
    console.log('\n\n2️⃣ Testing Recent Activity API (/api/dashboard-extended/recent-activity)');
    console.log('-'.repeat(60));
    const activityUrl = `${API_BASE}/api/dashboard-extended/recent-activity?tenantId=${TENANT_ID}&limit=10`;
    console.log(`URL: ${activityUrl}`);
    
    const activityRes = await fetch(activityUrl, { headers });
    const activityData = await activityRes.json();
    
    console.log(`\n📝 Recent Activities: ${activityData.activities?.length || 0} items`);
    if (activityData.activities && activityData.activities.length > 0) {
      activityData.activities.slice(0, 3).forEach((activity, idx) => {
        console.log(`  ${idx + 1}. ${activity.activity_type} - ${activity.employee_name} - ${activity.status}`);
      });
    } else {
      console.log('  ⚠️ No activities found');
    }

    // Test 3: Top Performers API
    console.log('\n\n3️⃣ Testing Top Performers API (/api/dashboard-extended/top-performers)');
    console.log('-'.repeat(60));
    const performersUrl = `${API_BASE}/api/dashboard-extended/top-performers?tenantId=${TENANT_ID}&limit=5`;
    console.log(`URL: ${performersUrl}`);
    
    const performersRes = await fetch(performersUrl, { headers });
    const performersData = await performersRes.json();
    
    console.log(`\n🏆 Top Performers: ${performersData.performers?.length || 0} employees`);
    if (performersData.performers && performersData.performers.length > 0) {
      performersData.performers.forEach((emp, idx) => {
        console.log(`  ${idx + 1}. ${emp.name} - ${emp.total_hours}h - $${emp.revenue_generated || 0}`);
      });
    } else {
      console.log('  ⚠️ No performers found');
    }

    // Test 4: Revenue by Client API
    console.log('\n\n4️⃣ Testing Revenue by Client API (/api/dashboard-extended/revenue-by-client)');
    console.log('-'.repeat(60));
    const clientsUrl = `${API_BASE}/api/dashboard-extended/revenue-by-client?tenantId=${TENANT_ID}&limit=5`;
    console.log(`URL: ${clientsUrl}`);
    
    const clientsRes = await fetch(clientsUrl, { headers });
    const clientsData = await clientsRes.json();
    
    console.log(`\n💰 Revenue by Client: ${clientsData.clients?.length || 0} clients`);
    if (clientsData.clients && clientsData.clients.length > 0) {
      clientsData.clients.forEach((client, idx) => {
        console.log(`  ${idx + 1}. ${client.client_name} - $${client.total_revenue} (${client.invoice_count} invoices)`);
      });
    } else {
      console.log('  ⚠️ No client revenue found');
    }

    // Test 5: Monthly Revenue Trend API
    console.log('\n\n5️⃣ Testing Monthly Revenue Trend API (/api/dashboard-extended/monthly-revenue-trend)');
    console.log('-'.repeat(60));
    const trendUrl = `${API_BASE}/api/dashboard-extended/monthly-revenue-trend?tenantId=${TENANT_ID}`;
    console.log(`URL: ${trendUrl}`);
    
    const trendRes = await fetch(trendUrl, { headers });
    const trendData = await trendRes.json();
    
    console.log(`\n📈 Monthly Revenue Trend: ${trendData.trend?.length || 0} months`);
    if (trendData.trend && trendData.trend.length > 0) {
      trendData.trend.slice(0, 6).forEach((month) => {
        console.log(`  ${month.month_label}: $${month.revenue}`);
      });
    } else {
      console.log('  ⚠️ No trend data found');
    }

    // Test 6: Employees API
    console.log('\n\n6️⃣ Testing Employees API (/api/dashboard-extended/employees)');
    console.log('-'.repeat(60));
    const employeesUrl = `${API_BASE}/api/dashboard-extended/employees?tenantId=${TENANT_ID}`;
    console.log(`URL: ${employeesUrl}`);
    
    const employeesRes = await fetch(employeesUrl, { headers });
    const employeesData = await employeesRes.json();
    
    console.log(`\n👥 Active Employees: ${employeesData.employees?.length || 0} employees`);
    if (employeesData.employees && employeesData.employees.length > 0) {
      employeesData.employees.slice(0, 5).forEach((emp, idx) => {
        console.log(`  ${idx + 1}. ${emp.name} - ${emp.department || 'N/A'}`);
      });
    } else {
      console.log('  ⚠️ No employees found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All API tests completed!\n');

  } catch (error) {
    console.error('\n❌ Error testing APIs:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testDashboardAPIs();
