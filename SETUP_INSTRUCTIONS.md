# TimePulse Timesheet Setup Instructions

## 🚀 Complete Setup Steps

### Step 1: Fix Database Schema
Run this command to add missing columns to the timesheets table:

```bash
cd server
node scripts/fix-timesheet-columns.js
```

This will add:
- `notes` - Text field for timesheet notes
- `attachments` - JSON field for file attachments
- `submitted_at` - Timestamp when timesheet was submitted
- `approved_at` - Timestamp when timesheet was approved
- `reviewer_id` - Foreign key to users table (assigned reviewer)
- `approved_by` - Foreign key to users table (who approved it)
- `rejection_reason` - Text field for rejection comments

### Step 2: Create Test Timesheet Data
Run this command to create a test timesheet:

```bash
node scripts/setup-and-create-timesheet.js
```

This will:
- Create a timesheet for Selvakumar (week: Sep 29 - Oct 5, 2025)
- Assign Pushban as the reviewer
- Set status to "submitted"
- Total hours: 40 (8 hours Mon-Fri)

### Step 3: Restart Backend Server
After running the migrations, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
npm start
```

### Step 4: Test in Browser

#### As Employee (Selvakumar):
1. Login with: `selvakumar@selsoftinc.com`
2. Navigate to: **Timesheets** page
3. You should see the timesheet for Sep 29 - Oct 5, 2025
4. Status: "Submitted for Approval"
5. Hours: 40.00

#### As Admin (Pushban):
1. Logout from Selvakumar
2. Login with: `pushban@selsoftinc.com`
3. Navigate to: **Timesheet Approval** page
4. You should see Selvakumar's timesheet
5. Click "Review" to approve or reject

## 📋 What Was Fixed

### Backend Changes:
1. **Added new API endpoint**: `GET /api/timesheets/employee/:employeeId/all`
   - Returns all timesheets for a specific employee
   - Includes reviewer information
   - Sorted by week start date (newest first)

2. **Updated TimesheetSummary.jsx**:
   - Removed hardcoded dummy data
   - Integrated with real API
   - Fetches employee's timesheets from database
   - Displays actual data with proper formatting

3. **Database Schema Updates**:
   - Added missing columns to timesheets table
   - Created indexes for better performance

### Frontend Changes:
1. **TimesheetSummary Component**:
   - Uses `useAuth` hook to get current user
   - Calls `/api/timesheets/employee/:employeeId/all` endpoint
   - Filters and formats data for UI display
   - Shows real timesheet data instead of mock data

## 🔍 Troubleshooting

### Issue: "Column does not exist" error
**Solution**: Run `node scripts/fix-timesheet-columns.js` to add missing columns

### Issue: No timesheets showing
**Solution**: 
1. Check browser console for errors
2. Verify user has `employeeId` or `id` in auth context
3. Run the setup script to create test data

### Issue: Wrong user email
**Solution**: 
- Admin email is `pushban@selsoftinc.com` (with 'b', not 'p')
- Employee email is `selvakumar@selsoftinc.com`

## ✅ Expected Result

After completing all steps:

1. **Employee View** (Selvakumar):
   - Sees list of their timesheets
   - Can view details, edit drafts, submit for approval
   - Real data from database displayed

2. **Admin View** (Pushban):
   - Sees all pending timesheets
   - Can approve or reject with comments
   - Timesheets assigned to them are highlighted

## 📝 Commands Summary

```bash
# 1. Fix database schema
cd server
node scripts/fix-timesheet-columns.js

# 2. Create test timesheet
node scripts/setup-and-create-timesheet.js

# 3. Restart server
npm start

# 4. Test in browser
# Login as selvakumar@selsoftinc.com to see timesheets
# Login as pushban@selsoftinc.com to approve timesheets
```

## 🎯 Next Steps

1. Run the fix script
2. Run the setup script
3. Refresh browser
4. Test the workflow end-to-end

---

**Note**: Make sure the backend server is running before testing in the browser!
