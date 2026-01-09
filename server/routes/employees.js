const express = require("express");
const router = express.Router();
const { models } = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { generateTemporaryPassword, sendWelcomeEmail } = require("../utils/emailService");
const DataEncryptionService = require("../services/DataEncryptionService");
const { encryptAuthResponse } = require("../utils/encryption");

const { Employee, User, Client, Tenant, Vendor, EmploymentType } = models;

// Get all employees for a tenant
router.get("/", async (req, res) => {
  try {
    const { tenantId, status } = req.query;

    console.log('👥 Fetching employees for tenantId:', tenantId, 'status:', status);

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Build where clause based on status filter
    const whereClause = { tenantId };
    if (status && status !== "all") {
      whereClause.status = status;
    }
    // If status is "all" or not provided, don't filter by status (show all employees)
    
    const allEmployees = await Employee.findAll({
      where: whereClause,
      attributes: [
        "id",
        "tenantId",
        "userId",
        "employeeId",
        "firstName",
        "lastName",
        "email",
        "phone",
        "department",
        "title",
        "managerId",
        "startDate",
        "endDate",
        "hourlyRate",
        "salaryAmount",
        "salaryType",
        "contactInfo",
        "status",
        "clientId",
        "vendorId",
        "implPartnerId",
        "employmentTypeId",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["role"],
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "clientName", "legalName", "email"],
          required: false,
        },
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
    }).catch(error => {
      console.error('❌ Error fetching employees:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    });

    // Show all employees including admins (OAuth users need to be visible)
    // Previously we filtered out admin users, but now we include them
    // because OAuth admins have Employee records and should be visible
    const employees = allEmployees;

    console.log('📊 Found', allEmployees.length, 'total employees in database');
    console.log('📊 After filtering:', employees.length, 'employees');
    console.log('📊 Employees without user records:', allEmployees.filter(e => !e.user).length);
    
    // Check for duplicate IDs
    const employeeIds = employees.map(e => e.id);
    const uniqueIds = [...new Set(employeeIds)];
    if (employeeIds.length !== uniqueIds.length) {
      console.log('⚠️ WARNING: Duplicate employee IDs found!');
      console.log('📋 All IDs:', employeeIds);
      console.log('📋 Unique IDs:', uniqueIds);
    }

    // First decrypt the raw employee data from database
    const decryptedRawEmployees = employees.map(emp => {
      const plainEmp = emp.toJSON ? emp.toJSON() : emp;
      return DataEncryptionService.decryptEmployeeData(plainEmp);
    });

    // Transform the decrypted data to match frontend expectations
    const transformedEmployees = decryptedRawEmployees.map((emp) => {
      // Decrypt client data if it exists
      let clientName = "Not assigned";
      let clientObject = null;
      if (emp.client) {
        const decryptedClient = DataEncryptionService.decryptClientData(emp.client);
        clientName = decryptedClient.clientName || decryptedClient.legalName || "Not assigned";
        clientObject = {
          id: decryptedClient.id,
          clientName: decryptedClient.clientName,
          name: decryptedClient.clientName,
          email: decryptedClient.email,
          legalName: decryptedClient.legalName
        };
      }
      
      // Decrypt vendor data if it exists
      let vendorName = "Not assigned";
      let vendorObject = null;
      if (emp.vendor) {
        const decryptedVendor = DataEncryptionService.decryptVendorData(emp.vendor);
        vendorName = decryptedVendor.name || "Not assigned";
        
        // CRITICAL: Only create vendorObject if we have a valid ID
        // This ensures the frontend vendor detection (vendor && vendor.id) works correctly
        if (decryptedVendor.id) {
          vendorObject = {
            id: decryptedVendor.id,
            name: decryptedVendor.name || "Unknown Vendor",
            vendorName: decryptedVendor.name || "Unknown Vendor",
            email: decryptedVendor.email || null
          };
          
          // Log if vendor is missing email (critical for invoice generation)
          if (!decryptedVendor.email) {
            console.warn(`⚠️ Vendor ${decryptedVendor.id} (${decryptedVendor.name}) is missing Email for employee ${emp.firstName} ${emp.lastName}`);
          }
        } else {
          console.warn(`⚠️ Vendor data exists but missing ID for employee ${emp.firstName} ${emp.lastName}:`, decryptedVendor);
        }
      } else if (emp.vendorId) {
        // Employee has vendorId but vendor association is null - database inconsistency
        console.warn(`⚠️ Employee ${emp.firstName} ${emp.lastName} has vendorId ${emp.vendorId} but vendor association is NULL`);
      }
      
      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        position: emp.title || "N/A",
        email: emp.email,
        phone: emp.phone || null,
        status: emp.status || "active",
        department: emp.department || "N/A",
        joinDate: emp.startDate || null,
        hourlyRate: emp.hourlyRate || null,
        role: emp.user?.role || null,
        client: clientObject,
        clientId: emp.clientId || null,
        employmentType: "W2",
        vendor: vendorObject,
        vendorId: emp.vendorId || null,
        implPartner: "Not assigned",
        implPartnerId: emp.implPartnerId || null,
        endClient: clientName,
        employeeId: emp.employeeId,
        salaryAmount: emp.salaryAmount,
        contactInfo: emp.contactInfo,
      };
    });

    console.log('✅ Sending', transformedEmployees.length, 'employees to frontend');
    
    // Log sample employee to verify decryption and vendor/client structure
    if (transformedEmployees.length > 0) {
      console.log('📋 Sample employee data:', {
        firstName: transformedEmployees[0].firstName,
        lastName: transformedEmployees[0].lastName,
        email: transformedEmployees[0].email,
        vendor: transformedEmployees[0].vendor,
        vendorId: transformedEmployees[0].vendorId,
        client: transformedEmployees[0].client,
        clientId: transformedEmployees[0].clientId
      });
    }
    
    // Log all employees with vendor assignments
    const employeesWithVendors = transformedEmployees.filter(e => e.vendorId);
    console.log(`📊 Employees with vendors: ${employeesWithVendors.length}/${transformedEmployees.length}`);
    employeesWithVendors.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName}: Vendor=${emp.vendor?.name || 'N/A'} (ID: ${emp.vendorId})`);
    });

    // Data is already decrypted, just use it directly
    const decryptedEmployees = transformedEmployees;

    const responseData = {
      success: true,
      employees: decryptedEmployees,
      total: decryptedEmployees.length,
    };
    res.json(encryptAuthResponse(responseData));
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      error: "Failed to fetch employees",
      details: error.message,
    });
  }
});

// Get single employee by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const employee = await Employee.findOne({
      where: {
        id,
        tenantId,
      },
      attributes: [
        "id",
        "tenantId",
        "userId",
        "employeeId",
        "firstName",
        "lastName",
        "email",
        "phone",
        "department",
        "title",
        "managerId",
        "startDate",
        "endDate",
        "hourlyRate",
        "salaryAmount",
        "salaryType",
        "contactInfo",
        "status",
        "clientId",
        "vendorId",
        "implPartnerId",
        "employmentTypeId",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "role",
            "department",
            "title",
          ],
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "clientName", "legalName"],
          required: false,
        },
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "name"],
          required: false,
        },
      ],
    }).catch(error => {
      console.error('❌ Error fetching employee by ID:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    });

    if (!employee) {
      console.log('❌ Employee not found - ID:', id, 'TenantId:', tenantId);
      return res.status(404).json({ error: "Employee not found" });
    }

    console.log('✅ Employee found:', {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName
    });

    // Decrypt employee data first
    const decryptedEmp = DataEncryptionService.decryptEmployeeData(employee.toJSON ? employee.toJSON() : employee);
    
    // Decrypt client name if it exists
    let clientName = "Not assigned";
    if (decryptedEmp.client) {
      const decryptedClient = DataEncryptionService.decryptClientData(decryptedEmp.client);
      clientName = decryptedClient.clientName || decryptedClient.legalName || "Not assigned";
    }
    
    // Decrypt vendor name if it exists
    let vendorName = "Not assigned";
    if (decryptedEmp.vendor) {
      const decryptedVendor = DataEncryptionService.decryptVendorData(decryptedEmp.vendor);
      vendorName = decryptedVendor.name || "Not assigned";
    }
    
    // Transform the data
    const transformedEmployee = {
      id: decryptedEmp.id,
      name: decryptedEmp.user
        ? `${decryptedEmp.user.firstName} ${decryptedEmp.user.lastName}`
        : `${decryptedEmp.firstName || ""} ${decryptedEmp.lastName || ""}`.trim() ||
          "N/A",
      firstName: decryptedEmp.user?.firstName || decryptedEmp.firstName || "",
      lastName: decryptedEmp.user?.lastName || decryptedEmp.lastName || "",
      position: decryptedEmp.user?.title || decryptedEmp.title || "N/A",
      email: decryptedEmp.user?.email || decryptedEmp.email || "",
      phone: decryptedEmp.phone || "N/A",
      status: decryptedEmp.status || "active",
      department: decryptedEmp.user?.department || decryptedEmp.department || "N/A",
      joinDate: decryptedEmp.startDate || new Date().toISOString(),
      hourlyRate: decryptedEmp.hourlyRate || 0,
      client: clientName,
      clientId: decryptedEmp.clientId || null,
      employmentType: "W2",
      vendor: vendorName,
      vendorId: decryptedEmp.vendorId || null,
      implPartner: "Not assigned",
      implPartnerId: decryptedEmp.implPartnerId || null,
      endClient: clientName,
      // Additional detailed fields
      employeeId: decryptedEmp.employeeId,
      salaryAmount: decryptedEmp.salaryAmount,
      contactInfo: decryptedEmp.contactInfo,
      user: decryptedEmp.user,
    };
    
    // Data is already decrypted
    const decryptedEmployee = transformedEmployee;
    
    const responseData = {
      success: true,
      employee: decryptedEmployee,
    };
    res.json(encryptAuthResponse(responseData));
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({
      error: "Failed to fetch employee",
      details: error.message,
    });
  }
});

// Create new employee
router.post("/", async (req, res) => {
  try {
    let employeeData = req.body;
    
    console.log('📥 Received employee data:', JSON.stringify(employeeData, null, 2));
    
    // Validate required fields before encryption
    if (!employeeData.firstName || !employeeData.lastName || !employeeData.email || !employeeData.tenantId) {
      console.error('❌ Missing required fields:', {
        firstName: !!employeeData.firstName,
        lastName: !!employeeData.lastName,
        email: !!employeeData.email,
        tenantId: !!employeeData.tenantId
      });
      return res.status(400).json(encryptAuthResponse({
        error: "Missing required fields",
        details: "firstName, lastName, email, and tenantId are required"
      }));
    }
    
    console.log('🔒 Encrypting employee data...');
    // Encrypt employee data before saving to database
    try {
      employeeData = DataEncryptionService.encryptEmployeeData(employeeData);
      console.log('✅ Employee data encrypted successfully');
    } catch (encryptError) {
      console.error('❌ Encryption error:', encryptError);
      return res.status(500).json(encryptAuthResponse({
        error: "Failed to encrypt employee data",
        details: encryptError.message
      }));
    }

    console.log('➕ Creating new employee:', {
      firstName: employeeData.firstName ? '[ENCRYPTED]' : 'null',
      lastName: employeeData.lastName ? '[ENCRYPTED]' : 'null',
      email: employeeData.email ? '[ENCRYPTED]' : 'null',
      tenantId: employeeData.tenantId
    });

    // Note: Email is encrypted, so we can't check for duplicates by email
    // We'll rely on database unique constraints or check after user creation fails

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    console.log('👤 Creating user account...');
    // Create user account for the employee
    let user;
    try {
      user = await User.create({
        tenantId: employeeData.tenantId,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        passwordHash: passwordHash,
        mustChangePassword: true,
        role: employeeData.role || 'employee',
        department: employeeData.department,
        title: employeeData.title,
        status: 'active'
      });
      console.log('✅ User account created:', user.id);
    } catch (userError) {
      console.error('❌ Failed to create user:', userError);
      if (userError.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json(encryptAuthResponse({
          error: "User with this email already exists",
          details: userError.message
        }));
      }
      throw userError;
    }

    // Link employee to user
    employeeData.userId = user.id;

    console.log('👥 Creating employee record...');
    // Create the employee record
    let employee;
    try {
      employee = await Employee.create(employeeData);
      console.log('✅ Employee created successfully:', employee.id);
    } catch (empError) {
      console.error('❌ Failed to create employee:', empError);
      // Rollback: delete the user we just created
      await user.destroy();
      console.log('🔄 Rolled back user creation');
      throw empError;
    }

    // Decrypt employee data for response
    const decryptedEmployee = DataEncryptionService.decryptEmployeeData(employee.toJSON ? employee.toJSON() : employee);

    // Get tenant information for email
    const tenant = await models.Tenant.findByPk(employeeData.tenantId);
    const companyName = tenant ? tenant.tenantName : 'Your Company';
    const loginUrl = process.env.APP_URL || 'http://localhost:3000';

    // Send welcome email with temporary password
    try {
      await sendWelcomeEmail({
        to: employeeData.email,
        employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
        temporaryPassword: temporaryPassword,
        companyName: companyName,
        loginUrl: loginUrl
      });
      console.log('✅ Welcome email sent to:', employeeData.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError);
      // Don't fail the employee creation if email fails
    }

    const responseData = {
      success: true,
      message: "Employee created successfully. Welcome email sent with temporary password.",
      employee: decryptedEmployee,
      userId: user.id,
    };
    res.status(201).json(encryptAuthResponse(responseData));
  } catch (error) {
    console.error("❌ Error creating employee:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error details:", JSON.stringify(error, null, 2));
    res.status(500).json(encryptAuthResponse({
      error: "Failed to create employee",
      details: error.message,
      errorName: error.name,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }));
  }
});

// Update employee
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Accept tenantId from either query parameter or request body
    const tenantId = req.query.tenantId || req.body.tenantId;
    let updateData = { ...req.body };
    
    // Remove tenantId from updateData if it was in the body
    delete updateData.tenantId;
    
    console.log('📝 Updating employee:', {
      id,
      tenantId,
      updateData
    });
    
    if (!tenantId) {
      console.error('❌ Missing tenantId');
      return res.status(400).json({ 
        success: false, 
        error: "tenantId is required" 
      });
    }
    
    // Encrypt employee data before updating in database
    updateData = DataEncryptionService.encryptEmployeeData(updateData);

    const employee = await Employee.findOne({
      where: { id, tenantId },
    });

    if (!employee) {
      console.error('❌ Employee not found:', { id, tenantId });
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    console.log('📋 Current employee data:', {
      id: employee.id,
      vendorId: employee.vendorId,
      clientId: employee.clientId
    });

    // Update employee record
    await employee.update(updateData);
    
    console.log('✅ Employee updated in database:', {
      id: employee.id,
      vendorId: employee.vendorId,
      clientId: employee.clientId
    });

    // If firstName or lastName changed, also update the linked User record
    if ((updateData.firstName || updateData.lastName) && employee.userId) {
      const user = await models.User.findByPk(employee.userId);
      if (user) {
        const userUpdate = {};
        if (updateData.firstName) userUpdate.firstName = updateData.firstName;
        if (updateData.lastName) userUpdate.lastName = updateData.lastName;
        await user.update(userUpdate);
      }
    }

    // Fetch updated employee with associations
    const updatedEmployee = await Employee.findOne({
      where: { id, tenantId },
      attributes: [
        "id",
        "tenantId",
        "userId",
        "employeeId",
        "firstName",
        "lastName",
        "email",
        "phone",
        "department",
        "title",
        "managerId",
        "startDate",
        "endDate",
        "hourlyRate",
        "salaryAmount",
        "salaryType",
        "contactInfo",
        "status",
        "clientId",
        "vendorId",
        "implPartnerId",
        "employmentTypeId",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["role"],
          required: false,
        },
        {
          model: Client,
          as: "client",
          attributes: ["id", "clientName", "legalName"],
          required: false,
        },
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
    }).catch(error => {
      console.error('❌ Error fetching updated employee:', error);
      throw error;
    });

    // Decrypt employee data
    const decryptedEmployee = DataEncryptionService.decryptEmployeeData(
      updatedEmployee.toJSON ? updatedEmployee.toJSON() : updatedEmployee
    );

    // Decrypt client and vendor data if they exist
    let clientObject = null;
    if (decryptedEmployee.client) {
      const decryptedClient = DataEncryptionService.decryptClientData(decryptedEmployee.client);
      clientObject = {
        id: decryptedClient.id,
        name: decryptedClient.clientName || decryptedClient.legalName,
        clientName: decryptedClient.clientName,
        legalName: decryptedClient.legalName
      };
    }
    
    let vendorObject = null;
    if (decryptedEmployee.vendor) {
      const decryptedVendor = DataEncryptionService.decryptVendorData(decryptedEmployee.vendor);
      
      // CRITICAL: Only create vendorObject if we have a valid ID
      // This ensures the frontend vendor detection (vendor && vendor.id) works correctly
      if (decryptedVendor.id) {
        vendorObject = {
          id: decryptedVendor.id,
          name: decryptedVendor.name || "Unknown Vendor",
          vendorName: decryptedVendor.name || "Unknown Vendor",
          email: decryptedVendor.email || null
        };
        
        // Log if vendor is missing email (critical for invoice generation)
        if (!decryptedVendor.email) {
          console.warn(`⚠️ PUT /employees/:id - Vendor ${decryptedVendor.id} (${decryptedVendor.name}) is missing Email`);
        }
      } else {
        console.warn(`⚠️ PUT /employees/:id - Vendor data exists but missing ID:`, decryptedVendor);
      }
    }
    
    const enrichedEmployee = {
      ...decryptedEmployee,
      vendor: vendorObject,
      vendorId: decryptedEmployee.vendorId || null,
      client: clientObject,
      clientId: decryptedEmployee.clientId || null,
      implPartner: "Not assigned",
      implPartnerId: decryptedEmployee.implPartnerId || null
    };

    console.log('✅ Employee updated successfully:', {
      id: enrichedEmployee.id,
      vendorId: enrichedEmployee.vendorId,
      vendor: enrichedEmployee.vendor
    });
    
    const responseData = {
      success: true,
      message: "Employee updated successfully",
      employee: enrichedEmployee,
    };
    res.json(responseData);
  } catch (error) {
    console.error("❌ Error updating employee:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update employee",
      details: error.message,
    });
  }
});

// Soft delete employee (set status to inactive) with cascade soft delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const employee = await Employee.findOne({
      where: { id, tenantId },
    });

    if (!employee) {
      return res.status(404).json(encryptAuthResponse({ error: "Employee not found" }));
    }

    // Cascade soft delete all related data
    const deletedRecords = {
      timesheets: 0,
      invoices: 0,
      user: false,
    };

    // Soft delete timesheets
    if (models.Timesheet) {
      const timesheetsUpdated = await models.Timesheet.update(
        { status: "deleted" },
        { where: { employeeId: id, tenantId } }
      );
      deletedRecords.timesheets = timesheetsUpdated[0];
    }

    // Soft delete invoices
    if (models.Invoice) {
      const invoicesUpdated = await models.Invoice.update(
        { status: "deleted" },
        { where: { createdBy: employee.userId, tenantId } }
      );
      deletedRecords.invoices = invoicesUpdated[0];
    }

    // Soft delete the employee
    await employee.update({ status: "inactive" });

    // Optionally deactivate the associated user account
    if (employee.userId) {
      const user = await models.User.findByPk(employee.userId);
      if (user) {
        await user.update({ status: "inactive" });
        deletedRecords.user = true;
      }
    }

    const responseData = {
      success: true,
      message: "Employee and all related data soft deleted successfully",
      employeeId: id,
      deletedRecords: deletedRecords,
    };
    res.json(encryptAuthResponse(responseData));
  } catch (error) {
    console.error("Error soft deleting employee:", error);
    res.status(500).json(encryptAuthResponse({
      error: "Failed to soft delete employee",
      details: error.message,
    }));
  }
});

// Restore soft-deleted employee (set status back to active)
router.patch("/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    const employee = await Employee.findOne({
      where: { id, tenantId },
    });

    if (!employee) {
      return res.status(404).json(encryptAuthResponse({ error: "Employee not found" }));
    }

    // Restore: Update status back to active
    await employee.update({ status: "active" });

    // Optionally restore the associated user account
    let userRestored = false;
    if (employee.userId) {
      const user = await models.User.findByPk(employee.userId);
      if (user) {
        await user.update({ status: "active" });
        userRestored = true;
      }
    }

    const responseData = {
      success: true,
      message: "Employee restored successfully (status set to active)",
      employeeId: id,
      userRestored: userRestored,
    };
    res.json(encryptAuthResponse(responseData));
  } catch (error) {
    console.error("Error restoring employee:", error);
    res.status(500).json(encryptAuthResponse({
      error: "Failed to restore employee",
      details: error.message,
    }));
  }
});

// Get employee statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json(encryptAuthResponse({ error: "Tenant ID is required" }));
    }

    const totalEmployees = await Employee.count({
      where: { tenantId },
    });

    const activeEmployees = await Employee.count({
      where: {
        tenantId,
        status: "active",
      },
    });

    const employeesByDepartment = await Employee.findAll({
      where: { tenantId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["department"],
        },
      ],
      attributes: [],
    });

    // Group by department
    const departmentCounts = {};
    employeesByDepartment.forEach((emp) => {
      const dept = emp.user?.department || "Unassigned";
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    const employeesByType = await Employee.findAll({
      where: { tenantId },
      attributes: ["employmentType"],
      group: ["employmentType"],
    });

    const responseData = {
      success: true,
      stats: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
        byDepartment: departmentCounts,
        byEmploymentType: employeesByType.reduce((acc, emp) => {
          acc[emp.employmentType || "W2"] =
            (acc[emp.employmentType || "W2"] || 0) + 1;
          return acc;
        }, {}),
      },
    };
    res.json(encryptAuthResponse(responseData));
  } catch (error) {
    console.error("Error fetching employee stats:", error);
    res.status(500).json({
      error: "Failed to fetch employee statistics",
      details: error.message,
    });
  }
});

module.exports = router;
