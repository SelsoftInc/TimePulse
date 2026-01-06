-- Migration: Update leave_type ENUM to support new leave types
-- Date: 2025-01-06
-- Description: Adds 'casual' and 'earned' to the leave_type ENUM

-- Step 1: Add new values to the ENUM type for leave_balances
ALTER TYPE enum_leave_balances_leave_type ADD VALUE IF NOT EXISTS 'casual';
ALTER TYPE enum_leave_balances_leave_type ADD VALUE IF NOT EXISTS 'earned';

-- Step 2: Add new values to the ENUM type for leave_requests
ALTER TYPE enum_leave_requests_leave_type ADD VALUE IF NOT EXISTS 'casual';
ALTER TYPE enum_leave_requests_leave_type ADD VALUE IF NOT EXISTS 'earned';

-- Step 3: Update existing 'vacation' leave balances to 'casual' with 6 days
UPDATE leave_balances 
SET leave_type = 'casual', 
    total_days = 6,
    used_days = CASE 
        WHEN used_days > 6 THEN 6 
        ELSE used_days 
    END,
    pending_days = CASE 
        WHEN pending_days > 6 THEN 6 
        ELSE pending_days 
    END,
    updated_at = NOW()
WHERE leave_type = 'vacation';

-- Step 4: Update existing 'sick' leave balances to have 6 days instead of 5
UPDATE leave_balances 
SET total_days = 6,
    updated_at = NOW()
WHERE leave_type = 'sick';

-- Step 5: Create 'earned' leave balance for all existing employees
INSERT INTO leave_balances (id, employee_id, tenant_id, year, leave_type, total_days, used_days, pending_days, carry_forward_days, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    employee_id,
    tenant_id,
    year,
    'earned' as leave_type,
    6 as total_days,
    0 as used_days,
    0 as pending_days,
    0 as carry_forward_days,
    NOW() as created_at,
    NOW() as updated_at
FROM leave_balances
WHERE leave_type = 'sick'
AND NOT EXISTS (
    SELECT 1 FROM leave_balances lb2 
    WHERE lb2.employee_id = leave_balances.employee_id 
    AND lb2.tenant_id = leave_balances.tenant_id 
    AND lb2.year = leave_balances.year 
    AND lb2.leave_type = 'earned'
)
ON CONFLICT DO NOTHING;

-- Step 6: Update leave requests table - change 'vacation' to 'casual'
UPDATE leave_requests 
SET leave_type = 'casual',
    updated_at = NOW()
WHERE leave_type = 'vacation';

-- Verification queries
-- SELECT leave_type, COUNT(*) as count, SUM(total_days) as total_days FROM leave_balances GROUP BY leave_type;
-- SELECT leave_type, COUNT(*) as count FROM leave_requests GROUP BY leave_type;
