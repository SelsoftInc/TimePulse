-- Migration: Update leave types from vacation/sick to sick/casual/earned
-- Date: 2025-01-06
-- Description: Updates leave balance records to support new leave types (sick, casual, earned) with 6 days each

-- Step 1: Update existing 'vacation' leave type to 'casual' with 6 days
UPDATE leave_balances 
SET leaveType = 'casual', 
    totalDays = 6,
    usedDays = CASE 
        WHEN usedDays > 6 THEN 6 
        ELSE usedDays 
    END,
    pendingDays = CASE 
        WHEN pendingDays > 6 THEN 6 
        ELSE pendingDays 
    END
WHERE leaveType = 'vacation';

-- Step 2: Update existing 'sick' leave type to have 6 days instead of 5
UPDATE leave_balances 
SET totalDays = 6
WHERE leaveType = 'sick';

-- Step 3: Create 'earned' leave balance for all existing employees
INSERT INTO leave_balances (employeeId, tenantId, year, leaveType, totalDays, usedDays, pendingDays, carryForwardDays, createdAt, updatedAt)
SELECT 
    employeeId,
    tenantId,
    year,
    'earned' as leaveType,
    6 as totalDays,
    0 as usedDays,
    0 as pendingDays,
    0 as carryForwardDays,
    NOW() as createdAt,
    NOW() as updatedAt
FROM leave_balances
WHERE leaveType = 'sick'
AND NOT EXISTS (
    SELECT 1 FROM leave_balances lb2 
    WHERE lb2.employeeId = leave_balances.employeeId 
    AND lb2.tenantId = leave_balances.tenantId 
    AND lb2.year = leave_balances.year 
    AND lb2.leaveType = 'earned'
);

-- Step 4: Update leave requests table - change 'vacation' to 'casual'
UPDATE leave_requests 
SET leaveType = 'casual'
WHERE leaveType = 'vacation';

-- Verification queries (run these to check the migration)
-- SELECT leaveType, COUNT(*) as count, SUM(totalDays) as total_days FROM leave_balances GROUP BY leaveType;
-- SELECT leaveType, COUNT(*) as count FROM leave_requests GROUP BY leaveType;
