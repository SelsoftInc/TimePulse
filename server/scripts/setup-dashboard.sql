-- Setup script for TimePulse Dashboard SQL functions and indexes
-- Run this script to set up the optimized dashboard queries

-- =============================================
-- 1. CREATE SQL FUNCTIONS
-- =============================================

-- Company KPIs function
CREATE OR REPLACE FUNCTION get_company_kpis(
  p_tenant_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_revenue DECIMAL(12,2),
  ar_outstanding DECIMAL(12,2),
  active_employees INTEGER,
  ts_pending INTEGER,
  ts_approved INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH date_filter AS (
    SELECT p_tenant_id AS tenant_id, p_from_date AS from_date, p_to_date AS to_date
  ),
  invoice_window AS (
    SELECT i.*
    FROM invoices i, date_filter d
    WHERE i.tenant_id = d.tenant_id
      AND (d.from_date IS NULL OR i.invoice_date >= d.from_date)
      AND (d.to_date IS NULL OR i.invoice_date <= d.to_date)
  ),
  timesheet_window AS (
    SELECT t.*
    FROM timesheets t, date_filter d
    WHERE t.tenant_id = d.tenant_id
      AND (d.from_date IS NULL OR t.week_end_date >= d.from_date)
      AND (d.to_date IS NULL OR t.week_end_date <= d.to_date)
  ),
  kpis AS (
    SELECT
      -- Company revenue from invoices in the period
      COALESCE(SUM(CASE WHEN iw.payment_status IN ('pending','paid','overdue') THEN iw.total_amount END),0) AS total_revenue,
      -- AR outstanding (not paid)
      COALESCE(SUM(CASE WHEN iw.payment_status IN ('pending','overdue') THEN iw.total_amount END),0) AS ar_outstanding,
      -- Active employees (all time)
      (SELECT COUNT(*) FROM employees e WHERE e.tenant_id = p_tenant_id AND e.status='active') AS active_employees,
      -- Timesheet approvals (in period)
      (SELECT COUNT(*) FROM timesheets tw WHERE tw.tenant_id=p_tenant_id AND tw.status='submitted'
         AND (p_from_date IS NULL OR tw.week_end_date >= p_from_date) 
         AND (p_to_date IS NULL OR tw.week_end_date <= p_to_date)) AS ts_pending,
      (SELECT COUNT(*) FROM timesheets tw WHERE tw.tenant_id=p_tenant_id AND tw.status='approved'
         AND (p_from_date IS NULL OR tw.week_end_date >= p_from_date) 
         AND (p_to_date IS NULL OR tw.week_end_date <= p_to_date)) AS ts_approved
    FROM invoice_window iw
  )
  SELECT * FROM kpis;
END;
$$ LANGUAGE plpgsql;

-- Employee KPIs function
CREATE OR REPLACE FUNCTION get_employee_kpis(
  p_tenant_id UUID,
  p_employee_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_revenue DECIMAL(12,2),
  gross_margin DECIMAL(12,2),
  total_hours DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH date_filter AS (
    SELECT p_tenant_id AS tenant_id, p_from_date AS from_date, p_to_date AS to_date, p_employee_id AS employee_id
  ),
  ts AS (
    SELECT t.employee_id, t.client_id, t.total_hours
    FROM timesheets t, date_filter d
    WHERE t.tenant_id = d.tenant_id
      AND t.employee_id = d.employee_id
      AND t.status IN ('submitted','approved')  -- exclude drafts/rejected from KPIs
      AND (d.from_date IS NULL OR t.week_end_date >= d.from_date)
      AND (d.to_date IS NULL OR t.week_end_date <= d.to_date)
  ),
  joined AS (
    SELECT
      ts.employee_id,
      ts.total_hours,
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
  SELECT
    revenue AS total_revenue,
    (revenue - cost) AS gross_margin,
    hours AS total_hours
  FROM agg;
END;
$$ LANGUAGE plpgsql;

-- AR Aging function
CREATE OR REPLACE FUNCTION get_ar_aging(
  p_tenant_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  current DECIMAL(12,2),
  d1_30 DECIMAL(12,2),
  d31_60 DECIMAL(12,2),
  d61_90 DECIMAL(12,2),
  d90_plus DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH inv AS (
    SELECT i.*
    FROM invoices i
    WHERE i.tenant_id = p_tenant_id
      AND (p_from_date IS NULL OR i.invoice_date >= p_from_date)
      AND (p_to_date IS NULL OR i.invoice_date <= p_to_date)
      AND i.payment_status <> 'paid'
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
  SELECT * FROM b;
END;
$$ LANGUAGE plpgsql;

-- Revenue by Employee function
CREATE OR REPLACE FUNCTION get_revenue_by_employee(
  p_tenant_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  revenue DECIMAL(12,2),
  cost DECIMAL(12,2),
  margin DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH d AS (
    SELECT p_tenant_id AS tenant_id, p_from_date AS from_date, p_to_date AS to_date
  ),
  ts AS (
    SELECT t.employee_id, t.client_id, t.total_hours
    FROM timesheets t, d
    WHERE t.tenant_id = d.tenant_id
      AND t.status IN ('submitted','approved')
      AND (d.from_date IS NULL OR t.week_end_date >= d.from_date)
      AND (d.to_date IS NULL OR t.week_end_date <= d.to_date)
  ),
  joined AS (
    SELECT
      ts.employee_id,
      e.first_name || ' ' || e.last_name AS name,
      COALESCE(c.hourly_rate,0) AS bill_rate,
      COALESCE(e.hourly_rate,0) AS pay_rate,
      ts.total_hours
    FROM ts
    JOIN employees e ON e.id = ts.employee_id
    LEFT JOIN clients c ON c.id = ts.client_id
  )
  SELECT
    employee_id AS id,
    name,
    SUM(total_hours * bill_rate) AS revenue,
    SUM(total_hours * pay_rate) AS cost,
    SUM(total_hours * (bill_rate - pay_rate)) AS margin
  FROM joined
  GROUP BY employee_id, name
  ORDER BY revenue DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Revenue Trend function
CREATE OR REPLACE FUNCTION get_revenue_trend(
  p_tenant_id UUID,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  week_date DATE,
  revenue DECIMAL(12,2),
  margin DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH d AS (
    SELECT p_tenant_id AS tenant_id, p_from_date AS from_date, p_to_date AS to_date
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
      ts.wk,
      ts.total_hours,
      COALESCE(c.hourly_rate,0) AS bill_rate,
      COALESCE(e.hourly_rate,0) AS pay_rate
    FROM ts
    LEFT JOIN clients c ON c.id = ts.client_id
    LEFT JOIN employees e ON e.id = ts.employee_id
  )
  SELECT
    wk AS week_date,
    ROUND(SUM(total_hours * bill_rate)::numeric, 2) AS revenue,
    ROUND(SUM(total_hours * (bill_rate - pay_rate))::numeric, 2) AS margin
  FROM joined
  GROUP BY wk
  ORDER BY wk ASC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. CREATE PERFORMANCE INDEXES
-- =============================================

-- Invoices: due-date heavy queries for AR aging
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_due_status
  ON invoices (tenant_id, due_date, payment_status);

-- Timesheets by end date (for date windows)
CREATE INDEX IF NOT EXISTS idx_timesheets_tenant_week_end
  ON timesheets (tenant_id, week_end_date);

-- Timesheets by employee and status for employee KPIs
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_status
  ON timesheets (tenant_id, employee_id, status, week_end_date);

-- Clients hourly rate for revenue calculations
CREATE INDEX IF NOT EXISTS idx_clients_tenant_rate
  ON clients (tenant_id, hourly_rate);

-- Employees hourly rate for cost calculations
CREATE INDEX IF NOT EXISTS idx_employees_tenant_rate
  ON employees (tenant_id, hourly_rate);

-- =============================================
-- 3. CREATE MATERIALIZED VIEW (OPTIONAL)
-- =============================================

-- Daily rollups by tenant/employee/client
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_staffing_daily AS
WITH base AS (
  SELECT
    t.tenant_id,
    t.employee_id,
    t.client_id,
    t.week_end_date::date AS day,
    t.total_hours
  FROM timesheets t
  WHERE t.status IN ('submitted','approved')
),
joined AS (
  SELECT
    b.*,
    COALESCE(c.hourly_rate,0) AS bill_rate,
    COALESCE(e.hourly_rate,0) AS pay_rate
  FROM base b
  LEFT JOIN clients c ON c.id = b.client_id
  LEFT JOIN employees e ON e.id = b.employee_id
)
SELECT
  tenant_id, employee_id, client_id, day,
  SUM(total_hours) AS hours,
  SUM(total_hours * bill_rate) AS revenue,
  SUM(total_hours * pay_rate) AS cost,
  SUM(total_hours * (bill_rate - pay_rate)) AS margin
FROM joined
GROUP BY tenant_id, employee_id, client_id, day;

-- Indexes for the materialized view
CREATE INDEX IF NOT EXISTS idx_mv_staffing_tenant_day
  ON mv_staffing_daily (tenant_id, day);

CREATE INDEX IF NOT EXISTS idx_mv_staffing_tenant_employee_day
  ON mv_staffing_daily (tenant_id, employee_id, day);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_staffing_daily()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_staffing_daily;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on timesheets if not already enabled
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for timesheets
DROP POLICY IF EXISTS timesheets_tenant_isolation ON timesheets;
CREATE POLICY timesheets_tenant_isolation ON timesheets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Employee self-view policy (for employee scope)
DROP POLICY IF EXISTS timesheets_self ON timesheets;
CREATE POLICY timesheets_self ON timesheets
  USING (employee_id = current_setting('app.current_employee_id')::uuid);

-- Similar policies for other tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employees_tenant_isolation ON employees;
CREATE POLICY employees_tenant_isolation ON employees
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_tenant_isolation ON clients;
CREATE POLICY clients_tenant_isolation ON clients
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_tenant_isolation ON invoices;
CREATE POLICY invoices_tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- =============================================
-- 5. GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions on functions to the application user
GRANT EXECUTE ON FUNCTION get_company_kpis(UUID, DATE, DATE) TO postgres;
GRANT EXECUTE ON FUNCTION get_employee_kpis(UUID, UUID, DATE, DATE) TO postgres;
GRANT EXECUTE ON FUNCTION get_ar_aging(UUID, DATE, DATE) TO postgres;
GRANT EXECUTE ON FUNCTION get_revenue_by_employee(UUID, DATE, DATE) TO postgres;
GRANT EXECUTE ON FUNCTION get_revenue_trend(UUID, DATE, DATE) TO postgres;
GRANT EXECUTE ON FUNCTION refresh_staffing_daily() TO postgres;

-- Grant select permissions on materialized view
GRANT SELECT ON mv_staffing_daily TO postgres;

-- =============================================
-- 6. INITIAL DATA REFRESH
-- =============================================

-- Refresh the materialized view with existing data
SELECT refresh_staffing_daily();

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'TimePulse Dashboard setup completed successfully!';
  RAISE NOTICE 'Created 5 SQL functions for optimized dashboard queries';
  RAISE NOTICE 'Created 5 performance indexes';
  RAISE NOTICE 'Created materialized view for daily rollups';
  RAISE NOTICE 'Set up Row Level Security policies';
  RAISE NOTICE 'Dashboard API is ready to use at /api/dashboard';
END $$;
