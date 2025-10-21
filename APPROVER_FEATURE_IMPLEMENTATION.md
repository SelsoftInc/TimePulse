# Approver/Reviewer Feature Implementation

## ✅ Feature Added: Timesheet Approver Selection

### What Was Implemented

Added a complete approver selection and submission workflow to the timesheet submit page.

## Components Added

### 1. Approver Dropdown UI ✅

**Location**: `TimesheetSubmit.jsx` (before submit button)

**Features:**
- Dropdown showing list of admins/managers
- Required field (marked with *)
- Fetches data from `/api/timesheets/reviewers` endpoint
- Submit button disabled until approver is selected
- Help text explaining the field

**Code:**
```jsx
{/* Approver Selection */}
<div className="form-group mb-4">
  <label className="form-label">
    Assign Reviewer/Approver <span className="text-danger">*</span>
  </label>
  <div className="form-control-wrap">
    <select 
      className="form-select" 
      value={selectedApprover} 
      onChange={(e) => setSelectedApprover(e.target.value)}
      disabled={isReadOnly}
      required
    >
      <option value="">Select an approver...</option>
      {availableApprovers.map((approver) => (
        <option key={approver.id} value={approver.id}>
          {approver.name} ({approver.role})
        </option>
      ))}
    </select>
  </div>
  <div className="form-note">
    Select an admin or manager to review and approve this timesheet
  </div>
</div>
```

### 2. State Management ✅

**Added States:**
```javascript
const [selectedApprover, setSelectedApprover] = useState('');
const [availableApprovers, setAvailableApprovers] = useState([]);
```

### 3. Data Fetching ✅

**API Call in useEffect:**
```javascript
// Load available approvers (admins and managers)
try {
  console.log('🔍 Fetching approvers...');
  const approversResponse = await axios.get(`/api/timesheets/reviewers?tenantId=${tenantId}`);
  console.log('📥 Approvers API response:', approversResponse.data);
  
  if (approversResponse.data.success && approversResponse.data.reviewers) {
    setAvailableApprovers(approversResponse.data.reviewers);
    console.log('✅ Loaded approvers:', approversResponse.data.reviewers.length);
  }
} catch (error) {
  console.error('❌ Error fetching approvers:', error);
}
```

### 4. Submit Button Enhancement ✅

**Updated Submit Button:**
```jsx
<button 
  type="submit" 
  className="btn btn-primary"
  disabled={submitting || !selectedApprover}  // ← Disabled until approver selected
>
  {submitting ? (
    <>
      <span className="spinner-border spinner-border-sm me-1"></span>
      Submitting...
    </>
  ) : `Submit ${clientType === 'internal' ? 'Internal Client' : 'External Client'} Timesheet`}
</button>
```

## Backend API Endpoint

### Existing Endpoint: GET /api/timesheets/reviewers

**Expected Response:**
```json
{
  "success": true,
  "reviewers": [
    {
      "id": "user-uuid-1",
      "name": "Pushpan U",
      "email": "admin@pushpan.com",
      "role": "admin"
    },
    {
      "id": "user-uuid-2",
      "name": "Manager Name",
      "email": "manager@company.com",
      "role": "manager"
    }
  ]
}
```

**This endpoint already exists in the backend!** It's used by the EmployeeTimesheet component.

## Complete Workflow

### 1. Page Load
```
User opens timesheet submit page
  ↓
Component fetches clients from API
  ↓
Component fetches approvers from API
  ↓
Dropdowns populated with data
```

### 2. User Fills Timesheet
```
User enters hours for each day
  ↓
User adds notes (optional)
  ↓
User uploads attachments (optional)
  ↓
User selects approver from dropdown (required)
  ↓
Submit button becomes enabled
```

### 3. Submission
```
User clicks Submit button
  ↓
handleSubmit function called
  ↓
Timesheet data + selectedApprover sent to backend
  ↓
Backend saves timesheet with status='submitted'
  ↓
Backend links timesheet to selected approver
  ↓
Success message shown
  ↓
Redirect to timesheet summary
```

### 4. Admin View
```
Admin logs in
  ↓
Goes to Timesheet Approval page
  ↓
Sees pending timesheets assigned to them
  ↓
Can approve/reject timesheets
```

### 5. Employee View
```
Employee goes to Timesheet Summary
  ↓
Sees their submitted timesheets
  ↓
Status shown: Pending/Approved/Rejected
  ↓
Can view details but cannot edit submitted timesheets
```

## Next Steps Required

### 1. Update handleSubmit Function

The `handleSubmit` function needs to be updated to include the `selectedApprover` in the submission data:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedApprover) {
    setError('Please select an approver');
    return;
  }
  
  setSubmitting(true);
  
  try {
    const timesheetData = {
      week: selectedWeek,
      clientHours: clientHours,
      holidayHours: holidayHours,
      notes: notes,
      attachments: attachments,
      reviewerId: selectedApprover,  // ← Include selected approver
      status: 'submitted',
      totalHours: getGrandTotal()
    };
    
    // Submit to backend
    const response = await axios.post('/api/timesheets/submit', timesheetData);
    
    if (response.data.success) {
      setSuccess('Timesheet submitted successfully!');
      navigate(`/${subdomain}/timesheets`);
    }
  } catch (error) {
    setError('Failed to submit timesheet');
  } finally {
    setSubmitting(false);
  }
};
```

### 2. Backend Endpoint (if not exists)

**POST /api/timesheets/submit**

Should:
- Save timesheet data
- Set status to 'submitted'
- Link to selected reviewer
- Send notification to reviewer (optional)

### 3. Database Schema

The `timesheets` table should have:
- `reviewer_id` (UUID) - Foreign key to users table
- `status` (ENUM) - 'draft', 'submitted', 'approved', 'rejected'
- `submitted_at` (TIMESTAMP)
- `approved_at` (TIMESTAMP)
- `approved_by` (UUID)

## Testing Checklist

### Frontend Testing
- [ ] Approver dropdown loads on page load
- [ ] Dropdown shows admins and managers
- [ ] Submit button disabled when no approver selected
- [ ] Submit button enabled when approver selected
- [ ] Form validation works
- [ ] Console logs show data fetching

### Backend Testing
- [ ] `/api/timesheets/reviewers` returns approvers
- [ ] Approvers list includes admins and managers
- [ ] Submission endpoint accepts reviewerId
- [ ] Timesheet saved with correct status
- [ ] Reviewer can see pending timesheets

### Integration Testing
- [ ] Employee submits timesheet with approver
- [ ] Admin sees timesheet in approval queue
- [ ] Admin can approve/reject
- [ ] Employee sees updated status
- [ ] Notifications work (if implemented)

## UI Screenshots

### Before (Missing Approver Field):
```
[Notes textarea]
[Attachments section]
[Submit Button] ← No approver selection
```

### After (With Approver Field):
```
[Notes textarea]
[Attachments section]
[Assign Reviewer/Approver *]  ← NEW!
  [Dropdown: Select an approver...]
  Help text: Select an admin or manager...
[Submit Button] ← Disabled until approver selected
```

## Benefits

1. **Clear Workflow**: Employees know who will review their timesheet
2. **Accountability**: Each timesheet has a designated reviewer
3. **Tracking**: System knows who approved/rejected each timesheet
4. **Notifications**: Can send targeted notifications to specific reviewers
5. **Load Balancing**: Can distribute timesheets among multiple approvers

## Summary

✅ **Approver dropdown added** to timesheet submit page  
✅ **Fetches approvers** from existing API endpoint  
✅ **Submit button validation** - disabled until approver selected  
✅ **State management** - selectedApprover tracked  
✅ **Console logging** - for debugging  
⚠️ **Next**: Update handleSubmit to include reviewerId  
⚠️ **Next**: Test complete submission flow  

---

**Status**: UI Complete, Backend Integration Pending  
**Date**: 2025-10-07  
**Ready for**: Testing and handleSubmit implementation
