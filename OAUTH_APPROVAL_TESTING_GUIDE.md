# OAuth User Approval - Quick Testing Guide

## 🚀 Quick Start

### Prerequisites
1. Backend server running on `http://localhost:5001`
2. Frontend running on `http://localhost:3000`
3. Database migration completed
4. Google OAuth configured

---

## 📋 Test Scenarios

### **Scenario 1: New User Registration**

**Steps:**
1. Navigate to login page
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Fill out onboarding form:
   - First Name: Test
   - Last Name: User
   - Role: Employee
   - Department: Engineering
   - Phone: (optional)
5. Click Submit

**Expected Result:**
- ✅ Redirected to `/pending-approval` page
- ✅ See pending status message with ⏳ icon
- ✅ Registration details displayed
- ✅ "Pending Approval" badge shown
- ✅ Cannot login yet

**Database Check:**
```sql
SELECT id, email, approval_status, status FROM users 
WHERE email = 'testuser@example.com';
-- Should show: approval_status = 'pending', status = 'inactive'
```

---

### **Scenario 2: Admin Receives Notification**

**Steps:**
1. Login as admin user
2. Check notification bell in header (top right)
3. Click on notification bell

**Expected Result:**
- ✅ Red badge showing "1" unread notification
- ✅ Dropdown opens with notification
- ✅ Notification title: "New User Registration Pending Approval"
- ✅ Notification message shows user name and email
- ✅ Click notification navigates to `/user-approvals`

**Database Check:**
```sql
SELECT * FROM notifications 
WHERE category = 'approval' AND type = 'warning'
ORDER BY created_at DESC LIMIT 1;
-- Should show notification for admin
```

---

### **Scenario 3: Admin Approves User**

**Steps:**
1. As admin, navigate to User Approvals page
   - Direct URL: `http://localhost:3000/selsoft/user-approvals`
   - Or click notification
2. See pending user card
3. Click "Approve" button
4. Confirm approval

**Expected Result:**
- ✅ User card shows loading state
- ✅ Success message appears
- ✅ User removed from pending list
- ✅ Page shows "No Pending Approvals" if no more users

**Database Check:**
```sql
SELECT id, email, approval_status, status, approved_at, approved_by 
FROM users 
WHERE email = 'testuser@example.com';
-- Should show: approval_status = 'approved', status = 'active'
-- approved_at should have timestamp
-- approved_by should have admin user ID
```

**Notification Check:**
```sql
SELECT * FROM notifications 
WHERE user_id = (SELECT id FROM users WHERE email = 'testuser@example.com')
AND title = 'Registration Approved'
ORDER BY created_at DESC LIMIT 1;
-- Should show approval notification for user
```

---

### **Scenario 4: Approved User Can Login**

**Steps:**
1. Logout from admin account
2. Click "Sign in with Google"
3. Select the approved test user account

**Expected Result:**
- ✅ OAuth check passes
- ✅ User redirected to dashboard
- ✅ No pending approval message
- ✅ Full access to application

---

### **Scenario 5: Admin Rejects User**

**Steps:**
1. Register another new user (follow Scenario 1)
2. As admin, go to User Approvals page
3. Click "Reject" button on pending user
4. Enter rejection reason: "Test rejection"
5. Click "Confirm Rejection"

**Expected Result:**
- ✅ Modal opens for rejection reason
- ✅ Can enter custom reason
- ✅ User removed from pending list
- ✅ Success message appears

**Database Check:**
```sql
SELECT id, email, approval_status, status, rejection_reason 
FROM users 
WHERE email = 'rejecteduser@example.com';
-- Should show: approval_status = 'rejected', status = 'inactive'
-- rejection_reason should contain "Test rejection"
```

---

### **Scenario 6: Rejected User Cannot Login**

**Steps:**
1. Logout
2. Click "Sign in with Google"
3. Select the rejected user account

**Expected Result:**
- ✅ OAuth check fails
- ✅ Error message: "Your registration has been rejected"
- ✅ Shows rejection reason if provided
- ✅ Cannot access application

---

### **Scenario 7: Pending User Cannot Login**

**Steps:**
1. Register new user but don't approve
2. Logout
3. Try to login with that user

**Expected Result:**
- ✅ OAuth check fails
- ✅ Message: "Your registration is pending admin approval"
- ✅ Cannot access application
- ✅ Redirected to pending approval page

---

## 🔍 Manual Database Verification

### Check Pending Users
```sql
SELECT 
  id, 
  first_name, 
  last_name, 
  email, 
  role, 
  approval_status, 
  status,
  created_at
FROM users 
WHERE approval_status = 'pending'
ORDER BY created_at DESC;
```

### Check Notifications
```sql
SELECT 
  n.id,
  n.title,
  n.message,
  n.type,
  n.category,
  n.priority,
  n.read_at,
  u.email as recipient_email
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.category = 'approval'
ORDER BY n.created_at DESC
LIMIT 10;
```

### Check Approval History
```sql
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.approval_status,
  u.approved_at,
  u.rejection_reason,
  approver.email as approved_by_email
FROM users u
LEFT JOIN users approver ON u.approved_by = approver.id
WHERE u.approval_status IN ('approved', 'rejected')
  AND u.auth_provider = 'google'
ORDER BY u.approved_at DESC
LIMIT 10;
```

---

## 🎯 UI Testing Checklist

### Notification Bell
- [ ] Bell icon visible in header
- [ ] Badge shows correct unread count
- [ ] Clicking bell opens dropdown
- [ ] Notifications display with correct icons
- [ ] Time ago displays correctly
- [ ] Clicking notification marks as read
- [ ] Clicking notification navigates to action URL
- [ ] "Mark all as read" works
- [ ] Empty state shows when no notifications
- [ ] Dark mode styling works

### Pending Approval Page
- [ ] Page loads correctly
- [ ] Pending icon (⏳) displays
- [ ] User details shown correctly
- [ ] Status badge shows "Pending Approval"
- [ ] Information boxes display
- [ ] "Back to Login" button works
- [ ] Responsive on mobile
- [ ] Dark mode styling works

### User Approvals Page (Admin)
- [ ] Only accessible by admins
- [ ] Non-admins see "Access Denied"
- [ ] Pending users displayed in cards
- [ ] User avatar shows initials
- [ ] All user details visible
- [ ] Approve button works
- [ ] Reject button opens modal
- [ ] Rejection reason can be entered
- [ ] Cards removed after action
- [ ] Empty state shows when no pending users
- [ ] Refresh button works
- [ ] Responsive on mobile
- [ ] Dark mode styling works

---

## 🐛 Common Issues & Solutions

### Issue: Migration fails
**Solution:**
```bash
# Check if columns already exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'approval_status';

# If exists, skip migration or manually add missing columns
```

### Issue: Notifications not appearing
**Solution:**
1. Check admin user exists: `SELECT * FROM users WHERE role = 'admin'`
2. Check notification was created: `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5`
3. Check browser console for API errors
4. Verify token is valid

### Issue: User stuck in pending
**Solution:**
```sql
-- Manually approve user
UPDATE users 
SET approval_status = 'approved', 
    status = 'active',
    approved_at = NOW()
WHERE email = 'user@example.com';
```

### Issue: Cannot access approval page
**Solution:**
1. Verify user role: `SELECT role FROM users WHERE email = 'admin@example.com'`
2. Check route: Should be `/[subdomain]/user-approvals`
3. Clear browser cache and localStorage
4. Check browser console for errors

---

## 📊 Performance Testing

### Load Test Notifications
```javascript
// Create 100 test notifications
for (let i = 0; i < 100; i++) {
  await fetch('http://localhost:5001/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tenantId: 'your-tenant-id',
      userId: 'admin-user-id',
      title: `Test Notification ${i}`,
      message: `This is test notification number ${i}`,
      type: 'info',
      category: 'general',
      priority: 'medium'
    })
  });
}
```

### Verify Pagination
- Check notification dropdown only shows 10 items
- Verify "View all notifications" link appears
- Test scroll behavior in dropdown

---

## ✅ Final Checklist

Before marking as complete:

- [ ] Database migration successful
- [ ] All API endpoints working
- [ ] New user registration creates pending status
- [ ] Admin receives notifications
- [ ] Notification bell displays correctly
- [ ] Approval page accessible to admins only
- [ ] Approve action works correctly
- [ ] Reject action works correctly
- [ ] Approved users can login
- [ ] Rejected users cannot login
- [ ] Pending users cannot login
- [ ] All UI components responsive
- [ ] Dark mode works on all pages
- [ ] No console errors
- [ ] Database queries optimized
- [ ] Documentation complete

---

## 📞 Next Steps

After testing:
1. Deploy database migration to staging
2. Test in staging environment
3. Create admin user guide
4. Update user documentation
5. Deploy to production
6. Monitor for issues

---

**Testing Date**: December 10, 2025  
**Tester**: _____________  
**Status**: ⏳ Ready for Testing
