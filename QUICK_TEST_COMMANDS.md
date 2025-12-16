# 🚀 Quick Test Commands Reference

## Problem: Foreign Key Constraint Error

When running `create-pending-oauth-user.js`, you may get:
```
❌ Error: update or delete on table "users" violates foreign key constraint "employees_user_id_fkey"
```

**Cause:** The user has related records (employee, notifications) that must be deleted first.

**Solution:** Use one of the methods below.

---

## ✅ Method 1: Use Updated Script (Recommended)

The script has been fixed to handle foreign key constraints automatically.

```bash
cd server
node create-pending-oauth-user.js
```

**What it does:**
1. Checks if user exists
2. If exists, deletes employee record first
3. Deletes notifications
4. Deletes old user
5. Creates fresh user with pending status
6. Creates employee record
7. Creates notifications for admins

---

## ✅ Method 2: Update Existing User (Simpler)

If you just want to set an existing user to pending without deleting:

```bash
cd server
node set-existing-user-pending.js
```

**What it does:**
1. Finds existing user
2. Updates status to 'inactive'
3. Updates approvalStatus to 'pending'
4. Clears approval fields
5. Creates fresh notifications for admins

**Advantages:**
- No deletion needed
- Faster
- Preserves user history
- No foreign key issues

---

## ✅ Method 3: Manual Database Cleanup

If both scripts fail, clean up manually:

```bash
# 1. Check all users
node check-all-users.js

# 2. Delete manually via SQL (if needed)
psql -d timepulse_db

# Delete employee first
DELETE FROM employees WHERE email = 'testpending@gmail.com';

# Delete notifications
DELETE FROM notifications WHERE metadata->>'userId' IN (
  SELECT id FROM users WHERE email = 'testpending@gmail.com'
);

# Delete user
DELETE FROM users WHERE email = 'testpending@gmail.com';

# Exit psql
\q

# 3. Now create fresh user
node create-pending-oauth-user.js
```

---

## 🧪 Complete Test Flow

### **Step 1: Create/Update Pending User**

**Option A - Create Fresh (if no user exists):**
```bash
node create-pending-oauth-user.js
```

**Option B - Update Existing (if user exists):**
```bash
node set-existing-user-pending.js
```

---

### **Step 2: Verify User**

```bash
node check-all-users.js
```

**Expected Output:**
```
🔍 Pending users: 1
  - testpending@gmail.com (Test Pending)
```

---

### **Step 3: Start Server**

```bash
npm start
```

**Look for:**
```
✅ User Approval Email service is ready
🚀 Server running on port 5001
```

---

### **Step 4: Start Frontend**

```bash
cd ../nextjs-app
npm run dev
```

**Expected:**
```
✓ Ready in 2s
- Local: http://localhost:3000
```

---

### **Step 5: Test in Browser**

```
1. Go to: http://localhost:3000
2. Login as admin (pushban@selsoftinc.com)
3. Go to: http://localhost:3000/selsoft/notifications
4. Click "View" button
5. Modal should open! ✅
6. Click "Approve User"
7. Check email (or console logs)
```

---

## 📊 Troubleshooting Commands

### **Check Database State:**
```bash
# See all users
node check-all-users.js

# See pending users only
node test-pending-users.js
```

### **Reset Test User:**
```bash
# Method 1: Update existing
node set-existing-user-pending.js

# Method 2: Delete and recreate
node create-pending-oauth-user.js
```

### **Check Server Logs:**
```bash
# Start server with logs
npm start

# Look for:
# ✅ User Approval Email service is ready
# [User Approvals] Found pending users: 1
```

### **Check Frontend Logs:**
```bash
# Open browser console (F12)
# Look for:
# [fetchPendingUserDetails] Response status: 200
# [fetchPendingUserDetails] Found pending user: {...}
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Create fresh pending user | `node create-pending-oauth-user.js` |
| Update existing to pending | `node set-existing-user-pending.js` |
| Check all users | `node check-all-users.js` |
| Check pending users | `node test-pending-users.js` |
| Start backend | `npm start` |
| Start frontend | `cd ../nextjs-app && npm run dev` |
| Test in browser | http://localhost:3000/selsoft/notifications |

---

## 💡 Pro Tips

### **Tip 1: Use Update Instead of Delete**
If you get foreign key errors, use `set-existing-user-pending.js` instead of `create-pending-oauth-user.js`.

### **Tip 2: Check Logs First**
Always check `node check-all-users.js` before creating a new user to see what exists.

### **Tip 3: Restart Server**
After creating/updating a user, restart the server to ensure fresh data.

### **Tip 4: Clear Browser Cache**
If modal doesn't open, clear browser cache or use incognito mode.

### **Tip 5: Check Console**
Always keep browser console (F12) open to see detailed logs.

---

## 🔄 Common Workflows

### **Workflow 1: First Time Setup**
```bash
# 1. Create test user
node create-pending-oauth-user.js

# 2. Verify
node check-all-users.js

# 3. Start servers
npm start
cd ../nextjs-app && npm run dev

# 4. Test in browser
```

### **Workflow 2: Re-testing After Changes**
```bash
# 1. Update existing user to pending
node set-existing-user-pending.js

# 2. Restart server
npm start

# 3. Test in browser
```

### **Workflow 3: Clean Slate**
```bash
# 1. Delete via script (handles foreign keys)
node create-pending-oauth-user.js

# 2. Verify
node check-all-users.js

# 3. Test
npm start
```

---

## 📧 Email Testing

### **Without SMTP:**
- Emails logged to console
- Look for: `📧 Email service not configured`
- Approval still works

### **With SMTP:**
- Add credentials to `.env`
- Restart server
- Look for: `✅ User Approval Email service is ready`
- Check inbox after approval

---

## ✅ Success Checklist

- [ ] User created/updated: `node check-all-users.js` shows pending user
- [ ] Server started: No errors, shows "User Approval Email service is ready"
- [ ] Frontend started: No errors, accessible at localhost:3000
- [ ] Login works: Can login as admin
- [ ] Notifications visible: See pending approval notification
- [ ] View button works: Modal opens with user details
- [ ] Approve works: Success message appears
- [ ] Email sent: Check inbox or console logs
- [ ] User status updated: `node check-all-users.js` shows approved

---

**Last Updated:** December 10, 2025  
**Status:** Ready to Use  
**Recommended:** Use `set-existing-user-pending.js` for simplicity
