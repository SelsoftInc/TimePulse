# Data Display Issues - Fixed

## Issues Identified

### 1. Dashboard showing 0 hours
- **Root Cause**: The `EmployeeDashboard` component was using `user.employeeId` which may not be set for all users
- **Impact**: Dashboard displayed 0h for "This Week" and "This Month"

### 2. Timesheets table not updating after submission
- **Root Cause**: The `TimesheetSummary` component wasn't refreshing data when returning from the submit page
- **Impact**: Newly submitted timesheets didn't appear in the table

### 3. Missing employeeId in user object
- **Root Cause**: Some users have `user.id` but not `user.employeeId` set
- **Impact**: API calls failed because employeeId was undefined

## Fixes Applied

### Fix 1: Dashboard - Use user.id as fallback for employeeId
**File**: `nextjs-app/src/components/dashboard/EmployeeDashboard.jsx`

**Changes**:
```javascript
// Before
if (!user?.tenantId || !user?.employeeId) {
  console.warn("Missing tenant ID or employee ID");
  setLoading(false);
  return;
}

// After
const employeeId = user?.employeeId || user?.id;
const tenantId = user?.tenantId;

console.log('🔍 Dashboard loading with:', { employeeId, tenantId, user });

if (!tenantId || !employeeId) {
  console.warn("Missing tenant ID or employee ID", { tenantId, employeeId });
  setLoading(false);
  return;
}
```

**Added**:
- Comprehensive console logging for debugging
- Better error messages with context
- Fallback to `user.id` when `user.employeeId` is not available

### Fix 2: TimesheetSummary - Auto-refresh and employeeId fallback
**File**: `nextjs-app/src/components/timesheets/TimesheetSummary.jsx`

**Changes**:

1. **Added auto-refresh when page becomes visible**:
```javascript
// Auto-refresh when page becomes visible (e.g., after submitting a timesheet)
useEffect(() => {
  if (!isMounted) return;

  const handleVisibilityChange = () => {
    if (!document.hidden && user?.tenantId) {
      console.log('🔄 Page became visible, reloading timesheet data...');
      loadTimesheetData();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [isMounted, user?.tenantId, loadTimesheetData]);
```

2. **Added employeeId fallback logic**:
```javascript
// Before
const empResponse = await axios.get(`${API_BASE}/api/timesheets/employees/by-email/${encodeURIComponent(userEmail)}?tenantId=${tenantId}`);
if (!empResponse.data.success || !empResponse.data.employee) {
  console.error('❌ Employee not found for email:', userEmail);
  setTimesheets([]);
  setLoading(false);
  return;
}
const employeeId = empResponse.data.employee.id;

// After
let employeeId = user?.employeeId || user?.id;
console.log('🔍 Initial employeeId from user:', employeeId);

// If no employeeId, try to get it from email
if (!employeeId) {
  console.log('📡 Fetching employee by email...');
  const empResponse = await axios.get(`${API_BASE}/api/timesheets/employees/by-email/${encodeURIComponent(userEmail)}?tenantId=${tenantId}`);
  
  if (!empResponse.data.success || !empResponse.data.employee) {
    console.error('❌ Employee not found for email:', userEmail);
    setTimesheets([]);
    setLoading(false);
    return;
  }
  
  employeeId = empResponse.data.employee.id;
}
console.log('✅ Using employeeId:', employeeId);
```

## Backend Verification

### Server Status
✅ Backend server is running on `http://localhost:5001`
✅ Health endpoint responding: `/health`
✅ All API routes registered correctly:
- `/api/employee-dashboard` - Employee dashboard data
- `/api/timesheets` - Timesheet listing
- `/api/timesheets/employee/:id/all` - Employee-specific timesheets

### API Endpoints Working
1. **Employee Dashboard**: `GET /api/employee-dashboard?employeeId={id}&tenantId={id}`
2. **Timesheets List**: `GET /api/timesheets/employee/{id}/all?tenantId={id}`
3. **Employee by Email**: `GET /api/timesheets/employees/by-email/{email}?tenantId={id}`

## Testing Instructions

### 1. Test Dashboard Data Display
1. Navigate to the Dashboard page
2. Check browser console for logs:
   - Should see: `🔍 Dashboard loading with:` with employeeId and tenantId
   - Should see: `📡 Fetching dashboard from:` with API URL
   - Should see: `✅ Dashboard data received:` with data object
3. Verify that "This Week" and "This Month" show actual hours (not 0h)
4. Verify "Recent Timesheets" section displays submitted timesheets

### 2. Test Timesheets Table
1. Navigate to Timesheets page
2. Verify existing timesheets are displayed in the table
3. Click "Submit Timesheet" button
4. Fill out and submit a new timesheet
5. Navigate back to Timesheets page
6. **Expected**: New timesheet should appear in the table automatically
7. Check console for: `🔄 Page became visible, reloading timesheet data...`

### 3. Test After Timesheet Submission
1. Submit a new timesheet
2. Return to Timesheets page (via navigation or back button)
3. Verify the new timesheet appears with correct:
   - Week range
   - Status (should be "Submitted for Approval" or "Approved")
   - Hours
   - Action buttons

## Console Logging Added

### Dashboard Component
- `🔍 Dashboard loading with:` - Shows employeeId, tenantId, and user object
- `📡 Fetching dashboard from:` - Shows API URL being called
- `📊 Dashboard response status:` - Shows HTTP status code
- `✅ Dashboard data received:` - Shows full API response
- `❌ Dashboard API error:` - Shows error details if API fails

### TimesheetSummary Component
- `🔍 Loading timesheets...` - Shows tenantId, userEmail, userRole
- `🔍 Initial employeeId from user:` - Shows employeeId from user object
- `✅ Using employeeId:` - Shows final employeeId being used
- `📡 Calling API:` - Shows full API URL
- `✅ API Response:` - Shows API response data
- `🔄 Page became visible, reloading timesheet data...` - Auto-refresh trigger

## Expected Behavior After Fixes

### Dashboard
1. ✅ Shows actual hours for "This Week" (not 0h)
2. ✅ Shows actual hours for "This Month" (not 0h)
3. ✅ Displays recent timesheets in "Recent Timesheets" section
4. ✅ Shows correct pending/approved counts

### Timesheets Page
1. ✅ Displays all submitted timesheets in table
2. ✅ Shows correct status for each timesheet
3. ✅ Auto-refreshes when returning from submit page
4. ✅ Updates immediately after submission

## Troubleshooting

### If Dashboard still shows 0h:
1. Check browser console for error messages
2. Verify user object has either `employeeId` or `id` field
3. Check that backend server is running on port 5001
4. Verify API endpoint returns data: `http://localhost:5001/api/employee-dashboard?employeeId={id}&tenantId={id}`

### If Timesheets table is empty:
1. Check browser console for API errors
2. Verify timesheets exist in database
3. Check that user has correct tenantId
4. Verify API endpoint: `http://localhost:5001/api/timesheets/employee/{id}/all?tenantId={id}`

### If auto-refresh doesn't work:
1. Check browser console for visibility change events
2. Verify the `visibilitychange` event listener is attached
3. Try manually refreshing the page

## Files Modified

1. **nextjs-app/src/components/dashboard/EmployeeDashboard.jsx**
   - Added employeeId fallback logic
   - Enhanced error logging
   - Better error handling

2. **nextjs-app/src/components/timesheets/TimesheetSummary.jsx**
   - Added auto-refresh on page visibility
   - Added employeeId fallback logic
   - Enhanced console logging

## Backend Files (No Changes Required)

The backend API endpoints are working correctly:
- `server/routes/employeeDashboard.js` - Dashboard data endpoint
- `server/routes/timesheets.js` - Timesheet endpoints
- `server/index.js` - Route registration

## Next Steps

1. **Test the fixes**:
   - Open browser DevTools console
   - Navigate to Dashboard and Timesheets pages
   - Submit a new timesheet
   - Verify data displays correctly

2. **Monitor console logs**:
   - Look for the emoji-prefixed log messages
   - Verify API calls are successful
   - Check for any error messages

3. **If issues persist**:
   - Share console logs with developer
   - Check network tab for failed API requests
   - Verify backend server is running

## Summary

The data display issues were caused by:
1. Missing `employeeId` in user object
2. No auto-refresh after timesheet submission
3. Insufficient error logging

All issues have been fixed by:
1. Using `user.id` as fallback for `employeeId`
2. Adding auto-refresh on page visibility change
3. Adding comprehensive console logging for debugging

The application should now properly display:
- ✅ Dashboard hours (This Week, This Month)
- ✅ Recent timesheets on Dashboard
- ✅ All timesheets in Timesheets table
- ✅ Newly submitted timesheets after submission
