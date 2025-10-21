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

module.exports = {
  prisma,
  withTenant,
  withTenantAndEmployee,
  getRevenueByEmployee,
  getCompanyKPIs,
  getEmployeeKPIs,
  getARAging,
  getRevenueTrend,
};
