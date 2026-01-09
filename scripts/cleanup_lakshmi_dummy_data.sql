-- Script to identify and remove dummy data for Lakshmi Priya employee
-- This script will help identify test/dummy data that should be removed

-- Step 1: Find Lakshmi Priya employee ID
-- Replace 'your-tenant-id' with actual tenant ID from the system

-- First, let's identify the employee
SELECT id, first_name, last_name, email, tenant_id
FROM employees
WHERE LOWER(first_name) LIKE '%lakshmi%'
   OR LOWER(last_name) LIKE '%priya%'
   OR LOWER(email) LIKE '%lakshmi%';

-- Step 2: Check timesheets for this employee
-- This will show us which clients/vendors are associated
SELECT 
    t.id as timesheet_id,
    t.employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    t.client_id,
    c.client_name,
    t.vendor_id,
    v.name as vendor_name,
    t.week_start,
    t.week_end,
    t.total_hours,
    t.status,
    t.created_at
FROM timesheets t
LEFT JOIN employees e ON e.id = t.employee_id
LEFT JOIN clients c ON c.id = t.client_id
LEFT JOIN vendors v ON v.id = t.vendor_id
WHERE e.first_name ILIKE '%lakshmi%'
   OR e.last_name ILIKE '%priya%'
ORDER BY t.created_at DESC;

-- Step 3: Check invoices related to this employee's clients
-- This will show revenue data
SELECT 
    i.id as invoice_id,
    i.client_id,
    c.client_name,
    i.vendor_id,
    v.name as vendor_name,
    i.invoice_date,
    i.total_amount,
    i.payment_status,
    i.status,
    i.created_at
FROM invoices i
LEFT JOIN clients c ON c.id = i.client_id
LEFT JOIN vendors v ON v.id = i.vendor_id
WHERE (i.client_id IN (
    SELECT DISTINCT t.client_id 
    FROM timesheets t
    JOIN employees e ON e.id = t.employee_id
    WHERE (e.first_name ILIKE '%lakshmi%' OR e.last_name ILIKE '%priya%')
    AND t.client_id IS NOT NULL
) OR i.vendor_id IN (
    SELECT DISTINCT t.vendor_id 
    FROM timesheets t
    JOIN employees e ON e.id = t.employee_id
    WHERE (e.first_name ILIKE '%lakshmi%' OR e.last_name ILIKE '%priya%')
    AND t.vendor_id IS NOT NULL
))
ORDER BY i.created_at DESC;

-- Step 4: Check for Cognizant client specifically (as shown in screenshot)
SELECT 
    c.id,
    c.client_name,
    c.email,
    c.status,
    c.created_at,
    COUNT(DISTINCT t.id) as timesheet_count,
    COUNT(DISTINCT i.id) as invoice_count,
    COALESCE(SUM(i.total_amount), 0) as total_revenue
FROM clients c
LEFT JOIN timesheets t ON t.client_id = c.id
LEFT JOIN invoices i ON i.client_id = c.id
WHERE c.client_name ILIKE '%cognizant%'
GROUP BY c.id, c.client_name, c.email, c.status, c.created_at;

-- ============================================
-- CLEANUP SECTION (Run only after verification)
-- ============================================

-- IMPORTANT: Review the above queries first to identify the correct IDs
-- Then uncomment and run the DELETE statements below

-- Step 5: Delete dummy timesheets for Lakshmi Priya
-- DELETE FROM timesheets
-- WHERE employee_id IN (
--     SELECT id FROM employees 
--     WHERE first_name ILIKE '%lakshmi%' OR last_name ILIKE '%priya%'
-- )
-- AND created_at > '2026-01-01'  -- Adjust date to target only recent dummy data
-- RETURNING id, employee_id, client_id, week_start, week_end;

-- Step 6: Delete dummy invoices (if they are test data)
-- Only delete if these are confirmed dummy invoices
-- DELETE FROM invoices
-- WHERE id IN (
--     -- List specific invoice IDs here after verification
--     -- 'invoice-id-1', 'invoice-id-2'
-- )
-- RETURNING id, client_id, vendor_id, invoice_date, total_amount;

-- Step 7: Optionally delete the dummy client if it's test data
-- DELETE FROM clients
-- WHERE client_name ILIKE '%cognizant%'
-- AND created_at > '2026-01-01'  -- Only recent test data
-- RETURNING id, client_name, email;

-- Step 8: Verify cleanup
-- Run the SELECT queries from Step 2 and 3 again to verify data is removed
