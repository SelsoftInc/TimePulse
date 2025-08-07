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
  return 'TempPass123!';
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
    
    // Create users
    const createdUsers = await Promise.all(
      transformedData.users.map(userData => 
        models.User.create({
          ...userData,
          tenantId: tenant.id,
          passwordHash: hashedPassword
        }, { transaction })
      )
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

module.exports = router;
