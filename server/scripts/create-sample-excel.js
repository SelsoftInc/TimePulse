#!/usr/bin/env node

/**
 * Create Sample Excel File for Tenant Onboarding
 * Generates a sample Excel file with Client, Users, and Employees sheets
 */

const XLSX = require('xlsx');
const path = require('path');

const createSampleExcel = () => {
  // Sample Client Data
  const clientData = [
    {
      'Client Name': 'Acme Corporation',
      'Legal Name': 'Acme Corp LLC',
      'Contact Person': 'John Smith',
      'Email': 'john.smith@acmecorp.com',
      'Phone': '+1-555-0123',
      'Billing Address': '123 Business Ave',
      'City': 'New York',
      'State': 'NY',
      'Zip Code': '10001',
      'Country': 'US',
      'Tax ID': '12-3456789',
      'Payment Terms': 30,
      'Hourly Rate': 125.00
    }
  ];

  // Sample Users Data
  const usersData = [
    {
      'First Name': 'Alice',
      'Last Name': 'Johnson',
      'Email': 'alice.johnson@acmecorp.com',
      'Role': 'admin',
      'Department': 'IT',
      'Title': 'IT Director'
    },
    {
      'First Name': 'Bob',
      'Last Name': 'Wilson',
      'Email': 'bob.wilson@acmecorp.com',
      'Role': 'manager',
      'Department': 'Operations',
      'Title': 'Operations Manager'
    },
    {
      'First Name': 'Carol',
      'Last Name': 'Davis',
      'Email': 'carol.davis@acmecorp.com',
      'Role': 'employee',
      'Department': 'Finance',
      'Title': 'Financial Analyst'
    }
  ];

  // Sample Employees Data
  const employeesData = [
    {
      'Employee ID': 'EMP001',
      'First Name': 'Alice',
      'Last Name': 'Johnson',
      'Email': 'alice.johnson@acmecorp.com',
      'Department': 'IT',
      'Title': 'IT Director',
      'Start Date': '2023-01-15',
      'Hourly Rate': 85.00,
      'Salary': 176800,
      'Salary Type': 'salary'
    },
    {
      'Employee ID': 'EMP002',
      'First Name': 'Bob',
      'Last Name': 'Wilson',
      'Email': 'bob.wilson@acmecorp.com',
      'Department': 'Operations',
      'Title': 'Operations Manager',
      'Start Date': '2023-02-01',
      'Hourly Rate': 75.00,
      'Salary': 156000,
      'Salary Type': 'salary'
    },
    {
      'Employee ID': 'EMP003',
      'First Name': 'Carol',
      'Last Name': 'Davis',
      'Email': 'carol.davis@acmecorp.com',
      'Department': 'Finance',
      'Title': 'Financial Analyst',
      'Start Date': '2023-03-01',
      'Hourly Rate': 65.00,
      'Salary': 135200,
      'Salary Type': 'salary'
    },
    {
      'Employee ID': 'EMP004',
      'First Name': 'David',
      'Last Name': 'Brown',
      'Email': 'david.brown@acmecorp.com',
      'Department': 'Development',
      'Title': 'Software Developer',
      'Start Date': '2023-04-15',
      'Hourly Rate': 70.00,
      'Salary': 0,
      'Salary Type': 'hourly'
    },
    {
      'Employee ID': 'EMP005',
      'First Name': 'Eva',
      'Last Name': 'Martinez',
      'Email': 'eva.martinez@acmecorp.com',
      'Department': 'Marketing',
      'Title': 'Marketing Specialist',
      'Start Date': '2023-05-01',
      'Hourly Rate': 55.00,
      'Salary': 114400,
      'Salary Type': 'salary'
    }
  ];

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

  // Write file
  const outputPath = path.join(__dirname, '../Onboard/AcmeCorp.xlsx');
  XLSX.writeFile(workbook, outputPath);

  console.log('✅ Sample Excel file created successfully!');
  console.log(`📁 File location: ${outputPath}`);
  console.log('\n📊 Sample data includes:');
  console.log(`   • ${clientData.length} client record`);
  console.log(`   • ${usersData.length} user accounts`);
  console.log(`   • ${employeesData.length} employee records`);
  console.log('\n🚀 You can now test the onboarding API with:');
  console.log('   GET /api/onboarding/tenants/AcmeCorp/preview');
  console.log('   POST /api/onboarding/tenants/AcmeCorp/onboard');
};

// Run if called directly
if (require.main === module) {
  createSampleExcel();
}

module.exports = { createSampleExcel };
