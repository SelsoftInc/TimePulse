# 🔍 Debug Instructions - Timesheet Not Loading

## Step 1: Check Browser Console

1. Open the Timesheets page
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Look for these log messages:

### Expected Console Output:
```
🔍 Loading timesheets... { tenantId: "xxx", employeeId: "yyy", user: {...} }
📡 Calling API: /api/timesheets/employee/yyy/all?tenantId=xxx
✅ API Response: { success: true, timesheets: [...] }
📊 Formatted timesheets: [...]
```

### If you see:
- ❌ **"No tenant ID or employee ID found"**
  - **Problem**: User object doesn't have tenantId or employeeId
  - **Solution**: Logout and login again

- ❌ **API Error (404, 500, etc.)**
  - **Problem**: Backend route not working
  - **Solution**: Check if backend server is running

- ❌ **Empty timesheets array**
  - **Problem**: No data in database
  - **Solution**: Run `node scripts/complete-setup.js`

## Step 2: Check LocalStorage

In browser console, run:
```javascript
// Check user info
JSON.parse(localStorage.getItem('userInfo'))

// Should show:
// {
//   id: "...",
//   email: "selvakumar@selsoftinc.com",
//   tenantId: "...",
//   employeeId: "..."  // <-- This must exist!
// }
```

### If employeeId is missing:
1. **Logout** from the app
2. **Login again** as selvakumar@selsoftinc.com
3. The updated login API will now return employeeId

## Step 3: Check Network Tab

1. Open DevTools → **Network** tab
2. Refresh the Timesheets page
3. Look for API call: `/api/timesheets/employee/[id]/all`

### Check the Response:
- **Status 200**: Good! Check response body
- **Status 404**: Route not found - backend needs restart
- **Status 500**: Server error - check backend console

### Response Body Should Be:
```json
{
  "success": true,
  "timesheets": [
    {
      "id": "...",
      "week": "29 SEP, 2025 To 05 OCT, 2025",
      "hours": "40.00",
      "status": { "label": "SUBMITTED" },
      ...
    }
  ]
}
```

## Step 4: Verify Database Has Data

Run this command:
```bash
cd server
node scripts/check-database-timesheets.js
```

### Expected Output:
```
✅ Found Selvakumar user: { id: "...", email: "..." }
✅ Found Selvakumar employee: { id: "...", email: "..." }
Found 1 timesheets:

1. Timesheet ID: xxx
   Week: 2025-09-29 to 2025-10-05
   Status: submitted
   Total Hours: 40
   ...
```

### If no timesheets found:
Run: `node scripts/complete-setup.js`

## Step 5: Complete Setup (If Needed)

If data is missing, run:
```bash
cd server
node scripts/complete-setup.js
```

This will:
1. ✅ Add missing database columns
2. ✅ Link user to employee record  
3. ✅ Create test timesheet
4. ✅ Verify everything

## Step 6: Restart Everything

1. **Stop backend server** (Ctrl+C)
2. **Start backend**: `npm start`
3. **In browser**: 
   - Logout
   - Login as selvakumar@selsoftinc.com
   - Go to Timesheets page
4. **Check console logs**

## 🎯 Quick Checklist

- [ ] Backend server is running
- [ ] Ran `node scripts/complete-setup.js`
- [ ] Logged out and logged in again
- [ ] User has employeeId in localStorage
- [ ] API endpoint exists: `/api/timesheets/employee/:id/all`
- [ ] Database has timesheet data
- [ ] Browser console shows API call
- [ ] Network tab shows 200 response

## 🚨 Common Issues

### Issue 1: employeeId is null
**Cause**: Old login session before employeeId was added
**Fix**: Logout and login again

### Issue 2: API returns 404
**Cause**: Backend not restarted after code changes
**Fix**: Restart backend server

### Issue 3: Empty timesheets array
**Cause**: No data in database
**Fix**: Run `node scripts/complete-setup.js`

### Issue 4: Wrong employee ID
**Cause**: User ID used instead of employee ID
**Fix**: Check that login API returns employeeId

## 📞 Need Help?

Share these details:
1. Console logs (from browser)
2. Network tab response
3. Output of `node scripts/check-database-timesheets.js`
4. LocalStorage userInfo object

---

**Start with Step 1 (Browser Console) and work through each step!**
