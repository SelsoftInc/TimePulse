const { PrismaClient, Prisma } = require("@prisma/client");

// Create a single instance of PrismaClient
const prisma = new PrismaClient({
  // Good defaults for pooled connections
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["query", "info", "warn", "error"],
});

// Helper function to set tenant context for RLS
async function withTenant(tenantId, run) {
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
  try {
    return await run();
  } finally {
    // Nothing needed - pooled connections are reused
  }
}

// Helper function to set both tenant and employee context
async function withTenantAndEmployee(tenantId, employeeId, run) {
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
  if (employeeId) {
    await prisma.$executeRaw`SELECT set_config('app.current_employee_id', ${employeeId}, true)`;
  }
  try {
    return await run();
  } finally {
    // Nothing needed - pooled connections are reused
  }
}

// Dashboard query functions using Prisma raw SQL
async function getRevenueByEmployee(tenantId, from, to) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const whereClause = Prisma.sql`
    WHERE t.tenant_id = ${tenantId}::uuid
      AND t.status IN ('submitted','approved')
      ${
        fromDate ? Prisma.sql`AND t.week_end_date >= ${fromDate}` : Prisma.empty
      }
      ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
      ${toDate ? Prisma.sql`t.week_end_date <= ${toDate}` : Prisma.empty}
  `;

  const query = Prisma.sql`
    WITH ts AS (
      SELECT t.employee_id, t.client_id, t.total_hours
      FROM timesheets t
      ${whereClause}
    )
    SELECT
      e.id,
      e.first_name || ' ' || e.last_name AS name,
      SUM(ts.total_hours * COALESCE(c.hourly_rate,0)) AS revenue,
      SUM(ts.total_hours * COALESCE(e.hourly_rate,0))  AS cost,
      SUM(ts.total_hours * (COALESCE(c.hourly_rate,0) - COALESCE(e.hourly_rate,0))) AS margin
    FROM ts
    JOIN employees e ON e.id = ts.employee_id
    LEFT JOIN clients   c ON c.id = ts.client_id
    GROUP BY e.id, name
    ORDER BY revenue DESC
    LIMIT 50
  `;

  return prisma.$queryRaw(query);
}

async function getCompanyKPIs(tenantId, from, to) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const invoiceWhereClause = Prisma.sql`
    WHERE i.tenant_id = ${tenantId}::uuid
      ${fromDate ? Prisma.sql`AND i.invoice_date >= ${fromDate}` : Prisma.empty}
      ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
      ${toDate ? Prisma.sql`i.invoice_date <= ${toDate}` : Prisma.empty}
  `;

  const timesheetWhereClause = Prisma.sql`
    WHERE t.tenant_id = ${tenantId}::uuid
      ${
        fromDate ? Prisma.sql`AND t.week_end_date >= ${fromDate}` : Prisma.empty
      }
      ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
      ${toDate ? Prisma.sql`t.week_end_date <= ${toDate}` : Prisma.empty}
  `;

  const query = Prisma.sql`
    WITH invoice_window AS (
      SELECT i.*
      FROM invoices i
      ${invoiceWhereClause}
    ),
    timesheet_window AS (
      SELECT t.*
      FROM timesheets t
      ${timesheetWhereClause}
    ),
    kpis AS (
      SELECT
        -- Company revenue from invoices in the period
        COALESCE(SUM(CASE WHEN iw.payment_status IN ('pending','paid','overdue') THEN iw.total_amount END),0) AS total_revenue,
        -- AR outstanding (not paid)
        COALESCE(SUM(CASE WHEN iw.payment_status IN ('pending','overdue') THEN iw.total_amount END),0) AS ar_outstanding,
        -- Active employees (all time)
        (SELECT COUNT(*) FROM employees e WHERE e.tenant_id = ${tenantId}::uuid AND e.status='active') AS active_employees,
        -- Timesheet approvals (in period)
        (SELECT COUNT(*) FROM timesheets tw WHERE tw.tenant_id=${tenantId}::uuid AND tw.status='submitted' 
         ${
           fromDate
             ? Prisma.sql`AND tw.week_end_date >= ${fromDate}`
             : Prisma.empty
         }
         ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
         ${
           toDate ? Prisma.sql`tw.week_end_date <= ${toDate}` : Prisma.empty
         }) AS ts_pending,
        (SELECT COUNT(*) FROM timesheets tw WHERE tw.tenant_id=${tenantId}::uuid AND tw.status='approved'
         ${
           fromDate
             ? Prisma.sql`AND tw.week_end_date >= ${fromDate}`
             : Prisma.empty
         }
         ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
         ${
           toDate ? Prisma.sql`tw.week_end_date <= ${toDate}` : Prisma.empty
         }) AS ts_approved
      FROM invoice_window iw
    )
    SELECT * FROM kpis
  `;

  return prisma.$queryRaw(query);
}

async function getEmployeeKPIs(tenantId, employeeId, from, to) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const whereClause = Prisma.sql`
    WHERE t.tenant_id = ${tenantId}::uuid
      AND t.employee_id = ${employeeId}::uuid
      AND t.status IN ('submitted','approved')
      ${
        fromDate ? Prisma.sql`AND t.week_end_date >= ${fromDate}` : Prisma.empty
      }
      ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
      ${toDate ? Prisma.sql`t.week_end_date <= ${toDate}` : Prisma.empty}
  `;

  const query = Prisma.sql`
    WITH ts AS (
      SELECT t.employee_id, t.client_id, t.total_hours
      FROM timesheets t
      ${whereClause}
    ),
    joined AS (
      SELECT ts.employee_id, ts.total_hours,
             c.hourly_rate AS bill_rate,
             e.hourly_rate AS pay_rate
      FROM ts
      JOIN employees e ON e.id = ts.employee_id
      LEFT JOIN clients c ON c.id = ts.client_id
    ),
    agg AS (
      SELECT
        COALESCE(SUM(total_hours * COALESCE(bill_rate,0)),0) AS revenue,
        COALESCE(SUM(total_hours * COALESCE(pay_rate,0)),0) AS cost,
        COALESCE(SUM(total_hours),0) AS hours
      FROM joined
    )
    SELECT revenue AS total_revenue, (revenue - cost) AS gross_margin, hours AS total_hours FROM agg
  `;

  return prisma.$queryRaw(query);
}

async function getARAging(tenantId, from, to) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const whereClause = Prisma.sql`
    WHERE i.tenant_id = ${tenantId}::uuid
      AND i.payment_status <> 'paid'
      ${fromDate ? Prisma.sql`AND i.invoice_date >= ${fromDate}` : Prisma.empty}
      ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
      ${toDate ? Prisma.sql`i.invoice_date <= ${toDate}` : Prisma.empty}
  `;

  const query = Prisma.sql`
    WITH inv AS (
      SELECT i.*
      FROM invoices i
      ${whereClause}
    ),
    b AS (
      SELECT
        SUM(CASE WHEN CURRENT_DATE <= due_date THEN total_amount ELSE 0 END) AS current,
        SUM(CASE WHEN CURRENT_DATE > due_date AND CURRENT_DATE <= due_date + INTERVAL '30 day' THEN total_amount ELSE 0 END) AS d1_30,
        SUM(CASE WHEN CURRENT_DATE > due_date + INTERVAL '30 day' AND CURRENT_DATE <= due_date + INTERVAL '60 day' THEN total_amount ELSE 0 END) AS d31_60,
        SUM(CASE WHEN CURRENT_DATE > due_date + INTERVAL '60 day' AND CURRENT_DATE <= due_date + INTERVAL '90 day' THEN total_amount ELSE 0 END) AS d61_90,
        SUM(CASE WHEN CURRENT_DATE > due_date + INTERVAL '90 day' THEN total_amount ELSE 0 END) AS d90_plus
      FROM inv
    )
    SELECT * FROM b
  `;

  return prisma.$queryRaw(query);
}

async function getRevenueTrend(tenantId, from, to) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const whereClause = Prisma.sql`
    WHERE t.tenant_id = ${tenantId}::uuid
      AND t.status IN ('submitted','approved')
      ${
        fromDate ? Prisma.sql`AND t.week_end_date >= ${fromDate}` : Prisma.empty
      }
      ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
      ${toDate ? Prisma.sql`t.week_end_date <= ${toDate}` : Prisma.empty}
  `;

  const query = Prisma.sql`
    WITH d AS (
      SELECT ${tenantId}::uuid tenant_id, ${fromDate}::date from_date, ${toDate}::date to_date
    ),
    ts AS (
      SELECT DATE_TRUNC('week', t.week_end_date)::date AS wk,
             t.client_id, t.employee_id, t.total_hours
      FROM timesheets t, d
      WHERE t.tenant_id = d.tenant_id
        AND t.status IN ('submitted','approved')
        AND (d.from_date IS NULL OR t.week_end_date >= d.from_date)
        AND (d.to_date IS NULL OR t.week_end_date <= d.to_date)
    ),
    joined AS (
      SELECT
        ts.wk::text AS week_date,
        ts.total_hours,
        COALESCE(c.hourly_rate,0) AS bill_rate,
        COALESCE(e.hourly_rate,0) AS pay_rate
      FROM ts
      LEFT JOIN clients   c ON c.id = ts.client_id
      LEFT JOIN employees e ON e.id = ts.employee_id
    )
    SELECT
      week_date,
      ROUND(SUM(total_hours * bill_rate)::numeric, 2) AS revenue,
      ROUND(SUM(total_hours * (bill_rate - pay_rate))::numeric, 2) AS margin
    FROM joined
    GROUP BY week_date
    ORDER BY week_date ASC
  `;

  return prisma.$queryRaw(query);
}

// Get Recent Activity (timesheets, invoices, leave requests)
async function getRecentActivity(tenantId, limit = 10) {
  const query = Prisma.sql`
    WITH timesheet_activity AS (
      SELECT 
        t.id,
        'timesheet' AS activity_type,
        e.first_name || ' ' || e.last_name AS employee_name,
        t.status,
        t.created_at,
        t.total_hours,
        c.client_name
      FROM timesheets t
      JOIN employees e ON e.id = t.employee_id
      LEFT JOIN clients c ON c.id = t.client_id
      WHERE t.tenant_id = ${tenantId}::uuid
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
      WHERE lr.tenant_id = ${tenantId}::uuid
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

  return prisma.$queryRaw(query);
}

// Get Top Performers by hours worked
async function getTopPerformers(tenantId, from, to, limit = 5) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const whereClause = Prisma.sql`
    WHERE t.tenant_id = ${tenantId}::uuid
      AND t.status = 'approved'
      ${
        fromDate ? Prisma.sql`AND t.week_end_date >= ${fromDate}` : Prisma.empty
      }
      ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
      ${toDate ? Prisma.sql`t.week_end_date <= ${toDate}` : Prisma.empty}
  `;

  const query = Prisma.sql`
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
    ${whereClause}
    GROUP BY e.id, e.first_name, e.last_name, e.email, e.department
    ORDER BY total_hours DESC
    LIMIT ${limit}
  `;

  return prisma.$queryRaw(query);
}

// Get Revenue by Client
async function getRevenueByClient(tenantId, from, to, limit = 5) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const whereClause = Prisma.sql`
    WHERE i.tenant_id = ${tenantId}::uuid
      AND i.payment_status IN ('pending', 'paid', 'overdue')
      ${fromDate ? Prisma.sql`AND i.invoice_date >= ${fromDate}` : Prisma.empty}
      ${fromDate && toDate ? Prisma.sql`AND` : Prisma.empty}
      ${toDate ? Prisma.sql`i.invoice_date <= ${toDate}` : Prisma.empty}
  `;

  const query = Prisma.sql`
    SELECT
      c.id,
      c.client_name,
      c.email,
      c.company,
      COALESCE(SUM(i.total_amount), 0) AS total_revenue,
      COUNT(i.id) AS invoice_count
    FROM invoices i
    JOIN clients c ON c.id = i.client_id
    ${whereClause}
    GROUP BY c.id, c.client_name, c.email, c.company
    ORDER BY total_revenue DESC
    LIMIT ${limit}
  `;

  return prisma.$queryRaw(query);
}

// Get Monthly Revenue Trend (last 12 months)
async function getMonthlyRevenueTrend(tenantId) {
  const query = Prisma.sql`
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
      WHERE i.tenant_id = ${tenantId}::uuid
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

  return prisma.$queryRaw(query);
}

module.exports = {
  prisma,
  withTenant,
  withTenantAndEmployee,
  getRevenueByEmployee,
  getCompanyKPIs,
  getEmployeeKPIs,
  getARAging,
  getRevenueTrend,
  getRecentActivity,
  getTopPerformers,
  getRevenueByClient,
  getMonthlyRevenueTrend,
};
