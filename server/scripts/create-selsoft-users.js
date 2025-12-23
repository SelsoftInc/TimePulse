/**
 * Script to create role-based users for Selsoft tenant
 * Run: node scripts/create-selsoft-users.js
 */

const fetch = require('node-fetch');

const API_BASE = 'http://44.222.217.57:5001/api/onboarding';

// Option 1: Create specific users based on Excel data
const createCustomUsers = async () => {
  console.log('Creating custom users for Selsoft tenant...\n');
  
  const users = [
    {
      firstName: 'Pushban',
      lastName: 'Rajaiyan',
      email: 'pushban.rajaiyan@selsfot.com',
      role: 'admin',
      phone: '217-721-3186',
      department: 'Administration',
      title: 'System Administrator'
    },
    {
      firstName: 'Uma',
      lastName: 'Sivalingam',
      email: 'uma.sivalingam@selsfot.com',
      role: 'manager',
      phone: '972-302-8849',
      department: 'Operations',
      title: 'Operations Manager'
    },
    {
      firstName: 'Lalitah',
      lastName: 'Prabhu',
      email: 'lalitah.prabhu@selsfot.com',
      role: 'approver',
      phone: '469-328-6751',
      department: 'HR',
      title: 'Timesheet Approver'
    },
    {
      firstName: 'Selvakumar',
      lastName: 'Murugesan',
      email: 'selvakumar.murugesan@selsfot.com',
      role: 'employee',
      phone: '470-208-9651',
      department: 'Engineering',
      title: 'Software Developer'
    },
    {
      firstName: 'Suresh',
      lastName: 'Palakad Krishnan',
      email: 'suresh.krishnan@selsfot.com',
      role: 'employee',
      phone: '214-592-3937',
      department: 'Engineering',
      title: 'Senior Developer'
    },
    {
      firstName: 'Panneerselvam',
      lastName: 'Arulanandam',
      email: 'panneerselvam.arulanandam@selsfot.com',
      role: 'employee',
      phone: '469-631-1957',
      department: 'Engineering',
      title: 'Developer'
    }
  ];

  try {
    const response = await fetch(`${API_BASE}/create-role-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subdomain: 'selsfot',
        users: users
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Successfully created users!\n');
      console.log('Tenant:', result.tenant.tenantName);
      console.log('Subdomain:', result.tenant.subdomain);
      console.log('Users created:', result.users.length);
      console.log('\n📝 Login Credentials:');
      console.log('='.repeat(60));
      
      result.users.forEach(user => {
        console.log(`\n${user.name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role.toUpperCase()}`);
        console.log(`  Password: ${result.defaultPassword}`);
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('\n⚠️  All users must change their password on first login');
      console.log(`\n🔑 Default Password: ${result.defaultPassword}`);
    } else {
      console.error('❌ Error:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

// Option 2: Create default users (quick setup)
const createDefaultUsers = async () => {
  console.log('Creating default users for Selsoft tenant...\n');
  
  try {
    const response = await fetch(`${API_BASE}/create-default-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subdomain: 'selsfot',
        prefix: 'Selsoft'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Successfully created default users!\n');
      console.log('Tenant:', result.tenant.tenantName);
      console.log('Subdomain:', result.tenant.subdomain);
      console.log('Users created:', result.users.length);
      console.log('\n📝 Login Credentials:');
      console.log('='.repeat(60));
      
      result.loginCredentials.forEach(cred => {
        console.log(`\n${cred.role.toUpperCase()}`);
        console.log(`  Email: ${cred.email}`);
        console.log(`  Password: ${cred.password}`);
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('\n⚠️  All users must change their password on first login');
      console.log(`\n🔑 Default Password: ${result.defaultPassword}`);
    } else {
      console.error('❌ Error:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

// Main execution
const main = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('  SELSOFT TENANT USER CREATION SCRIPT');
  console.log('='.repeat(60) + '\n');
  
  const args = process.argv.slice(2);
  const mode = args[0] || 'default';
  
  if (mode === 'custom') {
    await createCustomUsers();
  } else if (mode === 'default') {
    await createDefaultUsers();
  } else {
    console.log('Usage:');
    console.log('  node scripts/create-selsoft-users.js [mode]\n');
    console.log('Modes:');
    console.log('  default  - Create 4 default users (Admin, Manager, Approver, Employee)');
    console.log('  custom   - Create 6 users based on Selsoft team data\n');
    console.log('Example:');
    console.log('  node scripts/create-selsoft-users.js default');
    console.log('  node scripts/create-selsoft-users.js custom');
  }
};

// Run the script
main().catch(console.error);
