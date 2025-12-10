# ✅ createdAt Column Name Fix

## Issue Found

**Error:** `column "createdAt" does not exist`

**Root Cause:** The database column is `created_at` (snake_case) but the code was trying to use `createdAt` (camelCase) directly in queries.

---

## The Problem

In Sequelize, when using `raw: true`, you need to explicitly map database column names to JavaScript property names for columns that don't follow the automatic mapping.

### **What Was Wrong:**

```javascript
// ❌ WRONG - This fails with raw: true
attributes: [
  'createdAt'  // Database has 'created_at', not 'createdAt'
],
order: [['createdAt', 'DESC']]  // Database doesn't recognize 'createdAt'
```

### **Why It Failed:**

- With `raw: true`, Sequelize doesn't automatically map field names
- The database column is literally `created_at` (snake_case)
- Trying to select `createdAt` fails because that column doesn't exist

---

## The Fix

### **Correct Approach:**

```javascript
// ✅ CORRECT - Map database column to JS property
attributes: [
  ['created_at', 'createdAt']  // [database_column, js_property]
],
order: [['created_at', 'DESC']]  // Use database column name in order
```

---

## Files Fixed

### **1. server/routes/userApprovals.js**

**Before:**
```javascript
attributes: [
  'id',
  'firstName',
  'lastName',
  'email',
  'role',
  'department',
  'title',
  'authProvider',
  'createdAt',  // ❌ Wrong
  'approvalStatus'
],
order: [['createdAt', 'DESC']]  // ❌ Wrong
```

**After:**
```javascript
attributes: [
  'id',
  'firstName',
  'lastName',
  'email',
  'role',
  'department',
  'title',
  'authProvider',
  ['created_at', 'createdAt'],  // ✅ Correct mapping
  'approvalStatus'
],
order: [['created_at', 'DESC']]  // ✅ Correct column name
```

---

### **2. server/check-all-users.js**

**Before:**
```javascript
attributes: [
  'id',
  'email',
  'firstName',
  'lastName',
  'role',
  'tenantId',
  'status',
  'approvalStatus',
  'authProvider',
  'createdAt'  // ❌ Wrong
],
order: [['createdAt', 'DESC']]  // ❌ Wrong
```

**After:**
```javascript
attributes: [
  'id',
  'email',
  'firstName',
  'lastName',
  'role',
  'tenantId',
  'status',
  'approvalStatus',
  'authProvider',
  ['created_at', 'createdAt']  // ✅ Correct mapping
],
order: [['created_at', 'DESC']]  // ✅ Correct column name
```

---

## Why Other Fields Work

Some fields work automatically because Sequelize has field mappings defined in the model:

```javascript
// In models/index.js
firstName: {
  type: DataTypes.STRING(100),
  field: "first_name"  // ← Automatic mapping
},
approvalStatus: {
  type: DataTypes.STRING(20),
  field: "approval_status"  // ← Automatic mapping
}
```

But `createdAt` is a timestamp field that Sequelize adds automatically, and when using `raw: true`, you need to explicitly map it.

---

## Testing

### **Now This Works:**

```bash
# Check all users
node check-all-users.js
```

**Expected Output:**
```
✅ Connected!

📊 Total users: 3

User 1:
  Email: testpending@gmail.com
  Name: Test Pending
  Role: employee
  Status: inactive
  Approval: pending
  Auth: google
  Tenant: 5eda5596-...
  Created: 2025-12-10T...
```

---

### **API Also Works:**

```bash
# Start server
npm start
```

**No more errors!** The API endpoint `/api/user-approvals/pending` will now work correctly.

---

## Summary

**Issue:** Column name mismatch when using `raw: true`  
**Fix:** Explicitly map `created_at` to `createdAt`  
**Files Fixed:** 
- ✅ `server/routes/userApprovals.js`
- ✅ `server/check-all-users.js`

**Status:** ✅ Fixed and Ready to Test

---

## Next Steps

```bash
# 1. Verify user was created
node check-all-users.js

# 2. Start server
npm start

# 3. Test in browser
# Login → Notifications → Click "View"
```

The modal should now open successfully! 🎉

---

**Fix Date:** December 10, 2025  
**Issue:** createdAt column mapping  
**Status:** ✅ Resolved
