/**
 * Tenant Onboarding Routes - Database Integrated
 * Processes Excel files from the Onboard folder to create tenants, users, and employees
 * Uses Sequelize models for database persistence
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { models, sequelize, setTenantContext } = require('../models');

// Onboard folder path
const ONBOARD_FOLDER = path.join(__dirname, '../Onboard');

// Ensure onboard folder exists
if (!fs.existsSync(ONBOARD_FOLDER)) {
  fs.mkdirSync(ONBOARD_FOLDER, { recursive: true });
}

/**
 * Helper function to transform Excel data to standardized format
 */
function transformTenantData(excelData) {
  const { Client: clients = [], Users: users = [], Employees: employees = [] } = excelData;
  
  // Transform client data
  const transformedClients = clients.map(client => ({
    clientName: client['Client Name'] || client.name || '',
    legalName: client['Legal Name'] || client.legalName || client['Client Name'] || '',
    contactPerson: client['Contact Person'] || client.contact || '',
    email: client['Email'] || client.email || '',
    phone: client['Phone'] || client.phone || '',
    billingAddress: {
      street: client['Billing Address'] || client.address || '',
      city: client['City'] || client.city || '',
      state: client['State'] || client.state || '',
      zipCode: client['Zip Code'] || client.zip || '',
      country: client['Country'] || client.country || 'US'
    },
    taxId: client['Tax ID'] || client.taxId || '',
    paymentTerms: parseInt(client['Payment Terms']) || 30,
    hourlyRate: parseFloat(client['Hourly Rate']) || 0,
    status: 'active'
  }));
  
  // Transform user data
  const transformedUsers = users.map(user => ({
    firstName: user['First Name'] || user.firstName || '',
    lastName: user['Last Name'] || user.lastName || '',
    email: user['Email'] || user.email || '',
    role: (user['Role'] || user.role || 'employee').toLowerCase(),
    department: user['Department'] || user.department || '',
    title: user['Title'] || user.title || '',
    mustChangePassword: true,
    status: 'active'
  }));
  
  // Transform employee data
  const transformedEmployees = employees.map(employee => ({
    employeeId: employee['Employee ID'] || employee.id || '',
    firstName: employee['First Name'] || employee.firstName || '',
    lastName: employee['Last Name'] || employee.lastName || '',
    email: employee['Email'] || employee.email || '',
    department: employee['Department'] || employee.department || '',
    title: employee['Title'] || employee.title || '',
    startDate: employee['Start Date'] || employee.startDate || new Date().toISOString().split('T')[0],
    hourlyRate: parseFloat(employee['Hourly Rate']) || 0,
    salaryAmount: parseFloat(employee['Salary']) || 0,
    salaryType: employee['Salary Type'] || employee.salaryType || 'hourly',
    status: 'active'
  }));
  
  return {
    clients: transformedClients,
    users: transformedUsers,
    employees: transformedEmployees
  };
}

/**
 * Helper function to read Excel file and extract data
 */
function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const data = {};
    
    // Read each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      data[sheetName] = jsonData;
    });
    
    return data;
  } catch (error) {
    throw new Error(`Failed to read Excel file: ${error.message}`);
  }
}

/**
 * Helper function to generate default password
 */
function generateDefaultPassword() {
  return 'test123#';
}

/**
 * Helper function to get permissions by role
 */
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
    approver: [
      'VIEW_DASHBOARD',
      'VIEW_TIMESHEETS',
      'APPROVE_TIMESHEETS',
      'VIEW_EMPLOYEES',
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

// =============================================
// ROUTES
// =============================================

/**
 * GET /api/onboarding/tenants
 * List all available tenant folders in the Onboard directory
 */
router.get('/tenants', async (req, res) => {
  try {
    // Get all directories in the Onboard folder
    const tenantFolders = fs.readdirSync(ONBOARD_FOLDER, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    const tenantFiles = await Promise.all(tenantFolders.map(async (tenantName) => {
      const tenantFolder = path.join(ONBOARD_FOLDER, tenantName);
      
      // Look for Excel files in the tenant folder
      const files = fs.readdirSync(tenantFolder)
        .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
      
      if (files.length === 0) {
        return {
          tenantName,
          fileName: null,
          fileSize: 0,
          lastModified: null,
          status: 'no_file',
          tenantId: null,
          error: 'No Excel file found in tenant folder'
        };
      }
      
      // Use the first Excel file found (typically should be one)
      const fileName = files[0];
      const filePath = path.join(tenantFolder, fileName);
      const stats = fs.statSync(filePath);
      
      // Check if tenant is already onboarded
      const existingTenant = await models.Tenant.findOne({
        where: { tenantName }
      });
      
      return {
        tenantName,
        fileName,
        fileSize: stats.size,
        lastModified: stats.mtime,
        status: existingTenant ? 'onboarded' : 'pending',
        tenantId: existingTenant?.id || null,
        folderPath: tenantFolder
      };
    }));
    
    res.json({
      success: true,
      tenants: tenantFiles,
      count: tenantFiles.length
    });
  } catch (error) {
    console.error('Error listing tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list tenant folders',
      details: error.message
    });
  }
});

/**
 * GET /api/onboarding/tenants/:tenantName/preview
 * Preview tenant data from Excel file without onboarding
 */
router.get('/tenants/:tenantName/preview', (req, res) => {
  try {
    const { tenantName } = req.params;
    const tenantFolder = path.join(ONBOARD_FOLDER, tenantName);
    
    if (!fs.existsSync(tenantFolder)) {
      return res.status(404).json({
        success: false,
        error: 'Tenant folder not found'
      });
    }
    
    // Find Excel file in tenant folder
    const files = fs.readdirSync(tenantFolder)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
    
    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No Excel file found in tenant folder'
      });
    }
    
    const fileName = files[0]; // Use first Excel file found
    const filePath = path.join(tenantFolder, fileName);
    
    const excelData = readExcelFile(filePath);
    const transformedData = transformTenantData(excelData);
    
    res.json({
      success: true,
      tenantName,
      fileName,
      data: transformedData,
      summary: {
        clients: transformedData.clients.length,
        users: transformedData.users.length,
        employees: transformedData.employees.length
      }
    });
  } catch (error) {
    console.error('Error previewing tenant data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview tenant data',
      details: error.message
    });
  }
});

/**
 * POST /api/onboarding/tenants/:tenantName/onboard
 * Onboard a tenant by processing their Excel file and saving to database
 */
router.post('/tenants/:tenantName/onboard', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tenantName } = req.params;
    const { subdomain } = req.body;
    
    if (!subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Subdomain is required for onboarding'
      });
    }
    
    // Check if tenant already exists
    const existingTenant = await models.Tenant.findOne({
      where: { tenantName },
      transaction
    });
    
    if (existingTenant) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: 'Tenant already onboarded'
      });
    }
    
    const tenantFolder = path.join(ONBOARD_FOLDER, tenantName);
    
    if (!fs.existsSync(tenantFolder)) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Tenant folder not found'
      });
    }
    
    // Find Excel file in tenant folder
    const files = fs.readdirSync(tenantFolder)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
    
    if (files.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'No Excel file found in tenant folder'
      });
    }
    
    const fileName = files[0]; // Use first Excel file found
    const filePath = path.join(tenantFolder, fileName);
    
    // Read and transform Excel data
    const excelData = readExcelFile(filePath);
    const transformedData = transformTenantData(excelData);
    
    // Create tenant
    const tenant = await models.Tenant.create({
      tenantName,
      legalName: tenantName,
      subdomain,
      contactAddress: {},
      invoiceAddress: {},
      contactInfo: {},
      taxInfo: {},
      settings: {
        defaultCurrency: 'USD',
        timeZone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY'
      },
      status: 'active'
    }, { transaction });
    
    // Hash passwords for users
    const saltRounds = 10;
    const defaultPassword = generateDefaultPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    
    // Create users with role-based permissions
    const createdUsers = await Promise.all(
      transformedData.users.map(userData => {
        const userRole = (userData.role || 'employee').toLowerCase();
        const permissions = getPermissionsByRole(userRole);
        
        return models.User.create({
          ...userData,
          tenantId: tenant.id,
          passwordHash: hashedPassword,
          role: userRole,
          permissions: permissions,
          mustChangePassword: true
        }, { transaction });
      })
    );
    
    // Create employees
    const createdEmployees = await Promise.all(
      transformedData.employees.map(employeeData => 
        models.Employee.create({
          ...employeeData,
          tenantId: tenant.id
        }, { transaction })
      )
    );
    
    // Create clients
    const createdClients = await Promise.all(
      transformedData.clients.map(clientData => 
        models.Client.create({
          ...clientData,
          tenantId: tenant.id
        }, { transaction })
      )
    );
    
    // Create onboarding log
    const onboardingLog = await models.OnboardingLog.create({
      tenantId: tenant.id,
      sourceFile: fileName,
      onboardingData: {
        originalFile: fileName,
        processedAt: new Date().toISOString(),
        subdomain,
        defaultPassword
      },
      usersCreated: createdUsers.length,
      employeesCreated: createdEmployees.length,
      clientsCreated: createdClients.length,
      status: 'completed'
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Tenant onboarded successfully',
      tenant: {
        id: tenant.id,
        tenantName: tenant.tenantName,
        subdomain: tenant.subdomain,
        status: tenant.status
      },
      summary: {
        usersCreated: createdUsers.length,
        employeesCreated: createdEmployees.length,
        clientsCreated: createdClients.length,
        defaultPassword
      },
      onboardingLog: onboardingLog.id
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error onboarding tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to onboard tenant',
      details: error.message
    });
  }
});

/**
 * GET /api/onboarding/tenants/:tenantName/status
 * Check onboarding status for a tenant
 */
router.get('/tenants/:tenantName/status', async (req, res) => {
  try {
    const { tenantName } = req.params;
    
    const tenant = await models.Tenant.findOne({
      where: { tenantName },
      include: [
        {
          model: models.OnboardingLog,
          as: 'onboardingLogs',
          order: [['created_at', 'DESC']],
          limit: 1
        }
      ]
    });
    
    if (!tenant) {
      return res.json({
        success: true,
        status: 'not_onboarded',
        tenantName
      });
    }
    
    const latestLog = tenant.onboardingLogs?.[0];
    
    res.json({
      success: true,
      status: 'onboarded',
      tenantName,
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain,
        onboardedAt: tenant.onboardedAt
      },
      summary: latestLog ? {
        usersCreated: latestLog.usersCreated,
        employeesCreated: latestLog.employeesCreated,
        clientsCreated: latestLog.clientsCreated,
        onboardedAt: latestLog.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check onboarding status',
      details: error.message
    });
  }
});

/**
 * POST /api/onboarding/create-role-users
 * Create users with different roles for a tenant (Admin, Manager, Approver, Employee)
 * Body: { tenantId, subdomain, users: [{ firstName, lastName, email, role, phone }] }
 */
router.post('/create-role-users', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tenantId, subdomain, users } = req.body;
    
    if (!tenantId && !subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Either tenantId or subdomain is required'
      });
    }
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Users array is required and must not be empty'
      });
    }
    
    // Find tenant
    let tenant;
    if (tenantId) {
      tenant = await models.Tenant.findByPk(tenantId, { transaction });
    } else {
      tenant = await models.Tenant.findOne({
        where: { subdomain },
        transaction
      });
    }
    
    if (!tenant) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Hash default password
    const defaultPassword = generateDefaultPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Create users
    const createdUsers = [];
    const createdEmployees = [];
    
    for (const userData of users) {
      const { firstName, lastName, email, role = 'employee', phone, department, title } = userData;
      
      if (!firstName || !lastName) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'firstName and lastName are required for all users'
        });
      }
      
      // Validate role
      const validRoles = ['admin', 'manager', 'approver', 'employee'];
      const userRole = (role || 'employee').toLowerCase();
      
      if (!validRoles.includes(userRole)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Invalid role: ${role}. Must be one of: admin, manager, approver, employee`
        });
      }
      
      // Check if user with this email already exists
      if (email) {
        const existingUser = await models.User.findOne({
          where: { 
            tenantId: tenant.id,
            email: email
          },
          transaction
        });
        
        if (existingUser) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            error: `User with email ${email} already exists for this tenant`
          });
        }
      }
      
      // Get permissions for role
      const permissions = getPermissionsByRole(userRole);
      
      // Create user
      const user = await models.User.create({
        id: uuidv4(),
        tenantId: tenant.id,
        firstName,
        lastName,
        email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${tenant.subdomain || 'temp'}.com`,
        password: hashedPassword,
        role: userRole,
        department: department || '',
        title: title || '',
        permissions: permissions,
        status: 'active',
        mustChangePassword: true
      }, { transaction });
      
      createdUsers.push({
        id: user.id,
        name: `${firstName} ${lastName}`,
        email: user.email,
        role: userRole,
        permissions: permissions
      });
      
      // Create corresponding employee record
      const employee = await models.Employee.create({
        id: uuidv4(),
        tenantId: tenant.id,
        userId: user.id,
        firstName,
        lastName,
        email: user.email,
        phone: phone || '',
        department: department || '',
        title: title || '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        salaryType: 'hourly'
      }, { transaction });
      
      createdEmployees.push({
        id: employee.id,
        name: `${firstName} ${lastName}`,
        role: userRole
      });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `Successfully created ${createdUsers.length} users for tenant ${tenant.tenantName}`,
      tenant: {
        id: tenant.id,
        tenantName: tenant.tenantName,
        subdomain: tenant.subdomain
      },
      users: createdUsers,
      employees: createdEmployees,
      defaultPassword: defaultPassword,
      passwordNote: 'All users must change their password on first login'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating role-based users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create users',
      details: error.message
    });
  }
});

/**
 * POST /api/onboarding/create-default-users
 * Create default users (one of each role) for a tenant
 * Body: { tenantId OR subdomain, prefix (optional) }
 */
router.post('/create-default-users', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { tenantId, subdomain, prefix = 'Demo' } = req.body;
    
    if (!tenantId && !subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Either tenantId or subdomain is required'
      });
    }
    
    // Find tenant
    let tenant;
    if (tenantId) {
      tenant = await models.Tenant.findByPk(tenantId, { transaction });
    } else {
      tenant = await models.Tenant.findOne({
        where: { subdomain },
        transaction
      });
    }
    
    if (!tenant) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    // Define default users for each role
    const defaultUsers = [
      {
        firstName: `${prefix}`,
        lastName: 'Admin',
        email: `admin@${tenant.subdomain || 'demo'}.com`,
        role: 'admin',
        department: 'Administration',
        title: 'System Administrator',
        phone: '555-0001'
      },
      {
        firstName: `${prefix}`,
        lastName: 'Manager',
        email: `manager@${tenant.subdomain || 'demo'}.com`,
        role: 'manager',
        department: 'Management',
        title: 'Operations Manager',
        phone: '555-0002'
      },
      {
        firstName: `${prefix}`,
        lastName: 'Approver',
        email: `approver@${tenant.subdomain || 'demo'}.com`,
        role: 'approver',
        department: 'Operations',
        title: 'Timesheet Approver',
        phone: '555-0003'
      },
      {
        firstName: `${prefix}`,
        lastName: 'Employee',
        email: `employee@${tenant.subdomain || 'demo'}.com`,
        role: 'employee',
        department: 'Operations',
        title: 'Staff Member',
        phone: '555-0004'
      }
    ];
    
    // Hash default password
    const defaultPassword = generateDefaultPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const createdUsers = [];
    const createdEmployees = [];
    
    for (const userData of defaultUsers) {
      const { firstName, lastName, email, role, phone, department, title } = userData;
      
      // Check if user already exists
      const existingUser = await models.User.findOne({
        where: { 
          tenantId: tenant.id,
          email: email
        },
        transaction
      });
      
      if (existingUser) {
        console.log(`User ${email} already exists, skipping...`);
        continue;
      }
      
      // Get permissions for role
      const permissions = getPermissionsByRole(role);
      
      // Create user
      const user = await models.User.create({
        id: uuidv4(),
        tenantId: tenant.id,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role,
        department: department,
        title: title,
        permissions: permissions,
        status: 'active',
        mustChangePassword: true
      }, { transaction });
      
      createdUsers.push({
        id: user.id,
        name: `${firstName} ${lastName}`,
        email: user.email,
        role: role,
        permissions: permissions
      });
      
      // Create corresponding employee record
      const employee = await models.Employee.create({
        id: uuidv4(),
        tenantId: tenant.id,
        userId: user.id,
        firstName,
        lastName,
        email: user.email,
        phone: phone,
        department: department,
        title: title,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        salaryType: 'hourly'
      }, { transaction });
      
      createdEmployees.push({
        id: employee.id,
        name: `${firstName} ${lastName}`,
        role: role
      });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `Successfully created ${createdUsers.length} default users for tenant ${tenant.tenantName}`,
      tenant: {
        id: tenant.id,
        tenantName: tenant.tenantName,
        subdomain: tenant.subdomain
      },
      users: createdUsers,
      employees: createdEmployees,
      defaultPassword: defaultPassword,
      loginCredentials: createdUsers.map(u => ({
        email: u.email,
        password: defaultPassword,
        role: u.role
      })),
      passwordNote: 'All users must change their password on first login'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating default users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create default users',
      details: error.message
    });
  }
});

module.exports = router;
