const express = require("express");
const router = express.Router();
const { models, sequelize } = require("../models");
const { Op } = require("sequelize");
const DataEncryptionService = require("../services/DataEncryptionService");

const { Employee, Timesheet, User, Client, Invoice } = models;

// Helper function to safely parse dates
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// Get client report data
router.get("/clients", async (req, res) => {
  try {
    const { tenantId, startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
      });
    }

    // Set default date range if not provided (last 3 months)
    const now = new Date();
    const defaultStartDate = parseDate(startDate) || new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const defaultEndDate = parseDate(endDate) || now;

    console.log("🔍 Fetching client reports for:", {
      tenantId,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });

    // Get all clients for the tenant
    const clients = await Client.findAll({
      where: { tenantId },
      attributes: ["id", "clientName", "legalName", "hourlyRate"],
      raw: true,
    });

    // Decrypt client data
    const decryptedClients = DataEncryptionService.decryptClients(clients);

    console.log(`📊 Found ${decryptedClients.length} clients`);

    // Get timesheets using raw query to avoid field mapping issues
    const timesheets = await sequelize.query(
      `SELECT 
        t.id, t.tenant_id, t.employee_id, t.client_id, 
        t.week_start, t.week_end, t.total_hours, t.status,
        c.client_name, e.first_name, e.last_name
      FROM timesheets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.tenant_id = :tenantId
        AND t.week_start >= :startDate
        AND t.week_start <= :endDate
        AND t.status IN ('draft', 'submitted', 'approved', 'rejected')
      ORDER BY t.week_start DESC`,
      {
        replacements: {
          tenantId,
          startDate: defaultStartDate.toISOString().split('T')[0],
          endDate: defaultEndDate.toISOString().split('T')[0],
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Decrypt client and employee names in timesheets
    const decryptedTimesheets = timesheets.map(ts => ({
      ...ts,
      client_name: ts.client_name ? DataEncryptionService.decryptClientData({ clientName: ts.client_name }).clientName : null,
      first_name: ts.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: ts.first_name }).firstName : null,
      last_name: ts.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: ts.last_name }).lastName : null,
    }));

    console.log(`📊 Found ${decryptedTimesheets.length} timesheets`);

    // Get invoices for the date range
    const invoices = await Invoice.findAll({
      where: {
        tenantId,
        invoiceDate: {
          [Op.gte]: defaultStartDate,
          [Op.lte]: defaultEndDate,
        },
      },
      attributes: ["id", "clientId", "totalAmount", "paymentStatus"],
      raw: true,
    });

    // Process data to create client reports using decrypted clients
    const clientReports = decryptedClients.map((client) => {
      const clientTimesheets = decryptedTimesheets.filter(
        (ts) => ts.client_id === client.id
      );
      const clientInvoices = invoices.filter(
        (inv) => inv.clientId === client.id
      );

      // Calculate totals
      const totalHours = clientTimesheets.reduce(
        (sum, ts) => sum + (parseFloat(ts.total_hours) || 0),
        0
      );
      const totalBilled = clientInvoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.totalAmount) || 0),
        0
      );

      // Get unique employees
      const uniqueEmployees = new Set(
        clientTimesheets.map((ts) => ts.employee_id).filter(Boolean)
      );
      const totalEmployees = uniqueEmployees.size;

      // Group by project (using client name as project for now)
      const projects = [
        {
          name: client.clientName,
          hours: totalHours,
          employees: totalEmployees,
        },
      ];

      return {
        id: client.id,
        name: client.clientName,
        totalHours: Math.round(totalHours * 100) / 100,
        totalEmployees,
        totalBilled: Math.round(totalBilled * 100) / 100,
        projects,
      };
    });

    // Sort by total hours descending
    clientReports.sort((a, b) => b.totalHours - a.totalHours);

    res.json({
      success: true,
      data: clientReports,
      summary: {
        totalClients: clientReports.length,
        totalHours: clientReports.reduce(
          (sum, client) => sum + client.totalHours,
          0
        ),
        totalBilled: clientReports.reduce(
          (sum, client) => sum + client.totalBilled,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching client reports:", error);
    res.status(500).json({
      error: "Failed to fetch client reports",
      details: error.message,
    });
  }
});

// Get employee report data
router.get("/employees", async (req, res) => {
  try {
    const { tenantId, startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
      });
    }

    // Set default date range if not provided (last 3 months)
    const now = new Date();
    const defaultStartDate = parseDate(startDate) || new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const defaultEndDate = parseDate(endDate) || now;

    console.log("🔍 Fetching employee reports for:", {
      tenantId,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });

    // Get all active employees for the tenant (exclude soft-deleted and admin users)
    const employees = await sequelize.query(
      `SELECT e.id, e.first_name, e.last_name, e.department
       FROM employees e
       LEFT JOIN users u ON e.id = u.id AND e.tenant_id = u.tenant_id
       WHERE e.tenant_id = :tenantId
         AND (u.role IS NULL OR u.role != 'admin')
       ORDER BY e.first_name, e.last_name`,
      {
        replacements: { tenantId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Decrypt employee data
    const decryptedEmployees = employees.map(emp => ({
      ...emp,
      first_name: emp.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: emp.first_name }).firstName : null,
      last_name: emp.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: emp.last_name }).lastName : null,
    }));

    console.log(`📊 Found ${decryptedEmployees.length} employees`);

    // Get timesheets using raw query
    const timesheets = await sequelize.query(
      `SELECT 
        t.id, t.employee_id, t.client_id, t.week_start, t.week_end, 
        t.total_hours, t.status,
        c.client_name, e.first_name, e.last_name
      FROM timesheets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.tenant_id = :tenantId
        AND t.week_start >= :startDate
        AND t.week_start <= :endDate
        AND t.status IN ('draft', 'submitted', 'approved', 'rejected')
      ORDER BY t.week_start DESC`,
      {
        replacements: {
          tenantId,
          startDate: defaultStartDate.toISOString().split('T')[0],
          endDate: defaultEndDate.toISOString().split('T')[0],
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Decrypt client and employee names in timesheets
    const decryptedTimesheets = timesheets.map(ts => ({
      ...ts,
      client_name: ts.client_name ? DataEncryptionService.decryptClientData({ clientName: ts.client_name }).clientName : null,
      first_name: ts.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: ts.first_name }).firstName : null,
      last_name: ts.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: ts.last_name }).lastName : null,
    }));

    console.log(`📊 Found ${decryptedTimesheets.length} timesheets`);

    // Process data to create employee reports using decrypted data
    const employeeReports = decryptedEmployees.map((employee) => {
      const employeeTimesheets = decryptedTimesheets.filter(
        (ts) => ts.employee_id === employee.id
      );

      // Calculate totals
      const totalHours = employeeTimesheets.reduce(
        (sum, ts) => sum + (parseFloat(ts.total_hours) || 0),
        0
      );

      // Calculate utilization (assuming 40 hours per week)
      const weeksInPeriod = Math.ceil(
        (defaultEndDate - defaultStartDate) / (7 * 24 * 60 * 60 * 1000)
      );
      const expectedHours = weeksInPeriod * 40;
      const utilization =
        expectedHours > 0
          ? Math.round((totalHours / expectedHours) * 100)
          : 0;

      // Get client and project info from most recent timesheet
      const latestTimesheet = employeeTimesheets[0];
      const clientName = latestTimesheet?.client_name || "N/A";
      const projectName = clientName; // Using client name as project for now

      // Calculate weekly breakdown (last 4 weeks)
      const weeklyBreakdown = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(defaultEndDate);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekHours = employeeTimesheets
          .filter((ts) => {
            const tsDate = new Date(ts.week_start);
            return tsDate >= weekStart && tsDate <= weekEnd;
          })
          .reduce((sum, ts) => sum + (parseFloat(ts.total_hours) || 0), 0);

        weeklyBreakdown.push(Math.round(weekHours * 100) / 100);
      }

      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`.trim(),
        clientName,
        projectName,
        totalHours: Math.round(totalHours * 100) / 100,
        utilization,
        weeklyBreakdown,
      };
    });

    // Sort by total hours descending
    employeeReports.sort((a, b) => b.totalHours - a.totalHours);

    res.json({
      success: true,
      data: employeeReports,
      summary: {
        totalEmployees: employeeReports.length,
        totalHours: employeeReports.reduce(
          (sum, emp) => sum + emp.totalHours,
          0
        ),
        averageUtilization:
          employeeReports.length > 0
            ? Math.round(
                employeeReports.reduce((sum, emp) => sum + emp.utilization, 0) /
                  employeeReports.length
              )
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching employee reports:", error);
    res.status(500).json({
      error: "Failed to fetch employee reports",
      details: error.message,
    });
  }
});

// Get invoice report data
router.get("/invoices", async (req, res) => {
  try {
    const { tenantId, startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
      });
    }

    console.log("🔍 Fetching invoice reports for:", {
      tenantId,
    });

    // Get all invoices for the tenant (no date filtering to match Invoice module)
    const invoices = await Invoice.findAll({
      where: {
        tenantId,
      },
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["id", "clientName"],
          required: false,
        },
      ],
      order: [["invoiceDate", "DESC"]],
    });

    // Decrypt client names in invoices
    const decryptedInvoices = invoices.map(invoice => {
      const plainInvoice = invoice.get({ plain: true });
      if (plainInvoice.client && plainInvoice.client.clientName) {
        plainInvoice.client.clientName = DataEncryptionService.decryptClientData({ 
          clientName: plainInvoice.client.clientName 
        }).clientName;
      }
      return plainInvoice;
    });

    // Process data to create invoice reports
    const invoiceReports = decryptedInvoices.map((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate);
      const month = invoiceDate.toLocaleDateString("en-US", { month: "long" });
      const year = invoiceDate.getFullYear();
      
      // Calculate total hours from line items
      const lineItems = invoice.lineItems || [];
      const totalHours = lineItems.reduce((sum, item) => {
        return sum + (parseFloat(item.hours) || 0);
      }, 0);

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientName: invoice.client?.clientName || "Unknown Client",
        month,
        year,
        totalHours: totalHours,
        amount: parseFloat(invoice.totalAmount) || 0,
        status: invoice.status || "Draft",
        issueDate: invoice.issueDate || invoice.createdAt,
        createdAt: invoice.createdAt,
      };
    });

    // Group by month for summary
    const monthlySummary = {};
    invoiceReports.forEach((invoice) => {
      const key = `${invoice.month} ${invoice.year}`;
      if (!monthlySummary[key]) {
        monthlySummary[key] = {
          month: invoice.month,
          year: invoice.year,
          totalAmount: 0,
          totalHours: 0,
          invoiceCount: 0,
        };
      }
      monthlySummary[key].totalAmount += invoice.amount;
      monthlySummary[key].totalHours += invoice.totalHours;
      monthlySummary[key].invoiceCount += 1;
    });

    res.json({
      success: true,
      data: invoiceReports,
      monthlySummary: Object.values(monthlySummary).sort((a, b) => {
        // Sort by year and month
        const dateA = new Date(
          a.year,
          new Date(`${a.month} 1, ${a.year}`).getMonth()
        );
        const dateB = new Date(
          b.year,
          new Date(`${b.month} 1, ${b.year}`).getMonth()
        );
        return dateB - dateA;
      }),
      summary: {
        totalInvoices: invoiceReports.length,
        totalAmount: invoiceReports.reduce((sum, inv) => sum + inv.amount, 0),
        totalHours: invoiceReports.reduce(
          (sum, inv) => sum + inv.totalHours,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching invoice reports:", error);
    res.status(500).json({
      error: "Failed to fetch invoice reports",
      details: error.message,
    });
  }
});

// Get analytics dashboard data
router.get("/analytics", async (req, res) => {
  try {
    const { tenantId, period = "month" } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: "Tenant ID is required",
      });
    }

    // Set date range based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = now;
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = now;
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }

    console.log("🔍 Fetching analytics for:", {
      tenantId,
      period,
      startDate,
      endDate,
    });

    // Get timesheets using raw query
    const timesheets = await sequelize.query(
      `SELECT 
        t.id, t.employee_id, t.client_id, t.week_start, t.total_hours,
        c.client_name, e.first_name, e.last_name, e.department
      FROM timesheets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.tenant_id = :tenantId
        AND t.week_start >= :startDate
        AND t.week_start <= :endDate
        AND t.status IN ('draft', 'submitted', 'approved', 'rejected')
      ORDER BY t.week_start ASC`,
      {
        replacements: {
          tenantId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Decrypt client and employee names in timesheets
    const decryptedTimesheets = timesheets.map(ts => ({
      ...ts,
      client_name: ts.client_name ? DataEncryptionService.decryptClientData({ clientName: ts.client_name }).clientName : null,
      first_name: ts.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: ts.first_name }).firstName : null,
      last_name: ts.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: ts.last_name }).lastName : null,
    }));

    // Get invoices for the period
    const invoices = await Invoice.findAll({
      where: {
        tenantId,
        invoiceDate: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["id", "clientName"],
          required: false,
        },
      ],
    });

    // Calculate analytics using decrypted timesheets
    const totalHours = decryptedTimesheets.reduce(
      (sum, ts) => sum + (parseFloat(ts.total_hours) || 0),
      0
    );
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.total) || 0),
      0
    );
    const totalEmployees = new Set(
      decryptedTimesheets.map((ts) => ts.employee_id).filter(Boolean)
    ).size;
    const totalClients = new Set(
      decryptedTimesheets.map((ts) => ts.client_id).filter(Boolean)
    ).size;

    // Hours by client
    const hoursByClient = {};
    decryptedTimesheets.forEach((ts) => {
      const clientName = ts.client_name || "Unknown";
      hoursByClient[clientName] =
        (hoursByClient[clientName] || 0) + (parseFloat(ts.total_hours) || 0);
    });

    // Hours by employee
    const hoursByEmployee = {};
    decryptedTimesheets.forEach((ts) => {
      const employeeName = ts.first_name && ts.last_name
        ? `${ts.first_name} ${ts.last_name}`.trim()
        : "Unknown";
      hoursByEmployee[employeeName] =
        (hoursByEmployee[employeeName] || 0) + (parseFloat(ts.total_hours) || 0);
    });

    // Hours by department
    const hoursByDepartment = {};
    decryptedTimesheets.forEach((ts) => {
      const department = ts.department || "Unknown";
      hoursByDepartment[department] =
        (hoursByDepartment[department] || 0) + (parseFloat(ts.total_hours) || 0);
    });

    // Weekly trends
    const weeklyTrends = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() + 6);

        const weekTimesheets = decryptedTimesheets.filter((ts) => {
          const tsDate = new Date(ts.week_start);
          return tsDate >= currentDate && tsDate <= weekEnd;
        });

      const weekHours = weekTimesheets.reduce(
        (sum, ts) => sum + (parseFloat(ts.total_hours) || 0),
        0
      );

      weeklyTrends.push({
        week: currentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        hours: Math.round(weekHours * 100) / 100,
        timesheets: weekTimesheets.length,
      });

      currentDate.setDate(currentDate.getDate() + 7);
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalHours: Math.round(totalHours * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalEmployees,
          totalClients,
          averageHoursPerEmployee:
            totalEmployees > 0
              ? Math.round((totalHours / totalEmployees) * 100) / 100
              : 0,
          averageRevenuePerHour:
            totalHours > 0
              ? Math.round((totalRevenue / totalHours) * 100) / 100
              : 0,
        },
        hoursByClient: Object.entries(hoursByClient)
          .map(([name, hours]) => ({
            name,
            hours: Math.round(hours * 100) / 100,
          }))
          .sort((a, b) => b.hours - a.hours),
        hoursByEmployee: Object.entries(hoursByEmployee)
          .map(([name, hours]) => ({
            name,
            hours: Math.round(hours * 100) / 100,
          }))
          .sort((a, b) => b.hours - a.hours),
        hoursByDepartment: Object.entries(hoursByDepartment)
          .map(([name, hours]) => ({
            name,
            hours: Math.round(hours * 100) / 100,
          }))
          .sort((a, b) => b.hours - a.hours),
        weeklyTrends,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      error: "Failed to fetch analytics",
      details: error.message,
    });
  }
});

module.exports = router;
