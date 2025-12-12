/**
 * Invoice Routes
 */

const express = require("express");
const router = express.Router();
const { models } = require("../models");
const { Op } = require("sequelize");
const DataEncryptionService = require("../services/DataEncryptionService");

// GET /api/invoices?tenantId=...&scope=...&employeeId=...&from=...&to=...&client=...&q=...
router.get("/", async (req, res) => {
  try {
    const {
      tenantId,
      status,
      scope = "company",
      employeeId,
      from,
      to,
      client,
      q,
      excludeUserId,
    } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const whereClause = { tenantId };

    // Add status filtering
    if (status && status !== "all") {
      whereClause.status = status;
    }

    // Add scope filtering
    if (scope === "employee" && employeeId) {
      whereClause.employeeId = employeeId;
    }

    // Add date filtering
    if (from) {
      whereClause.created_at = { [Op.gte]: from };
    }
    if (to) {
      whereClause.created_at = { [Op.lte]: to };
    }

    // Add client filtering
    if (client) {
      whereClause.clientId = client;
    }

    // Exclude specific user if needed
    if (excludeUserId) {
      whereClause.employeeId = { [Op.ne]: excludeUserId };
    }

    // Add search filtering
    let includeClause = [
      {
        model: models.Client,
        as: "client",
        attributes: ["id", "clientName", "email"],
        required: false,
      },
      {
        model: models.Employee,
        as: "employee",
        attributes: ["id", "firstName", "lastName", "email"],
        required: false,
      },
      {
        model: models.User,
        as: "approver",
        attributes: ["id", "firstName", "lastName", "email"],
        required: false,
      },
    ];

    // Add search filter to employee if q is provided
    if (q) {
      includeClause[1].where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${q}%` } },
          { lastName: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
        ],
      };
    }

    // Add Vendor association
    includeClause.push({
      model: models.Vendor,
      as: "vendor",
      attributes: ["id", "name", "email"],
      required: false,
    });

    // Add Timesheet association to get employee and vendor data
    includeClause.push({
      model: models.Timesheet,
      as: "timesheet",
      attributes: ["id", "weekStart", "weekEnd", "employeeId"],
      required: false,
      include: [{
        model: models.Employee,
        as: "employee",
        attributes: ["id", "firstName", "lastName", "vendorId"],
        required: false,
        include: [{
          model: models.Vendor,
          as: "vendor",
          attributes: ["id", "name", "email"],
          required: false
        }]
      }]
    });

    const invoices = await models.Invoice.findAll({
      where: whereClause,
      include: includeClause,
      order: [["created_at", "DESC"]],
      limit: 100, // Limit for performance
    });

    // Decrypt invoice data
    const decryptedInvoices = DataEncryptionService.decryptInstances(invoices, 'invoice');

    const formattedInvoices = decryptedInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendor: inv.vendor?.name || inv.timesheet?.employee?.vendor?.name || "N/A",
      client: inv.client?.clientName || "N/A",
      employee: inv.employee
        ? `${inv.employee.firstName} ${inv.employee.lastName}`
        : inv.timesheet?.employee
        ? `${inv.timesheet.employee.firstName} ${inv.timesheet.employee.lastName}`
        : "N/A",
      week:
        inv.weekStart && inv.weekEnd
          ? `${new Date(inv.weekStart).toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            })} - ${new Date(inv.weekEnd).toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            })}`
          : "N/A",
      weekStart: inv.weekStart,
      weekEnd: inv.weekEnd,
      total: parseFloat(inv.total),
      status: inv.status,
      lineItems: inv.lineItems || [],
      attachments: inv.attachments || [],
      discrepancies: inv.discrepancies,
      notes: inv.notes,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      approvedBy: inv.approver
        ? `${inv.approver.firstName} ${inv.approver.lastName}`
        : null,
      approvedAt: inv.approvedAt,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }));

    // Transform data for frontend dashboard
    const transformedInvoices = decryptedInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendor: inv.vendor?.name || inv.timesheet?.employee?.vendor?.name || "N/A",
      vendorEmail: inv.vendor?.email || inv.timesheet?.employee?.vendor?.email || "N/A",
      client: inv.client ? inv.client.clientName : "No Client",
      employeeId: inv.timesheet?.employeeId || inv.employeeId,
      employeeName: inv.timesheet?.employee
        ? `${inv.timesheet.employee.firstName} ${inv.timesheet.employee.lastName}`
        : (inv.employee ? `${inv.employee.firstName} ${inv.employee.lastName}` : "Unknown"),
      week: inv.timesheet?.weekStart && inv.timesheet?.weekEnd
        ? `${new Date(inv.timesheet.weekStart).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - ${new Date(inv.timesheet.weekEnd).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`
        : (inv.weekStart && inv.weekEnd 
          ? `${new Date(inv.weekStart).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - ${new Date(inv.weekEnd).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`
          : "N/A"),
      period:
        inv.timesheet?.weekStart && inv.timesheet?.weekEnd
          ? `${inv.timesheet.weekStart} - ${inv.timesheet.weekEnd}`
          : "N/A",
      issueDate: inv.issueDate
        ? new Date(inv.issueDate).toISOString()
        : (inv.createdAt ? new Date(inv.createdAt).toISOString() : null),
      issuedOn: inv.invoiceDate
        ? new Date(inv.invoiceDate).toISOString().split("T")[0]
        : (inv.createdAt ? new Date(inv.createdAt).toISOString().split("T")[0] : "N/A"),
      dueOn: inv.dueDate
        ? new Date(inv.dueDate).toISOString().split("T")[0]
        : "N/A",
      totalHours: inv.totalHours || inv.timesheet?.totalHours || 0,
      total: parseFloat(inv.totalAmount || inv.total) || 0,
      amount: parseFloat(inv.totalAmount || inv.total) || 0,
      paymentStatus: inv.paymentStatus || "pending",
      status: inv.status || "active",
      lineItems: inv.lineItems || [],
      notes: inv.notes,
      timesheetId: inv.timesheetId,
      timesheet: inv.timesheet ? {
        id: inv.timesheet.id,
        weekStart: inv.timesheet.weekStart,
        weekEnd: inv.timesheet.weekEnd,
        totalHours: inv.timesheet.totalHours,
        employee: inv.timesheet.employee
      } : null,
    }));

    console.log(`✅ Returning ${transformedInvoices.length} invoices for tenant ${tenantId}`);

    res.json({
      success: true,
      invoices: transformedInvoices,
      total: transformedInvoices.length,
    });
  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
});

// POST /api/invoices
router.post("/", async (req, res) => {
  try {
    const {
      tenantId,
      vendorId,
      clientId,
      employeeId,
      timesheetId,
      weekStart,
      weekEnd,
      lineItems,
      total,
      subtotal,
      tax,
      dueDate,
      notes,
      attachments,
      quickbooksSync,
    } = req.body;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    // Generate invoice number in format IN-2025-XXX
    const currentYear = new Date().getFullYear();
    const lastInvoice = await models.Invoice.findOne({
      where: { 
        tenantId,
        invoiceNumber: { [Op.like]: `IN-${currentYear}-%` }
      },
      order: [["created_at", "DESC"]],
    });

    let invoiceNumber;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-").pop());
      invoiceNumber = `IN-${currentYear}-${String(lastNumber + 1).padStart(3, "0")}`;
    } else {
      invoiceNumber = `IN-${currentYear}-001`;
    }

    // Prepare data for encryption
    const invoiceData = {
      notes: notes || "",
      lineItems: lineItems || [],
    };

    // Encrypt sensitive data before saving
    const encryptedData = DataEncryptionService.encryptInvoiceData(invoiceData);

    const newInvoice = await models.Invoice.create({
      tenantId,
      invoiceNumber,
      vendorId,
      clientId,
      employeeId,
      timesheetId,
      weekStart,
      weekEnd,
      lineItems: encryptedData.lineItems || [],
      subtotal: subtotal || 0,
      tax: tax || 0,
      total: total || 0,
      status: "draft",
      dueDate,
      notes: encryptedData.notes || "",
      attachments: attachments || [],
      quickbooksSync: quickbooksSync || false,
    });

    res.status(201).json({ success: true, invoice: newInvoice });
  } catch (error) {
    console.error("❌ Error creating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message,
    });
  }
});

// GET /api/invoices/check-timesheet/:timesheetId
// Check if invoice exists for a specific timesheet
router.get("/check-timesheet/:timesheetId", async (req, res) => {
  try {
    const { timesheetId } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const invoice = await models.Invoice.findOne({
      where: { timesheetId, tenantId },
      attributes: ["id", "invoiceNumber", "totalAmount", "status", "paymentStatus"],
    });

    if (invoice) {
      return res.json({
        success: true,
        exists: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
          paymentStatus: invoice.paymentStatus,
        },
      });
    } else {
      return res.json({
        success: true,
        exists: false,
        invoice: null,
      });
    }
  } catch (error) {
    console.error("❌ Error checking invoice for timesheet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check invoice",
      error: error.message,
    });
  }
});

// GET /api/invoices/:id/pdf-data - Get complete invoice data for PDF generation
// IMPORTANT: This must come BEFORE the generic /:id route
router.get("/:id/pdf-data", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    console.log('📄 Fetching PDF data for invoice:', id, 'tenantId:', tenantId);

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    // First, fetch the basic invoice
    const invoice = await models.Invoice.findOne({
      where: { id, tenantId }
    });

    if (!invoice) {
      console.log('❌ Invoice not found');
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    console.log('✅ Invoice found:', invoice.invoiceNumber);

    // Decrypt invoice data
    const decryptedInvoice = DataEncryptionService.decryptInstance(invoice, 'invoice');

    // Fetch related data separately to avoid association errors
    let vendor = null;
    let employee = null;
    let timesheet = null;
    let client = null;

    // Fetch vendor if vendorId exists
    if (invoice.vendorId) {
      try {
        vendor = await models.Vendor.findOne({
          where: { id: invoice.vendorId },
          attributes: ["id", "name", "email", "phone", "address", "city", "state", "zipCode"]
        });
        console.log('✅ Vendor found:', vendor?.name);
      } catch (err) {
        console.log('⚠️ Vendor fetch error:', err.message);
      }
    }

    // Fetch client if clientId exists
    if (invoice.clientId) {
      try {
        client = await models.Client.findOne({
          where: { id: invoice.clientId },
          attributes: ["id", "clientName", "email", "billingAddress"]
        });
        console.log('✅ Client found:', client?.clientName);
      } catch (err) {
        console.log('⚠️ Client fetch error:', err.message);
      }
    }

    // Fetch timesheet if timesheetId exists
    if (invoice.timesheetId) {
      try {
        timesheet = await models.Timesheet.findOne({
          where: { id: invoice.timesheetId },
          attributes: ["id", "weekStart", "weekEnd", "totalHours", "employeeId", "status"]
        });
        console.log('✅ Timesheet found:', timesheet?.id);
      } catch (err) {
        console.log('⚠️ Timesheet fetch error:', err.message);
      }
    }

    // Fetch employee if employeeId exists (from invoice or timesheet)
    const employeeId = invoice.employeeId || timesheet?.employeeId;
    if (employeeId) {
      try {
        employee = await models.Employee.findOne({
          where: { id: employeeId },
          attributes: ["id", "firstName", "lastName", "email", "title", "position", "department", "hourlyRate", "vendorId"]
        });
        console.log('✅ Employee found:', employee?.firstName, employee?.lastName);

        // If employee has vendor and we don't have vendor yet, fetch it
        if (employee?.vendorId && !vendor) {
          vendor = await models.Vendor.findOne({
            where: { id: employee.vendorId },
            attributes: ["id", "name", "email", "phone", "address", "city", "state", "zipCode"]
          });
          console.log('✅ Vendor found via employee:', vendor?.name);
        }
      } catch (err) {
        console.log('⚠️ Employee fetch error:', err.message);
      }
    }

    // Format week range from timesheet
    let weekRange = null;
    let weekStart = null;
    let weekEnd = null;
    
    if (timesheet?.weekStart && timesheet?.weekEnd) {
      weekStart = timesheet.weekStart;
      weekEnd = timesheet.weekEnd;
      const startDate = new Date(weekStart);
      const endDate = new Date(weekEnd);
      weekRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
    }

    // Build line items from invoice data or timesheet
    let lineItems = [];
    
    if (decryptedInvoice.lineItems && Array.isArray(decryptedInvoice.lineItems) && decryptedInvoice.lineItems.length > 0) {
      // Use existing line items (decrypted)
      lineItems = decryptedInvoice.lineItems.map(item => ({
        employeeName: item.employeeName || (employee ? `${employee.firstName} ${employee.lastName}` : 'Employee Name'),
        role: item.role || item.position || employee?.title || employee?.position || employee?.department || 'Software Engineer',
        description: item.description || weekRange || 'Billing Period',
        hoursWorked: parseFloat(item.hours || item.hoursWorked || 0),
        hourlyRate: parseFloat(item.rate || item.hourlyRate || employee?.hourlyRate || 0),
        total: parseFloat(item.amount || item.total || 0)
      }));
    } else if (timesheet && employee) {
      // Generate line item from timesheet data
      const hours = parseFloat(timesheet.totalHours || 0);
      const rate = parseFloat(employee.hourlyRate || 0);
      
      lineItems = [{
        employeeName: `${employee.firstName} ${employee.lastName}`,
        role: employee.title || employee.position || employee.department || 'Software Engineer',
        description: weekRange || 'Billing Period',
        hoursWorked: hours,
        hourlyRate: rate,
        total: hours * rate
      }];
    }

    // Build response with all data needed for PDF
    const pdfData = {
      // Invoice basic info
      id: decryptedInvoice.id,
      invoiceNumber: decryptedInvoice.invoiceNumber,
      invoiceDate: decryptedInvoice.invoiceDate,
      dueDate: decryptedInvoice.dueDate,
      paymentTerms: 'Net 15',
      
      // Vendor/Client info (Billed To)
      vendorName: vendor?.name || 'Vendor Name',
      vendorEmail: vendor?.email || 'vendor@example.com',
      vendorAddress: vendor?.address || '500 Corporate Drive, Suite 200',
      vendorCity: vendor?.city || 'Dallas, TX 75201',
      vendorPhone: vendor?.phone || '',
      
      // Employee info
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Employee Name',
      employeeEmail: employee?.email || '',
      employeeRole: employee?.title || employee?.position || employee?.department || 'Software Engineer',
      hourlyRate: employee?.hourlyRate || 0,
      
      // Timesheet/Period info
      weekStart: weekStart,
      weekEnd: weekEnd,
      weekRange: weekRange,
      totalHours: timesheet?.totalHours || 0,
      
      // Financial info
      subtotal: parseFloat(invoice.subtotal || 0),
      taxAmount: parseFloat(invoice.taxAmount || 0),
      totalAmount: parseFloat(invoice.totalAmount || 0),
      
      // Line items
      lineItems: lineItems,
      
      // Status
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      
      // Additional info (decrypted)
      notes: decryptedInvoice.notes,
      timesheetId: decryptedInvoice.timesheetId,
      
      // Month and year for display
      month: weekStart ? new Date(weekStart).toLocaleDateString('en-US', { month: 'long' }) : null,
      year: weekStart ? new Date(weekStart).getFullYear() : new Date().getFullYear()
    };

    res.json({ 
      success: true, 
      invoice: pdfData
    });
  } catch (error) {
    console.error("❌ Error fetching invoice PDF data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice PDF data",
      error: error.message,
    });
  }
});

// GET /api/invoices/:id - Get complete invoice details for viewing
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    console.log('📄 Fetching invoice details for ID:', id, 'tenantId:', tenantId);

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    // Fetch the basic invoice
    const invoice = await models.Invoice.findOne({
      where: { id, tenantId }
    });

    if (!invoice) {
      console.log('❌ Invoice not found');
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    console.log('✅ Invoice found:', invoice.invoiceNumber);

    // Decrypt invoice data
    const decryptedInvoice = DataEncryptionService.decryptInstance(invoice, 'invoice');

    // Fetch related data separately
    let vendor = null;
    let employee = null;
    let timesheet = null;
    let client = null;

    // Fetch vendor
    if (invoice.vendorId) {
      try {
        vendor = await models.Vendor.findOne({
          where: { id: invoice.vendorId },
          attributes: ["id", "name", "email", "phone", "address", "city", "state", "zipCode"]
        });
        console.log('✅ Vendor found via invoice.vendorId:', vendor?.name, 'Email:', vendor?.email);
      } catch (err) {
        console.log('⚠️ Vendor fetch error:', err.message);
      }
    } else {
      console.log('⚠️ No vendorId on invoice, will try to get from employee');
    }

    // Fetch client
    if (invoice.clientId) {
      try {
        client = await models.Client.findOne({
          where: { id: invoice.clientId },
          attributes: ["id", "clientName", "email", "billingAddress"]
        });
        console.log('✅ Client found:', client?.clientName);
      } catch (err) {
        console.log('⚠️ Client fetch error:', err.message);
      }
    }

    // Fetch timesheet
    if (invoice.timesheetId) {
      try {
        timesheet = await models.Timesheet.findOne({
          where: { id: invoice.timesheetId },
          attributes: ["id", "weekStart", "weekEnd", "totalHours", "employeeId", "status"]
        });
        console.log('✅ Timesheet found:', timesheet?.id);
      } catch (err) {
        console.log('⚠️ Timesheet fetch error:', err.message);
      }
    }

    // Fetch employee with vendor association
    const employeeId = invoice.employeeId || timesheet?.employeeId;
    if (employeeId) {
      try {
        employee = await models.Employee.findOne({
          where: { id: employeeId },
          attributes: ["id", "firstName", "lastName", "email", "title", "position", "department", "hourlyRate", "vendorId"],
          include: [{
            model: models.Vendor,
            as: 'vendor',
            attributes: ["id", "name", "email", "phone", "address", "city", "state", "zipCode"],
            required: false
          }]
        });
        console.log('✅ Employee found:', employee?.firstName, employee?.lastName);
        console.log('✅ Employee vendor (nested):', employee?.vendor?.name, employee?.vendor?.email);

        // If employee has vendor and we don't have vendor yet, use employee's vendor
        if (employee?.vendor && !vendor) {
          vendor = employee.vendor;
          console.log('✅ Using vendor from employee association:', vendor?.name, 'Email:', vendor?.email);
        } else if (employee?.vendorId && !vendor) {
          // Fallback: Fetch vendor separately if association didn't work
          vendor = await models.Vendor.findOne({
            where: { id: employee.vendorId },
            attributes: ["id", "name", "email", "phone", "address", "city", "state", "zipCode"]
          });
          console.log('✅ Vendor found via separate query:', vendor?.name, 'Email:', vendor?.email);
        } else if (!vendor) {
          console.log('⚠️ No vendor found - employee.vendorId:', employee?.vendorId);
        }
      } catch (err) {
        console.log('⚠️ Employee fetch error:', err.message);
      }
    }

    // Build complete response with decrypted data
    const completeInvoice = {
      ...decryptedInvoice,
      vendor: vendor,
      client: client,
      employee: employee,
      timesheet: timesheet ? {
        ...timesheet.toJSON(),
        employee: employee
      } : null
    };

    console.log('✅ Complete invoice data prepared');
    console.log('📋 Final vendor in response:', completeInvoice.vendor ? `${completeInvoice.vendor.name} (${completeInvoice.vendor.email})` : 'NULL');
    console.log('👤 Final employee in response:', completeInvoice.employee ? `${completeInvoice.employee.firstName} ${completeInvoice.employee.lastName}` : 'NULL');

    res.json({ success: true, invoice: completeInvoice });
  } catch (error) {
    console.error("❌ Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
});

// GET /api/invoices/:id/employees - Get employee details for invoice line items
router.get("/:id/employees", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const invoice = await models.Invoice.findOne({
      where: { id, tenantId },
      include: [
        {
          model: models.Timesheet,
          as: "timesheet",
          required: false,
          include: [{
            model: models.Employee,
            as: "employee",
            attributes: ["id", "firstName", "lastName", "email", "title", "position", "department", "hourlyRate"],
            required: false
          }]
        },
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email", "title", "position", "department", "hourlyRate"],
          required: false,
        }
      ],
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    // Extract employee data from timesheet or direct employee association
    let employeeData = null;
    
    if (invoice.timesheet?.employee) {
      employeeData = {
        id: invoice.timesheet.employee.id,
        firstName: invoice.timesheet.employee.firstName,
        lastName: invoice.timesheet.employee.lastName,
        fullName: `${invoice.timesheet.employee.firstName} ${invoice.timesheet.employee.lastName}`,
        email: invoice.timesheet.employee.email,
        position: invoice.timesheet.employee.title || invoice.timesheet.employee.position || invoice.timesheet.employee.department || 'Position',
        hourlyRate: invoice.timesheet.employee.hourlyRate || 45.00
      };
    } else if (invoice.employee) {
      employeeData = {
        id: invoice.employee.id,
        firstName: invoice.employee.firstName,
        lastName: invoice.employee.lastName,
        fullName: `${invoice.employee.firstName} ${invoice.employee.lastName}`,
        email: invoice.employee.email,
        position: invoice.employee.title || invoice.employee.position || invoice.employee.department || 'Position',
        hourlyRate: invoice.employee.hourlyRate || 45.00
      };
    }

    // Process line items if they exist
    let lineItemsWithEmployees = [];
    if (invoice.lineItems && Array.isArray(invoice.lineItems)) {
      lineItemsWithEmployees = invoice.lineItems.map(item => ({
        ...item,
        employeeName: item.employeeName || (employeeData ? employeeData.fullName : 'Employee Name'),
        position: item.position || (employeeData ? employeeData.position : 'Position'),
        hourlyRate: item.hourlyRate || item.rate || (employeeData ? employeeData.hourlyRate : 45.00)
      }));
    }

    res.json({ 
      success: true, 
      employee: employeeData,
      lineItems: lineItemsWithEmployees
    });
  } catch (error) {
    console.error("❌ Error fetching invoice employees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice employees",
      error: error.message,
    });
  }
});

// PUT /api/invoices/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tenantId,
      status,
      notes,
      lineItems,
      total,
      subtotal,
      tax,
      approvedBy,
      invoiceNumber,
      issueDate,
      vendor,
      employeeName,
      employeeEmail,
      vendorContact,
      hours,
      week,
      companyLogo,
      timesheetFile,
      timesheetFileName,
    } = req.body;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const invoice = await models.Invoice.findOne({
      where: { id, tenantId },
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    const updateData = {};
    
    // Basic invoice fields
    if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
    if (issueDate) updateData.issueDate = issueDate;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (lineItems) updateData.lineItems = lineItems;
    if (total !== undefined) updateData.total = total;
    if (total !== undefined) updateData.totalAmount = total; // Also update totalAmount field
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (tax !== undefined) updateData.tax = tax;
    if (hours !== undefined) updateData.hours = hours;
    if (week) updateData.week = week;
    
    // Employee and vendor fields
    if (employeeName !== undefined) updateData.employeeName = employeeName;
    if (employeeEmail !== undefined) updateData.employeeEmail = employeeEmail;
    if (vendor !== undefined) updateData.vendor = vendor;
    if (vendorContact !== undefined) updateData.vendorContact = vendorContact;
    
    // File uploads
    if (companyLogo !== undefined) updateData.companyLogo = companyLogo;
    if (timesheetFile !== undefined) updateData.timesheetFile = timesheetFile;
    if (timesheetFileName !== undefined) updateData.timesheetFileName = timesheetFileName;

    // Status-specific updates
    if (status === "approved") {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    } else if (status === "paid") {
      updateData.paidAt = new Date();
    }

    console.log('📝 Updating invoice with data:', updateData);
    await invoice.update(updateData);

    // Fetch updated invoice with associations
    const updatedInvoice = await models.Invoice.findOne({
      where: { id, tenantId },
      include: [
        {
          model: models.Vendor,
          as: "vendor",
          attributes: ["id", "name", "email"],
          required: false,
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "email"],
          required: false,
        },
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
    });

    console.log('✅ Invoice updated successfully');
    res.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    console.error("❌ Error updating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update invoice",
      error: error.message,
    });
  }
});

// POST /api/invoices/:id/approve
router.post("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, approvedBy, notes } = req.body;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const invoice = await models.Invoice.findOne({
      where: { id, tenantId },
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    await invoice.update({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      notes: notes || invoice.notes,
    });

    res.json({ success: true, invoice });
  } catch (error) {
    console.error("❌ Error approving invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve invoice",
      error: error.message,
    });
  }
});

// POST /api/invoices/:id/reject
router.post("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, rejectionReason } = req.body;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    const invoice = await models.Invoice.findOne({
      where: { id, tenantId },
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    await invoice.update({
      status: "rejected",
      rejectionReason,
    });

    res.json({ success: true, invoice });
  } catch (error) {
    console.error("❌ Error rejecting invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject invoice",
      error: error.message,
    });
  }
});

// POST /api/invoices/generate-from-timesheet
router.post("/generate-from-timesheet", (req, res) => {
  const { timesheetData, clientInfo } = req.body;

  try {
    // Transform timesheet data to invoice format
    const invoice = {
      id: Date.now(),
      invoiceNumber: `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],

      client: {
        name:
          clientInfo?.name ||
          timesheetData?.results?.Entry?.[0]?.Vendor_Name ||
          "Unknown Client",
        email: clientInfo?.email || "",
        address: clientInfo?.address || "",
      },

      items: [
        {
          description: `Professional Services - ${
            timesheetData?.results?.Entry?.[0]?.Duration || "Period"
          }`,
          quantity: parseFloat(
            timesheetData?.results?.Entry?.[0]?.Total_Hours || 0
          ),
          rate: clientInfo?.hourlyRate || 125,
          amount:
            parseFloat(timesheetData?.results?.Entry?.[0]?.Total_Hours || 0) *
            (clientInfo?.hourlyRate || 125),
        },
      ],

      subtotal:
        parseFloat(timesheetData?.results?.Entry?.[0]?.Total_Hours || 0) *
        (clientInfo?.hourlyRate || 125),
      tax: 0,
      total:
        parseFloat(timesheetData?.results?.Entry?.[0]?.Total_Hours || 0) *
        (clientInfo?.hourlyRate || 125),

      status: "draft",
      notes: `Invoice generated from timesheet analysis.`,

      metadata: {
        sourceTimesheet: timesheetData,
        processingCost: timesheetData?.cost || "",
      },
    };

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).json({
      error: "Failed to generate invoice",
      message: error.message,
    });
  }
});

// GET /api/invoices/:id/download-pdf - Download invoice as PDF
router.get("/:id/download-pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    console.log("📄 Generating PDF for invoice:", id);

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    // Fetch complete invoice data using InvoiceService
    const InvoiceService = require("../services/InvoiceService");
    const invoiceDetails = await InvoiceService.getInvoiceWithDetails(id, tenantId);

    if (!invoiceDetails.invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    // Prepare data for PDF generation
    const { invoice, employee, vendor, client, timesheet } = invoiceDetails;

    // Format week range if timesheet exists
    let weekRange = null;
    if (timesheet) {
      const weekStart = new Date(timesheet.weekStart);
      const weekEnd = new Date(timesheet.weekEnd);
      weekRange = `${weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })} - ${weekEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })}`;
    }

    const pdfData = {
      // Invoice info
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      paymentTerms: "Net 30",

      // Vendor info (Billed To)
      vendorName: vendor?.name || "N/A",
      vendorEmail: vendor?.email || "",
      vendorAddress: vendor?.address || "",
      vendorCity: vendor?.city ? `${vendor.city}, ${vendor.state || ""} ${vendor.zip || ""}` : "",
      vendorPhone: vendor?.phone || "",

      // Client info (if applicable)
      clientName: client?.clientName || "",
      clientEmail: client?.email || "",

      // Employee info
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "",
      employeeEmail: employee?.email || "",
      employeeRole: employee?.title || employee?.department || "",

      // Timesheet info
      weekRange: weekRange,
      totalHours: timesheet?.totalHours || 0,

      // Financial info
      subtotal: parseFloat(invoice.subtotal || 0),
      taxAmount: parseFloat(invoice.taxAmount || 0),
      totalAmount: parseFloat(invoice.totalAmount || 0),

      // Line items
      lineItems: invoice.lineItems || [],

      // Notes
      notes: invoice.notes || "",

      // Payment status
      paymentStatus: invoice.paymentStatus,
    };

    // Generate PDF
    const InvoicePDFService = require("../services/InvoicePDFService");
    const pdfBuffer = await InvoicePDFService.generateInvoicePDF(pdfData);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

    console.log("✅ PDF generated and sent:", invoice.invoiceNumber);
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message,
    });
  }
});

module.exports = router;
