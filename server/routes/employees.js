const express = require("express");
const router = express.Router();
const { models } = require("../models");
const { Op } = require("sequelize");

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
      // Include all attributes including the new relationship fields
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
        "clientId",
        "vendorId",
        "implPartnerId",
        "startDate",
        "endDate",
        "hourlyRate",
        "salaryAmount",
        "salaryType",
        "contactInfo",
        "status",
      ],
      // Include related data
      include: [
        {
          model: User,
          as: "user",
          attributes: ["role"],
          required: false,
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "legalName"],
          required: false,
        },
        {
          model: models.Vendor,
          as: "vendor",
          attributes: ["id", "name", "category"],
          required: false,
        },
        {
          model: models.ImplementationPartner,
          as: "implPartner",
          attributes: ["id", "name", "specialization"],
          required: false,
        },
        {
          model: models.EmploymentType,
          as: "employmentType",
          attributes: ["id", "name", "description"],
          required: false,
        },
      ],
    });

    // Filter out admin users at application level (but keep employees without user records)
    const employees = allEmployees.filter((emp) => {
      // If employee doesn't have a user record, include them (newly created employees)
      if (!emp.user) {
        return true;
      }
      
      // For inactive employees, show them regardless of role (they might be admins who were deactivated)
      if (emp.status === "inactive") {
        return true;
      }
      // For active employees, exclude admin users
      return emp.user.role !== "admin";
    });

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

    // Transform the data to match frontend expectations
    const transformedEmployees = employees.map((emp) => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      firstName: emp.firstName,
      lastName: emp.lastName,
      position: emp.title || "N/A", // Use title field instead of position
      email: emp.email,
      phone: emp.phone || null,
      status: emp.status || "active",
      department: emp.department || "N/A",
      joinDate: emp.startDate || null,
      hourlyRate: emp.hourlyRate || null,
      // Include role from linked user
      role: emp.user?.role || null,
      // Client relationship data
      client: emp.client
        ? {
            id: emp.client.id,
            name: emp.client.clientName || emp.client.legalName,
            legalName: emp.client.legalName,
          }
        : null,
      clientId: emp.clientId,
      employmentType: emp.employmentType?.name || "W2",
      // Vendor relationship data
      vendor: emp.vendor
        ? {
            id: emp.vendor.id,
            name: emp.vendor.name,
            category: emp.vendor.category,
          }
        : null,
      vendorId: emp.vendorId,
      // Implementation partner relationship data
      implPartner: emp.implPartner
        ? {
            id: emp.implPartner.id,
            name: emp.implPartner.name,
            specialization: emp.implPartner.specialization,
          }
        : null,
      implPartnerId: emp.implPartnerId,
      endClient: emp.client
        ? {
            id: emp.client.id,
            name: emp.client.clientName || emp.client.legalName,
            location: emp.client.legalName, // Using legalName as location placeholder
          }
        : null,
      // Additional fields from database
      employeeId: emp.employeeId,
      salaryAmount: emp.salaryAmount,
      contactInfo: emp.contactInfo,
    }));

    console.log('✅ Sending', transformedEmployees.length, 'employees to frontend');

    res.json({
      success: true,
      employees: transformedEmployees,
      total: transformedEmployees.length,
    });
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
      // Include all attributes including the new relationship fields
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
        "clientId",
        "vendorId",
        "implPartnerId",
        "startDate",
        "endDate",
        "hourlyRate",
        "salaryAmount",
        "salaryType",
        "contactInfo",
        "status",
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
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "legalName"],
          required: false,
        },
        {
          model: models.Vendor,
          as: "vendor",
          attributes: ["id", "name", "category"],
          required: false,
        },
        {
          model: models.ImplementationPartner,
          as: "implPartner",
          attributes: ["id", "name", "specialization"],
          required: false,
        },
        {
          model: models.EmploymentType,
          as: "employmentType",
          attributes: ["id", "name", "description"],
          required: false,
        },
      ],
    });

    if (!employee) {
      console.log('❌ Employee not found - ID:', id, 'TenantId:', tenantId);
      return res.status(404).json({ error: "Employee not found" });
    }

    console.log('✅ Employee found:', {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      vendorId: employee.vendorId,
      clientId: employee.clientId,
      hasVendor: !!employee.vendor,
      hasClient: !!employee.client
    });

    if (employee.vendor) {
      console.log('📦 Vendor details:', {
        id: employee.vendor.id,
        name: employee.vendor.name,
        category: employee.vendor.category
      });
    } else {
      console.log('⚠️ No vendor associated with employee');
    }

    // Transform the data
    const transformedEmployee = {
      id: employee.id,
      name: employee.user
        ? `${employee.user.firstName} ${employee.user.lastName}`
        : `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
          "N/A",
      firstName: employee.user?.firstName || employee.firstName || "",
      lastName: employee.user?.lastName || employee.lastName || "",
      position: employee.user?.title || employee.title || "N/A",
      email: employee.user?.email || employee.email || "",
      phone: employee.phone || "N/A",
      status: employee.status || "active",
      department: employee.user?.department || employee.department || "N/A",
      joinDate: employee.startDate || new Date().toISOString(),
      hourlyRate: employee.hourlyRate || 0,
      // Client relationship data
      client: employee.client
        ? {
            id: employee.client.id,
            name: employee.client.clientName || employee.client.legalName,
            legalName: employee.client.legalName,
          }
        : null,
      clientId: employee.clientId,
      employmentType: employee.employmentType?.name || "W2",
      // Vendor relationship data
      vendor: employee.vendor
        ? {
            id: employee.vendor.id,
            name: employee.vendor.name,
            category: employee.vendor.category,
          }
        : null,
      vendorId: employee.vendorId,
      // Implementation partner relationship data
      implPartner: employee.implPartner
        ? {
            id: employee.implPartner.id,
            name: employee.implPartner.name,
            specialization: employee.implPartner.specialization,
          }
        : null,
      implPartnerId: employee.implPartnerId,
      endClient: employee.client
        ? {
            id: employee.client.id,
            name: employee.client.clientName || employee.client.legalName,
            location: employee.client.legalName, // Using legalName as location placeholder
          }
        : null,
      // Additional detailed fields
      employeeId: employee.employeeId,
      salaryAmount: employee.salaryAmount,
      contactInfo: employee.contactInfo,
      user: employee.user,
    };

    console.log('📤 Sending response with vendorId:', transformedEmployee.vendorId);
    console.log('📤 Sending response with vendor object:', transformedEmployee.vendor);
    
    res.json({
      success: true,
      employee: transformedEmployee,
    });
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
    const employeeData = req.body;

    console.log('➕ Creating new employee:', {
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      tenantId: employeeData.tenantId
    });

    // Check if employee with same email already exists
    const existingEmployee = await Employee.findOne({
      where: {
        email: employeeData.email,
        tenantId: employeeData.tenantId
      }
    });

    if (existingEmployee) {
      console.log('⚠️ Employee with this email already exists:', existingEmployee.id);
      return res.status(409).json({
        error: "Employee with this email already exists",
        existingEmployeeId: existingEmployee.id
      });
    }

    // Create the employee record
    const employee = await Employee.create(employeeData);

    console.log('✅ Employee created successfully:', employee.id);

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({
      error: "Failed to create employee",
      details: error.message,
    });
  }
});

// Update employee
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const updateData = req.body;

    const employee = await Employee.findOne({
      where: { id, tenantId },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Update employee record
    await employee.update(updateData);

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

    // Fetch updated employee with all relationships
    const updatedEmployee = await Employee.findOne({
      where: { id, tenantId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["role"],
          required: false,
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "legalName"],
          required: false,
        },
        {
          model: models.Vendor,
          as: "vendor",
          attributes: ["id", "name", "category"],
          required: false,
        },
        {
          model: models.ImplementationPartner,
          as: "implPartner",
          attributes: ["id", "name", "specialization"],
          required: false,
        },
        {
          model: models.EmploymentType,
          as: "employmentType",
          attributes: ["id", "name", "description"],
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({
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
      return res.status(404).json({ error: "Employee not found" });
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

    res.json({
      success: true,
      message: "Employee and all related data soft deleted successfully",
      employeeId: id,
      deletedRecords,
    });
  } catch (error) {
    console.error("Error soft deleting employee:", error);
    res.status(500).json({
      error: "Failed to soft delete employee",
      details: error.message,
    });
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
      return res.status(404).json({ error: "Employee not found" });
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

    res.json({
      success: true,
      message: "Employee restored successfully (status set to active)",
      employeeId: id,
      userRestored,
    });
  } catch (error) {
    console.error("Error restoring employee:", error);
    res.status(500).json({
      error: "Failed to restore employee",
      details: error.message,
    });
  }
});

// Get employee statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
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

    res.json({
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
    });
  } catch (error) {
    console.error("Error fetching employee stats:", error);
    res.status(500).json({
      error: "Failed to fetch employee statistics",
      details: error.message,
    });
  }
});

module.exports = router;
