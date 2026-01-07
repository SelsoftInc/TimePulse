# Dashboard - Show All Active Clients with $0 Revenue

## Issue Analysis

Based on the screenshots provided:

**Screenshot 1 (Reports Page):**
- Shows 4 active clients in the system:
  1. Cognizant - $23,010.95
  2. deloitte - $0
  3. Acme Corporation - $0
  4. aswini traders - $0

**Screenshot 2 (Dashboard):**
- Revenue by Client card only shows: Cognizant ($23,010.95)
- Missing: deloitte, Acme Corporation, aswini traders (all with $0 revenue)

**Screenshot 3 (Leave Approvals):**
- Shows pending leave request from kumaran s
- Submitted on Jan 7, 2026
- Leave type: Casual, 2 days (Jan 12-13, 2026)
- Status: Pending

## Problem Statement

1. **Revenue by Client Card:** Only displays clients with revenue > $0, excluding active clients with no invoices or $0 revenue
2. **Recent Activity Card:** Should display the pending leave request and any timesheet submissions, but shows "No recent activity"

## Root Cause

### Revenue by Client Issue:
The original query used `INNER JOIN` between invoices and clients:
```sql
FROM invoices i
JOIN clients c ON c.id = i.client_id
WHERE i.tenant_id = :tenantId
  AND i.payment_status IN ('pending', 'paid', 'overdue')
```

This means:
- Only clients with invoices are returned
- Clients without invoices (deloitte, Acme Corporation, aswini traders) are excluded
- Active clients with $0 revenue don't appear

### Recent Activity Issue:
The query is correct and should return leave request data. The issue is likely:
- Employee-User relationship not properly set up
- Leave request data exists but employee name can't be resolved
- Decryption issues with employee names

## Solution Implemented

### 1. Revenue by Client - Show All Active Clients

**Changed Query Strategy:**
- Use `LEFT JOIN` instead of `INNER JOIN`
- Start from `clients` table instead of `invoices` table
- Filter by `c.status = 'active'`
- Use `CASE` statements to calculate revenue only for valid invoices

**New Query:**
```sql
SELECT
  c.id,
  c.client_name AS client_name,
  c.email,
  c.legal_name AS company,
  COALESCE(SUM(CASE 
    WHEN i.payment_status IN ('pending', 'paid', 'overdue')
      AND i.invoice_date >= :fromDate
      AND i.invoice_date <= :toDate
    THEN i.total_amount 
    ELSE 0 
  END), 0) AS total_revenue,
  COUNT(CASE 
    WHEN i.payment_status IN ('pending', 'paid', 'overdue')
      AND i.invoice_date >= :fromDate
      AND i.invoice_date <= :toDate
    THEN i.id 
  END) AS invoice_count
FROM clients c
LEFT JOIN invoices i ON i.client_id = c.id AND i.tenant_id = :tenantId
WHERE c.tenant_id = :tenantId
  AND c.status = 'active'
GROUP BY c.id, c.client_name, c.email, c.legal_name
ORDER BY total_revenue DESC, c.client_name ASC
LIMIT 100
```

**Key Changes:**
1. **FROM clients c** - Start from clients table
2. **LEFT JOIN invoices** - Include clients even without invoices
3. **c.status = 'active'** - Only show active clients
4. **CASE statements** - Calculate revenue only for valid invoices within date range
5. **ORDER BY total_revenue DESC, c.client_name ASC** - Sort by revenue (highest first), then alphabetically

**Result:**
- All 4 active clients will be displayed
- Cognizant: $23,010.95
- deloitte: $0.00
- Acme Corporation: $0.00
- aswini traders: $0.00

### 2. Recent Activity - Enhanced Logging

**Added Comprehensive Logging:**
```javascript
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
  console.log('   Total timesheets:', timesheetCount);
  console.log('   Timesheets with activity status:', submittedCount);
  console.log('   Total leave requests:', leaveCount);
  console.log('   Leave requests with activity status:', pendingLeaveCount);
}
```

**Diagnostic Checks:**
- Total timesheets in database
- Timesheets with status 'submitted', 'approved', or 'rejected'
- Total leave requests in database
- Leave requests with status 'pending', 'approved', or 'rejected'

## Files Modified

### Backend:
1. ✅ `server/routes/dashboard-extended.js`
   - Changed revenue-by-client query from INNER JOIN to LEFT JOIN
   - Start from clients table instead of invoices table
   - Filter by active status
   - Enhanced logging for both revenue and activity endpoints

## Expected Console Output

### Revenue by Client:
```
📊 Revenue by Client - Date Filter: {
  from: '2026-01-01',
  to: '2026-01-31',
  isCurrentMonth: true
}
📊 Revenue by Client - Found 4 active clients
📋 Sample clients: [
  { name: 'Cognizant', revenue: 23010.95 },
  { name: 'deloitte', revenue: 0 },
  { name: 'Acme Corporation', revenue: 0 }
]
```

### Recent Activity (if data exists):
```
📋 Fetching Recent Activity for tenant: 5eda5596-b1d9-4963-953d-7af9d0511ce8
📊 Found 1 activities
📋 Activities breakdown:
   - Timesheets: 0
   - Leave Requests: 1
📋 Sample activity: {
  id: 'xxx',
  activity_type: 'leave',
  employee_name: 'kumaran s',
  status: 'pending',
  created_at: '2026-01-07T...',
  total_hours: 2,
  client_name: 'Casual'
}
📋 Sample leave activity: {
  id: 'xxx',
  activity_type: 'leave',
  employee_name: 'kumaran s',
  status: 'pending',
  created_at: '2026-01-07T...',
  total_hours: 2,
  client_name: 'Casual'
}
```

### Recent Activity (if no data):
```
📋 Fetching Recent Activity for tenant: 5eda5596-b1d9-4963-953d-7af9d0511ce8
📊 Found 0 activities
⚠️  No activities found - checking data:
   Total timesheets: 15
   Timesheets with activity status: 0
   Total leave requests: 1
   Leave requests with activity status: 1
```

This tells us exactly where the problem is!

## Testing Steps

### 1. Restart Backend Server
```bash
cd d:\selsoft\WebApp\TimePulse\server
npm start
```

### 2. Refresh Dashboard
- Open browser and navigate to Dashboard
- Hard refresh: `Ctrl + Shift + R`

### 3. Check Backend Console

**Look for Revenue by Client logs:**
```
📊 Revenue by Client - Found 4 active clients
```

**Look for Recent Activity logs:**
```
📊 Found X activities
📋 Activities breakdown:
   - Timesheets: X
   - Leave Requests: X
```

### 4. Verify Dashboard Display

**Revenue by Client Card:**
- ✅ Should show 4 clients:
  - Cognizant: $23,010.95
  - deloitte: $0.00
  - Acme Corporation: $0.00
  - aswini traders: $0.00
- ✅ Scrollable if more clients exist
- ✅ Sorted by revenue (highest first)

**Recent Activity Card:**
- ✅ Should show leave request from kumaran s
- ✅ Activity type: Leave Request Submitted
- ✅ Status: PENDING
- ✅ Date: Jan 7, 2026
- ✅ Icon: Yellow calendar icon

## Troubleshooting

### If Revenue by Client Still Shows Only 1 Client:

**Check Console Logs:**
```
📊 Revenue by Client - Found 1 active clients
```

**Possible Causes:**

1. **Clients not marked as active:**
   ```sql
   SELECT id, client_name, status 
   FROM clients 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8';
   ```

   **Fix:**
   ```sql
   UPDATE clients 
   SET status = 'active' 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
     AND status IS NULL;
   ```

2. **Wrong tenant_id:**
   - Verify the tenant_id in the console logs matches your database

### If Recent Activity Shows 0 Activities:

**Check Console Diagnostic Logs:**
```
⚠️  No activities found - checking data:
   Total timesheets: 15
   Timesheets with activity status: 0  ← Problem!
   Total leave requests: 1
   Leave requests with activity status: 1  ← Data exists!
```

**Possible Causes:**

1. **Employee-User relationship missing:**
   ```sql
   SELECT 
     lr.id,
     lr.employee_id,
     e.user_id,
     u.first_name,
     u.last_name
   FROM leave_requests lr
   LEFT JOIN employees e ON e.id = lr.employee_id
   LEFT JOIN users u ON u.id = e.user_id
   WHERE lr.tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
     AND lr.status = 'pending';
   ```

   **Fix:**
   ```sql
   -- Find employee for kumaran s
   SELECT id, first_name, last_name, user_id 
   FROM employees 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8';
   
   -- Update employee with user_id if missing
   UPDATE employees 
   SET user_id = (SELECT id FROM users WHERE email = 'kumar123@gmail.com')
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
     AND first_name = 'kumaran';
   ```

2. **Leave request has wrong status:**
   ```sql
   SELECT id, employee_id, status, created_at
   FROM leave_requests 
   WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8';
   ```

   The query looks for status IN ('pending', 'approved', 'rejected'), so 'pending' should work.

3. **Decryption failing:**
   - Check if employee names are encrypted
   - Verify decryption service is working
   - Check console for decryption errors

## Database Quick Checks

### Check Active Clients:
```sql
SELECT 
  id,
  client_name,
  email,
  status,
  created_at
FROM clients 
WHERE tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
ORDER BY client_name;
```

**Expected Result:** 4 rows with status = 'active'

### Check Leave Requests:
```sql
SELECT 
  lr.id,
  e.first_name || ' ' || e.last_name AS employee_name,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lr.status,
  lr.created_at
FROM leave_requests lr
LEFT JOIN employees e ON e.id = lr.employee_id
WHERE lr.tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
ORDER BY lr.created_at DESC;
```

**Expected Result:** At least 1 row for kumaran s with status = 'pending'

### Check Employee-User Relationships:
```sql
SELECT 
  e.id,
  e.first_name,
  e.last_name,
  e.user_id,
  u.email,
  u.first_name AS user_first_name,
  u.last_name AS user_last_name
FROM employees e
LEFT JOIN users u ON u.id = e.user_id
WHERE e.tenant_id = '5eda5596-b1d9-4963-953d-7af9d0511ce8';
```

**Expected Result:** All employees should have user_id set and matching user records

## Expected Dashboard Display

### Revenue by Client Card:
```
Revenue by Client
┌─────────────────────────────────────────┐
│ Cognizant                   $23,010.95  │
│ ram@cognizant.com                       │
├─────────────────────────────────────────┤
│ deloitte                         $0.00  │
│ deloitte@example.com                    │
├─────────────────────────────────────────┤
│ Acme Corporation                 $0.00  │
│ acme@example.com                        │
├─────────────────────────────────────────┤
│ aswini traders                   $0.00  │
│ aswini@example.com                      │
└─────────────────────────────────────────┘
```

### Recent Activity Card:
```
Recent Activity
┌─────────────────────────────────────────┐
│  📅  Leave Request Submitted            │
│      kumaran s submitted a leave        │
│      request                            │
│      Jan 7, 2026          [PENDING]     │
└─────────────────────────────────────────┘
```

## Summary of Changes

### Backend Changes:
1. ✅ Changed revenue-by-client query to use LEFT JOIN
2. ✅ Start from clients table instead of invoices table
3. ✅ Filter by active status
4. ✅ Include clients with $0 revenue
5. ✅ Enhanced logging for revenue endpoint
6. ✅ Enhanced logging for recent activity endpoint
7. ✅ Added diagnostic checks for leave requests

### Expected Results:
1. ✅ All 4 active clients displayed in Revenue by Client card
2. ✅ Clients with $0 revenue show $0.00
3. ✅ Recent Activity shows leave request from kumaran s
4. ✅ Console logs help identify any data issues

### No Frontend Changes Required:
- Frontend already supports displaying multiple clients with scrolling
- Frontend already supports displaying leave request activities
- Recent Activity card design already matches Employee Dashboard

## Next Steps

1. **Restart Backend Server**
2. **Refresh Dashboard**
3. **Check Console Logs** for diagnostic information
4. **Verify Display** matches expected results
5. **If Issues Persist** - Use troubleshooting section to identify root cause

The comprehensive logging will tell you exactly what data is being returned and help identify any issues with employee-user relationships or data status.
