const express = require("express");
const router = express.Router();
const { models } = require("../models");
const { Op } = require("sequelize");

const { Employee, Timesheet, User, Client, Invoice } = models;

// Get client report data
router.get("/clients", async (req, res) => {
  try {
    const { tenantId, startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: "Tenant ID is required",
      });
    }

    // Set default date range if not provided (last 3 months)
    const now = new Date();
    const defaultStartDate =
      startDate || new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const defaultEndDate = endDate || now;

    console.log("🔍 Fetching client reports for:", {
      tenantId,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });

    // Get all clients for the tenant
    const clients = await Client.findAll({
      where: { tenantId },
      attributes: ["id", "clientName", "legalName", "hourlyRate"],
    });

    // Get timesheets for the date range (exclude soft-deleted)
    const timesheets = await Timesheet.findAll({
      where: {
        tenantId,
        week_start_date: {
          [Op.gte]: defaultStartDate,
          [Op.lte]: defaultEndDate,
        },
        status: {
          [Op.ne]: "deleted", // Exclude soft-deleted timesheets
        },
      },
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["id", "clientName"],
          required: false,
        },
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName"],
          required: false,
        },
      ],
      order: [["week_start_date", "DESC"]],
    });

    // Get invoices for the date range (exclude soft-deleted)
    const invoices = await Invoice.findAll({
      where: {
        tenantId,
        invoiceDate: {
          [Op.gte]: defaultStartDate,
          [Op.lte]: defaultEndDate,
        },
        status: {
          [Op.ne]: "deleted", // Exclude soft-deleted invoices
        },
      },
      attributes: ["id", "clientId", "totalAmount", "paymentStatus"],
    });

    // Process data to create client reports
    const clientReports = clients.map((client) => {
      const clientTimesheets = timesheets.filter(
        (ts) => ts.clientId === client.id
      );
      const clientInvoices = invoices.filter(
        (inv) => inv.clientId === client.id
      );

      // Calculate totals
      const totalHours = clientTimesheets.reduce(
        (sum, ts) => sum + (parseFloat(ts.totalHours) || 0),
        0
      );
      const totalBilled = clientInvoices.reduce(
        (sum, inv) => sum + (parseFloat(inv.totalAmount) || 0),
        0
      );

      // Get unique employees
      const uniqueEmployees = new Set(
        clientTimesheets.map((ts) => ts.employeeId).filter(Boolean)
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
        error: "Tenant ID is required",
      });
    }

    // Set default date range if not provided (last month)
    const now = new Date();
    const defaultStartDate =
      startDate || new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const defaultEndDate = endDate || now;

    console.log("🔍 Fetching employee reports for:", {
      tenantId,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });

    // Get all active employees for the tenant (exclude soft-deleted and admin users)
    const allEmployees = await Employee.findAll({
      where: { 
        tenantId,
        status: "active" // Only include active employees
      },
      attributes: ["id", "firstName", "lastName", "hourlyRate"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["department", "title", "role"],
          required: false,
        },
      ],
    });

    // Filter out admin users at application level
    const employees = allEmployees.filter(emp => 
      !emp.user || emp.user.role !== "admin"
    );

    // Get timesheets for the date range (exclude soft-deleted)
    const timesheets = await Timesheet.findAll({
      where: {
        tenantId,
        week_start_date: {
          [Op.gte]: defaultStartDate,
          [Op.lte]: defaultEndDate,
        },
        status: {
          [Op.ne]: "deleted", // Exclude soft-deleted timesheets
        },
      },
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["id", "clientName"],
          required: false,
        },
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName"],
          required: false,
        },
      ],
      order: [["week_start_date", "DESC"]],
    });

    // Process data to create employee reports
    const employeeReports = employees.map((employee) => {
      const employeeTimesheets = timesheets.filter(
        (ts) => ts.employeeId === employee.id
      );

      // Calculate totals
      const totalHours = employeeTimesheets.reduce(
        (sum, ts) => sum + (parseFloat(ts.totalHours) || 0),
        0
      );

      // Calculate utilization (assuming 40 hours per week as standard)
      const weeksInRange = Math.ceil(
        (defaultEndDate - defaultStartDate) / (7 * 24 * 60 * 60 * 1000)
      );
      const expectedHours = weeksInRange * 40;
      const utilization =
        expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100) : 0;

      // Get most recent client and project
      const latestTimesheet = employeeTimesheets[0];
      const clientName = latestTimesheet?.client?.clientName || "N/A";
      const projectName = latestTimesheet?.client?.clientName || "N/A"; // Using client name as project for now

      // Calculate weekly breakdown (last 4 weeks)
      const weeklyBreakdown = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(defaultEndDate);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekHours = employeeTimesheets
          .filter((ts) => {
            const tsDate = new Date(ts.week_start_date);
            return tsDate >= weekStart && tsDate <= weekEnd;
          })
          .reduce((sum, ts) => sum + (parseFloat(ts.totalHours) || 0), 0);

        weeklyBreakdown.push(Math.round(weekHours * 100) / 100);
      }

      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        totalHours: Math.round(totalHours * 100) / 100,
        utilization: Math.min(utilization, 120), // Cap at 120%
        clientName,
        projectName,
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
        error: "Tenant ID is required",
      });
    }

    // Set default date range if not provided (last 6 months)
    const now = new Date();
    const defaultStartDate =
      startDate || new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const defaultEndDate = endDate || now;

    console.log("🔍 Fetching invoice reports for:", {
      tenantId,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    });

    // Get invoices for the date range (exclude soft-deleted)
    const invoices = await Invoice.findAll({
      where: {
        tenantId,
        invoiceDate: {
          [Op.gte]: defaultStartDate,
          [Op.lte]: defaultEndDate,
        },
        status: {
          [Op.ne]: "deleted", // Exclude soft-deleted invoices
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
      order: [["invoiceDate", "DESC"]],
    });

    // Process data to create invoice reports
    const invoiceReports = invoices.map((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate);
      const month = invoiceDate.toLocaleDateString("en-US", { month: "long" });
      const year = invoiceDate.getFullYear();

      return {
        id: invoice.id,
        clientId: invoice.clientId,
        clientName: invoice.client?.clientName || "Unknown Client",
        month,
        year,
        totalHours: parseFloat(invoice.totalHours) || 0,
        amount: parseFloat(invoice.totalAmount) || 0,
        status: invoice.status || "Draft",
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

    // Get timesheets for the period (exclude soft-deleted)
    const timesheets = await Timesheet.findAll({
      where: {
        tenantId,
        week_start_date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
        status: {
          [Op.ne]: "deleted", // Exclude soft-deleted timesheets
        },
      },
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["id", "clientName"],
          required: false,
        },
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "firstName", "lastName", "department"],
          required: false,
        },
      ],
      order: [["week_start_date", "ASC"]],
    });

    // Get invoices for the period (exclude soft-deleted)
    const invoices = await Invoice.findAll({
      where: {
        tenantId,
        invoiceDate: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
        status: {
          [Op.ne]: "deleted", // Exclude soft-deleted invoices
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

    // Calculate analytics
    const totalHours = timesheets.reduce(
      (sum, ts) => sum + (parseFloat(ts.totalHours) || 0),
      0
    );
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.total) || 0),
      0
    );
    const totalEmployees = new Set(
      timesheets.map((ts) => ts.employeeId).filter(Boolean)
    ).size;
    const totalClients = new Set(
      timesheets.map((ts) => ts.clientId).filter(Boolean)
    ).size;

    // Hours by client
    const hoursByClient = {};
    timesheets.forEach((ts) => {
      const clientName = ts.client?.clientName || "Unknown";
      hoursByClient[clientName] =
        (hoursByClient[clientName] || 0) + (parseFloat(ts.totalHours) || 0);
    });

    // Hours by employee
    const hoursByEmployee = {};
    timesheets.forEach((ts) => {
      const employeeName = ts.employee
        ? `${ts.employee.firstName} ${ts.employee.lastName}`.trim()
        : "Unknown";
      hoursByEmployee[employeeName] =
        (hoursByEmployee[employeeName] || 0) + (parseFloat(ts.totalHours) || 0);
    });

    // Hours by department
    const hoursByDepartment = {};
    timesheets.forEach((ts) => {
      const department = ts.employee?.department || "Unknown";
      hoursByDepartment[department] =
        (hoursByDepartment[department] || 0) + (parseFloat(ts.totalHours) || 0);
    });

    // Weekly trends
    const weeklyTrends = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() + 6);

        const weekTimesheets = timesheets.filter((ts) => {
          const tsDate = new Date(ts.week_start_date);
          return tsDate >= currentDate && tsDate <= weekEnd;
        });

      const weekHours = weekTimesheets.reduce(
        (sum, ts) => sum + (parseFloat(ts.totalHours) || 0),
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
