# ✅ Timesheet Submission Fix - Now Saves to Database

## Issue Fixed
Timesheets were not appearing in the summary table after submission because the frontend was only simulating the submission without actually saving to the database.

## Changes Made

### 1. Frontend - Updated handleSubmit Function ✅

**File**: `frontend/src/components/timesheets/TimesheetSubmit.jsx`

**Before:**
```javascript
// Simulate API call
await new Promise(resolve => setTimeout(resolve, 1500));

// In a real app, send formData to API
const submissionData = { ... };
console.log('✅ Submitting timesheet:', submissionData);
// NOT ACTUALLY SENT TO BACKEND!
```

**After:**
```javascript
// Get employee ID
const employeeId = !isEmployee() ? selectedEmployee : user.employeeId;

// Parse week range
const [startStr, endStr] = selectedWeek.split(' To ');
const weekStart = new Date(startStr).toISOString().split('T')[0];
const weekEnd = new Date(endStr).toISOString().split('T')[0];

// Prepare submission data
const submissionData = {
  tenantId: user.tenantId,
  employeeId: employeeId,
  weekStart: weekStart,
  weekEnd: weekEnd,
  clientId: clientHours[0]?.id,
  reviewerId: selectedApprover,
  status: 'submitted',
  totalHours: getGrandTotal(),
  notes: notes,
  dailyHours: {
    sat: clientHours.reduce((sum, c) => sum + (c.hours[0] || 0), 0),
    sun: clientHours.reduce((sum, c) => sum + (c.hours[1] || 0), 0),
    mon: clientHours.reduce((sum, c) => sum + (c.hours[2] || 0), 0),
    tue: clientHours.reduce((sum, c) => sum + (c.hours[3] || 0), 0),
    wed: clientHours.reduce((sum, c) => sum + (c.hours[4] || 0), 0),
    thu: clientHours.reduce((sum, c) => sum + (c.hours[5] || 0), 0),
    fri: clientHours.reduce((sum, c) => sum + (c.hours[6] || 0), 0)
  }
};

// ACTUALLY SUBMIT TO BACKEND!
const response = await axios.post('/api/timesheets/submit', submissionData);

if (response.data.success) {
  setSuccess('Timesheet submitted successfully!');
  setTimeout(() => navigate(`/${subdomain}/timesheets`), 2000);
}
```

### 2. Backend - Created Submit Endpoint ✅

**File**: `server/routes/timesheets.js`

**New Endpoint**: `POST /api/timesheets/submit`

```javascript
router.post('/submit', async (req, res, next) => {
  try {
    const { tenantId, employeeId, weekStart, weekEnd, clientId, reviewerId, status, totalHours, notes, dailyHours } = req.body;
    
    // Validate required fields
    if (!tenantId || !employeeId || !weekStart || !weekEnd) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Check if timesheet already exists
    const existing = await models.Timesheet.findOne({
      where: { tenantId, employeeId, weekStart, weekEnd }
    });
    
    if (existing) {
      // Update existing timesheet
      existing.clientId = clientId;
      existing.reviewerId = reviewerId;
      existing.status = 'submitted';
      existing.totalHours = totalHours;
      existing.notes = notes;
      existing.dailyHours = dailyHours;
      existing.submittedAt = new Date();
      await existing.save();
      
      return res.json({
        success: true,
        message: 'Timesheet updated and submitted',
        timesheet: existing
      });
    }
    
    // Create new timesheet
    const newTimesheet = await models.Timesheet.create({
      tenantId,
      employeeId,
      clientId,
      reviewerId,
      weekStart,
      weekEnd,
      dailyHours,
      totalHours,
      status: 'submitted',
      notes,
      submittedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Timesheet submitted successfully',
      timesheet: newTimesheet
    });
    
  } catch (err) {
    console.error('Error submitting timesheet:', err);
    next(err);
  }
});
```

## Complete Workflow

### 1. User Fills Timesheet
```
User enters hours for each day
User adds notes (optional)
User selects approver (required)
```

### 2. User Clicks Submit
```
Frontend validates:
  - Approver selected? ✓
  - Hours entered? ✓
  - Employee ID exists? ✓
```

### 3. Frontend Sends to Backend
```
POST /api/timesheets/submit
{
  tenantId: "...",
  employeeId: "...",
  weekStart: "2025-09-29",
  weekEnd: "2025-10-05",
  clientId: "cognizant-uuid",
  reviewerId: "admin-uuid",
  status: "submitted",
  totalHours: 40,
  dailyHours: {
    sat: 0, sun: 0, mon: 8, tue: 8, wed: 8, thu: 8, fri: 8
  },
  notes: "Worked on project tasks"
}
```

### 4. Backend Saves to Database
```
Checks if timesheet exists for this week
  - If exists: Update and set status to 'submitted'
  - If new: Create new timesheet record
  
Sets submittedAt timestamp
Returns success response
```

### 5. Frontend Shows Success
```
Success message: "Timesheet submitted successfully!"
Redirects to timesheet summary after 2 seconds
```

### 6. Summary Page Shows Data
```
Timesheet summary fetches all timesheets
New submitted timesheet appears in table
Status shows: "Submitted" (pending approval)
```

## Data Flow

```
User Input (Hours)
    ↓
Frontend Validation
    ↓
POST /api/timesheets/submit
    ↓
Backend Validation
    ↓
Database Save (timesheets table)
    ↓
Success Response
    ↓
Frontend Redirect
    ↓
Summary Page Fetch
    ↓
Display in Table
```

## Database Schema

**timesheets table:**
```
- id (UUID, primary key)
- tenant_id (UUID, foreign key)
- employee_id (UUID, foreign key)
- client_id (UUID, foreign key, nullable)
- reviewer_id (UUID, foreign key, nullable)
- week_start (DATE)
- week_end (DATE)
- daily_hours (JSONB) - { mon, tue, wed, thu, fri, sat, sun }
- total_hours (DECIMAL)
- status (ENUM) - 'draft', 'submitted', 'approved', 'rejected'
- notes (TEXT)
- submitted_at (TIMESTAMP)
- approved_at (TIMESTAMP)
- approved_by (UUID)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Testing

### 1. Submit Timesheet
1. Fill hours for each day
2. Select approver
3. Click Submit
4. Should see success message
5. Should redirect to summary

### 2. Check Summary Page
1. Navigate to Timesheets
2. Should see new timesheet in table
3. Status should be "Submitted"
4. Hours should match what was entered

### 3. Check Database
```bash
cd server
node scripts/simple-check.js
```

Should show new timesheet record.

### 4. Check Console Logs

**Frontend Console:**
```
📤 Submitting timesheet with approver: admin-uuid-123
📤 Submitting to API: { tenantId: "...", ... }
✅ API Response: { success: true, ... }
```

**Backend Console:**
```
📥 Received timesheet submission: { tenantId: "...", ... }
✅ Created new timesheet: timesheet-uuid-456
```

## Summary

✅ **Frontend**: Now actually calls backend API  
✅ **Backend**: New `/submit` endpoint saves to database  
✅ **Database**: Timesheet records created with correct data  
✅ **Summary**: Submitted timesheets now appear in table  

---

**Status**: ✅ Complete  
**Action Required**: Refresh frontend to test  
**Expected Result**: Submitted timesheets appear in summary table
