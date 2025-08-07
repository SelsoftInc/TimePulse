#!/usr/bin/env node

/**
 * Create Selsoft Inc Excel File for Tenant Onboarding
 * Generates a sample Excel file with Client, Users, and Employees sheets for Selsoft Inc
 */

const XLSX = require('xlsx');
const path = require('path');

const createSelsoftExcel = () => {
  // Sample Client Data for Selsoft Inc
  const clientData = [
    {
      'Client Name': 'Selsoft Inc',
      'Legal Name': 'Selsoft Incorporated',
      'Contact Person': 'Selva Kumar',
      'Email': 'selva@selsoft.com',
      'Phone': '+1-555-0100',
      'Billing Address': '456 Tech Boulevard',
      'City': 'San Francisco',
      'State': 'CA',
      'Zip Code': '94105',
      'Country': 'US',
      'Tax ID': '98-7654321',
      'Payment Terms': 30,
      'Hourly Rate': 150.00
    }
  ];

  // Sample Users Data for Selsoft Inc
  const usersData = [
    {
      'First Name': 'Selva',
      'Last Name': 'Kumar',
      'Email': 'selva@selsoft.com',
      'Role': 'admin',
      'Department': 'Executive',
      'Title': 'CEO & Founder'
    },
    {
      'First Name': 'Priya',
      'Last Name': 'Sharma',
      'Email': 'priya.sharma@selsoft.com',
      'Role': 'manager',
      'Department': 'Engineering',
      'Title': 'Engineering Manager'
    },
    {
      'First Name': 'Raj',
      'Last Name': 'Patel',
      'Email': 'raj.patel@selsoft.com',
      'Role': 'employee',
      'Department': 'Development',
      'Title': 'Senior Developer'
    },
    {
      'First Name': 'Anita',
      'Last Name': 'Singh',
      'Email': 'anita.singh@selsoft.com',
      'Role': 'employee',
      'Department': 'Finance',
      'Title': 'Financial Controller'
    }
  ];

  // Sample Employees Data for Selsoft Inc
  const employeesData = [
    {
      'Employee ID': 'SEL001',
      'First Name': 'Selva',
      'Last Name': 'Kumar',
      'Email': 'selva@selsoft.com',
      'Department': 'Executive',
      'Title': 'CEO & Founder',
      'Start Date': '2020-01-01',
      'Hourly Rate': 200.00,
      'Salary': 250000,
      'Salary Type': 'salary'
    },
    {
      'Employee ID': 'SEL002',
      'First Name': 'Priya',
      'Last Name': 'Sharma',
      'Email': 'priya.sharma@selsoft.com',
      'Department': 'Engineering',
      'Title': 'Engineering Manager',
      'Start Date': '2020-03-15',
      'Hourly Rate': 95.00,
      'Salary': 197600,
      'Salary Type': 'salary'
    },
    {
      'Employee ID': 'SEL003',
      'First Name': 'Raj',
      'Last Name': 'Patel',
      'Email': 'raj.patel@selsoft.com',
      'Department': 'Development',
      'Title': 'Senior Developer',
      'Start Date': '2020-06-01',
      'Hourly Rate': 85.00,
      'Salary': 176800,
      'Salary Type': 'salary'
    },
    {
      'Employee ID': 'SEL004',
      'First Name': 'Anita',
      'Last Name': 'Singh',
      'Email': 'anita.singh@selsoft.com',
      'Department': 'Finance',
      'Title': 'Financial Controller',
      'Start Date': '2020-09-01',
      'Hourly Rate': 75.00,
      'Salary': 156000,
      'Salary Type': 'salary'
    },
    {
      'Employee ID': 'SEL005',
      'First Name': 'Vikram',
      'Last Name': 'Gupta',
      'Email': 'vikram.gupta@selsoft.com',
      'Department': 'Development',
      'Title': 'Frontend Developer',
      'Start Date': '2021-02-15',
      'Hourly Rate': 70.00,
      'Salary': 0,
      'Salary Type': 'hourly'
    },
    {
      'Employee ID': 'SEL006',
      'First Name': 'Meera',
      'Last Name': 'Reddy',
      'Email': 'meera.reddy@selsoft.com',
      'Department': 'Marketing',
      'Title': 'Digital Marketing Specialist',
      'Start Date': '2021-05-01',
      'Hourly Rate': 60.00,
      'Salary': 124800,
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

  // Write file to Selsoft folder
  const outputPath = path.join(__dirname, '../Onboard/Selsoft/Selsoft.xlsx');
  XLSX.writeFile(workbook, outputPath);

  console.log('✅ Selsoft Inc Excel file created successfully!');
  console.log(`📁 File location: ${outputPath}`);
  console.log('\n📊 Selsoft Inc data includes:');
  console.log(`   • ${clientData.length} client record (Selsoft Inc)`);
  console.log(`   • ${usersData.length} user accounts`);
  console.log(`   • ${employeesData.length} employee records`);
  console.log('\n🚀 You can now test the onboarding API with:');
  console.log('   GET /api/onboarding/tenants/Selsoft/preview');
  console.log('   POST /api/onboarding/tenants/Selsoft/onboard');
};

// Run if called directly
if (require.main === module) {
  createSelsoftExcel();
}

module.exports = { createSelsoftExcel };
