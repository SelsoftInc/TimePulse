# Employee-User Synchronization Fix

## Problem

Two issues were identified:

1. **Name Update Not Syncing**: When updating employee name (e.g., "Selvakumar Test" → "Selvakumar Murugesan"), the change only updated the Employee table but not the linked User table. User Management screen still showed old name.

2. **Orphaned Users**: When deleting employees (David Brown, Emily Wilson), their user accounts remained in the Users table, still visible in User Management.

## Root Cause

The application has two separate tables:
- **employees** - Employee records
- **users** - User accounts for login

They are linked via `employee.userId → user.id`, but updates/deletes were not being synchronized.

## Solutions Implemented

### 1. Employee Update - Sync Names to User Table

**File**: `/server/routes/employees.js`

**Change**: When updating employee firstName/lastName, also update the linked user record.

```javascript
// Update employee record
await employee.update(updateData);

// If firstName or lastName changed, also update the linked User record
if ((updateData.firstName || updateData.lastName) && employee.userId) {
  const user = await models.User.findByPk(employee.userId);
  if (user) {
    const userUpdate = {};
    if (updateData.firstName) userUpdate.firstName = updateData.firstName;
    if (updateData.lastName) userUpdate.lastName = updateData.lastName;
    await user.update(userUpdate);
  }
}
```

### 2. Employee Delete - Also Delete User Account

**File**: `/server/routes/employees.js`

**Change**: When deleting employee, also delete their linked user account.

```javascript
// Store userId before deleting employee
const userId = employee.userId;

// Delete the employee
await employee.destroy();

// Delete the linked user account if exists
if (userId) {
  const user = await models.User.findByPk(userId);
  if (user) {
    await user.destroy();
    deletedRecords.user = true;
  }
}
```

## Cleanup Scripts

### Script 1: Sync Existing Employee Names to Users

**File**: `/server/syncEmployeeUserNames.js`

**Purpose**: One-time sync to update user names from employee records

**Run**:
```bash
cd server
node syncEmployeeUserNames.js
```

**What it does**:
- Finds all employees with linked user accounts
- Compares names between employee and user
- Updates user names to match employee names

### Script 2: Cleanup Orphaned Users

**File**: `/server/cleanupOrphanedUsers.js`

**Purpose**: Delete user accounts without corresponding employee records

**Run**:
```bash
cd server
node cleanupOrphanedUsers.js
```

**What it does**:
- Finds all users
- Checks if each user has a corresponding employee
- Deletes users without employees (orphaned accounts)
- Reports: David Brown, Emily Wilson, etc.

## Testing

### Test Name Update Sync

1. Login as employee (e.g., selvakumar@selsoftinc.com)
2. Go to Settings → Update name
3. Change name from "Selvakumar Test" to "Selvakumar Murugesan"
4. Save
5. Admin logs in → User Management
6. ✅ Should see "Selvakumar Murugesan" (not "Selvakumar Test")

### Test Delete Sync

1. Admin goes to Employees page
2. Delete an employee (e.g., "Test Employee")
3. Go to User Management
4. ✅ That user should also be deleted

## Manual Cleanup (If Needed)

If you want to manually clean up the orphaned users right now:

```sql
-- Find orphaned users (users without employees)
SELECT u.id, u.first_name, u.last_name, u.email, u.role
FROM users u
LEFT JOIN employees e ON e.user_id = u.id
WHERE e.id IS NULL;

-- Delete specific orphaned users
DELETE FROM users 
WHERE email IN ('david.brown@selsoftinc.com', 'emily.wilson@selsoftinc.com');
```

## Summary

✅ **Employee name updates** now sync to User table
✅ **Employee deletes** now also delete User account
✅ **Cleanup scripts** available for existing data
✅ **Cascade delete** ensures data consistency

Going forward, all employee operations will automatically keep the User table in sync!
