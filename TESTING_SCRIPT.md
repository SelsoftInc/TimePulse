# End-to-End Testing Script

## Prerequisites

1. ✅ SMTP secrets updated with actual credentials
2. ✅ apprunner.yaml changes committed and pushed
3. ✅ App Runner service deployed and running

---

## Test 1: Email Notifications

### Test 1.1: Timesheet Submission Email

**Steps:**
1. Login as an employee
2. Navigate to timesheet submission page
3. Fill in timesheet data
4. Select a reviewer/approver
5. Submit timesheet

**Expected Result:**
- ✅ Timesheet submitted successfully
- ✅ Reviewer receives email notification
- ✅ Email contains:
  - Employee name
  - Week range
  - Link to view timesheet
  - "Review Timesheet" button

**Verify:**
```bash
# Check logs for email sent
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "timesheet submission email sent"
```

---

### Test 1.2: Timesheet Approval Email

**Steps:**
1. Login as reviewer/manager
2. Navigate to approval page
3. Find the submitted timesheet
4. Click "Approve"

**Expected Result:**
- ✅ Timesheet status changes to "approved"
- ✅ Employee receives approval email
- ✅ Email contains:
  - Week range
  - Reviewer name
  - Link to view timesheet
  - "View Timesheet" button

**Verify:**
```bash
# Check logs
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "timesheet approval email sent"
```

---

### Test 1.3: Timesheet Rejection Email

**Steps:**
1. Login as reviewer/manager
2. Navigate to approval page
3. Find a submitted timesheet
4. Click "Reject"
5. Enter rejection reason
6. Submit rejection

**Expected Result:**
- ✅ Timesheet status changes to "rejected"
- ✅ Employee receives rejection email
- ✅ Email contains:
  - Week range
  - Reviewer name
  - Rejection reason
  - Link to view/resubmit timesheet
  - "Review & Resubmit" button

**Verify:**
```bash
# Check logs
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "timesheet rejection email sent"
```

---

## Test 2: File Upload/Storage

### Test 2.1: Upload File

**Steps:**
1. Navigate to timesheet submission page
2. Create or edit a timesheet
3. Scroll to "Attachments" section
4. Click "Upload" or drag-and-drop a file
5. Select a file (image, PDF, etc.)

**Expected Result:**
- ✅ Upload progress indicator shows
- ✅ File uploads successfully
- ✅ File appears in "Uploaded Files" list
- ✅ File icon/name displays correctly

**Verify:**
```bash
# Check S3 bucket
aws s3 ls s3://timepulse-timesheet-attachments/timesheets/ --recursive --region us-east-1

# Check logs
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "file uploaded successfully"
```

---

### Test 2.2: Download File

**Steps:**
1. On timesheet page with uploaded files
2. Click "Download" button on a file
3. File should download

**Expected Result:**
- ✅ Download starts immediately
- ✅ File downloads correctly
- ✅ File opens correctly

**Verify:**
```bash
# Check logs
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "download"
```

---

### Test 2.3: Delete File

**Steps:**
1. On timesheet page with uploaded files
2. Click "Delete" button on a file
3. Confirm deletion

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ File is deleted from S3
- ✅ File removed from list
- ✅ Success message shown

**Verify:**
```bash
# Check S3 bucket (file should be gone)
aws s3 ls s3://timepulse-timesheet-attachments/timesheets/ --recursive --region us-east-1

# Check logs
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "file deleted successfully"
```

---

### Test 2.4: File Validation

**Steps:**
1. Try to upload file > 10MB
2. Try to upload unsupported file type

**Expected Result:**
- ✅ Error message for file size
- ✅ Error message for file type
- ✅ Upload is rejected

---

## Test 3: Week Navigation

### Test 3.1: Previous Week Button

**Steps:**
1. Navigate to timesheet page
2. Select a week
3. Click "Previous Week" button (◀)

**Expected Result:**
- ✅ Navigates to previous week
- ✅ Timesheet loads for previous week (if exists)
- ✅ Or shows empty form for new week

**Verify:**
- URL changes to new week
- Week selector updates
- Timesheet data loads correctly

---

### Test 3.2: Next Week Button

**Steps:**
1. Navigate to timesheet page
2. Select a week
3. Click "Next Week" button (▶)

**Expected Result:**
- ✅ Navigates to next week
- ✅ Timesheet loads for next week (if exists)
- ✅ Or shows empty form for new week

---

### Test 3.3: Week Picker Dropdown

**Steps:**
1. Navigate to timesheet page
2. Click week dropdown
3. Select a different week

**Expected Result:**
- ✅ Week changes
- ✅ Timesheet loads for selected week
- ✅ Form updates with week data

---

## Test 4: History Page

### Test 4.1: View History

**Steps:**
1. Navigate to history page (`/timesheets/history`)
2. View timesheet list

**Expected Result:**
- ✅ List of timesheets displays
- ✅ Shows week, employee, client, hours, status
- ✅ Pagination works (if > 20 timesheets)

---

### Test 4.2: Filter by Employee

**Steps:**
1. On history page
2. Select employee from dropdown
3. Click "Apply" or wait for auto-filter

**Expected Result:**
- ✅ List filters to selected employee
- ✅ Only that employee's timesheets show

---

### Test 4.3: Filter by Date Range

**Steps:**
1. On history page
2. Set "From Date"
3. Set "To Date"

**Expected Result:**
- ✅ List filters to date range
- ✅ Only timesheets in range show

---

### Test 4.4: Filter by Status

**Steps:**
1. On history page
2. Select status (draft, submitted, approved, rejected)
3. View filtered results

**Expected Result:**
- ✅ List filters to selected status
- ✅ Only timesheets with that status show

---

### Test 4.5: View Timesheet from History

**Steps:**
1. On history page
2. Click "View" (eye icon) on a timesheet
3. Timesheet details page opens

**Expected Result:**
- ✅ Navigates to timesheet page
- ✅ Timesheet data loads correctly
- ✅ All fields populated

---

## Test 5: Integration Tests

### Test 5.1: Complete Workflow

**Steps:**
1. Employee creates timesheet
2. Employee uploads file attachment
3. Employee submits timesheet
4. Reviewer receives email
5. Reviewer approves timesheet
6. Employee receives approval email
7. Check history page shows approved timesheet

**Expected Result:**
- ✅ All steps complete successfully
- ✅ Emails sent at correct times
- ✅ Files persist in S3
- ✅ History shows correct status

---

### Test 5.2: Error Handling

**Test Scenarios:**
1. Submit timesheet without reviewer → Should show error
2. Upload file when timesheet doesn't exist → Should show error
3. Delete file when read-only → Should be disabled
4. Navigate to week without employee selected → Should show error

**Expected Result:**
- ✅ Appropriate error messages
- ✅ No crashes
- ✅ User-friendly error handling

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Email Notifications:
[ ] Submission email sent
[ ] Approval email sent
[ ] Rejection email sent

File Upload:
[ ] Upload works
[ ] Download works
[ ] Delete works
[ ] Validation works

Week Navigation:
[ ] Previous week works
[ ] Next week works
[ ] Week picker works

History:
[ ] History page loads
[ ] Filters work
[ ] Pagination works
[ ] View timesheet works

Integration:
[ ] Complete workflow works
[ ] Error handling works

Issues Found:
_________________________________
_________________________________
_________________________________
```

---

## 🐛 Common Issues & Solutions

### Issue: Emails not sending
**Solution:**
- Check SMTP secrets are updated
- Verify Gmail app password (not regular password)
- Check logs for SMTP errors
- Verify port 587 is not blocked

### Issue: File upload fails
**Solution:**
- Check S3 bucket exists
- Verify IAM role has S3 permissions
- Check file size (< 10MB)
- Check file type is allowed

### Issue: Week navigation not working
**Solution:**
- Check employee is selected (for non-employees)
- Verify API endpoint is accessible
- Check browser console for errors

### Issue: History page empty
**Solution:**
- Verify timesheets exist in database
- Check tenantId is correct
- Verify API endpoint returns data

---

**Ready for Testing!** 🚀

