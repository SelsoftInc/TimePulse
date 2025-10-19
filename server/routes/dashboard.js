/**
 * Dashboard API Routes
 * Optimized dashboard queries with Company/Employee scope support
 */

const express = require("express");
const { sequelize } = require("../models");
const router = express.Router();

// =============================================
// DASHBOARD DATA ENDPOINT
// =============================================

/**
 * GET /api/dashboard
 * Returns comprehensive dashboard data based on scope (company/employee)
 *
 * Query Parameters:
 * - scope: 'company' | 'employee' (default: 'company')
 * - employeeId: UUID (required when scope='employee')
 * - from: ISO date string (optional)
 * - to: ISO date string (optional)
 */
router.get("/", async (req, res) => {
  try {
    const { scope = "company", employeeId, from, to, tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    if (scope === "employee" && !employeeId) {
      return res
        .status(400)
        .json({ error: "Employee ID required for employee scope" });
    }

    // Parse dates
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    // Validate dates
    if (fromDate && isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: "Invalid from date" });
    }
    if (toDate && isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "Invalid to date" });
    }

    // Set tenant context for RLS
    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);
    if (scope === "employee" && employeeId) {
      await sequelize.query(`SET app.current_employee_id = '${employeeId}'`);
    }

    // Execute queries in parallel
    const [
      kpisResult,
      arAgingResult,
      revenueByEmployeeResult,
      revenueTrendResult,
    ] = await Promise.all([
      // KPIs based on scope
      scope === "employee"
        ? sequelize.query(`SELECT * FROM get_employee_kpis(?, ?, ?, ?)`, {
            replacements: [tenantId, employeeId, fromDate, toDate],
            type: sequelize.QueryTypes.SELECT,
          })
        : sequelize.query(`SELECT * FROM get_company_kpis(?, ?, ?)`, {
            replacements: [tenantId, fromDate, toDate],
            type: sequelize.QueryTypes.SELECT,
          }),

      // AR Aging (company scope only)
      scope === "company"
        ? sequelize.query(`SELECT * FROM get_ar_aging(?, ?, ?)`, {
            replacements: [tenantId, fromDate, toDate],
            type: sequelize.QueryTypes.SELECT,
          })
        : Promise.resolve([
            { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 },
          ]),

      // Revenue by Employee (company scope only)
      scope === "company"
        ? sequelize.query(`SELECT * FROM get_revenue_by_employee(?, ?, ?)`, {
            replacements: [tenantId, fromDate, toDate],
            type: sequelize.QueryTypes.SELECT,
          })
        : Promise.resolve([]),

      // Revenue Trend
      sequelize.query(`SELECT * FROM get_revenue_trend(?, ?, ?)`, {
        replacements: [tenantId, fromDate, toDate],
        type: sequelize.QueryTypes.SELECT,
      }),
    ]);

    // Format response
    const response = {
      scope,
      employeeId: scope === "employee" ? employeeId : null,
      dateRange: {
        from: fromDate?.toISOString().split("T")[0] || null,
        to: toDate?.toISOString().split("T")[0] || null,
      },
      kpis: kpisResult[0] || {},
      arAging: scope === "company" ? arAgingResult[0] || {} : null,
      revenueByEmployee: scope === "company" ? revenueByEmployeeResult : null,
      revenueTrend: revenueTrendResult,
    };

    res.json(response);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// =============================================
// EMPLOYEE LIST FOR DROPDOWN
// =============================================

/**
 * GET /api/dashboard/employees
 * Returns list of employees for dashboard dropdown
 */
router.get("/employees", async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Set tenant context for RLS
    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);

    const employees = await sequelize.query(
      `SELECT 
        id, 
        first_name || ' ' || last_name as name,
        email,
        department,
        title,
        status
       FROM employees 
       WHERE tenant_id = ? AND status = 'active'
       ORDER BY first_name, last_name`,
      {
        replacements: [tenantId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({ employees });
  } catch (error) {
    console.error("Dashboard Employees API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// =============================================
// REFRESH MATERIALIZED VIEW (ADMIN ONLY)
// =============================================

/**
 * POST /api/dashboard/refresh
 * Refreshes the materialized view for better performance
 */
router.post("/refresh", async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await sequelize.query(`SELECT refresh_staffing_daily()`);

    res.json({ message: "Materialized view refreshed successfully" });
  } catch (error) {
    console.error("Refresh Materialized View Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
