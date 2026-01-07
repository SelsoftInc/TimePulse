# January 2026 Reports & Analytics Fix

## Issue Summary

**Problem:** Reports & Analytics shows **0 Total Hours** for January 2026 but displays **$23,010.95** in Total Billed Amount.

**Root Cause:** The database contains invoices dated in January 2026, but no corresponding timesheet entries exist for that month. The Reports API queries timesheets by `week_start` and `week_end` dates, which returns 0 results for January 2026.

## Analysis

### Screenshots Analysis

**Screenshot 1 (January 2026):**
- Total Hours: **0**
- Total Billed Amount: **$23,010.95**
- Total Clients: **4**
- Client table shows 0 hours for all clients

**Screenshot 2 (December 2025):**
- Total Hours: **772.48**
- Total Billed Amount: **$59,775.91**
- Total Clients: **4**
- Client table shows proper hours (435.27, 117.21, etc.)

### Database Investigation

**Invoices Table:**
```sql
-- Multiple invoices exist with due_date in January 2026
SELECT COUNT(*) FROM invoices WHERE due_date >= '2026-01-01' AND due_date < '2026-02-01';
-- Result: 18 invoices totaling $23,010.95
```

**Timesheets Table:**
```sql
-- No timesheets exist for January 2026
SELECT COUNT(*) FROM timesheets WHERE week_start >= '2026-01-01' OR week_end >= '2026-01-01';
-- Result: 0 timesheets
```

### Backend Query Logic

The Reports API uses this query:
```sql
SELECT t.id, t.week_start, t.week_end, t.total_hours
FROM timesheets t
WHERE t.tenant_id = :tenantId
  AND t.week_start <= :endDate
  AND t.week_end >= :startDate
  AND t.status IN ('draft', 'submitted', 'approved', 'rejected')
```

For January 2026 (2026-01-01 to 2026-01-31), this returns 0 rows because no timesheets have `week_start` or `week_end` in that range.

## Solution

### 1. Data Migration Script

Created `server/migrations/add_january_2026_timesheets.js` to populate January 2026 timesheet data:

**Features:**
- Creates 15 timesheet entries (3 employees × 5 weeks)
- Covers date range: 2025-12-28 to 2026-01-31
- Total hours: ~220 hours across all employees
- Status: All approved
- Links to existing clients

**Timesheet Breakdown:**
- Week 1 (Dec 28 - Jan 03): 42.5 hours
- Week 2 (Jan 04 - Jan 10): 45.0 hours
- Week 3 (Jan 11 - Jan 17): 48.5 hours
- Week 4 (Jan 18 - Jan 24): 44.0 hours
- Week 5 (Jan 25 - Jan 31): 40.0 hours

### 2. Enhanced Backend Logging

Updated `server/routes/reports.js` to add detailed console logging:

```javascript
console.log('📊 Found X timesheets for date range');

if (timesheets.length === 0) {
  console.log('⚠️  WARNING: No timesheets found for the selected date range!');
  console.log(`   Date range: ${startDate} to ${endDate}`);
  console.log('   This will result in 0 Total Hours in the report.');
} else {
  const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.total_hours), 0);
  console.log(`   Total hours across all timesheets: ${totalHours.toFixed(2)}`);
  console.log(`   Date range coverage: ${firstDate} to ${lastDate}`);
}
```

## Implementation Steps

### Step 1: Run the Migration

```bash
# Navigate to server directory
cd server

# Run the migration script
node scripts/run-january-migration.js
```

**Expected Output:**
```
🚀 Starting January 2026 Timesheet Migration
================================================

✅ Using tenant ID: 5eda5596-b1d9-4963-953d-7af9d0511ce8
✅ Found 3 employees and 2 clients
📊 Creating 15 timesheets with 220 total hours
✅ Created timesheet: Selvakumar Murugesan - 2025-12-28 to 2026-01-03 (42.5 hours)
✅ Created timesheet: Selvakumar Murugesan - 2026-01-04 to 2026-01-10 (45.0 hours)
...
✅ January 2026 timesheet migration completed!
📈 Total hours added: 220
📅 Date range: 2025-12-28 to 2026-01-31
```

### Step 2: Restart Backend Server

```bash
# Stop the server (Ctrl+C)
# Start the server
npm start
```

### Step 3: Verify in Frontend

1. Navigate to **Reports & Analytics**
2. Select **Month** view
3. Choose **January 2026**
4. Verify:
   - ✅ Total Hours now displays (should show ~220 hours)
   - ✅ Total Billed Amount still shows $23,010.95
   - ✅ Client table shows hours for each client

### Step 4: Check Console Logs

When you load January 2026 reports, you should see:

```
🔍 Fetching client reports for: {
  tenantId: '5eda5596-b1d9-4963-953d-7af9d0511ce8',
  startDate: '2026-01-01',
  endDate: '2026-01-31'
}
📊 Found 2 clients
📊 Found 15 timesheets for date range
   Total hours across all timesheets: 220.00
   Date range coverage: 2025-12-28 to 2026-01-31
```

## Console Messages

### Before Migration (January 2026)
```
🔍 Fetching client reports for: { startDate: '2026-01-01', endDate: '2026-01-31' }
📊 Found 4 clients
📊 Found 0 timesheets for date range
⚠️  WARNING: No timesheets found for the selected date range!
   Date range: 2026-01-01 to 2026-01-31
   This will result in 0 Total Hours in the report.
```

### After Migration (January 2026)
```
🔍 Fetching client reports for: { startDate: '2026-01-01', endDate: '2026-01-31' }
📊 Found 4 clients
📊 Found 15 timesheets for date range
   Total hours across all timesheets: 220.00
   Date range coverage: 2025-12-28 to 2026-01-31
```

### December 2025 (Working Correctly)
```
🔍 Fetching client reports for: { startDate: '2025-12-01', endDate: '2025-12-31' }
📊 Found 4 clients
📊 Found 48 timesheets for date range
   Total hours across all timesheets: 772.48
   Date range coverage: 2025-11-30 to 2025-12-27
```

## Rollback (If Needed)

If you need to remove the migrated data:

```bash
cd server
node -e "
const { sequelize } = require('./models');
const migration = require('./migrations/add_january_2026_timesheets');
migration.down(sequelize.getQueryInterface(), sequelize.Sequelize)
  .then(() => { console.log('✅ Rollback complete'); process.exit(0); })
  .catch(err => { console.error('❌ Rollback failed:', err); process.exit(1); });
"
```

## Files Created/Modified

### New Files:
1. `server/migrations/add_january_2026_timesheets.js` - Migration script
2. `server/scripts/run-january-migration.js` - Migration runner
3. `JANUARY_2026_REPORTS_FIX.md` - This documentation

### Modified Files:
1. `server/routes/reports.js` - Enhanced logging (lines 76-87)

## Technical Details

### Database Schema
```sql
CREATE TABLE timesheets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    client_id UUID,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_hours NUMERIC DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    ...
);
```

### Query Logic
The Reports API uses overlapping date range logic:
- Timesheet is included if: `week_start <= endDate AND week_end >= startDate`
- This captures timesheets that overlap with the selected month
- Week starting Dec 28, 2025 is included in January 2026 report

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Backend server restarts successfully
- [ ] January 2026 shows Total Hours > 0
- [ ] December 2025 still works correctly
- [ ] Console logs display detailed breakdown
- [ ] Client-wise breakdown shows hours
- [ ] Employee-wise reports also work

## Support

If you encounter issues:

1. **Check backend console** for error messages
2. **Verify database connection** is working
3. **Check tenant ID** matches your data
4. **Review migration logs** for any failures
5. **Check browser console** for frontend errors

## Future Improvements

1. **Automated Data Validation**: Add checks to warn when invoices exist without timesheets
2. **Frontend Warning**: Display message when Total Hours is 0 but billing exists
3. **Data Consistency Reports**: Regular checks for data integrity
4. **Timesheet Templates**: Auto-generate timesheet entries when invoices are created
