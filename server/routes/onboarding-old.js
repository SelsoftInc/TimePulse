/**
 * Tenant Onboarding Routes
 * Process Excel files from Onboard folder to set up new tenants
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Path to the Onboard directory
const ONBOARD_DIR = path.join(__dirname, '../../Onboard');

/**
 * Process Excel file and extract tenant data
 */
function processExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const result = {
      client: null,
      users: [],
      employees: []
    };

    // Process Client tab
    if (workbook.SheetNames.includes('Client')) {
      const clientSheet = workbook.Sheets['Client'];
      const clientData = XLSX.utils.sheet_to_json(clientSheet);
      result.client = clientData[0] || null; // Assuming first row contains client data
    }

    // Process Users tab
    if (workbook.SheetNames.includes('Users')) {
      const usersSheet = workbook.Sheets['Users'];
      result.users = XLSX.utils.sheet_to_json(usersSheet);
    }

    // Process Employees tab
    if (workbook.SheetNames.includes('Employees')) {
      const employeesSheet = workbook.Sheets['Employees'];
      result.employees = XLSX.utils.sheet_to_json(employeesSheet);
    }

    return result;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
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
 * List all available tenant files in the Onboard folder
 */
router.get('/tenants', async (req, res) => {
  try {
    const files = fs.readdirSync(ONBOARD_FOLDER)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
    
    const tenantFiles = await Promise.all(files.map(async (file) => {
      const filePath = path.join(ONBOARD_FOLDER, file);
      const stats = fs.statSync(filePath);
      const tenantName = path.basename(file, path.extname(file));
      
      // Check if tenant is already onboarded
      const existingTenant = await models.Tenant.findOne({
        where: { tenantName }
      });
      
      return {
        tenantName,
        fileName: file,
        fileSize: stats.size,
        lastModified: stats.mtime,
        status: existingTenant ? 'onboarded' : 'pending',
        tenantId: existingTenant?.id || null
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
      error: 'Failed to list tenant files',
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
    const fileName = `${tenantName}.xlsx`;
    const filePath = path.join(ONBOARD_FOLDER, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Tenant file not found'
      });
    }
    
    const excelData = readExcelFile(filePath);
    const transformedData = transformTenantData(excelData);
    
    res.json({
      success: true,
      tenantName,
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
    
    const fileName = `${tenantName}.xlsx`;
    const filePath = path.join(ONBOARD_FOLDER, fileName);
    
    if (!fs.existsSync(filePath)) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Tenant file not found'
      });
    }
    
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
    
    // Set tenant context for RLS
    await setTenantContext(tenant.id);
    
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
