/**
 * Extended Dashboard API Routes
 * Additional endpoints for Recent Activity, Top Performers, Revenue by Client, Monthly Trend
 */

const express = require("express");
const { sequelize } = require("../models");
const router = express.Router();

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

// GET /api/dashboard-extended/recent-activity
router.get("/recent-activity", async (req, res) => {
  try {
    const { tenantId, limit = 10 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);

    const query = `
      WITH timesheet_activity AS (
        SELECT 
          t.id,
          'timesheet' AS activity_type,
          COALESCE(e.first_name || ' ' || e.last_name, 'Unknown') AS employee_name,
          t.status,
          t.created_at,
          t.total_hours,
          c.client_name AS client_name
        FROM timesheets t
        LEFT JOIN employees e ON e.id = t.employee_id
        LEFT JOIN clients c ON c.id = t.client_id
        WHERE t.tenant_id = '${tenantId}'
        ORDER BY t.created_at DESC
        LIMIT ${limit}
      ),
      leave_activity AS (
        SELECT 
          lr.id,
          'leave' AS activity_type,
          lr.employee_name,
          lr.status,
          lr.created_at,
          NULL::numeric AS total_hours,
          lr.leave_type AS client_name
        FROM leave_requests lr
        WHERE lr.tenant_id = '${tenantId}'
        ORDER BY lr.created_at DESC
        LIMIT ${limit}
      ),
      combined AS (
        SELECT * FROM timesheet_activity
        UNION ALL
        SELECT * FROM leave_activity
      )
      SELECT * FROM combined
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const activities = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({ activities: convertToNumber(activities) });
  } catch (error) {
    console.error("Recent Activity API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/dashboard-extended/top-performers
router.get("/top-performers", async (req, res) => {
  try {
    const { tenantId, from, to, limit = 5 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    let dateFilter = "";
    if (fromDate) {
      dateFilter += ` AND t.week_end >= '${fromDate.toISOString().split("T")[0]}'`;
    }
    if (toDate) {
      dateFilter += ` AND t.week_end <= '${toDate.toISOString().split("T")[0]}'`;
    }

    const query = `
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        e.first_name || ' ' || e.last_name AS name,
        e.email,
        e.department,
        COALESCE(SUM(t.total_hours), 0) AS total_hours,
        COALESCE(SUM(t.total_hours * COALESCE(c.hourly_rate, 0)), 0) AS revenue_generated
      FROM timesheets t
      JOIN employees e ON e.id = t.employee_id
      LEFT JOIN clients c ON c.id = t.client_id
      WHERE t.tenant_id = '${tenantId}'
        AND t.status = 'approved'
        ${dateFilter}
      GROUP BY e.id, e.first_name, e.last_name, e.email, e.department
      ORDER BY total_hours DESC
      LIMIT ${limit}
    `;

    const performers = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({ performers: convertToNumber(performers) });
  } catch (error) {
    console.error("Top Performers API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/dashboard-extended/revenue-by-client
router.get("/revenue-by-client", async (req, res) => {
  try {
    const { tenantId, from, to, limit = 5 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    let dateFilter = "";
    if (fromDate) {
      dateFilter += ` AND i.invoice_date >= '${fromDate.toISOString().split("T")[0]}'`;
    }
    if (toDate) {
      dateFilter += ` AND i.invoice_date <= '${toDate.toISOString().split("T")[0]}'`;
    }

    const query = `
      SELECT
        c.id,
        c.client_name AS client_name,
        c.email,
        c.legal_name AS company,
        COALESCE(SUM(i.total_amount), 0) AS total_revenue,
        COUNT(i.id) AS invoice_count
      FROM invoices i
      JOIN clients c ON c.id = i.client_id
      WHERE i.tenant_id = '${tenantId}'
        AND i.payment_status IN ('pending', 'paid', 'overdue')
        ${dateFilter}
      GROUP BY c.id, c.client_name, c.email, c.legal_name
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `;

    const clients = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({ clients: convertToNumber(clients) });
  } catch (error) {
    console.error("Revenue by Client API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/dashboard-extended/monthly-revenue-trend
router.get("/monthly-revenue-trend", async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);

    const query = `
      WITH months AS (
        SELECT 
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months' + (n || ' months')::INTERVAL)::date AS month_start
        FROM generate_series(0, 11) AS n
      ),
      monthly_revenue AS (
        SELECT 
          DATE_TRUNC('month', i.invoice_date)::date AS month_start,
          SUM(i.total_amount) AS revenue
        FROM invoices i
        WHERE i.tenant_id = '${tenantId}'
          AND i.payment_status IN ('pending', 'paid', 'overdue')
          AND i.invoice_date >= CURRENT_DATE - INTERVAL '11 months'
        GROUP BY DATE_TRUNC('month', i.invoice_date)
      )
      SELECT 
        TO_CHAR(m.month_start, 'Mon') AS month_label,
        COALESCE(mr.revenue, 0) AS revenue
      FROM months m
      LEFT JOIN monthly_revenue mr ON m.month_start = mr.month_start
      ORDER BY m.month_start ASC
    `;

    const trend = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({ trend: convertToNumber(trend) });
  } catch (error) {
    console.error("Monthly Revenue Trend API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/dashboard-extended/employees - Get employees for dropdown
router.get("/employees", async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);

    const query = `
      SELECT
        id,
        first_name || ' ' || last_name AS name,
        email,
        department,
        title,
        status
      FROM employees
      WHERE tenant_id = '${tenantId}'
        AND status = 'active'
      ORDER BY first_name ASC, last_name ASC
    `;

    const employees = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({ employees: convertToNumber(employees) });
  } catch (error) {
    console.error("Dashboard Employees API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
