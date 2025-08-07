#!/usr/bin/env node

/**
 * Create Tenant Excel File for Onboarding
 * Generic script to generate Excel files for any tenant
 * Usage: node create-tenant-excel.js <tenantName> [options]
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Default template data that can be customized
const DEFAULT_TEMPLATES = {
  'Selsoft': {
    client: {
      'Client Name': 'Selsoft Inc',
      'Legal Name': 'Selsoft Incorporated',
      'Contact Person': 'Selva Kumar',
      'Email': 'selva@selsoftinc.com',
      'Phone': '+1-555-0100',
      'Billing Address': '456 Tech Boulevard',
      'City': 'San Francisco',
      'State': 'CA',
      'Zip Code': '94105',
      'Country': 'US',
      'Tax ID': '98-7654321',
      'Payment Terms': 30,
      'Hourly Rate': 150.00
    },
    users: [
      {
        'First Name': 'Pushban',
        'Last Name': 'Rajaiyan',
        'Email': 'pushban@selsoftinc.com',
        'Role': 'admin',
        'Department': 'Administration',
        'Title': 'Company Administrator'
      },
      {
        'First Name': 'Uma',
        'Last Name': 'Sivalingam',
        'Email': 'uma@selsoftinc.com',
        'Role': 'admin',
        'Department': 'Administration',
        'Title': 'System Administrator'
      },
      {
        'First Name': 'Lalitha',
        'Last Name': 'Prabhu',
        'Email': 'lalitha@selsoftinc.com',
        'Role': 'approver',
        'Department': 'Operations',
        'Title': 'Operations Manager'
      }
    ],
    employees: [
      {
        'Employee ID': '100',
        'First Name': 'Selvakumar',
        'Last Name': 'Murugesan',
        'Email': 'selvakumar@selsoftinc.com',
        'Department': 'Executive',
        'Title': 'CEO',
        'Start Date': '2020-01-01',
        'Hourly Rate': 200.00,
        'Salary': 250000,
        'Salary Type': 'salary'
      },
      {
        'Employee ID': '50',
        'First Name': 'Suresh',
        'Last Name': 'Palakad Krishnan',
        'Email': 'ksuresh@selsoftinc.com',
        'Department': 'Engineering',
        'Title': 'Senior Engineer',
        'Start Date': '2020-02-01',
        'Hourly Rate': 120.00,
        'Salary': 180000,
        'Salary Type': 'salary'
      },
      {
        'Employee ID': '75',
        'First Name': 'Panneerselvam',
        'Last Name': 'Arulanandam',
        'Email': 'panneer@selsoftinc.com',
        'Department': 'Development',
        'Title': 'Developer',
        'Start Date': '2020-03-01',
        'Hourly Rate': 115.00,
        'Salary': 175000,
        'Salary Type': 'salary'
      },
      {
        'Employee ID': '1',
        'First Name': 'Pushban',
        'Last Name': 'Rajaiyan',
        'Email': 'push123@gmail.com',
        'Department': 'Administration',
        'Title': 'Company Administrator',
        'Start Date': '2019-05-15',
        'Hourly Rate': 110.00,
        'Salary': 165000,
        'Salary Type': 'salary'
      },
      {
        'Employee ID': '20',
        'First Name': 'Uma',
        'Last Name': 'Sivalingam',
        'Email': 'umapushban@gmail.com',
        'Department': 'Administration',
        'Title': 'System Administrator',
        'Start Date': '2021-08-01',
        'Hourly Rate': 85.00,
        'Salary': 176800,
        'Salary Type': 'salary'
      },
      {
        'Employee ID': '25',
        'First Name': 'Lalitha',
        'Last Name': 'Prabhu',
        'Email': 'lalitha@selsoftinc.com',
        'Department': 'Operations',
        'Title': 'Operations Manager',
        'Start Date': '2021-09-01',
        'Hourly Rate': 90.00,
        'Salary': 140000,
        'Salary Type': 'salary'
      }
    ]
  }
};

// Generic template for any tenant
const createGenericTemplate = (tenantName) => {
  const domain = tenantName.toLowerCase().replace(/\s+/g, '') + '.com';
  const prefix = tenantName.substring(0, 3).toUpperCase();
  
  return {
    client: {
      'Client Name': tenantName,
      'Legal Name': `${tenantName} LLC`,
      'Contact Person': 'John Doe',
      'Email': `contact@${domain}`,
      'Phone': '+1-555-0123',
      'Billing Address': '123 Business Street',
      'City': 'New York',
      'State': 'NY',
      'Zip Code': '10001',
      'Country': 'US',
      'Tax ID': '12-3456789',
      'Payment Terms': 30,
      'Hourly Rate': 125.00
    },
    users: [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': `john.doe@${domain}`,
        'Role': 'admin',
        'Department': 'Executive',
        'Title': 'CEO'
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': `jane.smith@${domain}`,
        'Role': 'manager',
        'Department': 'Operations',
        'Title': 'Operations Manager'
      },
      {
        'First Name': 'Bob',
        'Last Name': 'Johnson',
        'Email': `bob.johnson@${domain}`,
        'Role': 'employee',
        'Department': 'Development',
        'Title': 'Developer'
      }
    ],
    employees: [
      {
        'Employee ID': `${prefix}001`,
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': `john.doe@${domain}`,
        'Department': 'Executive',
        'Title': 'CEO',
        'Start Date': '2023-01-01',
        'Hourly Rate': 150.00,
        'Salary': 200000,
        'Salary Type': 'salary'
      },
      {
        'Employee ID': `${prefix}002`,
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': `jane.smith@${domain}`,
        'Department': 'Operations',
        'Title': 'Operations Manager',
        'Start Date': '2023-02-01',
        'Hourly Rate': 85.00,
        'Salary': 120000,
        'Salary Type': 'salary'
      },
      {
        'Employee ID': `${prefix}003`,
        'First Name': 'Bob',
        'Last Name': 'Johnson',
        'Email': `bob.johnson@${domain}`,
        'Department': 'Development',
        'Title': 'Developer',
        'Start Date': '2023-03-01',
        'Hourly Rate': 75.00,
        'Salary': 0,
        'Salary Type': 'hourly'
      }
    ]
  };
};

const createTenantExcel = (tenantName, options = {}) => {
  // Get template data (predefined or generic)
  const template = DEFAULT_TEMPLATES[tenantName] || createGenericTemplate(tenantName);
  
  // Allow overriding template data
  const clientData = [options.client || template.client];
  const usersData = options.users || template.users;
  const employeesData = options.employees || template.employees;

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Create worksheets
  const clientSheet = XLSX.utils.json_to_sheet(clientData);
  const usersSheet = XLSX.utils.json_to_sheet(usersData);
  const employeesSheet = XLSX.utils.json_to_sheet(employeesData);

  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(workbook, clientSheet, 'Client');
  XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
  XLSX.utils.book_append_sheet(workbook, employeesSheet, 'Employees');

  // Ensure tenant folder exists
  const tenantFolder = path.join(__dirname, '../Onboard', tenantName);
  if (!fs.existsSync(tenantFolder)) {
    fs.mkdirSync(tenantFolder, { recursive: true });
  }

  // Write file to tenant folder
  const outputPath = path.join(tenantFolder, `${tenantName}.xlsx`);
  XLSX.writeFile(workbook, outputPath);

  console.log(`✅ ${tenantName} Excel file created successfully!`);
  console.log(`📁 File location: ${outputPath}`);
  console.log(`\n📊 ${tenantName} data includes:`);
  console.log(`   • ${clientData.length} client record`);
  console.log(`   • ${usersData.length} user accounts`);
  console.log(`   • ${employeesData.length} employee records`);
  console.log(`\n🚀 You can now test the onboarding API with:`);
  console.log(`   GET /api/onboarding/tenants/${tenantName}/preview`);
  console.log(`   POST /api/onboarding/tenants/${tenantName}/onboard`);
  
  return outputPath;
};

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node create-tenant-excel.js <tenantName>');
    console.log('');
    console.log('Examples:');
    console.log('  node create-tenant-excel.js Selsoft');
    console.log('  node create-tenant-excel.js "Acme Corp"');
    console.log('  node create-tenant-excel.js TechStart');
    console.log('');
    console.log('Available predefined templates:');
    console.log('  - Selsoft (with custom Selsoft Inc data)');
    console.log('  - Any other name will use generic template');
    process.exit(1);
  }
  
  const tenantName = args[0];
  createTenantExcel(tenantName);
}

module.exports = { createTenantExcel, createGenericTemplate };
