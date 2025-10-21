# ✅ Complete Timesheet Submission Flow - Verification & Testing Guide

## Overview
This document verifies the complete end-to-end timesheet submission flow from employee entry to admin approval.

## Current Implementation Status

### ✅ 1. Backend Server
- **Status**: Running on port 5000
- **Reviewers API**: Working (returns 2 admins)
- **Submit API**: Implemented at `/api/timesheets/submit`
- **Pending Approval API**: Working at `/api/timesheets/pending-approval`

### ✅ 2. Frontend Components
- **TimesheetSubmit.jsx**: Updated to call real API
- **Approver Dropdown**: Fetches and displays admins
- **Submit Button**: Validates and submits with reviewerId
- **Route Order**: Fixed (reviewers before :id)

### ✅ 3. Database
- **Timesheets Table**: Has reviewerId column
- **Users Table**: Has 2 admin users
- **Employees Table**: Has Selvakumar

## Complete Flow

### Step 1: Employee Enters Hours (Image 1)

**Screen**: Submit Timesheet Page

**Actions**:
1. Employee sees client table with Cognizant
2. Enters hours manually in each day column (SAT, SUN, MON, TUE, WED, THU, FRI)
3. Can enter Holiday/Time off hours
4. Total hours calculated automatically

**Example**:
```
Cognizant:
  MON: 8
  TUE: 8
  WED: 8
  THU: 8
  FRI: 8
  Total: 40 hours
```

### Step 2: Employee Selects Approver (Image 2)

**Screen**: Bottom of Submit Timesheet Page

**Actions**:
1. Scroll down to "Assign Reviewer/Approver" dropdown
2. Click dropdown - shows 2 admins:
   - Admin User (admin@selsoft.com)
   - Pushban User (pushban@selsoftinc.com)
3. Select one approver (e.g., Pushban User)
4. Submit button becomes enabled

**Dropdown Data**:
```javascript
{
  id: "e70433fd-c849-4433-b4bd-7588476adfd3",
  name: "Pushban User",
  email: "pushban@selsoftinc.com",
  role: "admin"
}
```

### Step 3: Employee Clicks Submit

**Frontend Action**:
```javascript
POST /api/timesheets/submit
{
  tenantId: "5eda5596-b1d9-4963-953d-7af9d0511ce8",
  employeeId: "2d639e96-2f26-4577-8ce7-2570e5ca0ad0",
  weekStart: "2025-10-06",
  weekEnd: "2025-10-12",
  clientId: "a3889c22-ace2-40f9-9f29-1a1556c0a444",
  reviewerId: "e70433fd-c849-4433-b4bd-7588476adfd3",  // ← Pushban User
  status: "submitted",
  totalHours: 40,
  dailyHours: {
    sat: 0,
    sun: 0,
    mon: 8,
    tue: 8,
    wed: 8,
    thu: 8,
    fri: 8
  },
  notes: "Worked on Cognizant project"
}
```

**Backend Action**:
```javascript
// server/routes/timesheets.js - POST /submit
1. Receives submission data
2. Validates required fields
3. Checks if timesheet exists for this week
4. Creates/updates timesheet with:
   - reviewerId: "e70433fd-c849-4433-b4bd-7588476adfd3"
   - status: "submitted"
   - submittedAt: current timestamp
5. Saves to database
6. Returns success response
```

**Database Record Created**:
```sql
INSERT INTO timesheets (
  id, tenant_id, employee_id, client_id, reviewer_id,
  week_start, week_end, daily_hours, total_hours,
  status, notes, submitted_at, created_at, updated_at
) VALUES (
  'uuid-123',
  '5eda5596-b1d9-4963-953d-7af9d0511ce8',
  '2d639e96-2f26-4577-8ce7-2570e5ca0ad0',
  'a3889c22-ace2-40f9-9f29-1a1556c0a444',
  'e70433fd-c849-4433-b4bd-7588476adfd3',  -- Pushban User
  '2025-10-06',
  '2025-10-12',
  '{"sat":0,"sun":0,"mon":8,"tue":8,"wed":8,"thu":8,"fri":8}',
  40.00,
  'submitted',
  'Worked on Cognizant project',
  NOW(),
  NOW(),
  NOW()
);
```

### Step 4: Shows in Timesheet Summary (Employee View)

**Screen**: Timesheets → Summary

**Query**:
```javascript
GET /api/timesheets/employee/:employeeId/all?tenantId=...
```

**Shows**:
```
Week Range: 06-Oct-2025 To 12-Oct-2025
Client: Cognizant
Hours: 40.0
Status: Submitted
Approver: Pushban User  ← SHOWS ASSIGNED APPROVER
Submitted: 07-Oct-2025
```

**Table Columns**:
- Week Range
- Client
- Total Hours
- Status (Badge: "Submitted")
- Approver Name ← NEW!
- Submitted Date
- Actions (View/Edit)

### Step 5: Shows in Admin Approval Page (Pushban View)

**Screen**: Timesheet Approval

**Query**:
```javascript
GET /api/timesheets/pending-approval?tenantId=...&reviewerId=e70433fd-c849-4433-b4bd-7588476adfd3
```

**Shows**:
```
Pending Approvals: 1

Card:
  Employee: Selvakumar Murugesan
  Department: Engineering
  Week: 06-Oct-2025 To 12-Oct-2025
  Client: Cognizant
  Total Hours: 40.0
  Status: Submitted for Approval
  Submitted: 07-Oct-2025
  Assigned To: Pushban User  ← SHOWS IT'S ASSIGNED TO THEM
  
  [Approve] [Reject] [View Details]
```

## Testing Steps

### Test 1: Submit Timesheet

1. **Login as Selvakumar** (employee)
2. **Go to**: Timesheets → Submit Timesheet
3. **Enter hours**:
   - Cognizant: Mon-Fri = 8 hours each
4. **Scroll down** to approver dropdown
5. **Select**: Pushban User
6. **Click**: Submit Internal Client Timesheet
7. **Verify**: Success message appears
8. **Verify**: Redirects to timesheet summary

**Expected Console Logs**:
```
📤 Submitting timesheet with approver: e70433fd-c849-4433-b4bd-7588476adfd3
📤 Submitting to API: {...}
✅ API Response: { success: true, ... }
```

### Test 2: Verify in Database

```bash
cd server
node scripts/check-submitted-timesheets.js
```

**Expected Output**:
```
✅ Found 1 submitted timesheets:

1. Timesheet ID: uuid-123
   Employee: Selvakumar Murugesan
   Email: selvakumar@selsoftinc.com
   Week: 2025-10-06 to 2025-10-12
   Status: submitted
   Total Hours: 40.00
   Reviewer: Pushban User (pushban@selsoftinc.com)
   Reviewer ID: e70433fd-c849-4433-b4bd-7588476adfd3
   Submitted At: 2025-10-07T...
```

### Test 3: Verify in Timesheet Summary

1. **Stay logged in as Selvakumar**
2. **Go to**: Timesheets → Summary
3. **Verify table shows**:
   - Week: 06-Oct-2025 To 12-Oct-2025
   - Status: Submitted (yellow badge)
   - Approver: Pushban User ← IMPORTANT!
   - Hours: 40.0

### Test 4: Verify in Admin Approval Page

1. **Logout**
2. **Login as Pushban** (admin)
3. **Go to**: Timesheets → Timesheet Approval
4. **Verify**:
   - Pending count: 1
   - Card shows Selvakumar's timesheet
   - Assigned to: Pushban User
   - Can approve/reject

## API Endpoints Used

### 1. GET /api/timesheets/reviewers
- **Purpose**: Fetch list of approvers for dropdown
- **Response**: List of admin/manager users
- **Status**: ✅ Working

### 2. POST /api/timesheets/submit
- **Purpose**: Save submitted timesheet
- **Payload**: Includes reviewerId
- **Response**: Success with timesheet ID
- **Status**: ✅ Implemented

### 3. GET /api/timesheets/pending-approval
- **Purpose**: Fetch timesheets for admin approval
- **Filter**: By reviewerId (optional)
- **Response**: List of submitted timesheets
- **Status**: ✅ Working

### 4. GET /api/timesheets/employee/:employeeId/all
- **Purpose**: Fetch employee's timesheet history
- **Response**: List with reviewer info
- **Status**: ✅ Working

## Database Schema

### timesheets table
```sql
CREATE TABLE timesheets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  client_id UUID,
  reviewer_id UUID,  ← STORES ASSIGNED APPROVER
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  daily_hours JSONB,
  total_hours DECIMAL(5,2),
  status VARCHAR(50),  ← 'submitted', 'approved', 'rejected'
  notes TEXT,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Troubleshooting

### Issue: Approver dropdown empty
**Solution**: Check backend server is running on port 5000

### Issue: Submit button disabled
**Solution**: Select an approver from dropdown

### Issue: Timesheet not appearing in summary
**Solution**: Check database with `check-submitted-timesheets.js`

### Issue: Admin doesn't see timesheet
**Solution**: Verify status is 'submitted' in database

## Summary

✅ **Backend Server**: Running on port 5000  
✅ **Reviewers API**: Returns 2 admins  
✅ **Submit API**: Saves with reviewerId  
✅ **Database**: Has reviewerId column  
✅ **Frontend**: Calls real APIs  
✅ **Approval Page**: Filters by reviewerId  

---

**Everything is implemented and ready to test! Follow the testing steps above to verify the complete flow.**
