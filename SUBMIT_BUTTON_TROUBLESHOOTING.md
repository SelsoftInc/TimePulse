# 🔧 Submit Button Troubleshooting Guide

## Issue
Submit button not working and not navigating to timesheet summary screen after submission.

## Root Cause
The backend server needs to be **restarted** to load the `/api/timesheets/submit` endpoint.

## Step-by-Step Fix

### Step 1: Restart Backend Server ⚠️

```bash
cd d:\selsoft\WebApp\TimePulse\server

# If server is running, stop it (Ctrl+C)

# Start server
npm start
```

**Wait for this output:**
```
Server running on port 5000
✅ Database connection established successfully
```

### Step 2: Verify Submit Endpoint Works

```bash
cd d:\selsoft\WebApp\TimePulse\server
node scripts/test-submit-endpoint.js
```

**Expected Output:**
```
✅ API Response Status: 200
✅ API Response Data:
{
  "success": true,
  "message": "Timesheet submitted successfully",
  "timesheet": { ... }
}

✅ Timesheet submitted successfully!
Timesheet ID: uuid-123
```

**If you see 404 error:**
- Server not restarted yet
- Restart server and try again

### Step 3: Test in Frontend

1. **Open browser and go to**: http://localhost:3000/selsoft/timesheets/submit

2. **Open Developer Console** (F12)

3. **Enter hours**:
   - Click MON field: Type 8
   - Click TUE field: Type 8
   - Click WED field: Type 8
   - Click THU field: Type 8
   - Click FRI field: Type 8
   - Total should show: 40.0

4. **Scroll down and select approver**:
   - Click "Assign Reviewer/Approver" dropdown
   - Select: Pushban User (admin)

5. **Click "Submit Internal Client Timesheet" button**

6. **Check Console for logs**:
   ```
   📤 Submitting timesheet with approver: e70433fd-c849-4433-b4bd-7588476adfd3
   📤 Submitting to API: { tenantId: "...", employeeId: "...", ... }
   ✅ API Response: { success: true, ... }
   ```

7. **Should see success message**:
   ```
   "Timesheet submitted successfully! 
    An approval request has been sent to Pushban User."
   ```

8. **Should redirect after 2 seconds** to: `/selsoft/timesheets`

## Common Issues & Solutions

### Issue 1: Button Does Nothing When Clicked

**Symptoms:**
- Click submit button
- Nothing happens
- No console logs

**Solution:**
Check if approver is selected:
- Scroll down to "Assign Reviewer/Approver"
- Make sure dropdown shows a selected approver
- Button is disabled if no approver selected

### Issue 2: Error "Submit endpoint not found"

**Symptoms:**
- Console shows: `❌ Error submitting timesheet: Request failed with status code 404`
- Error message: "Submit endpoint not found"

**Solution:**
```bash
# Restart backend server
cd d:\selsoft\WebApp\TimePulse\server
npm start
```

### Issue 3: Error "Please enter at least one hour"

**Symptoms:**
- Error message appears at top
- Form doesn't submit

**Solution:**
- Enter hours in at least one day field
- Make sure total hours > 0
- Check that numbers are being entered (not text)

### Issue 4: Submits But Doesn't Navigate

**Symptoms:**
- Success message appears
- Doesn't redirect to timesheet summary

**Solution:**
Check console for navigation errors:
```javascript
// Should see after 2 seconds:
navigate(`/${subdomain}/timesheets`);
```

If navigation fails, manually go to: http://localhost:3000/selsoft/timesheets

### Issue 5: Data Not Showing in Summary

**Symptoms:**
- Submission successful
- Redirects to summary
- New timesheet not visible

**Solution:**
1. Check database:
   ```bash
   cd server
   node scripts/check-submitted-timesheets.js
   ```

2. Should show new timesheet with status='submitted'

3. If not in database, check backend console for errors

## Complete Testing Checklist

### Backend
- [ ] Server running on port 5000
- [ ] No errors in server console
- [ ] Test script returns 200 status
- [ ] Submit endpoint returns success

### Frontend
- [ ] Page loads without errors
- [ ] Client table visible (not upload screen)
- [ ] Hour fields are editable (white, not gray)
- [ ] Can enter hours
- [ ] Total hours calculate correctly
- [ ] Approver dropdown shows admins
- [ ] Can select approver
- [ ] Submit button enabled (blue)
- [ ] Click submit shows loading spinner
- [ ] Console shows API call logs
- [ ] Success message appears
- [ ] Redirects after 2 seconds

### Database
- [ ] Timesheet record created
- [ ] Has correct employee_id
- [ ] Has correct reviewer_id
- [ ] Status is 'submitted'
- [ ] Total hours correct
- [ ] Daily hours saved
- [ ] submitted_at timestamp set

### Summary Page
- [ ] Shows new timesheet
- [ ] Status badge shows "Submitted"
- [ ] Approver name visible
- [ ] Hours display correctly
- [ ] Week range correct

### Admin Approval Page
- [ ] Login as admin (Pushban)
- [ ] Go to Timesheet Approval
- [ ] See pending count: 1
- [ ] See Selvakumar's timesheet
- [ ] Can approve/reject

## Debug Commands

### Check if server is running:
```bash
curl http://localhost:5000/health
```

### Test submit endpoint:
```bash
cd server
node scripts/test-submit-endpoint.js
```

### Check database:
```bash
cd server
node scripts/check-submitted-timesheets.js
```

### Check reviewers:
```bash
cd server
node scripts/test-reviewers-api.js
```

## Expected Console Logs

### Frontend (Browser Console):
```
🔍 No hours entered yet, using first client type: internal
📊 Current clientType: internal clientHours: 1
✅ Showing only Cognizant for Selvakumar: [...]
📤 Submitting timesheet with approver: e70433fd-c849-4433-b4bd-7588476adfd3
📤 Submitting to API: { tenantId: "...", ... }
✅ API Response: { success: true, ... }
```

### Backend (Server Console):
```
📥 Received timesheet submission: { tenantId: "...", ... }
✅ Created new timesheet: uuid-123
POST /api/timesheets/submit 200 - 45ms
```

## Quick Fix Summary

1. **Restart backend server** (most common fix)
2. **Refresh frontend** (Ctrl + Shift + R)
3. **Enter hours** in at least one day
4. **Select approver** from dropdown
5. **Click submit** and wait
6. **Check console** for errors
7. **Verify in database** if needed

---

**If submit button still doesn't work after following all steps, share the console logs (both frontend and backend) for further debugging.**
