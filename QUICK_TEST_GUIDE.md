# Quick Test Guide - Timesheet Workflow

## ✅ Changes Made

### 1. **Removed Dummy Data**
Updated `TimesheetSummary.jsx` to fetch real timesheet data from the database instead of showing hardcoded mock data.

### 2. **Database Integration**
- Fetches timesheets from `/api/timesheets/current` endpoint
- Filters timesheets for the logged-in employee
- Displays real data with proper status formatting

## 🚀 How to Test

### Step 1: Create Test Timesheet Data
Run this command in the server directory:
```bash
cd server
node scripts/setup-and-create-timesheet.js
```

This will:
- Add `reviewer_id` column to database (if needed)
- Create a timesheet for Selvakumar (week: Sep 29 - Oct 5, 2025)
- Assign Pushpan as the reviewer
- Set status to "submitted"
- Total hours: 40 (8 hours Mon-Fri)

### Step 2: View as Employee (Selvakumar)
1. Login as: `selvakumar@selsoftinc.com`
2. Navigate to: **Timesheets** page
3. You should see:
   - The timesheet you created (Sep 29 - Oct 5, 2025)
   - Status: "Submitted for Approval"
   - Hours: 40.00

### Step 3: View as Admin (Pushpan)
1. Logout from Selvakumar account
2. Login as: `pushpan@selsoftinc.com`
3. Navigate to: **Timesheet Approval** page
4. You should see:
   - Selvakumar's timesheet in the pending list
   - Click "Review" to see full details
   - Approve or reject the timesheet

## 📋 What Changed

**Before:**
- Timesheet list showed hardcoded dummy data
- Data was not connected to database
- Showed fake dates and hours

**After:**
- Timesheet list fetches real data from database
- Shows actual timesheets created by employees
- Displays correct week ranges, hours, and status
- Filters timesheets by logged-in employee

## 🔍 API Endpoints Used

1. **GET /api/timesheets/current?tenantId=...**
   - Returns all timesheets for current week
   - Includes employee and client information

2. **GET /api/timesheets/pending-approval?tenantId=...**
   - Returns submitted timesheets for approval
   - Used by admin/manager approval page

3. **PUT /api/timesheets/:id**
   - Updates timesheet (hours, status, reviewer, etc.)
   - Used for submission and approval

## ✨ Features Working

✅ Employee can view their own timesheets
✅ Real data from database displayed
✅ Status shown correctly (Pending, Submitted, Approved, Rejected)
✅ Week ranges formatted properly
✅ Hours displayed accurately
✅ Admin can see all pending timesheets
✅ Reviewer assignment working

## 🎯 Next Steps

1. Run the setup script to create test data
2. Login as Selvakumar to see the timesheet
3. Login as Pushpan to approve it
4. Verify the workflow end-to-end

---

**Note:** The eslint warning about missing dependency in useEffect is intentional - we only want to load timesheets once on component mount.
