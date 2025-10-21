# Attachments Fix - Testing Checklist

## Pre-Testing Setup
- [ ] Backend server restarted (to load updated code)
- [ ] Frontend running on http://localhost:3000 or http://localhost:3001
- [ ] Browser console open (F12) to monitor for errors

## Test Case 1: Timesheet Approval - Review Button
**Steps:**
1. [ ] Login as admin user (admin@pushpan.com / Admin@123)
2. [ ] Navigate to "Timesheets" → "Timesheet Approval"
3. [ ] Verify pending timesheets are displayed
4. [ ] Click "Review" button on any timesheet
5. [ ] Modal should open without errors

**Expected Results:**
- ✅ No error: "timesheet.attachments.map is not a function"
- ✅ Modal displays employee information
- ✅ Attachments section shows either:
  - "No attachments" (if none exist)
  - List of attachments with icons (if they exist)
- ✅ Attachment count indicator on card (if attachments exist)

**Browser Console:**
- ✅ No red errors
- ✅ API response shows `attachments: []` (array, not string)

---

## Test Case 2: Approve/Reject Timesheet
**Steps:**
1. [ ] In the review modal, select "Approve" or "Reject"
2. [ ] Add optional comments
3. [ ] Click "Approve Timesheet" or "Reject Timesheet"
4. [ ] Verify success notification appears

**Expected Results:**
- ✅ Timesheet processed successfully
- ✅ Modal closes
- ✅ Timesheet removed from pending list
- ✅ Success toast notification displayed

---

## Test Case 3: Multiple Timesheets
**Steps:**
1. [ ] Review multiple timesheets in sequence
2. [ ] Check each timesheet's attachments section

**Expected Results:**
- ✅ All timesheets open without errors
- ✅ Attachments display correctly for each
- ✅ No console errors

---

## Test Case 4: API Response Verification
**Steps:**
1. [ ] Open browser DevTools → Network tab
2. [ ] Filter by "XHR" or "Fetch"
3. [ ] Click "Review" button on a timesheet
4. [ ] Check the API response

**Expected Results:**
- ✅ `/api/timesheets/pending-approval` returns:
  ```json
  {
    "success": true,
    "timesheets": [
      {
        "id": 1,
        "attachments": [],  // ← Should be array, not string
        ...
      }
    ]
  }
  ```

---

## Test Case 5: Employee Timesheet View
**Steps:**
1. [ ] Login as employee user
2. [ ] Navigate to "Timesheets" → "My Timesheet"
3. [ ] View timesheet details

**Expected Results:**
- ✅ No errors related to attachments
- ✅ Attachments display correctly (if any)

---

## Test Case 6: Invoice Attachments
**Steps:**
1. [ ] Navigate to "Invoices"
2. [ ] View any invoice with attachments

**Expected Results:**
- ✅ Attachments display correctly
- ✅ No console errors

---

## Regression Testing

### Database Compatibility
- [ ] **SQLite (Current):** Attachments work correctly
- [ ] **PostgreSQL (If available):** Attachments work correctly

### Different Scenarios
- [ ] Timesheet with no attachments
- [ ] Timesheet with 1 attachment
- [ ] Timesheet with multiple attachments
- [ ] Newly created timesheet
- [ ] Existing timesheet from database

---

## Known Issues to Watch For

### If Error Still Occurs:
1. **Backend not restarted:** Restart server with `npm start`
2. **Frontend cache:** Hard refresh browser (Ctrl+Shift+R)
3. **Old data in database:** Attachments stored as invalid JSON

### Debugging Steps:
```javascript
// In browser console, check timesheet data:
console.log(timesheet.attachments);
console.log(typeof timesheet.attachments);
console.log(Array.isArray(timesheet.attachments));
```

---

## Success Criteria
✅ All test cases pass without errors
✅ No "map is not a function" errors in console
✅ Attachments display correctly in all screens
✅ Approve/Reject workflow works smoothly
✅ API responses return arrays for attachments field

---

## Rollback Trigger
If any of these occur, consider rollback:
- ❌ Critical errors in production
- ❌ Data corruption or loss
- ❌ Performance degradation
- ❌ Breaking changes to other features

---

**Testing Date:** _____________
**Tested By:** _____________
**Status:** [ ] Pass [ ] Fail
**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
