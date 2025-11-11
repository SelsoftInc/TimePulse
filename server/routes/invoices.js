/**
 * Invoice Routes
 */

const express = require("express");
const router = express.Router();
const { models } = require("../models");
const { Op } = require("sequelize");

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

    const formattedInvoices = invoices.map((inv) => ({
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
    const transformedInvoices = invoices.map((inv) => ({
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
        : "N/A",
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
      total: parseFloat(inv.totalAmount) || 0,
      amount: parseFloat(inv.totalAmount) || 0,
      paymentStatus: inv.paymentStatus || "pending",
      status: inv.status || "active",
      lineItems: inv.lineItems || [],
      notes: inv.notes,
      timesheetId: inv.timesheetId,
      timesheet: inv.timesheet ? {
        id: inv.timesheet.id,
        weekStart: inv.timesheet.weekStart,
        weekEnd: inv.timesheet.weekEnd,
        employee: inv.timesheet.employee
      } : null,
    }));

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

    const newInvoice = await models.Invoice.create({
      tenantId,
      invoiceNumber,
      vendorId,
      clientId,
      employeeId,
      timesheetId,
      weekStart,
      weekEnd,
      lineItems: lineItems || [],
      subtotal: subtotal || 0,
      tax: tax || 0,
      total: total || 0,
      status: "draft",
      dueDate,
      notes,
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

// GET /api/invoices/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "tenantId is required" });
    }

    // Fetch invoice with basic associations first
    const invoice = await models.Invoice.findOne({
      where: { id, tenantId },
      include: [
        {
          model: models.Vendor,
          as: "vendor",
          attributes: ["id", "name", "email", "phone", "address"],
          required: false,
        },
        {
          model: models.Client,
          as: "client",
          attributes: ["id", "clientName", "email", "billingAddress"],
          required: false,
        },
        {
          model: models.Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
          include: [{
            model: models.Vendor,
            as: "vendor",
            attributes: ["id", "name", "email"],
            required: false
          }]
        },
        {
          model: models.Timesheet,
          as: "timesheet",
          attributes: ["id", "weekStart", "weekEnd", "employeeId"],
          required: false,
          include: [{
            model: models.Employee,
            as: "employee",
            attributes: ["id", "firstName", "lastName", "email"],
            required: false,
            include: [{
              model: models.Vendor,
              as: "vendor",
              attributes: ["id", "name", "email"],
              required: false
            }]
          }]
        },
        {
          model: models.User,
          as: "approver",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error("❌ Error fetching invoice:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
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
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (lineItems) updateData.lineItems = lineItems;
    if (total !== undefined) updateData.total = total;
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (tax !== undefined) updateData.tax = tax;

    if (status === "approved") {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    } else if (status === "paid") {
      updateData.paidAt = new Date();
    }

    await invoice.update(updateData);

    res.json({ success: true, invoice });
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

module.exports = router;
