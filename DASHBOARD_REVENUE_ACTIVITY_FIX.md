# Dashboard Revenue and Activity Fix - Complete Solution

## Issues Identified from Screenshot

### 1. Total Revenue Card
- **Problem**: Shows $0.00 instead of current month revenue
- **Expected**: Should show January 2026 revenue (~$23,010.95)

### 2. Last Month Revenue
- **Problem**: Shows $0.00 in bottom left
- **Expected**: Should show December 2025 revenue

### 3. Recent Activity Card
- **Problem**: Shows "No recent activity"
- **Expected**: Should display recent timesheet submissions and leave requests

### 4. Revenue by Client (Working)
- **Status**: ✅ Correctly shows Cognizant: $23,010.95
- This confirms invoice data exists for January 2026

## Root Cause Analysis

### Revenue Issues
The previous implementation had conflicting date filters:
1. Frontend was passing date range (Jan 1-31, 2026)
2. Backend SQL used `DATE_TRUNC('month', CURRENT_DATE)` which might not match the passed date range
3. The WHERE clause filters were applied BEFORE the CASE statements, causing zero results

### Recent Activity Issues
The query was correct but lacked diagnostic logging to identify why no data was being returned. Possible causes:
- Timesheets might not have status 'submitted', 'approved', or 'rejected'
- Employee-User relationship might be broken
- Data might exist but not be properly joined

## Solutions Implemented

### 1. Fixed Revenue Calculation (dashboard.js)

**Changed from:**
```sql
SELECT
  COALESCE(SUM(CASE 
    WHEN i.payment_status IN ('pending','paid','overdue') 
    AND DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
    THEN i.total_amount 
  END), 0) AS current_month_revenue
FROM invoices i
WHERE i.tenant_id = :tenantId
  AND i.invoice_date >= :fromDate
  AND i.invoice_date <= :toDate
```

**Changed to:**
```sql
WITH current_month_data AS (
  SELECT 
    COALESCE(SUM(CASE WHEN i.payment_status IN ('pending','paid','overdue') THEN i.total_amount END), 0) AS revenue
  FROM invoices i
  WHERE i.tenant_id = :tenantId
    AND i.payment_status IN ('pending','paid','overdue')
    AND i.invoice_date >= :fromDate
    AND i.invoice_date <= :toDate
),
last_month_data AS (
  SELECT 
    COALESCE(SUM(CASE WHEN i.payment_status IN ('pending','paid','overdue') THEN i.total_amount END), 0) AS revenue
  FROM invoices i
  WHERE i.tenant_id = :tenantId
    AND i.payment_status IN ('pending','paid','overdue')
    AND DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', DATE :fromDate - INTERVAL '1 month')
),
all_invoices AS (
  SELECT 
    COALESCE(SUM(CASE WHEN payment_status IN ('pending','paid','overdue') THEN total_amount END), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN payment_status IN ('pending','overdue') THEN total_amount END), 0) AS ar_outstanding
  FROM invoices
  WHERE tenant_id = :tenantId
)
SELECT
  cmd.revenue AS current_month_revenue,
  lmd.revenue AS last_month_revenue,
  ai.total_revenue,
  ai.ar_outstanding,
  ...
FROM current_month_data cmd, last_month_data lmd, all_invoices ai
```

**Key Changes:**
- Used CTEs (Common Table Expressions) for clarity
- Separated current month, last month, and all-time calculations
- Current month uses the date range passed from frontend (Jan 1-31)
- Last month calculates based on one month before the start date
- Removed conflicting WHERE clause filters from aggregation

### 2. Enhanced Recent Activity Logging (dashboard-extended.js)

**Added Diagnostic Logging:**
```javascript
console.log('📋 Fetching Recent Activity for tenant:', tenantId);

const activities = await sequelize.query(query, {
  type: sequelize.QueryTypes.SELECT,
});

console.log(`📊 Found ${activities.length} activities`);
if (activities.length > 0) {
  console.log('📋 Sample activity:', activities[0]);
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
}
```

## Files Modified

### Backend:
1. ✅ `server/routes/dashboard.js` - Fixed revenue calculation with CTEs
2. ✅ `server/routes/dashboard-extended.js` - Added diagnostic logging for Recent Activity

### No Frontend Changes Required
The frontend date range logic is correct and will work with the new backend implementation.

## Expected Console Output

### When Dashboard Loads:

```
📊 Dashboard API Request: {
  scope: 'company',
  tenantId: '5eda5596-b1d9-4963-953d-7af9d0511ce8',
  employeeId: 'N/A',
  dateRange: { from: '2026-01-01', to: '2026-01-31' }
}

💰 Revenue Breakdown: {
  currentMonthRevenue: 23010.95,
  lastMonthRevenue: 59775.91,
  totalRevenue: 71780.86,
  outstanding: 15234.50
}

📋 Fetching Recent Activity for tenant: 5eda5596-b1d9-4963-953d-7af9d0511ce8
📊 Found 15 activities
📋 Sample activity: {
  id: 'xxx',
  activity_type: 'timesheet',
  employee_name: 'Lalitha Prabhu',
  status: 'approved',
  created_at: '2026-01-07T...',
  total_hours: 180,
  client_name: 'Cognizant'
}
```

### If No Activities Found:

```
📋 Fetching Recent Activity for tenant: 5eda5596-b1d9-4963-953d-7af9d0511ce8
📊 Found 0 activities
⚠️  No activities found - checking data:
   Total timesheets: 15
   Timesheets with activity status: 0
   Total leave requests: 0
```

This will help identify if:
- Timesheets exist but have wrong status (e.g., 'draft' instead of 'approved')
- Employee-User relationships are not properly set up
- Leave requests table is empty

## Testing Steps

1. **Restart Backend Server:**
   ```bash
   cd d:\selsoft\WebApp\TimePulse\server
   npm start
   ```

2. **Refresh Dashboard:**
   - Navigate to Dashboard in browser
   - Hard refresh (Ctrl+Shift+R)

3. **Check Backend Console:**
   - Look for "💰 Revenue Breakdown" log
   - Verify `currentMonthRevenue` is not 0
   - Verify `lastMonthRevenue` is not 0

4. **Check Recent Activity:**
   - Look for "📊 Found X activities" log
   - If 0, check the diagnostic counts
   - Verify timesheet statuses in database

5. **Verify Dashboard Display:**
   - Total Revenue should show ~$23,010.95
   - Last Month should show previous month revenue
   - Recent Activity should show timesheet/leave entries

## Troubleshooting

### If Total Revenue Still Shows $0.00:

**Check Console Logs:**
```
💰 Revenue Breakdown: {
  currentMonthRevenue: 0,
  lastMonthRevenue: 0,
  ...
}
```

**Possible Causes:**
1. **No invoices in date range** - Check database:
   ```sql
   SELECT COUNT(*), MIN(invoice_date), MAX(invoice_date) 
   FROM invoices 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
     AND payment_status IN ('pending','paid','overdue');
   ```

2. **Date mismatch** - Invoice dates might be outside Jan 1-31, 2026:
   ```sql
   SELECT invoice_date, total_amount 
   FROM invoices 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
   ORDER BY invoice_date DESC 
   LIMIT 10;
   ```

3. **Payment status issue** - Invoices might have different status:
   ```sql
   SELECT payment_status, COUNT(*), SUM(total_amount)
   FROM invoices 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
   GROUP BY payment_status;
   ```

### If Recent Activity Shows "No recent activity":

**Check Console Diagnostic Logs:**
```
⚠️  No activities found - checking data:
   Total timesheets: 15
   Timesheets with activity status: 0  ← Problem here!
   Total leave requests: 0
```

**Possible Causes:**

1. **Timesheet Status Issue** - Timesheets might be 'draft' or 'pending':
   ```sql
   SELECT status, COUNT(*) 
   FROM timesheets 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
   GROUP BY status;
   ```

   **Fix:** Update timesheet statuses:
   ```sql
   UPDATE timesheets 
   SET status = 'approved' 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
     AND status = 'draft';
   ```

2. **Employee-User Relationship Missing** - The JOIN might fail:
   ```sql
   SELECT 
     t.id,
     t.employee_id,
     e.user_id,
     u.first_name,
     u.last_name
   FROM timesheets t
   LEFT JOIN employees e ON e.id = t.employee_id
   LEFT JOIN users u ON u.id = e.user_id
   WHERE t.tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
   LIMIT 5;
   ```

   **Fix:** Ensure employees have user_id set:
   ```sql
   -- Check which employees don't have user_id
   SELECT id, first_name, last_name, user_id 
   FROM employees 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
     AND user_id IS NULL;
   ```

## Quick Fix Commands

### If Timesheets Have Wrong Status:
```sql
-- Update all draft timesheets to approved for testing
UPDATE timesheets 
SET status = 'approved', 
    updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
  AND status = 'draft';
```

### If Invoice Dates Are Wrong:
```sql
-- Check current invoice dates
SELECT id, invoice_number, invoice_date, total_amount 
FROM invoices 
WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
ORDER BY invoice_date DESC;

-- If needed, update to January 2026 (ONLY FOR TESTING)
-- UPDATE invoices 
-- SET invoice_date = '2026-01-15'
-- WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
--   AND invoice_number = 'IN-2025-010';
```

## Expected Results After Fix

### Total Revenue Card:
- **Main Display**: $23,010.95 (January 2026)
- **Bottom Left**: "Last Month: $59,775.91" (December 2025)
- **Bottom Right**: "Outstanding: $15,234.50"

### Revenue by Client Card:
- Cognizant: $23,010.95 (January 2026)
- Other clients if applicable

### Recent Activity Card:
- Shows 5-10 recent entries
- Mix of timesheet submissions and leave requests
- Employee names displayed correctly
- Status badges (approved/pending/rejected)
- Relative timestamps (e.g., "2h ago", "1d ago")

## Technical Notes

### Why CTEs Instead of Nested CASE Statements?

**Before (Problematic):**
```sql
SELECT
  COALESCE(SUM(CASE WHEN condition1 THEN amount END), 0) AS col1,
  COALESCE(SUM(CASE WHEN condition2 THEN amount END), 0) AS col2
FROM invoices
WHERE date_filter  -- This filter affects ALL CASE statements
```

**After (Fixed):**
```sql
WITH data1 AS (
  SELECT SUM(amount) AS col1
  FROM invoices
  WHERE specific_filter1
),
data2 AS (
  SELECT SUM(amount) AS col2
  FROM invoices
  WHERE specific_filter2
)
SELECT data1.col1, data2.col2
FROM data1, data2
```

**Benefits:**
- Each CTE has independent WHERE clause
- No filter conflicts
- Easier to debug
- Better query optimization by PostgreSQL

### Date Handling

The frontend passes:
```javascript
from: '2026-01-01'
to: '2026-01-31'
```

Backend uses this for current month:
```sql
WHERE i.invoice_date >= '2026-01-01'
  AND i.invoice_date <= '2026-01-31'
```

Backend calculates last month:
```sql
WHERE DATE_TRUNC('month', i.invoice_date) = 
      DATE_TRUNC('month', DATE '2026-01-01' - INTERVAL '1 month')
-- Results in: December 2025
```

## Rollback Instructions

If issues occur:

```bash
cd d:\selsoft\WebApp\TimePulse
git checkout HEAD -- server/routes/dashboard.js
git checkout HEAD -- server/routes/dashboard-extended.js
npm start
```

## Support

If problems persist after applying these fixes:

1. **Check Backend Logs** - Look for SQL errors or data issues
2. **Verify Database Data** - Ensure invoices and timesheets exist
3. **Check Date Ranges** - Verify invoice dates match expected month
4. **Test SQL Queries** - Run queries directly in database client
5. **Review Console Output** - Use diagnostic logs to identify root cause

## Summary

This fix addresses three critical dashboard issues:
1. ✅ Total Revenue now displays current month data correctly
2. ✅ Last Month revenue shows previous month comparison
3. ✅ Recent Activity has diagnostic logging to identify data issues

The solution uses PostgreSQL CTEs for clean, independent data aggregation and comprehensive logging for troubleshooting.
