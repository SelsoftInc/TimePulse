# Employee Dashboard - Quick Test Guide

## Prerequisites
✅ Server running on port 5001 (with nodemon for hot-reload)
✅ Frontend running on port 3000
✅ Logged in as an employee user

## Test Steps

### 1. Test Logo Navigation
1. Login to the application
2. From any page, click on the **TimePulse logo** in the header
3. **Expected**: Should navigate to `https://goggly-casteless-torri.ngrok-free.dev/selsoft/employee-dashboard`

### 2. Test Dashboard Data Loading
1. Navigate to employee dashboard
2. **Expected**: 
   - Loading spinner appears briefly
   - Dashboard loads with live data
   - No console errors

### 3. Verify Timesheet Statistics
Check the dashboard displays:
- ✅ Total timesheets this month
- ✅ Pending timesheets count
- ✅ Approved timesheets count
- ✅ Total hours worked this month
- ✅ Recent timesheets list (last 5)

### 4. Verify Invoice Statistics
Check the dashboard displays:
- ✅ Total invoices this month
- ✅ Paid invoices count
- ✅ Pending invoices count
- ✅ Overdue invoices count
- ✅ Total earnings this month
- ✅ Pending earnings amount
- ✅ Recent invoices list (last 5)

### 5. Verify Notifications
Check notifications section shows:
- ✅ Pending timesheet alerts (if any)
- ✅ Approved timesheet notifications
- ✅ Overdue invoice warnings (if any)
- ✅ Payment confirmations

### 6. Test API Endpoint Directly

Open browser console and run:
```javascript
fetch('http://localhost:5001/api/employee-dashboard?employeeId=YOUR_EMPLOYEE_ID&tenantId=YOUR_TENANT_ID', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(d => console.log('Dashboard Data:', d));
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "employee": { ... },
    "timesheets": { ... },
    "invoices": { ... },
    "summary": { ... }
  }
}
```

## Common Issues & Solutions

### Issue: "Missing tenant ID or employee ID"
**Solution**: Ensure user object has `employeeId` property. Check login response includes employee ID.

### Issue: Dashboard shows no data
**Solution**: 
1. Check if employee has timesheets/invoices in database
2. Verify `employeeId` matches records in Timesheet/Invoice tables
3. Check browser console for API errors

### Issue: Logo navigation doesn't work
**Solution**: 
1. Hard refresh browser (Ctrl+Shift+R)
2. Check Header.jsx changes are loaded
3. Verify route exists in App.js

### Issue: API returns 404
**Solution**: 
1. Restart server with `npm run dev` in server directory
2. Verify route is registered in server/index.js
3. Check server console for startup errors

## Success Criteria

✅ Logo click navigates to employee dashboard
✅ Dashboard loads without errors
✅ Live data from database is displayed
✅ Statistics are accurate
✅ Notifications appear based on data
✅ No console errors
✅ Page is responsive and styled correctly

## Next Steps After Testing

If all tests pass:
1. ✅ Employee dashboard is fully functional
2. ✅ Logo navigation is working
3. ✅ Live data integration is complete

If issues found:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database has test data
4. Review implementation documentation
