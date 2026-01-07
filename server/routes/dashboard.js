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

    // If employee scope but no employeeId, show consolidated employee data (all employees)
    // This is similar to company view but from employee perspective

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

    // Log dashboard request details
    console.log('📊 Dashboard API Request:', {
      scope,
      tenantId,
      employeeId: employeeId || 'N/A',
      dateRange: {
        from: fromDate ? fromDate.toISOString().split('T')[0] : 'N/A',
        to: toDate ? toDate.toISOString().split('T')[0] : 'N/A'
      }
    });

    // Set tenant context for RLS
    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);
    if (scope === "employee" && employeeId) {
      await sequelize.query(`SET app.current_employee_id = '${employeeId}'`);
    }

    // Build date filters for different contexts
    let timesheetDateFilter = '';
    if (fromDate) {
      timesheetDateFilter += ` AND week_end >= '${fromDate.toISOString().split("T")[0]}'`;
    }
    if (toDate) {
      timesheetDateFilter += ` AND week_end <= '${toDate.toISOString().split("T")[0]}'`;
    }
    
    let dateFilter = '';
    if (fromDate) {
      dateFilter += ` AND t.week_end >= '${fromDate.toISOString().split("T")[0]}'`;
    }
    if (toDate) {
      dateFilter += ` AND t.week_end <= '${toDate.toISOString().split("T")[0]}'`;
    }

    // Execute queries in parallel
    const [
      kpisResult,
      arAgingResult,
      revenueByEmployeeResult,
      revenueTrendResult,
    ] = await Promise.all([
      // KPIs based on scope - Direct SQL queries
      scope === "employee"
        ? sequelize.query(
            `
            SELECT
              COALESCE(SUM(CASE WHEN t.status IN ('submitted','approved') THEN t.total_hours * COALESCE(c.hourly_rate,0) END), 0) AS total_revenue,
              COALESCE(SUM(CASE WHEN t.status IN ('submitted','approved') THEN t.total_hours * (COALESCE(c.hourly_rate,0) - COALESCE(e.hourly_rate,0)) END), 0) AS gross_margin,
              COALESCE(SUM(CASE WHEN t.status IN ('submitted','approved') THEN t.total_hours END), 0) AS total_hours,
              COUNT(CASE WHEN t.status = 'submitted' THEN 1 END) AS ts_pending,
              COUNT(CASE WHEN t.status = 'approved' THEN 1 END) AS ts_approved,
              (SELECT COUNT(*) FROM employees WHERE tenant_id = '${tenantId}' AND status = 'active') AS active_employees
            FROM timesheets t
            LEFT JOIN clients c ON c.id = t.client_id
            LEFT JOIN employees e ON e.id = t.employee_id
            WHERE t.tenant_id = '${tenantId}'
              ${employeeId ? `AND t.employee_id = '${employeeId}'` : ''}
              ${dateFilter}
            `,
            {
              type: sequelize.QueryTypes.SELECT,
            }
          )
        : sequelize.query(
            `
            WITH current_month_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN i.payment_status IN ('pending','paid','overdue') THEN i.total_amount END), 0) AS revenue
              FROM invoices i
              WHERE i.tenant_id = '${tenantId}'
                AND i.payment_status IN ('pending','paid','overdue')
                ${fromDate ? `AND i.invoice_date >= '${fromDate.toISOString().split("T")[0]}'` : ''}
                ${toDate ? `AND i.invoice_date <= '${toDate.toISOString().split("T")[0]}'` : ''}
            ),
            last_month_data AS (
              SELECT 
                COALESCE(SUM(CASE WHEN i.payment_status IN ('pending','paid','overdue') THEN i.total_amount END), 0) AS revenue
              FROM invoices i
              WHERE i.tenant_id = '${tenantId}'
                AND i.payment_status IN ('pending','paid','overdue')
                AND DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', ${fromDate ? `DATE '${fromDate.toISOString().split("T")[0]}'` : 'CURRENT_DATE'} - INTERVAL '1 month')
            ),
            all_invoices AS (
              SELECT 
                COALESCE(SUM(CASE WHEN payment_status IN ('pending','paid','overdue') THEN total_amount END), 0) AS total_revenue,
                COALESCE(SUM(CASE WHEN payment_status IN ('pending','overdue') THEN total_amount END), 0) AS ar_outstanding
              FROM invoices
              WHERE tenant_id = '${tenantId}'
            )
            SELECT
              cmd.revenue AS current_month_revenue,
              lmd.revenue AS last_month_revenue,
              ai.total_revenue,
              ai.ar_outstanding,
              (SELECT COUNT(*) FROM employees WHERE tenant_id = '${tenantId}' AND status = 'active') AS active_employees,
              (SELECT COUNT(*) FROM timesheets WHERE tenant_id = '${tenantId}' AND status = 'submitted' ${timesheetDateFilter}) AS ts_pending,
              (SELECT COUNT(*) FROM timesheets WHERE tenant_id = '${tenantId}' AND status = 'approved' ${timesheetDateFilter}) AS ts_approved
            FROM current_month_data cmd, last_month_data lmd, all_invoices ai
            `,
            {
              type: sequelize.QueryTypes.SELECT,
            }
          ),

      // AR Aging (company scope only) - Direct SQL
      scope === "company"
        ? sequelize.query(
            `
            SELECT
              SUM(CASE WHEN CURRENT_DATE <= due_date THEN total_amount ELSE 0 END) AS current,
              SUM(CASE WHEN CURRENT_DATE > due_date AND CURRENT_DATE <= due_date + INTERVAL '30 day' THEN total_amount ELSE 0 END) AS d1_30,
              SUM(CASE WHEN CURRENT_DATE > due_date + INTERVAL '30 day' AND CURRENT_DATE <= due_date + INTERVAL '60 day' THEN total_amount ELSE 0 END) AS d31_60,
              SUM(CASE WHEN CURRENT_DATE > due_date + INTERVAL '60 day' AND CURRENT_DATE <= due_date + INTERVAL '90 day' THEN total_amount ELSE 0 END) AS d61_90,
              SUM(CASE WHEN CURRENT_DATE > due_date + INTERVAL '90 day' THEN total_amount ELSE 0 END) AS d90_plus
            FROM invoices
            WHERE tenant_id = '${tenantId}'
              AND payment_status <> 'paid'
              ${fromDate ? `AND invoice_date >= '${fromDate.toISOString().split("T")[0]}'` : ''}
              ${toDate ? `AND invoice_date <= '${toDate.toISOString().split("T")[0]}'` : ''}
            `,
            {
              type: sequelize.QueryTypes.SELECT,
            }
          )
        : Promise.resolve([
            { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 },
          ]),

      // Revenue by Employee (company scope only) - Direct SQL
      scope === "company"
        ? sequelize.query(
            `
            SELECT
              e.id,
              e.first_name || ' ' || e.last_name AS name,
              SUM(t.total_hours * COALESCE(c.hourly_rate, 0)) AS revenue,
              SUM(t.total_hours * COALESCE(e.hourly_rate, 0)) AS cost,
              SUM(t.total_hours * (COALESCE(c.hourly_rate, 0) - COALESCE(e.hourly_rate, 0))) AS margin
            FROM timesheets t
            JOIN employees e ON e.id = t.employee_id
            LEFT JOIN clients c ON c.id = t.client_id
            WHERE t.tenant_id = '${tenantId}'
              AND t.status IN ('submitted', 'approved')
              ${dateFilter}
            GROUP BY e.id, e.first_name, e.last_name
            ORDER BY revenue DESC
            LIMIT 50
            `,
            {
              type: sequelize.QueryTypes.SELECT,
            }
          )
        : Promise.resolve([]),

      // Revenue Trend - Direct SQL
      sequelize.query(
        `
        SELECT
          DATE_TRUNC('week', t.week_end)::date AS week_date,
          ROUND(SUM(t.total_hours * COALESCE(c.hourly_rate, 0))::numeric, 2) AS revenue,
          ROUND(SUM(t.total_hours * (COALESCE(c.hourly_rate, 0) - COALESCE(e.hourly_rate, 0)))::numeric, 2) AS margin
        FROM timesheets t
        LEFT JOIN clients c ON c.id = t.client_id
        LEFT JOIN employees e ON e.id = t.employee_id
        WHERE t.tenant_id = '${tenantId}'
          AND t.status IN ('submitted', 'approved')
          ${dateFilter}
        GROUP BY DATE_TRUNC('week', t.week_end)
        ORDER BY week_date ASC
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      ),
    ]);

    // Helper function to convert BigInt and Decimal to numbers
    const convertToNumber = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (Array.isArray(obj)) {
        return obj.map(item => convertToNumber(item));
      }
      if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'bigint') {
            converted[key] = Number(value);
          } else if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
            converted[key] = parseFloat(value.toString());
          } else if (typeof value === 'object') {
            converted[key] = convertToNumber(value);
          } else {
            converted[key] = value;
          }
        }
        return converted;
      }
      return obj;
    };

    // Log calculated KPIs for debugging
    const kpisData = convertToNumber(kpisResult[0] || {});
    if (scope === "company") {
      console.log('💰 Revenue Breakdown:', {
        currentMonthRevenue: kpisData.current_month_revenue || 0,
        lastMonthRevenue: kpisData.last_month_revenue || 0,
        totalRevenue: kpisData.total_revenue || 0,
        outstanding: kpisData.ar_outstanding || 0
      });
    }

    // Format response with type conversion
    const response = {
      scope,
      employeeId: scope === "employee" ? employeeId : null,
      dateRange: {
        from: fromDate?.toISOString().split("T")[0] || null,
        to: toDate?.toISOString().split("T")[0] || null,
      },
      kpis: kpisData,
      arAging: scope === "company" ? convertToNumber(arAgingResult[0] || {}) : null,
      revenueByEmployee: scope === "company" ? convertToNumber(revenueByEmployeeResult) : null,
      revenueTrend: convertToNumber(revenueTrendResult),
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
       WHERE tenant_id = '${tenantId}' AND status = 'active'
       ORDER BY first_name, last_name`,
      {
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
