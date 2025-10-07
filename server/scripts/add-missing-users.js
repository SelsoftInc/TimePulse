/**
 * Script to add missing users from Selsoft Excel file
 * Creates user accounts with temporary password: test123#
 * 
 * Usage: node scripts/add-missing-users.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { models, connectDB } = require('../models');

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
      'VIEW_TIMESHEETS',
      'CREATE_TIMESHEETS',
      'EDIT_TIMESHEETS'
    ]
  };
  
  return rolePermissions[role.toLowerCase()] || rolePermissions.employee;
}

async function addMissingUsers() {
  console.log('🚀 Adding missing users from Selsoft Excel file...\n');

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

    console.log('✅ Found Selsoft tenant:', tenant.tenantName);
    console.log(`   Tenant ID: ${tenant.id}\n`);

    // Read Excel file
    const tenantFolder = path.join(ONBOARD_FOLDER, TENANT_NAME);
    const files = fs.readdirSync(tenantFolder)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
    
    if (files.length === 0) {
      console.error('❌ No Excel file found');
      process.exit(1);
    }

    const fileName = files[0];
    const filePath = path.join(tenantFolder, fileName);
    
    console.log(`📖 Reading Excel file: ${fileName}\n`);

    const workbook = XLSX.readFile(filePath);
    const usersSheet = workbook.Sheets['Users'];
    const employeesSheet = workbook.Sheets['Employees'];
    
    if (!usersSheet && !employeesSheet) {
      console.error('❌ No Users or Employees sheet found in Excel file');
      process.exit(1);
    }

    let usersFromExcel = [];
    
    if (usersSheet) {
      usersFromExcel = XLSX.utils.sheet_to_json(usersSheet);
      console.log(`📊 Found ${usersFromExcel.length} users in Users sheet`);
    }

    if (employeesSheet) {
      const employeesFromExcel = XLSX.utils.sheet_to_json(employeesSheet);
      console.log(`📊 Found ${employeesFromExcel.length} employees in Employees sheet\n`);
      
      // Add employees as users if not already in users list
      employeesFromExcel.forEach(emp => {
        const email = emp['Email'] || emp.email;
        if (email && !usersFromExcel.find(u => (u['Email'] || u.email) === email)) {
          usersFromExcel.push({
            'First Name': emp['First Name'] || emp.firstName,
            'Last Name': emp['Last Name'] || emp.lastName,
            'Email': email,
            'Role': emp['Role'] || 'employee',
            'Department': emp['Department'] || emp.department,
            'Title': emp['Title'] || emp.title
          });
        }
      });
    }

    console.log(`\n📋 Total users to process: ${usersFromExcel.length}\n`);

    // Get existing users
    const existingUsers = await models.User.findAll({
      where: { tenantId: tenant.id }
    });

    const existingEmails = existingUsers.map(u => u.email.toLowerCase());
    console.log(`📊 Existing users in database: ${existingUsers.length}`);
    console.log(`   Emails: ${existingEmails.join(', ')}\n`);

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);

    // Add missing users
    let addedCount = 0;
    let skippedCount = 0;

    for (const userData of usersFromExcel) {
      const email = (userData['Email'] || userData.email || '').toLowerCase();
      const firstName = userData['First Name'] || userData.firstName || '';
      const lastName = userData['Last Name'] || userData.lastName || '';
      const role = (userData['Role'] || userData.role || 'employee').toLowerCase();
      const department = userData['Department'] || userData.department || '';
      const title = userData['Title'] || userData.title || '';

      if (!email || !firstName || !lastName) {
        console.log(`⚠️  Skipping incomplete user data: ${email || 'no email'}`);
        skippedCount++;
        continue;
      }

      if (existingEmails.includes(email)) {
        console.log(`⏭️  User already exists: ${email}`);
        skippedCount++;
        continue;
      }

      try {
        const newUser = await models.User.create({
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
        });

        console.log(`✅ Created user: ${firstName} ${lastName} (${email}) - Role: ${role}`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Failed to create user ${email}:`, error.message);
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Summary:');
    console.log(`   Users added: ${addedCount}`);
    console.log(`   Users skipped: ${skippedCount}`);
    console.log(`   Total processed: ${usersFromExcel.length}`);
    console.log(`\n🔑 Default Password: ${DEFAULT_PASSWORD}`);
    console.log(`   All users must change password on first login`);
    console.log('='.repeat(80));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
addMissingUsers();
