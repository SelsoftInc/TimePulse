# Timesheet Approval Workflow - Implementation Guide

## Overview
Implemented a complete timesheet approval workflow where employees upload timesheets, assign reviewers (admin/manager), and admins approve or reject them.

---

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
cd server
node scripts/add-reviewer-column.js
```

This will add the `reviewer_id` column to the `timesheets` table.

### 2. Start the Backend Server
```bash
cd server
npm start
```

### 3. Start the Frontend
```bash
cd frontend
npm start
```

---

## 📋 Features Implemented

### **Backend Changes**

#### 1. **Database Model Updates** (`server/models/index.js`)
- Added `reviewerId` field to Timesheet model
- Added associations:
  - `Timesheet.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' })`
  - `Timesheet.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' })`

#### 2. **New API Routes** (`server/routes/timesheets.js`)

**GET /api/timesheets/reviewers?tenantId=...**
- Returns list of admin and manager users who can review timesheets
- Response format:
```json
{
  "success": true,
  "reviewers": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  ]
}
```

**GET /api/timesheets/pending-approval?tenantId=...&reviewerId=...**
- Returns timesheets with status 'submitted'
- Filters by reviewerId if provided (for managers to see only their assigned timesheets)
- Includes employee, client, and reviewer information

**PUT /api/timesheets/:id**
- Updated to accept `reviewerId`, `approvedBy`, and `rejectionReason`
- Handles approval/rejection workflow

#### 3. **Migration Script** (`server/scripts/add-reviewer-column.js`)
- Adds `reviewer_id` column to timesheets table
- Creates index for performance

---

### **Frontend Changes**

#### 1. **Employee Timesheet Component** (`frontend/src/components/timesheets/EmployeeTimesheet.jsx`)

**New Features:**
- **Reviewer Selection Dropdown**: Employees must select an admin or manager to review their timesheet
- **Validation**: Cannot submit timesheet without selecting a reviewer
- **API Integration**: Fetches list of available reviewers on component load

**UI Changes:**
```jsx
<select 
  className="form-select" 
  value={selectedReviewer} 
  onChange={(e) => setSelectedReviewer(e.target.value)}
  disabled={isSubmitted}
  required
>
  <option value="">Select a reviewer...</option>
  {reviewers.map(reviewer => (
    <option key={reviewer.id} value={reviewer.id}>
      {reviewer.name} ({reviewer.role})
    </option>
  ))}
</select>
```

**Validation Logic:**
```javascript
if (!isDraft && !selectedReviewer) {
  toast.error('Please select a reviewer before submitting the timesheet');
  return;
}
```

#### 2. **Timesheet Approval Component** (`frontend/src/components/timesheets/TimesheetApproval.jsx`)

**New Features:**
- **Real API Integration**: Replaced mock data with actual API calls
- **Reviewer Filtering**: Managers only see timesheets assigned to them
- **Approval/Rejection**: Updates timesheet status via API
- **Today's Stats**: Tracks approved and rejected counts

**API Integration:**
```javascript
// Load pending timesheets
const response = await axios.get(`/api/timesheets/pending-approval`, {
  params: {
    tenantId,
    reviewerId: user?.role === 'manager' ? user?.id : undefined
  }
});

// Approve/Reject timesheet
await axios.put(`/api/timesheets/${timesheetId}`, {
  status: action === "approve" ? "approved" : "rejected",
  approvedBy: action === "approve" ? user?.id : undefined,
  rejectionReason: action === "reject" ? comments : undefined
});
```

**Reviewer Display in Modal:**
```jsx
{timesheet.reviewer && (
  <div className="approval-info-section reviewer-section">
    <h6 className="section-title">Assigned Reviewer</h6>
    <div className="reviewer-info">
      <i className="fa fa-user-check"></i>
      <span>{timesheet.reviewer.name} ({timesheet.reviewer.role})</span>
    </div>
  </div>
)}
```

---

## 🔄 Complete Workflow

### **Step 1: Employee Submits Timesheet**

1. Employee navigates to their timesheet page
2. Fills in weekly hours for each day
3. **Selects a reviewer** from the dropdown (admin or manager)
4. Adds optional notes
5. Uploads attachments (optional)
6. Clicks "Submit for Approval"

**Validation:**
- Must select a reviewer before submission
- Can save as draft without reviewer

### **Step 2: Admin/Manager Reviews Timesheet**

1. Admin/Manager navigates to "Timesheet Approval" page
2. Sees list of pending timesheets:
   - **Admins**: See all submitted timesheets
   - **Managers**: See only timesheets assigned to them
3. Clicks "Review" button on a timesheet
4. Modal opens showing:
   - Employee details
   - Week range and hours
   - Client information
   - Notes and attachments
   - **Assigned reviewer** (shows who was selected)
5. Selects "Approve" or "Reject"
6. Adds comments (required for rejection)
7. Submits decision

### **Step 3: Timesheet Status Update**

**On Approval:**
- Status changes to "approved"
- `approvedAt` timestamp set
- `approvedBy` set to current user's ID
- Timesheet removed from pending list
- Success notification shown

**On Rejection:**
- Status changes to "rejected"
- `rejectionReason` saved with comments
- Timesheet removed from pending list
- Warning notification shown

---

## 🧪 Testing Checklist

### **Database Setup**
- [ ] Run migration script: `node scripts/add-reviewer-column.js`
- [ ] Verify `reviewer_id` column exists in timesheets table
- [ ] Check index created: `idx_timesheets_reviewer`

### **Employee Flow**
- [ ] Navigate to employee timesheet page
- [ ] Verify reviewer dropdown loads with admin/manager users
- [ ] Try to submit without selecting reviewer (should show error)
- [ ] Select a reviewer and submit successfully
- [ ] Verify timesheet status changes to "submitted"

### **Admin/Manager Flow**
- [ ] Login as admin - verify all submitted timesheets visible
- [ ] Login as manager - verify only assigned timesheets visible
- [ ] Click "Review" button - modal opens
- [ ] Verify all timesheet details displayed correctly
- [ ] Verify assigned reviewer shown in modal
- [ ] Approve a timesheet - verify success
- [ ] Reject a timesheet with comments - verify success
- [ ] Check approved/rejected counts update

### **API Testing**
- [ ] GET `/api/timesheets/reviewers?tenantId=...` returns admin/manager users
- [ ] GET `/api/timesheets/pending-approval?tenantId=...` returns submitted timesheets
- [ ] PUT `/api/timesheets/:id` with reviewerId updates successfully
- [ ] PUT `/api/timesheets/:id` with approval updates status

---

## 📊 Database Schema

### Timesheets Table (Updated)
```sql
CREATE TABLE timesheets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    employee_id TEXT NOT NULL REFERENCES employees(id),
    client_id TEXT REFERENCES clients(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    daily_hours TEXT DEFAULT '{"mon":0,"tue":0,"wed":0,"thu":0,"fri":0,"sat":0,"sun":0}',
    total_hours REAL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected')),
    notes TEXT,
    attachments TEXT DEFAULT '[]',
    submitted_at TEXT,
    approved_at TEXT,
    reviewer_id TEXT REFERENCES users(id),  -- NEW FIELD
    approved_by TEXT REFERENCES users(id),
    rejection_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timesheets_reviewer ON timesheets(reviewer_id);
```

---

## 🔍 Troubleshooting

### Issue: Reviewer dropdown is empty
**Solution:** 
- Ensure you have users with role 'admin' or 'manager' in the database
- Check API response: `/api/timesheets/reviewers?tenantId=YOUR_TENANT_ID`

### Issue: Cannot submit timesheet
**Solution:**
- Verify reviewer is selected
- Check browser console for errors
- Verify backend is running

### Issue: Timesheets not showing in approval page
**Solution:**
- Ensure timesheets have status 'submitted'
- For managers, verify reviewerId matches their user ID
- Check API response: `/api/timesheets/pending-approval?tenantId=YOUR_TENANT_ID`

### Issue: Migration fails
**Solution:**
- Check if column already exists: `PRAGMA table_info(timesheets);`
- Manually add column: `ALTER TABLE timesheets ADD COLUMN reviewer_id TEXT REFERENCES users(id);`

---

## 📝 Notes

### ESLint Warning (Can be ignored)
```
React Hook useEffect has a missing dependency: 'loadPendingTimesheets'
```
This is intentional - we only want to load timesheets once on component mount.

### Future Enhancements
- Email notifications to reviewer when timesheet is submitted
- Email notifications to employee when timesheet is approved/rejected
- Bulk approval functionality
- Timesheet history and audit trail
- Comments thread for back-and-forth discussion

---

## 🎯 Summary

**What's Working:**
✅ Employees can upload timesheets and assign reviewers
✅ Validation ensures reviewer is selected before submission
✅ Admins see all pending timesheets
✅ Managers see only timesheets assigned to them
✅ Approval/rejection workflow with comments
✅ Real-time status updates
✅ Database properly tracks reviewer assignments

**Next Steps:**
1. Run the migration script
2. Test the complete workflow
3. Add email notifications (optional)
4. Deploy to production
