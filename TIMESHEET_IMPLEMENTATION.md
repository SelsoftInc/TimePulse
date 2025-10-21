# Timesheet Implementation - Database Integration

## Overview
Removed all mock data from the timesheet screen and implemented full database integration with weekly cycle management.

---

## 🗄️ Database Implementation

### **1. Timesheets Table Created**
Located at: `server/database/migrations/2025-09-30_create_timesheets_table.sql`

**Schema:**
```sql
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Week range (Monday to Sunday)
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    
    -- Daily hours stored as JSONB
    daily_hours JSONB DEFAULT '{"mon": 0, "tue": 0, "wed": 0, "thu": 0, "fri": 0, "sat": 0, "sun": 0}'::jsonb,
    
    -- Total hours for the week
    total_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Status workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    
    -- Optional fields
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Approval tracking
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_timesheets_tenant`: On tenant_id for tenant filtering
- `idx_timesheets_employee`: On employee_id for employee filtering
- `idx_timesheets_client`: On client_id for client filtering
- `idx_timesheets_week`: On week_start, week_end for date range queries
- `idx_timesheets_status`: On status for workflow queries
- `idx_timesheets_unique_employee_week`: Unique constraint on (tenant_id, employee_id, week_start, week_end)

---

## 📊 Sequelize Model Updates

**File:** `server/models/index.js`

**Enhanced Fields Added:**
```javascript
notes: {
  type: DataTypes.TEXT,
  allowNull: true
},
attachments: {
  type: DataTypes.JSONB,
  defaultValue: [],
  allowNull: true
},
submittedAt: {
  type: DataTypes.DATE,
  allowNull: true,
  field: 'submitted_at'
},
approvedAt: {
  type: DataTypes.DATE,
  allowNull: true,
  field: 'approved_at'
},
approvedBy: {
  type: DataTypes.UUID,
  allowNull: true,
  field: 'approved_by',
  references: { model: 'users', key: 'id' }
},
rejectionReason: {
  type: DataTypes.TEXT,
  allowNull: true,
  field: 'rejection_reason'
}
```

---

## 🔌 API Endpoints

**File:** `server/routes/timesheets.js`

### **1. GET /api/timesheets/current**
Get all timesheets for current week (creates if not exists)

**Query Parameters:**
- `tenantId` (required): UUID of the tenant

**Response:**
```json
{
  "success": true,
  "weekStart": "2025-09-29",
  "weekEnd": "2025-10-05",
  "timesheets": [
    {
      "id": "uuid",
      "employee": { "id": "uuid", "name": "John Doe", "role": "Developer" },
      "client": "ACME Corp",
      "project": "Project for ACME Corp",
      "week": "Sep 29 - Oct 5",
      "weekStart": "2025-09-29",
      "weekEnd": "2025-10-05",
      "hours": "40.0",
      "status": { "label": "DRAFT", "color": "secondary" },
      "dailyHours": { "mon": 8, "tue": 8, "wed": 8, "thu": 8, "fri": 8, "sat": 0, "sun": 0 }
    }
  ]
}
```

### **2. GET /api/timesheets/employee/:employeeId/current**
Get current week's timesheet for a specific employee

**Query Parameters:**
- `tenantId` (required): UUID of the tenant

**Response:**
```json
{
  "success": true,
  "timesheet": {
    "id": "uuid",
    "employee": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "client": {
      "id": "uuid",
      "name": "ACME Corp"
    },
    "weekStart": "2025-09-29",
    "weekEnd": "2025-10-05",
    "weekLabel": "Sep 29 - Oct 5, 2025",
    "dailyHours": { "mon": 0, "tue": 0, "wed": 0, "thu": 0, "fri": 0, "sat": 0, "sun": 0 },
    "totalHours": 0,
    "status": "draft",
    "notes": null,
    "attachments": [],
    "submittedAt": null,
    "created": true
  }
}
```

### **3. GET /api/timesheets/:id**
Get a specific timesheet by ID

**Response:**
```json
{
  "success": true,
  "timesheet": { /* full timesheet object */ }
}
```

### **4. PUT /api/timesheets/:id**
Update a timesheet (hours, status, notes, attachments)

**Request Body:**
```json
{
  "dailyHours": {
    "mon": 8,
    "tue": 8,
    "wed": 8,
    "thu": 8,
    "fri": 8,
    "sat": 0,
    "sun": 0
  },
  "status": "submitted",
  "notes": "Worked on feature X",
  "attachments": [
    { "name": "file1.pdf", "size": 12345 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "timesheet": { /* updated timesheet */ },
  "message": "Timesheet updated successfully"
}
```

---

## 🎨 Frontend Implementation

**File:** `frontend/src/components/timesheets/EmployeeTimesheet.jsx`

### **Changes Made:**

**1. Removed Mock Data:**
- ❌ Removed hardcoded `employeeData`
- ❌ Removed hardcoded `sowData`
- ❌ Removed hardcoded `currentWeek`

**2. Added Real API Integration:**
```javascript
// Fetch timesheet on component mount
useEffect(() => {
  const fetchTimesheet = async () => {
    const response = await apiFetch(
      `/api/timesheets/employee/${employeeId}/current?tenantId=${user.tenantId}`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    // Set state with real data
  };
  fetchTimesheet();
}, [employeeId, user?.tenantId]);
```

**3. Enhanced Form Submission:**
```javascript
const handleSubmit = async (isDraft = false) => {
  const updateData = {
    dailyHours: weeklyHours,
    status: isDraft ? 'draft' : 'submitted',
    notes: notes,
    attachments: files.map(f => ({ name: f.name, size: f.size }))
  };
  
  await apiFetch(`/api/timesheets/${timesheetId}`, {
    method: 'PUT',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
};
```

**4. New Features:**
- ✅ **Loading State**: Shows spinner while fetching data
- ✅ **Error Handling**: Toast notifications for errors
- ✅ **Status Badges**: Visual indicators for submitted/approved timesheets
- ✅ **Disabled Inputs**: Prevents editing of submitted timesheets
- ✅ **Validation**: Requires at least 1 hour to submit
- ✅ **Auto-save**: Tracks submission state with loading indicators

---

## 📅 Weekly Cycle Logic

**Monday-to-Sunday Week:**
```javascript
const getWeekRangeMonToSun = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { weekStart: monday, weekEnd: sunday };
};
```

**Auto-creation:**
- Timesheets are automatically created when accessed for the first time
- Each employee gets one timesheet per week
- Unique constraint prevents duplicates

---

## 🚀 Running the Migration

### **Option 1: Using the Migration Script**
```bash
cd server
node scripts/migrate-timesheets.js
```

### **Option 2: Manual SQL Execution**
```bash
# PostgreSQL
psql -U your_user -d your_database -f database/migrations/2025-09-30_create_timesheets_table.sql

# SQLite (if using SQLite)
sqlite3 your_database.db < database/migrations/2025-09-30_create_timesheets_table.sql
```

### **Option 3: Via Sequelize Sync**
The model will auto-sync if you have `sequelize.sync()` enabled in your startup code.

---

## ✅ Testing Checklist

### **Backend Tests:**
- [ ] Run migration script successfully
- [ ] Verify timesheets table exists
- [ ] Test GET /api/timesheets/current endpoint
- [ ] Test GET /api/timesheets/employee/:id/current endpoint
- [ ] Test PUT /api/timesheets/:id endpoint
- [ ] Verify auto-creation of timesheets
- [ ] Verify unique constraint works

### **Frontend Tests:**
1. **Loading State:**
   - [ ] Spinner shows while fetching
   - [ ] Data loads correctly after fetch

2. **Form Functionality:**
   - [ ] Can enter hours for each day
   - [ ] Total hours calculate correctly
   - [ ] Can add notes
   - [ ] Can attach files (metadata tracked)

3. **Submission:**
   - [ ] Can save as draft
   - [ ] Can submit for approval
   - [ ] Submit button disabled with 0 hours
   - [ ] Success toast appears on save
   - [ ] Error toast appears on failure

4. **Status Management:**
   - [ ] Draft timesheets are editable
   - [ ] Submitted timesheets are read-only
   - [ ] Status badge displays correctly
   - [ ] Info message shows for submitted timesheets

5. **Error Handling:**
   - [ ] Shows error if employee not found
   - [ ] Shows error if API fails
   - [ ] Gracefully handles network errors

---

## 🔐 Security Considerations

1. **Authorization**: Always verify `tenantId` matches authenticated user's tenant
2. **Validation**: Backend validates all input data
3. **SQL Injection**: Using parameterized queries via Sequelize
4. **File Uploads**: Only metadata stored (actual file upload to be implemented separately)

---

## 📝 Future Enhancements

1. **Actual File Upload**: Implement S3/Azure Blob storage for attachments
2. **Week Navigation**: Add prev/next week navigation
3. **Timesheet History**: View past weeks' timesheets
4. **Approval Workflow**: Manager approval interface
5. **Overtime Calculation**: Automatic overtime hours detection
6. **Email Notifications**: Notify on submission/approval
7. **Mobile App Support**: API ready for mobile consumption
8. **Bulk Operations**: Submit multiple weeks at once
9. **Comments/Feedback**: Allow approvers to add comments
10. **Analytics**: Weekly/monthly reports and trends

---

## 🎯 Key Benefits

✅ **No More Mock Data**: All data comes from database  
✅ **Weekly Cycle**: Automatic Monday-Sunday week management  
✅ **Auto-creation**: Timesheets created on first access  
✅ **Status Workflow**: Draft → Submitted → Approved/Rejected  
✅ **Multi-tenant**: Fully isolated by tenant  
✅ **Audit Trail**: Created/updated timestamps, approval tracking  
✅ **Scalable**: Proper indexes for performance  
✅ **Type Safe**: JSONB for flexible daily hours storage  

---

## 📚 Related Files

**Backend:**
- `server/models/index.js` - Timesheet model definition
- `server/routes/timesheets.js` - API endpoints
- `server/database/migrations/2025-09-30_create_timesheets_table.sql` - Migration
- `server/scripts/migrate-timesheets.js` - Migration script

**Frontend:**
- `frontend/src/components/timesheets/EmployeeTimesheet.jsx` - Main component
- `frontend/src/components/timesheets/EmployeeTimesheet.css` - Styling

---

## 🐛 Troubleshooting

**Issue:** Migration fails with "uuid_generate_v4() does not exist"  
**Solution:** Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` in PostgreSQL

**Issue:** Timesheet not loading  
**Solution:** Check browser console for API errors, verify tenantId is correct

**Issue:** Can't submit timesheet  
**Solution:** Ensure at least 1 hour is entered, check status is 'draft'

**Issue:** Unique constraint violation  
**Solution:** Timesheet already exists for this employee/week combination

---

**Implementation Date:** September 30, 2025  
**Status:** ✅ Complete and Ready for Testing
