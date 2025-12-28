/**
 * Invoice Service
 * Handles automatic invoice generation from approved timesheets
 * Fetches and integrates data from Employee, Vendor, Client, and Timesheet APIs
 */

const { models } = require("../models");
const crypto = require("crypto");
const DataEncryptionService = require("./DataEncryptionService");

class InvoiceService {
  /**
   * Generate invoice number in format INV-YYYY-NNNNN
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<string>} Generated invoice number
   */
  static async generateInvoiceNumber(tenantId) {
    const currentYear = new Date().getFullYear();
    
    // Find the last invoice for this year
    const lastInvoice = await models.Invoice.findOne({
      where: {
        tenantId,
        invoiceNumber: {
          [models.Sequelize.Op.like]: `INV-${currentYear}-%`,
        },
      },
      order: [["created_at", "DESC"]],
    });

    let invoiceNumber;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-").pop());
      invoiceNumber = `INV-${currentYear}-${String(lastNumber + 1).padStart(5, "0")}`;
    } else {
      invoiceNumber = `INV-${currentYear}-00001`;
    }

    return invoiceNumber;
  }

  /**
   * Generate secure invoice hash for public access
   * @param {string} timesheetId - Timesheet ID
   * @returns {string} MD5 hash
   */
  static generateInvoiceHash(timesheetId) {
    return crypto
      .createHash("md5")
      .update(`${timesheetId}-${Date.now()}`)
      .digest("hex");
  }

  /**
   * Fetch complete timesheet data with all associations
   * @param {string} timesheetId - Timesheet ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Timesheet with all related data
   */
  static async fetchTimesheetData(timesheetId, tenantId) {
    const timesheet = await models.Timesheet.findOne({
      where: { id: timesheetId, tenantId },
      include: [
        {
          model: models.Employee,
          as: "employee",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "title",
            "department",
            "hourlyRate",
            "vendorId",
          ],
          required: false,
        },
        {
          model: models.Client,
          as: "client",
          attributes: [
            "id",
            "clientName",
            "email",
            "billingAddress",
            "hourlyRate",
          ],
          required: false,
        },
      ],
    });

    if (!timesheet) {
      throw new Error("Timesheet not found");
    }

    return timesheet;
  }

  /**
   * Fetch employee data from Employee API
   * @param {string} employeeId - Employee ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Employee data
   */
  static async fetchEmployeeData(employeeId, tenantId) {
    const employee = await models.Employee.findOne({
      where: { id: employeeId, tenantId },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "phone",
        "title",
        "department",
        "hourlyRate",
      ],
      // Note: vendorId and vendor association removed - doesn't exist in schema
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    console.log("📋 Employee fetched:", {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
    });

    return employee;
  }

  /**
   * Fetch vendor data from Vendor API
   * @param {string} vendorId - Vendor ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} Vendor data or null
   */
  static async fetchVendorData(vendorId, tenantId) {
    if (!vendorId) return null;

    const vendor = await models.Vendor.findOne({
      where: { id: vendorId, tenantId },
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "zip",
        "country",
        "contactPerson",
        "paymentTerms",
      ],
    });

    return vendor;
  }

  /**
   * Fetch client data from Client API
   * @param {string} clientId - Client ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} Client data or null
   */
  static async fetchClientData(clientId, tenantId) {
    if (!clientId) return null;

    const client = await models.Client.findOne({
      where: { id: clientId, tenantId },
      attributes: [
        "id",
        "clientName",
        "email",
        "billingAddress",
        "hourlyRate",
        "paymentTerms",
      ],
    });

    return client;
  }

  /**
   * Calculate invoice amounts
   * @param {Object} timesheet - Timesheet data
   * @param {Object} employee - Employee data
   * @param {Object} client - Client data
   * @returns {Object} Calculated amounts
   */
  static calculateInvoiceAmounts(timesheet, employee, client) {
    const totalHours = parseFloat(timesheet.totalHours || 0);
    
    // Determine hourly rate priority: Employee > Client > Default
    let hourlyRate = 0;
    if (employee && employee.hourlyRate) {
      hourlyRate = parseFloat(employee.hourlyRate);
    } else if (client && client.hourlyRate) {
      hourlyRate = parseFloat(client.hourlyRate);
    }

    const subtotal = totalHours * hourlyRate;
    const taxAmount = 0; // Can be configured based on tenant settings
    const totalAmount = subtotal + taxAmount;

    return {
      totalHours,
      hourlyRate,
      subtotal,
      taxAmount,
      totalAmount,
    };
  }

  /**
   * Create line items for invoice
   * @param {Object} timesheet - Timesheet data
   * @param {Object} employee - Employee data
   * @param {number} hourlyRate - Hourly rate
   * @param {number} subtotal - Subtotal amount
   * @returns {Array} Line items
   */
  static createLineItems(timesheet, employee, hourlyRate, subtotal) {
    const weekStart = new Date(timesheet.weekStart);
    const weekEnd = new Date(timesheet.weekEnd);
    const weekRange = `${weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })} - ${weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })}`;

    const employeeName = employee
      ? `${employee.firstName} ${employee.lastName}`
      : "Employee";

    return [
      {
        description: `Timesheet for ${employeeName} - ${weekRange}`,
        hours: parseFloat(timesheet.totalHours || 0),
        rate: hourlyRate,
        amount: subtotal,
      },
    ];
  }

  /**
   * Calculate due date (default 30 days from invoice date)
   * @param {Date} invoiceDate - Invoice date
   * @param {number} days - Number of days (default 30)
   * @returns {string} Due date in YYYY-MM-DD format
   */
  static calculateDueDate(invoiceDate = new Date(), days = 30) {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + days);

    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, "0");
    const day = String(dueDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /**
   * Format date to YYYY-MM-DD
   * @param {Date} date - Date object
   * @returns {string} Formatted date
   */
  static formatDateOnly(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Main method: Generate invoice from approved timesheet
   * Automatically fetches all required data from integrated APIs
   * 
   * @param {string} timesheetId - Timesheet ID
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID (who approved the timesheet)
   * @returns {Promise<Object>} Created invoice
   */
  static async generateInvoiceFromTimesheet(timesheetId, tenantId, userId) {
    try {
      console.log("📄 Starting invoice generation for timesheet:", timesheetId);

      // 1. Fetch timesheet data with associations
      const timesheet = await this.fetchTimesheetData(timesheetId, tenantId);

      // 2. Verify timesheet is approved
      if (timesheet.status !== "approved") {
        throw new Error("Only approved timesheets can be converted to invoices");
      }

      // 3. Check if invoice already exists
      const existingInvoice = await models.Invoice.findOne({
        where: { timesheetId: timesheet.id, tenantId },
      });

      if (existingInvoice) {
        console.log("⚠️ Invoice already exists:", existingInvoice.invoiceNumber);
        return {
          success: false,
          message: "Invoice already exists for this timesheet",
          invoice: existingInvoice,
        };
      }

      // 4. Fetch employee data from Employee API
      const employee = await this.fetchEmployeeData(
        timesheet.employeeId,
        tenantId
      );

      // 5. Vendor assignment no longer stored in employee table
      // Invoice will be created without vendor, can be assigned later via frontend
      let vendor = null;
      console.log("⚠️ Vendor not assigned - invoice will be created without vendor");

      // 6. Fetch client data from Client API
      const client = await this.fetchClientData(timesheet.clientId, tenantId);

      // 7. Calculate invoice amounts
      const amounts = this.calculateInvoiceAmounts(timesheet, employee, client);

      // 8. Create line items
      const lineItems = this.createLineItems(
        timesheet,
        employee,
        amounts.hourlyRate,
        amounts.subtotal
      );

      // 9. Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(tenantId);

      // 10. Generate invoice hash for secure access
      const invoiceHash = this.generateInvoiceHash(timesheetId);

      // 11. Calculate dates
      const invoiceDate = new Date();
      const dueDate = this.calculateDueDate(invoiceDate, 30);

      // 12. Encrypt sensitive invoice data
      const invoiceData = {
        lineItems: lineItems,
        notes: "", // No notes in auto-generated invoices
      };
      const encryptedData = DataEncryptionService.encryptInvoiceData(invoiceData);

      // 13. Create invoice record with encrypted data
      const invoice = await models.Invoice.create({
        tenantId,
        invoiceNumber,
        clientId: timesheet.clientId,
        employeeId: employee.id,
        vendorId: vendor ? vendor.id : null,
        timesheetId: timesheet.id,
        invoiceHash,
        invoiceDate: this.formatDateOnly(invoiceDate),
        dueDate: dueDate,
        lineItems: encryptedData.lineItems,
        subtotal: amounts.subtotal,
        taxAmount: amounts.taxAmount,
        totalAmount: amounts.totalAmount,
        paymentStatus: "pending",
        status: "active",
        createdBy: userId,
      });

      console.log("✅ Invoice created successfully:", {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      });

      return {
        success: true,
        message: "Invoice generated successfully",
        invoice: invoice,
        employeeData: {
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          title: employee.title,
          department: employee.department,
        },
        vendorData: vendor
          ? {
              name: vendor.name,
              email: vendor.email,
              phone: vendor.phone,
              address: vendor.address,
            }
          : null,
        clientData: client
          ? {
              name: client.clientName,
              email: client.email,
            }
          : null,
      };
    } catch (error) {
      console.error("❌ Error generating invoice:", error);
      throw error;
    }
  }

  /**
   * Get complete invoice data for viewing/editing
   * Fetches all related data from APIs
   * 
   * @param {string} invoiceId - Invoice ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Complete invoice data
   */
  static async getInvoiceWithDetails(invoiceId, tenantId) {
    try {
      // Fetch invoice
      const invoice = await models.Invoice.findOne({
        where: { id: invoiceId, tenantId },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Fetch related data
      const employee = invoice.employeeId
        ? await this.fetchEmployeeData(invoice.employeeId, tenantId)
        : null;

      const vendor = invoice.vendorId
        ? await this.fetchVendorData(invoice.vendorId, tenantId)
        : null;

      const client = invoice.clientId
        ? await this.fetchClientData(invoice.clientId, tenantId)
        : null;

      const timesheet = invoice.timesheetId
        ? await models.Timesheet.findOne({
            where: { id: invoice.timesheetId, tenantId },
          })
        : null;

      return {
        invoice,
        employee,
        vendor,
        client,
        timesheet,
      };
    } catch (error) {
      console.error("❌ Error fetching invoice details:", error);
      throw error;
    }
  }
}

module.exports = InvoiceService;
