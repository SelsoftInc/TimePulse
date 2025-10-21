# Leave Management Database Schema

## Overview
Created comprehensive database schema for leave management system with two main tables: `leave_requests` and `leave_balances`.

## Database Tables

### 1. leave_requests
Stores all employee leave requests with approval workflow.

**Columns**:
- `id` (UUID, PK) - Unique identifier
- `employee_id` (UUID, FK → employees) - Employee requesting leave
- `tenant_id` (UUID, FK → tenants) - Organization
- `leave_type` (ENUM) - vacation, sick, personal, unpaid, other
- `start_date` (DATE) - Leave start date
- `end_date` (DATE) - Leave end date
- `total_days` (DECIMAL) - Number of days (supports half days)
- `reason` (TEXT) - Reason for leave
- `status` (ENUM) - pending, approved, rejected, cancelled
- `attachment_url` (VARCHAR) - URL to uploaded file
- `attachment_name` (VARCHAR) - Original filename
- `reviewed_by` (UUID, FK → users) - Approver/Rejector
- `reviewed_at` (TIMESTAMP) - When reviewed
- `review_comments` (TEXT) - Approval/rejection comments
- `created_at` (TIMESTAMP) - Request submission time
- `updated_at` (TIMESTAMP) - Last update time

**Indexes**:
- `(employee_id, tenant_id)` - Fast employee queries
- `(status)` - Filter by status
- `(start_date, end_date)` - Date range queries
- `(tenant_id, status)` - Tenant-wide status queries

**Foreign Keys**:
- `employee_id` → `employees(id)` ON DELETE CASCADE
- `tenant_id` → `tenants(id)` ON DELETE CASCADE
- `reviewed_by` → `users(id)`

### 2. leave_balances
Tracks employee leave balances by year and type.

**Columns**:
- `id` (UUID, PK) - Unique identifier
- `employee_id` (UUID, FK → employees) - Employee
- `tenant_id` (UUID, FK → tenants) - Organization
- `year` (INTEGER) - Calendar year
- `leave_type` (ENUM) - vacation, sick, personal, unpaid, other
- `total_days` (DECIMAL) - Total allocated days
- `used_days` (DECIMAL) - Days used (approved)
- `pending_days` (DECIMAL) - Days in pending requests
- `carry_forward_days` (DECIMAL) - Days from previous year
- `created_at` (TIMESTAMP) - Record creation
- `updated_at` (TIMESTAMP) - Last update

**Indexes**:
- `(employee_id, tenant_id)` - Fast employee queries
- `(tenant_id, year)` - Year-based queries

**Unique Constraint**:
- `(employee_id, tenant_id, year, leave_type)` - One balance per employee/year/type

**Foreign Keys**:
- `employee_id` → `employees(id)` ON DELETE CASCADE
- `tenant_id` → `tenants(id)` ON DELETE CASCADE

## Setup Instructions

### Option 1: Run Migration Script (Recommended)

```bash
cd server
psql -U postgres -d timepulse_db -f migrations/create-leave-tables.sql
```

### Option 2: Manual SQL

```sql
-- Copy and paste the SQL from migrations/create-leave-tables.sql
```

### Option 3: Sequelize Sync (Development Only)

Temporarily enable sync in `server/models/index.js`:

```javascript
// Uncomment this line
await sequelize.sync({ alter: true });
```

Then restart server. **Warning**: This may modify existing tables.

## Sequelize Models

### LeaveRequest Model
Location: `/server/models/LeaveRequest.js`

```javascript
const leaveRequest = await LeaveRequest.create({
  employeeId: 'uuid',
  tenantId: 'uuid',
  leaveType: 'vacation',
  startDate: '2025-10-15',
  endDate: '2025-10-19',
  totalDays: 5,
  reason: 'Family vacation',
  status: 'pending'
});
```

### LeaveBalance Model
Location: `/server/models/LeaveBalance.js`

```javascript
const balance = await LeaveBalance.create({
  employeeId: 'uuid',
  tenantId: 'uuid',
  year: 2025,
  leaveType: 'vacation',
  totalDays: 15,
  usedDays: 0,
  pendingDays: 0,
  carryForwardDays: 0
});
```

## Model Associations

```javascript
// Employee → Leave Requests (One to Many)
Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId' });

// Employee → Leave Balances (One to Many)
Employee.hasMany(LeaveBalance, { foreignKey: 'employeeId' });
LeaveBalance.belongsTo(Employee, { foreignKey: 'employeeId' });

// User → Leave Requests (as Reviewer)
User.hasMany(LeaveRequest, { foreignKey: 'reviewedBy' });
LeaveRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
```

## Cascade Delete Behavior

When an employee is deleted:
- ✅ All their `leave_requests` are automatically deleted (CASCADE)
- ✅ All their `leave_balances` are automatically deleted (CASCADE)

This is handled at the database level via foreign key constraints.

## Sample Data

### Initialize Leave Balances for New Employee

```sql
-- Vacation: 15 days
INSERT INTO leave_balances (employee_id, tenant_id, year, leave_type, total_days)
VALUES ('employee-uuid', 'tenant-uuid', 2025, 'vacation', 15);

-- Sick: 10 days
INSERT INTO leave_balances (employee_id, tenant_id, year, leave_type, total_days)
VALUES ('employee-uuid', 'tenant-uuid', 2025, 'sick', 10);

-- Personal: 5 days
INSERT INTO leave_balances (employee_id, tenant_id, year, leave_type, total_days)
VALUES ('employee-uuid', 'tenant-uuid', 2025, 'personal', 5);
```

### Create Leave Request

```sql
INSERT INTO leave_requests (
  employee_id, tenant_id, leave_type, 
  start_date, end_date, total_days, 
  reason, status
) VALUES (
  'employee-uuid', 'tenant-uuid', 'vacation',
  '2025-10-15', '2025-10-19', 5,
  'Family vacation', 'pending'
);
```

## Query Examples

### Get Employee's Leave Balance

```sql
SELECT 
  leave_type,
  total_days,
  used_days,
  pending_days,
  (total_days - used_days - pending_days) as remaining_days
FROM leave_balances
WHERE employee_id = 'uuid' 
  AND tenant_id = 'uuid'
  AND year = 2025;
```

### Get Pending Leave Requests for Approval

```sql
SELECT 
  lr.*,
  e.first_name || ' ' || e.last_name as employee_name,
  e.email as employee_email
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
WHERE lr.tenant_id = 'uuid'
  AND lr.status = 'pending'
ORDER BY lr.created_at ASC;
```

### Get Employee Leave History

```sql
SELECT *
FROM leave_requests
WHERE employee_id = 'uuid'
  AND tenant_id = 'uuid'
  AND status IN ('approved', 'rejected')
ORDER BY start_date DESC;
```

## Next Steps

1. **Run Migration**: Create the tables in your database
2. **Seed Data**: Initialize leave balances for existing employees
3. **Update API**: Modify `/server/routes/leaveManagement.js` to use real data
4. **Test**: Verify CRUD operations work correctly

## Benefits

✅ **Persistent Storage**: Leave data saved in database
✅ **Referential Integrity**: Foreign keys ensure data consistency
✅ **Cascade Deletes**: Automatic cleanup when employee deleted
✅ **Audit Trail**: Track who approved/rejected and when
✅ **Flexible**: Supports multiple leave types
✅ **Scalable**: Indexed for performance
✅ **Year-based**: Separate balances per year
✅ **Fractional Days**: Support half-day leaves

## Migration Checklist

- [ ] Run migration script to create tables
- [ ] Verify tables created: `\dt` in psql
- [ ] Initialize leave balances for existing employees
- [ ] Update API routes to use database models
- [ ] Update frontend to handle real data
- [ ] Test create, read, update, delete operations
- [ ] Test cascade deletes
- [ ] Add validation and business logic
