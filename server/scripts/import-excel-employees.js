/**
 * Script to import employees from Selsoft Excel file to database
 * Creates both User accounts (for login) and Employee records (for HR)
 * Password: test123#
 * 
 * Usage: node scripts/import-excel-employees.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { models, connectDB, sequelize } = require('../models');

const ONBOARD_FOLDER = path.join(__dirname, '../Onboard');
const TENANT_NAME = 'Selsoft';
const DEFAULT_PASSWORD = 'test123#';

function getPermissionsByRole(role) {
  const rolePermissions = {
    admin: [
      'ALL_PERMISSIONS',
      'VIEW_DASHBOARD',
      'VIEW_TIMESHEETS',
      'CREATE_TIMESHEETS',
      'EDIT_TIMESHEETS',
      'DELETE_TIMESHEETS',
      'APPROVE_TIMESHEETS',
      'VIEW_EMPLOYEES',
      'CREATE_EMPLOYEE',
      'EDIT_EMPLOYEE',
      'DELETE_EMPLOYEE',
      'VIEW_CLIENTS',
      'CREATE_CLIENT',
      'EDIT_CLIENT',
      'DELETE_CLIENT',
      'VIEW_INVOICES',
      'CREATE_INVOICE',
      'EDIT_INVOICE',
      'DELETE_INVOICE',
      'VIEW_REPORTS',
      'MANAGE_SETTINGS',
      'MANAGE_USERS'
    ],
    manager: [
      'VIEW_DASHBOARD',
      'VIEW_TIMESHEETS',
      'APPROVE_TIMESHEETS',
      'VIEW_EMPLOYEES',
      'EDIT_EMPLOYEE',
      'VIEW_CLIENTS',
      'VIEW_INVOICES',
      'VIEW_REPORTS'
    ],
    employee: [
      'VIEW_DASHBOARD',
      'VIEW_TIMESHEETS',
      'CREATE_TIMESHEETS',
      'EDIT_TIMESHEETS'
    ]
  };
  
  return rolePermissions[role.toLowerCase()] || rolePermissions.employee;
}

async function importExcelEmployees() {
  console.log('🚀 Importing Employees from Excel to Database\n');
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
      console.log('   Please run onboarding first: node scripts/onboard-selsoft.js');
      process.exit(1);
    }

    console.log('\n✅ Found Selsoft tenant');
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Subdomain: ${tenant.subdomain}\n`);

    // Read Excel file
    const tenantFolder = path.join(ONBOARD_FOLDER, TENANT_NAME);
    
    if (!fs.existsSync(tenantFolder)) {
      console.log(`❌ Excel folder not found: ${tenantFolder}`);
      process.exit(1);
    }

    const files = fs.readdirSync(tenantFolder)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
    
    if (files.length === 0) {
      console.log('❌ No Excel file found');
      process.exit(1);
    }

    const fileName = files[0];
    const filePath = path.join(tenantFolder, fileName);
    
    console.log(`📖 Reading Excel file: ${fileName}\n`);

    const workbook = XLSX.readFile(filePath);
    
    // Check for Employees sheet
    if (!workbook.SheetNames.includes('Employees')) {
      console.log('❌ No "Employees" sheet found in Excel file');
      console.log(`   Available sheets: ${workbook.SheetNames.join(', ')}`);
      process.exit(1);
    }

    const employeesSheet = workbook.Sheets['Employees'];
    const employeesFromExcel = XLSX.utils.sheet_to_json(employeesSheet);
    
    console.log(`📊 Found ${employeesFromExcel.length} employees in Excel file\n`);

    // Get existing employees and users
    const existingEmployees = await models.Employee.findAll({
      where: { tenantId: tenant.id }
    });

    const existingUsers = await models.User.findAll({
      where: { tenantId: tenant.id }
    });

    const existingEmployeeEmails = existingEmployees.map(e => e.email.toLowerCase());
    const existingUserEmails = existingUsers.map(u => u.email.toLowerCase());

    console.log(`📊 Current database status:`);
    console.log(`   Existing Employees: ${existingEmployees.length}`);
    console.log(`   Existing Users: ${existingUsers.length}\n`);

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);

    let employeesCreated = 0;
    let usersCreated = 0;
    let skipped = 0;
    let errors = 0;

    console.log('🔄 Processing employees...\n');
    console.log('─'.repeat(80));

    for (const empData of employeesFromExcel) {
      const firstName = empData['First Name'] || empData.firstName || '';
      const lastName = empData['Last Name'] || empData.lastName || '';
      const email = (empData['Email'] || empData.email || '').toLowerCase().trim();
      const employeeId = empData['Employee ID'] || empData.employeeId || '';
      const department = empData['Department'] || empData.department || '';
      const title = empData['Title'] || empData.title || '';
      const hourlyRate = parseFloat(empData['Hourly Rate'] || empData.hourlyRate || 0);
      const role = (empData['Role'] || empData.role || 'employee').toLowerCase();

      if (!email || !firstName || !lastName) {
        console.log(`⚠️  Skipping incomplete record: ${firstName} ${lastName} (${email || 'no email'})`);
        skipped++;
        continue;
      }

      console.log(`\n📝 Processing: ${firstName} ${lastName} (${email})`);

      const transaction = await sequelize.transaction();

      try {
        // Create User account if doesn't exist
        let user = null;
        if (!existingUserEmails.includes(email)) {
          user = await models.User.create({
            tenantId: tenant.id,
            firstName,
            lastName,
            email,
            passwordHash: hashedPassword,
            role,
            department,
            title,
            permissions: getPermissionsByRole(role),
            mustChangePassword: true,
            status: 'active'
          }, { transaction });

          console.log(`   ✅ Created User account (Role: ${role})`);
          usersCreated++;
          existingUserEmails.push(email);
        } else {
          user = existingUsers.find(u => u.email.toLowerCase() === email);
          console.log(`   ⏭️  User account already exists`);
        }

        // Create Employee record if doesn't exist
        if (!existingEmployeeEmails.includes(email)) {
          await models.Employee.create({
            tenantId: tenant.id,
            userId: user?.id || null,
            employeeId: employeeId.toString(),
            firstName,
            lastName,
            email,
            department,
            title,
            hourlyRate,
            salaryType: 'hourly',
            startDate: new Date().toISOString().split('T')[0],
            status: 'active'
          }, { transaction });

          console.log(`   ✅ Created Employee record (ID: ${employeeId}, Rate: $${hourlyRate})`);
          employeesCreated++;
          existingEmployeeEmails.push(email);
        } else {
          console.log(`   ⏭️  Employee record already exists`);
          skipped++;
        }

        await transaction.commit();

      } catch (error) {
        await transaction.rollback();
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 IMPORT SUMMARY');
    console.log('─'.repeat(80));
    console.log(`Total records in Excel: ${employeesFromExcel.length}`);
    console.log(`Users created: ${usersCreated}`);
    console.log(`Employees created: ${employeesCreated}`);
    console.log(`Skipped (already exists): ${skipped}`);
    console.log(`Errors: ${errors}`);

    console.log('\n🔑 LOGIN CREDENTIALS');
    console.log('─'.repeat(80));
    console.log(`Default Password: ${DEFAULT_PASSWORD}`);
    console.log(`All users must change password on first login`);

    console.log('\n🌐 ACCESS INFORMATION');
    console.log('─'.repeat(80));
    console.log(`Login URL: http://localhost:3000/selsoft/login`);
    console.log(`Employee List: http://localhost:3000/selsoft/employees`);

    console.log('\n✅ Import complete!');
    console.log('='.repeat(80));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
importExcelEmployees();
