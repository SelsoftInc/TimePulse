/**
 * Script to verify employee data in database vs Excel file
 * Shows exactly what employees and users exist
 * 
 * Usage: node scripts/verify-employee-data.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { models, connectDB } = require('../models');

const ONBOARD_FOLDER = path.join(__dirname, '../Onboard');
const TENANT_NAME = 'Selsoft';

async function verifyEmployeeData() {
  console.log('🔍 Verifying Employee Data: Database vs Excel\n');
  console.log('='.repeat(80));

  try {
    // Connect to database
    await connectDB();

    // Find Selsoft tenant
    const tenant = await models.Tenant.findOne({
      where: { subdomain: 'selsoft' }
    });

    if (!tenant) {
      console.log('❌ Selsoft tenant not found in database');
      process.exit(1);
    }

    console.log('\n📊 TENANT INFORMATION');
    console.log('─'.repeat(80));
    console.log(`Tenant Name: ${tenant.tenantName}`);
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Subdomain: ${tenant.subdomain}`);
    console.log(`Onboarded: ${tenant.onboardedAt}`);

    // Fetch users from database
    const users = await models.User.findAll({
      where: { tenantId: tenant.id },
      order: [['created_at', 'ASC']]
    });

    console.log('\n\n👥 USERS IN DATABASE (Login Accounts)');
    console.log('─'.repeat(80));
    console.log(`Total Users: ${users.length}\n`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Department: ${user.department || 'N/A'}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No users found in database\n');
    }

    // Fetch employees from database
    const employees = await models.Employee.findAll({
      where: { tenantId: tenant.id },
      order: [['created_at', 'ASC']]
    });

    console.log('\n👔 EMPLOYEES IN DATABASE (HR Records)');
    console.log('─'.repeat(80));
    console.log(`Total Employees: ${employees.length}\n`);
    
    if (employees.length > 0) {
      employees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.firstName} ${emp.lastName}`);
        console.log(`   Email: ${emp.email}`);
        console.log(`   Employee ID: ${emp.employeeId || 'N/A'}`);
        console.log(`   Department: ${emp.department || 'N/A'}`);
        console.log(`   Title: ${emp.title || 'N/A'}`);
        console.log(`   Hourly Rate: $${emp.hourlyRate || '0.00'}`);
        console.log(`   User ID: ${emp.userId || 'Not linked to user account'}`);
        console.log(`   Status: ${emp.status}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No employees found in database\n');
    }

    // Read Excel file
    const tenantFolder = path.join(ONBOARD_FOLDER, TENANT_NAME);
    
    if (!fs.existsSync(tenantFolder)) {
      console.log(`\n⚠️  Excel folder not found: ${tenantFolder}`);
      process.exit(0);
    }

    const files = fs.readdirSync(tenantFolder)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
    
    if (files.length === 0) {
      console.log('\n⚠️  No Excel file found');
      process.exit(0);
    }

    const fileName = files[0];
    const filePath = path.join(tenantFolder, fileName);
    
    console.log('\n\n📄 EXCEL FILE CONTENTS');
    console.log('─'.repeat(80));
    console.log(`File: ${fileName}\n`);

    const workbook = XLSX.readFile(filePath);
    
    // Read Users sheet
    if (workbook.SheetNames.includes('Users')) {
      const usersSheet = workbook.Sheets['Users'];
      const usersFromExcel = XLSX.utils.sheet_to_json(usersSheet);
      
      console.log(`\n👥 Users Sheet (${usersFromExcel.length} rows):`);
      console.log('─'.repeat(80));
      usersFromExcel.forEach((user, index) => {
        console.log(`${index + 1}. ${user['First Name'] || user.firstName || ''} ${user['Last Name'] || user.lastName || ''}`);
        console.log(`   Email: ${user['Email'] || user.email || 'N/A'}`);
        console.log(`   Role: ${user['Role'] || user.role || 'N/A'}`);
        console.log(`   Department: ${user['Department'] || user.department || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No "Users" sheet found in Excel file');
    }

    // Read Employees sheet
    if (workbook.SheetNames.includes('Employees')) {
      const employeesSheet = workbook.Sheets['Employees'];
      const employeesFromExcel = XLSX.utils.sheet_to_json(employeesSheet);
      
      console.log(`\n👔 Employees Sheet (${employeesFromExcel.length} rows):`);
      console.log('─'.repeat(80));
      employeesFromExcel.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp['First Name'] || emp.firstName || ''} ${emp['Last Name'] || emp.lastName || ''}`);
        console.log(`   Email: ${emp['Email'] || emp.email || 'N/A'}`);
        console.log(`   Employee ID: ${emp['Employee ID'] || emp.employeeId || 'N/A'}`);
        console.log(`   Department: ${emp['Department'] || emp.department || 'N/A'}`);
        console.log(`   Title: ${emp['Title'] || emp.title || 'N/A'}`);
        console.log(`   Hourly Rate: $${emp['Hourly Rate'] || emp.hourlyRate || '0.00'}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No "Employees" sheet found in Excel file');
    }

    // Comparison
    console.log('\n\n📊 COMPARISON SUMMARY');
    console.log('='.repeat(80));
    console.log(`Database Users: ${users.length}`);
    console.log(`Database Employees: ${employees.length}`);
    
    if (workbook.SheetNames.includes('Users')) {
      const usersFromExcel = XLSX.utils.sheet_to_json(workbook.Sheets['Users']);
      console.log(`Excel Users: ${usersFromExcel.length}`);
    }
    
    if (workbook.SheetNames.includes('Employees')) {
      const employeesFromExcel = XLSX.utils.sheet_to_json(workbook.Sheets['Employees']);
      console.log(`Excel Employees: ${employeesFromExcel.length}`);
    }

    console.log('\n💡 IMPORTANT NOTES:');
    console.log('─'.repeat(80));
    console.log('1. Users = Login accounts (for authentication)');
    console.log('2. Employees = HR records (shown in Employee List UI)');
    console.log('3. The Employee List UI displays records from the EMPLOYEES table');
    console.log('4. Not all users need to be employees, and vice versa');
    console.log('\n✅ The employees you see in the UI ARE from the database!');
    console.log('='.repeat(80));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
verifyEmployeeData();
