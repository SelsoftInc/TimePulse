/**
 * Extended Dashboard API Routes
 * Additional endpoints for Recent Activity, Top Performers, Revenue by Client, Monthly Trend
 */

const express = require("express");
const { sequelize } = require("../models");
const DataEncryptionService = require("../services/DataEncryptionService");
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

    console.log('📋 Fetching Recent Activity for tenant:', tenantId);

    const query = `
      WITH timesheet_activity AS (
        SELECT 
          t.id,
          'timesheet' AS activity_type,
          COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS employee_name,
          t.status,
          t.updated_at AS created_at,
          t.total_hours,
          c.client_name AS client_name
        FROM timesheets t
        LEFT JOIN employees e ON e.id = t.employee_id
        LEFT JOIN users u ON u.id = e.user_id
        LEFT JOIN clients c ON c.id = t.client_id
        WHERE t.tenant_id = '${tenantId}'
          AND t.status IN ('submitted', 'approved', 'rejected')
        ORDER BY t.updated_at DESC
        LIMIT ${limit}
      ),
      leave_activity AS (
        SELECT 
          lr.id,
          'leave' AS activity_type,
          COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS employee_name,
          lr.status,
          lr.created_at,
          lr.total_days AS total_hours,
          lr.leave_type AS client_name
        FROM leave_requests lr
        LEFT JOIN employees e ON e.id = lr.employee_id
        LEFT JOIN users u ON u.id = e.user_id
        WHERE lr.tenant_id = '${tenantId}'
          AND lr.status IN ('pending', 'approved', 'rejected')
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

    console.log(`📊 Found ${activities.length} activities`);
    if (activities.length > 0) {
      console.log('📋 Activities breakdown:');
      const timesheetActivities = activities.filter(a => a.activity_type === 'timesheet');
      const leaveActivities = activities.filter(a => a.activity_type === 'leave');
      console.log(`   - Timesheets: ${timesheetActivities.length}`);
      console.log(`   - Leave Requests: ${leaveActivities.length}`);
      console.log('📋 Sample activity:', activities[0]);
      if (leaveActivities.length > 0) {
        console.log('📋 Sample leave activity:', leaveActivities[0]);
      }
    } else {
      console.log('⚠️  No activities found - checking data:');
      // Check if there are any timesheets
      const timesheetCount = await sequelize.query(
        `SELECT COUNT(*) as count FROM timesheets WHERE tenant_id = '${tenantId}'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log('   Total timesheets:', timesheetCount[0]?.count || 0);
      
      const submittedCount = await sequelize.query(
        `SELECT COUNT(*) as count FROM timesheets WHERE tenant_id = '${tenantId}' AND status IN ('submitted', 'approved', 'rejected')`,
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log('   Timesheets with activity status:', submittedCount[0]?.count || 0);
      
      const leaveCount = await sequelize.query(
        `SELECT COUNT(*) as count FROM leave_requests WHERE tenant_id = '${tenantId}'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log('   Total leave requests:', leaveCount[0]?.count || 0);
      
      const pendingLeaveCount = await sequelize.query(
        `SELECT COUNT(*) as count FROM leave_requests WHERE tenant_id = '${tenantId}' AND status IN ('pending', 'approved', 'rejected')`,
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log('   Leave requests with activity status:', pendingLeaveCount[0]?.count || 0);
    }

    // Decrypt employee names
    const decryptedActivities = activities.map(activity => {
      if (activity.employee_name && activity.employee_name !== 'Unknown') {
        try {
          // Try to decrypt the name parts
          const nameParts = activity.employee_name.split(' ');
          if (nameParts.length >= 2) {
            const decryptedFirstName = DataEncryptionService.decryptEmployeeData({ firstName: nameParts[0] }).firstName || nameParts[0];
            const decryptedLastName = DataEncryptionService.decryptEmployeeData({ lastName: nameParts.slice(1).join(' ') }).lastName || nameParts.slice(1).join(' ');
            activity.employee_name = `${decryptedFirstName} ${decryptedLastName}`.trim();
          }
        } catch (err) {
          // If decryption fails, keep original name
          console.log('Decryption skipped for:', activity.employee_name);
        }
      }
      return activity;
    });

    res.json({ activities: convertToNumber(decryptedActivities) });
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

    // Decrypt employee data
    const decryptedPerformers = performers.map(performer => {
      const decryptedData = DataEncryptionService.decryptEmployeeData({
        firstName: performer.first_name,
        lastName: performer.last_name,
        email: performer.email
      });
      return {
        ...performer,
        first_name: decryptedData.firstName || performer.first_name,
        last_name: decryptedData.lastName || performer.last_name,
        name: `${decryptedData.firstName || performer.first_name} ${decryptedData.lastName || performer.last_name}`,
        email: decryptedData.email || performer.email
      };
    });

    res.json({ performers: convertToNumber(decryptedPerformers) });
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
    const { tenantId, from, to, limit = 100, employeeId, scope } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);

    // Default to current month if no date range provided
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const fromDate = from ? new Date(from) : currentMonthStart;
    const toDate = to ? new Date(to) : currentMonthEnd;

    let dateFilter = "";
    if (fromDate) {
      dateFilter += ` AND i.invoice_date >= '${fromDate.toISOString().split("T")[0]}'`;
    }
    if (toDate) {
      dateFilter += ` AND i.invoice_date <= '${toDate.toISOString().split("T")[0]}'`;
    }
    
    console.log('📊 Revenue by Client - Date Filter:', {
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
      isCurrentMonth: !from && !to
    });

    // Add employee filter for employee scope
    let employeeFilter = "";
    if (scope === 'employee' && employeeId) {
      employeeFilter = `
        AND EXISTS (
          SELECT 1 FROM timesheets t 
          WHERE t.client_id = c.id 
          AND t.employee_id = '${employeeId}'
          AND t.tenant_id = '${tenantId}'
        )`;
    }

    // Build query to show all active clients including those with $0 revenue
    const query = `
      SELECT
        c.id,
        c.client_name AS client_name,
        c.email,
        c.legal_name AS company,
        COALESCE(SUM(CASE 
          WHEN i.payment_status IN ('pending', 'paid', 'overdue')
            ${dateFilter}
          THEN i.total_amount 
          ELSE 0 
        END), 0) AS total_revenue,
        COUNT(CASE 
          WHEN i.payment_status IN ('pending', 'paid', 'overdue')
            ${dateFilter}
          THEN i.id 
        END) AS invoice_count
      FROM clients c
      LEFT JOIN invoices i ON i.client_id = c.id AND i.tenant_id = '${tenantId}'
      WHERE c.tenant_id = '${tenantId}'
        AND c.status = 'active'
        ${scope === 'employee' && employeeId ? `
        AND EXISTS (
          SELECT 1 FROM timesheets t 
          WHERE t.client_id = c.id 
          AND t.employee_id = '${employeeId}'
          AND t.tenant_id = '${tenantId}'
        )` : ''}
      GROUP BY c.id, c.client_name, c.email, c.legal_name
      ORDER BY total_revenue DESC, c.client_name ASC
      LIMIT ${limit}
    `;

    const clients = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    console.log(`📊 Revenue by Client - Found ${clients.length} active clients`);
    if (clients.length > 0) {
      console.log('📋 Sample clients:', clients.slice(0, 3).map(c => ({
        name: c.client_name,
        revenue: c.total_revenue
      })));
    }

    // Decrypt client names and emails
    const decryptedClients = clients.map(client => {
      const decryptedData = DataEncryptionService.decryptClientData({
        clientName: client.client_name,
        email: client.email,
        legalName: client.company
      });
      return {
        ...client,
        client_name: decryptedData.clientName || client.client_name,
        email: decryptedData.email || client.email,
        company: decryptedData.legalName || client.company
      };
    });

    res.json({ clients: convertToNumber(decryptedClients) });
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
    const { tenantId, employeeId, scope } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    await sequelize.query(`SET app.current_tenant_id = '${tenantId}'`);

    // For employee scope, calculate revenue based on employee's timesheets
    let query;
    if (scope === 'employee' && employeeId) {
      query = `
        WITH months AS (
          SELECT 
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months' + (n || ' months')::INTERVAL)::date AS month_start
          FROM generate_series(0, 11) AS n
        ),
        monthly_revenue AS (
          SELECT 
            DATE_TRUNC('month', t.week_end)::date AS month_start,
            SUM(t.total_hours * COALESCE(c.hourly_rate, 0)) AS revenue
          FROM timesheets t
          LEFT JOIN clients c ON c.id = t.client_id
          WHERE t.tenant_id = '${tenantId}'
            AND t.employee_id = '${employeeId}'
            AND t.status = 'approved'
            AND t.week_end >= CURRENT_DATE - INTERVAL '11 months'
          GROUP BY DATE_TRUNC('month', t.week_end)
        )
        SELECT 
          TO_CHAR(m.month_start, 'Mon') AS month_label,
          COALESCE(mr.revenue, 0) AS revenue
        FROM months m
        LEFT JOIN monthly_revenue mr ON m.month_start = mr.month_start
        ORDER BY m.month_start ASC
      `;
    } else {
      // Company scope - show all revenue
      query = `
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
    }

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
        first_name,
        last_name,
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

    // Decrypt employee names
    const decryptedEmployees = employees.map(emp => {
      const decryptedFirstName = emp.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: emp.first_name }).firstName : '';
      const decryptedLastName = emp.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: emp.last_name }).lastName : '';
      return {
        ...emp,
        firstName: decryptedFirstName,
        lastName: decryptedLastName,
        name: `${decryptedFirstName} ${decryptedLastName}`.trim()
      };
    });

    res.json({ employees: convertToNumber(decryptedEmployees) });
  } catch (error) {
    console.error("Dashboard Employees API Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
