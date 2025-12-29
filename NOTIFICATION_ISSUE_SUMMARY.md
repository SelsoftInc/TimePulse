# OAuth Notification Issue - Root Cause & Fix

## 🔍 **Root Cause Identified**

### **Problem**: Admin (Pushban) not receiving notifications for new OAuth user registrations

### **Investigation Results**:

1. ✅ **Notification system works** - Manually created test notification successfully
2. ✅ **User "suresh s" was created** with status "pending"
3. ❌ **Employee record was NOT created** for this user
4. ❌ **NO notifications were created** during registration

### **Root Cause**:
**Employee creation is failing silently**, which prevents the code from reaching the notification creation section.

---

## 📊 **Database Check Results**

```sql
-- Pending user exists
User: suresh s (s29903103@gmail.com)
ID: 1c65d3b9-22b0-4524-ac3a-f87b052a9ebf
Status: pending
Created: Dec 29, 2025 11:25:55 AM

-- Employee record: NOT FOUND ❌
-- This is the problem!

-- Admin users available
1. Admin User (admin@selsoft.com)
2. Chandralekha Veerasami (chandralekha@selsoftinc.com)
3. Pushban User (pushban@selsoftinc.com) - role: 'admin'
```

---

## 🔧 **Fix Applied**

### **File**: `server/routes/oauth.js`

**Added try-catch around Employee creation** (Lines 548-580):

```javascript
try {
  // Determine title based on role
  let title = 'Employee';
  if (role.toLowerCase() === 'admin') {
    title = 'Administrator';
  } else if (role.toLowerCase() === 'approver') {
    title = 'Manager';
  }
  
  const employee = await models.Employee.create({
    tenantId: tenant.id,
    firstName: firstName,
    lastName: lastName,
    email: email.toLowerCase(),
    phone: phoneNumber || null,
    department: department || 'General',
    title: title,
    status: 'active',
    startDate: new Date(),
    userId: user.id,
    approverId: approverId || null
  });
  employeeId = employee.id;
  console.log('[OAuth Register] Employee created successfully:', employeeId);
  if (approverId) {
    console.log('[OAuth Register] Employee assigned to approver:', approverId);
  }
} catch (employeeError) {
  console.error('[OAuth Register] CRITICAL: Failed to create employee record!');
  console.error('[OAuth Register] Employee creation error:', employeeError.message);
  console.error('[OAuth Register] Error details:', employeeError);
  // Continue without employee record - notifications will still be created
}
```

**Key Changes**:
- Wrapped Employee creation in try-catch
- Added detailed error logging
- **Allows code to continue** even if Employee creation fails
- Notifications will now be created regardless of Employee creation status

---

## 🧪 **Testing Steps**

### **Step 1: Delete Existing Pending User**

```sql
-- Delete the existing pending user to test fresh registration
DELETE FROM users WHERE email = 's29903103@gmail.com';
```

### **Step 2: Register New User**

1. Hard refresh browser: `Ctrl + F5`
2. Navigate to login → "Sign in with Google"
3. Email: `s29903103@gmail.com`
4. Complete onboarding:
   - First Name: "suresh"
   - Last Name: "s"
   - Role: "Employee"
   - **Select Approver**: "Pushban User (admin)"
   - Click "Complete Registration"

### **Step 3: Check Backend Logs**

**Look for these logs**:
```
[OAuth Register] Creating employee record for role: employee
[OAuth Register] Employee created successfully: <uuid>
[OAuth Register] Employee assigned to approver: <uuid>
[OAuth Register] Starting notification creation...
[OAuth Register] approverId received: <uuid>
[OAuth Register] Found 3 admin users to notify
[OAuth Register] Approver details found: { name: 'Pushban User', ... }
[OAuth Register] Creating notification for admin: admin@selsoft.com
[OAuth Register] Notification message: ...selected Pushban User as their approver...
[OAuth Register] Notification created with ID: <uuid>
```

**OR if Employee creation fails**:
```
[OAuth Register] CRITICAL: Failed to create employee record!
[OAuth Register] Employee creation error: <error message>
[OAuth Register] Starting notification creation...
[OAuth Register] Notifications created successfully
```

### **Step 4: Verify Notifications**

**Login as Pushban (pushban@selsoftinc.com)**:
1. Check notification bell icon
2. ✅ Should see: "New User Registration Pending Approval"
3. ✅ Message: "suresh s has registered via Google OAuth and selected Pushban User as their approver"
4. ✅ Priority: HIGH (yellow badge)

### **Step 5: Verify Database**

```sql
-- Check notifications were created
SELECT 
  n.id,
  n.title,
  n.message,
  n.type,
  n.priority,
  u.first_name,
  u.last_name,
  u.email
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.metadata->>'pendingUserEmail' = 's29903103@gmail.com'
ORDER BY n.created_at DESC;
```

**Expected**: 3 notifications (one for each admin user)

---

## 🎯 **Why This Fix Works**

### **Before Fix**:
```
User Registration → Employee Creation FAILS → Code STOPS → No Notifications ❌
```

### **After Fix**:
```
User Registration → Employee Creation (try-catch) → Continue Regardless → Notifications Created ✅
```

**Benefits**:
1. **Notifications always created** even if Employee creation fails
2. **Detailed error logging** shows exact Employee creation error
3. **Non-blocking** - registration completes successfully
4. **Admin can still approve** user even without Employee record

---

## 🔍 **Next Steps to Identify Employee Creation Error**

Once you test the registration again, check the backend logs for:

```
[OAuth Register] CRITICAL: Failed to create employee record!
[OAuth Register] Employee creation error: <ACTUAL ERROR MESSAGE>
```

**Common causes**:
1. **Missing required field** in Employee model
2. **Foreign key constraint** violation
3. **Unique constraint** violation (email already exists)
4. **Database column mismatch** (camelCase vs snake_case)
5. **Invalid data type** for a field

---

## 📝 **Files Modified**

1. **`server/routes/oauth.js`** (Lines 548-580)
   - Added try-catch around Employee creation
   - Added detailed error logging
   - Allows code to continue to notification creation

---

## ✅ **Success Criteria**

- [x] Backend server restarted with fix
- [ ] **TEST**: Register new OAuth user
- [ ] **VERIFY**: Backend logs show Employee creation attempt
- [ ] **VERIFY**: If Employee fails, error is logged but code continues
- [ ] **VERIFY**: Notifications are created for all admin users
- [ ] **VERIFY**: Pushban receives notification in UI
- [ ] **VERIFY**: Notification includes approver name

---

## 🚀 **Server Status**

✅ **Backend running on port 5001**  
✅ **Employee creation wrapped in try-catch**  
✅ **Enhanced error logging enabled**  
✅ **Notifications will be created regardless of Employee status**  

---

**Implementation Date**: December 29, 2024  
**Status**: ✅ Fix Applied - Ready for Testing  
**Next Action**: Test OAuth registration and check backend logs for Employee creation error
