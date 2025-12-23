# 🧪 Complete OAuth Approval Testing Guide

## Current Situation

The error "Failed to fetch user details: Server error fetching pending users" is still occurring because:
1. The API query is working correctly
2. BUT there are NO pending users in the database to fetch
3. The `set-user-pending.js` script updated the user but it reverted back to approved

## Solution: Create a Fresh Pending User

Instead of trying to modify existing users, let's create a completely new test user with pending status.

---

## Step-by-Step Testing Process

### **Step 1: Check Current Users**

```bash
cd server
node check-all-users.js
```

**This will show:**
- All users in database
- Their approval status
- Which users are pending (if any)

---

### **Step 2: Create New Pending User**

```bash
node create-pending-oauth-user.js
```

**This will:**
- Create user: `testpending@gmail.com`
- Set `approvalStatus: 'pending'`
- Set `status: 'inactive'`
- Create employee record
- Create notification for all admins
- Simulate complete OAuth registration flow

**Expected Output:**
```
✅ User created successfully!
   ID: ...
   Email: testpending@gmail.com
   Name: Test Pending
   Status: inactive
   Approval: pending
   Tenant: 5eda5596-...

✅ Employee record created
   ID: ...

✅ Found 1 admin(s)

🔔 Creating notifications for admins...
   ✅ Notification created for: pushban@selsoftinc.com
```

---

### **Step 3: Verify User Was Created**

```bash
node check-all-users.js
```

**Should show:**
```
🔍 Pending users: 1
  - testpending@gmail.com (Test Pending)
```

---

### **Step 4: Restart Server**

```bash
npm start
```

**Expected Logs:**
```
🔧 Using LOCAL database configuration
📍 Loading user-approvals routes...
✅ User Approval Email service is ready
🚀 Server running on port 5001
```

**Important:** Make sure there are NO errors during startup!

---

### **Step 5: Start Frontend**

```bash
cd ../nextjs-app
npm run dev
```

**Expected:**
```
✓ Ready in 2s
- Local: https://goggly-casteless-torri.ngrok-free.dev
```

---

### **Step 6: Test in Browser**

#### **6.1 Login as Admin**
```
1. Go to: https://goggly-casteless-torri.ngrok-free.dev
2. Login with admin credentials:
   - Email: pushban@selsoftinc.com (or your admin email)
   - Password: your password
```

#### **6.2 Navigate to Notifications**
```
1. Click the bell icon in header
2. OR go directly to: https://goggly-casteless-torri.ngrok-free.dev/selsoft/notifications
```

**You should see:**
- Notification card: "New User Registration Pending Approval"
- Message: "Test Pending (testpending@gmail.com) has registered..."
- "View" button on the right

#### **6.3 Open Modal**
```
1. Click the "View" button
2. Watch browser console for logs
```

**Expected Console Logs:**
```
[Notification Click] {
  category: 'approval',
  metadata: { userId: '...' },
  title: 'New User Registration Pending Approval'
}
[Notification Click] User ID: ...
[Notification Click] Opening approval modal for user: ...

[fetchPendingUserDetails] Starting fetch for userId: ...
[fetchPendingUserDetails] Tenant ID: 5eda5596-...
[fetchPendingUserDetails] Fetching from: http://localhost:5001/api/user-approvals/pending?tenantId=...
[fetchPendingUserDetails] Response status: 200
[fetchPendingUserDetails] Response data: {
  "success": true,
  "pendingUsers": [
    {
      "id": "...",
      "firstName": "Test",
      "lastName": "Pending",
      "email": "testpending@gmail.com",
      "role": "employee",
      "approvalStatus": "pending"
    }
  ],
  "count": 1
}
[fetchPendingUserDetails] Found pending user: { ... }
[fetchPendingUserDetails] Modal should open now
```

**Expected Backend Logs:**
```
[User Approvals] Fetching pending users for tenant: 5eda5596-...
[User Approvals] Found pending users: 1
[User Approvals] Pending users data: [
  {
    "id": "...",
    "firstName": "Test",
    "lastName": "Pending",
    "email": "testpending@gmail.com",
    "role": "employee",
    "approvalStatus": "pending"
  }
]
```

**Modal Should Display:**
```
┌─────────────────────────────────────────┐
│  User Approval                          │
├─────────────────────────────────────────┤
│  Name: Test Pending                     │
│  Email: testpending@gmail.com           │
│  Role: employee                         │
│  Department: General                    │
│  Auth Provider: google                  │
│                                         │
│  [Approve User]  [Reject User]  [Cancel]│
└─────────────────────────────────────────┘
```

---

### **Step 7: Test Approval**

#### **7.1 Click "Approve User"**

**Expected:**
- Success message: "User approved successfully!"
- Modal closes
- Notification disappears or marked as read

**Backend Logs:**
```
[User Approval] User testpending@gmail.com approved by pushban@selsoftinc.com
[User Approval] Approval email sent to testpending@gmail.com
```

#### **7.2 Verify User Status Changed**

```bash
node check-all-users.js
```

**Should show:**
```
User: testpending@gmail.com
  Status: active
  Approval: approved
```

---

## Troubleshooting

### **Issue 1: "No pending users found"**

**Check:**
```bash
node check-all-users.js
```

**If no pending users:**
```bash
node create-pending-oauth-user.js
```

---

### **Issue 2: Modal doesn't open**

**Check browser console for:**
```
[fetchPendingUserDetails] Response status: 500
```

**If 500 error, check backend logs:**
```
[User Approvals] Error: ...
```

**Common causes:**
- Database column mismatch
- Sequelize model misconfiguration
- Missing user in database

---

### **Issue 3: API returns empty array**

**Backend logs show:**
```
[User Approvals] Found pending users: 0
```

**Solution:**
```bash
# Create fresh pending user
node create-pending-oauth-user.js

# Verify it exists
node check-all-users.js
```

---

### **Issue 4: Notification doesn't appear**

**Check:**
1. User was created: `node check-all-users.js`
2. Notification was created: Check database
3. Refresh notifications page
4. Check if logged in as correct admin

---

## Database Verification Queries

If you want to check the database directly:

```sql
-- Check all users
SELECT id, email, first_name, last_name, role, status, approval_status 
FROM users 
ORDER BY created_at DESC;

-- Check pending users
SELECT id, email, first_name, last_name, role, status, approval_status 
FROM users 
WHERE approval_status = 'pending';

-- Check notifications
SELECT id, title, message, user_id, category, created_at 
FROM notifications 
WHERE category = 'approval' 
ORDER BY created_at DESC;
```

---

## Complete File Structure

```
server/
├── routes/
│   ├── userApprovals.js          ✅ Fixed - uses approvalStatus
│   └── oauth.js                   ✅ Fixed - uses approvalStatus
├── models/
│   └── index.js                   ✅ Correct - field: "approval_status"
├── check-all-users.js             ✅ NEW - Check all users
├── create-pending-oauth-user.js   ✅ NEW - Create test user
├── set-user-pending.js            ⚠️  OLD - May not work reliably
└── test-pending-users.js          ✅ Existing - Basic check

nextjs-app/
└── src/app/[subdomain]/notifications/
    ├── page.js                    ✅ Fixed - proper logging
    └── notifications.css          ✅ Fixed - View button styling
```

---

## Success Criteria

✅ **Step 1:** `check-all-users.js` shows pending user  
✅ **Step 2:** Server starts without errors  
✅ **Step 3:** Frontend starts without errors  
✅ **Step 4:** Notification appears in UI  
✅ **Step 5:** "View" button is visible and clickable  
✅ **Step 6:** Console shows 200 response  
✅ **Step 7:** Modal opens with user details  
✅ **Step 8:** Approve button works  
✅ **Step 9:** User status changes to approved  
✅ **Step 10:** Email sent (if SMTP configured)  

---

## Quick Test Commands

```bash
# 1. Create test user
node create-pending-oauth-user.js

# 2. Verify user exists
node check-all-users.js

# 3. Start server
npm start

# 4. In another terminal, start frontend
cd ../nextjs-app
npm run dev

# 5. Open browser
# https://goggly-casteless-torri.ngrok-free.dev/selsoft/notifications

# 6. Click "View" button

# 7. Modal should open!
```

---

## Expected Timeline

- **Create user:** 5 seconds
- **Verify user:** 3 seconds
- **Start servers:** 10 seconds
- **Navigate to page:** 5 seconds
- **Click View:** 1 second
- **Modal opens:** Instant

**Total:** ~25 seconds from start to modal opening

---

## If Everything Fails

If the modal still doesn't open after following all steps:

1. **Share the exact error message** from browser console
2. **Share backend logs** when clicking View button
3. **Share output** of `node check-all-users.js`
4. **Share screenshot** of the error

This will help identify the exact issue.

---

**Last Updated:** December 10, 2025  
**Status:** Ready for Testing  
**Next Step:** Run `node create-pending-oauth-user.js`
