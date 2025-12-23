# 🔄 Complete User Approval Workflow with Email Notifications

## Overview

This document describes the complete end-to-end workflow for OAuth user registration, admin approval/rejection, and email notifications.

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION (OAuth)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Sign in with Google"                              │
│  → Google OAuth authentication                                  │
│  → User grants permissions                                      │
│  → Returns to application                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend: server/routes/oauth.js                                │
│  → Creates user with:                                           │
│     • approvalStatus: 'pending'                                 │
│     • status: 'inactive'                                        │
│     • authProvider: 'google'                                    │
│     • googleId: [user's Google ID]                              │
│  → Creates employee record                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Notification Created for ALL Admins                            │
│  → tenantId: [user's tenant]                                    │
│  → userId: [admin's ID]                                         │
│  → title: "New User Registration Pending Approval"             │
│  → category: 'approval'                                         │
│  → priority: 'high'                                             │
│  → metadata: { userId, email, name, role }                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  User sees message: "Waiting for admin approval"                │
│  → Cannot login yet                                             │
│  → Status: inactive                                             │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
                        ADMIN REVIEW PHASE
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  Admin logs in to TimePulse                                     │
│  → Sees notification bell with badge                            │
│  → Clicks bell or goes to /notifications                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Notifications Page                                             │
│  → Shows card: "New User Registration Pending Approval"         │
│  → User details: Name, Email, Role                              │
│  → "View" button visible                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Admin clicks "View" button                                     │
│  → Frontend: page.js → handleViewApproval()                     │
│  → Fetches: GET /api/user-approvals/pending?tenantId=...        │
│  → Backend: userApprovals.js → GET /pending                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend Query                                                  │
│  → SELECT * FROM users                                          │
│    WHERE tenantId = ? AND approvalStatus = 'pending'            │
│  → Returns pending user details                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Modal Opens with User Details                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  User Approval                                            │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │  Name:         John Doe                                  │ │
│  │  Email:        john@example.com                          │ │
│  │  Role:         employee                                  │ │
│  │  Department:   Engineering                               │ │
│  │  Auth:         google                                    │ │
│  │                                                           │ │
│  │  [Approve User]  [Reject User]  [Cancel]                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
                    OPTION A: ADMIN APPROVES
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  Admin clicks "Approve User"                                    │
│  → Frontend: handleApprove()                                    │
│  → POST /api/user-approvals/approve/:userId                     │
│  → Body: { tenantId, adminId }                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend: userApprovals.js → POST /approve/:userId              │
│  1. Find pending user                                           │
│  2. Update user:                                                │
│     • approvalStatus: 'approved'                                │
│     • status: 'active'                                          │
│     • approvedBy: adminId                                       │
│     • approvedAt: new Date()                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Create In-App Notification for User                            │
│  → title: "Registration Approved"                               │
│  → message: "You can now login to TimePulse"                    │
│  → type: 'success'                                              │
│  → category: 'system'                                           │
│  → actionUrl: '/login'                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Send Approval Email                                            │
│  → Service: UserApprovalEmailService.sendUserApprovedEmail()    │
│  → To: user@example.com                                         │
│  → Subject: "✅ Welcome to [Company] - Account Approved"        │
│  → Beautiful HTML template with:                                │
│     • Green success header                                      │
│     • Welcome message                                           │
│     • Account details (name, role, approved by)                 │
│     • "Login to TimePulse" button                               │
│     • Professional footer                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  User Receives Email                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ✅ Account Approved!                                     │ │
│  │  Welcome to Selsoft                                       │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │  Dear John Doe,                                           │ │
│  │                                                           │ │
│  │  Great news! Your registration has been approved.         │ │
│  │                                                           │ │
│  │  🎉 Welcome Aboard!                                       │ │
│  │                                                           │ │
│  │  Your Account Details:                                    │ │
│  │  • Name: John Doe                                         │ │
│  │  • Role: employee                                         │ │
│  │  • Approved by: Admin Name                                │ │
│  │  • Status: Active                                         │ │
│  │                                                           │ │
│  │       [Login to TimePulse] ← Clickable button             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Login to TimePulse"                               │
│  → Redirects to: https://goggly-casteless-torri.ngrok-free.dev/login                    │
│  → User signs in with Google                                    │
│  → Successfully authenticated                                   │
│  → Redirected to dashboard                                      │
│  → Full access granted ✅                                       │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
                    OPTION B: ADMIN REJECTS
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  Admin clicks "Reject User"                                     │
│  → Modal prompts for rejection reason                           │
│  → Admin enters: "Position not available"                       │
│  → Clicks "Confirm Rejection"                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: handleReject()                                       │
│  → POST /api/user-approvals/reject/:userId                      │
│  → Body: { tenantId, adminId, reason }                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend: userApprovals.js → POST /reject/:userId               │
│  1. Find pending user                                           │
│  2. Update user:                                                │
│     • approvalStatus: 'rejected'                                │
│     • status: 'inactive'                                        │
│     • approvedBy: adminId                                       │
│     • approvedAt: new Date()                                    │
│     • rejectionReason: reason                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Create In-App Notification for User                            │
│  → title: "Registration Rejected"                               │
│  → message: [rejection reason]                                  │
│  → type: 'error'                                                │
│  → category: 'system'                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Send Rejection Email                                           │
│  → Service: UserApprovalEmailService.sendUserRejectedEmail()    │
│  → To: user@example.com                                         │
│  → Subject: "Registration Status - [Company]"                   │
│  → Professional HTML template with:                             │
│     • Neutral gray header                                       │
│     • Respectful message                                        │
│     • Rejection reason box                                      │
│     • Contact information                                       │
│     • Professional footer                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  User Receives Email                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ℹ️ Registration Status Update                            │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │  Dear John Doe,                                           │ │
│  │                                                           │ │
│  │  Thank you for your interest in Selsoft.                  │ │
│  │                                                           │ │
│  │  We regret to inform you that we are unable to            │ │
│  │  approve your account at this time.                       │ │
│  │                                                           │ │
│  │  Reason for Decision:                                     │ │
│  │  Position not available                                   │ │
│  │                                                           │ │
│  │  Have Questions?                                          │ │
│  │  Contact Admin Name for more information.                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  User cannot login                                              │
│  → Status remains: inactive                                     │
│  → Approval status: rejected                                    │
│  → Can contact admin for clarification                          │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
                        TECHNICAL DETAILS
═══════════════════════════════════════════════════════════════════
```

---

## 🔧 Backend Implementation

### **File: server/routes/userApprovals.js**

#### **Approval Endpoint:**
```javascript
router.post('/approve/:userId', async (req, res) => {
  // 1. Find pending user
  const user = await models.User.findOne({
    where: { id: userId, tenantId, approvalStatus: 'pending' }
  });

  // 2. Update user status
  await user.update({
    approvalStatus: 'approved',
    status: 'active',
    approvedBy: adminId,
    approvedAt: new Date()
  });

  // 3. Create in-app notification
  await models.Notification.create({
    tenantId, userId: user.id,
    title: 'Registration Approved',
    message: 'You can now login to TimePulse.',
    type: 'success', category: 'system'
  });

  // 4. Send email
  await userApprovalEmailService.sendUserApprovedEmail({
    userEmail: user.email,
    userName: `${user.firstName} ${user.lastName}`,
    userRole: user.role,
    approvedBy: admin.name,
    loginLink: `${FRONTEND_URL}/login`,
    tenantName: tenant.name
  });

  // 5. Return success
  res.json({ success: true, message: 'User approved successfully' });
});
```

#### **Rejection Endpoint:**
```javascript
router.post('/reject/:userId', async (req, res) => {
  // 1. Find pending user
  const user = await models.User.findOne({
    where: { id: userId, tenantId, approvalStatus: 'pending' }
  });

  // 2. Update user status
  await user.update({
    approvalStatus: 'rejected',
    status: 'inactive',
    approvedBy: adminId,
    approvedAt: new Date(),
    rejectionReason: reason
  });

  // 3. Create in-app notification
  await models.Notification.create({
    tenantId, userId: user.id,
    title: 'Registration Rejected',
    message: reason || 'Your registration has been rejected.',
    type: 'error', category: 'system'
  });

  // 4. Send email
  await userApprovalEmailService.sendUserRejectedEmail({
    userEmail: user.email,
    userName: `${user.firstName} ${user.lastName}`,
    rejectionReason: reason,
    rejectedBy: admin.name,
    tenantName: tenant.name
  });

  // 5. Return success
  res.json({ success: true, message: 'User rejected successfully' });
});
```

---

### **File: server/services/UserApprovalEmailService.js**

#### **Email Service Features:**
- ✅ Nodemailer integration
- ✅ SMTP configuration
- ✅ Beautiful HTML templates
- ✅ Plain text fallback
- ✅ Error handling
- ✅ Development mode (no SMTP needed)
- ✅ Production mode (actual emails)

#### **Methods:**
1. `sendUserApprovedEmail()` - Sends approval email
2. `sendUserRejectedEmail()` - Sends rejection email
3. `getUserApprovedTemplate()` - HTML template for approval
4. `getUserRejectedTemplate()` - HTML template for rejection

---

## 📧 Email Configuration

### **Environment Variables (.env):**
```env
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=https://goggly-casteless-torri.ngrok-free.dev
```

### **Development Mode:**
If SMTP not configured:
- Emails logged to console
- Approval/rejection still works
- Perfect for testing

### **Production Mode:**
With SMTP configured:
- Actual emails sent
- Professional templates
- Delivery tracking

---

## 🎯 Key Features

### **1. Dual Notification System:**
- ✅ In-app notifications (stored in database)
- ✅ Email notifications (sent via SMTP)

### **2. Beautiful Email Templates:**
- ✅ Responsive HTML design
- ✅ Professional branding
- ✅ Clear call-to-action buttons
- ✅ Mobile-friendly

### **3. Error Handling:**
- ✅ Email failure doesn't block approval
- ✅ Comprehensive logging
- ✅ Graceful degradation

### **4. User Experience:**
- ✅ Immediate feedback (in-app notification)
- ✅ Persistent record (email)
- ✅ Clear next steps (login button)

---

## 🧪 Testing Checklist

- [ ] Create pending user: `node create-pending-oauth-user.js`
- [ ] Verify user exists: `node check-all-users.js`
- [ ] Start server: `npm start`
- [ ] Login as admin
- [ ] Navigate to notifications
- [ ] Click "View" button
- [ ] Modal opens with user details
- [ ] Click "Approve User"
- [ ] Check console logs (if no SMTP)
- [ ] Check email inbox (if SMTP configured)
- [ ] Verify user status changed: `node check-all-users.js`
- [ ] User can now login

---

## 📊 Database Schema

### **Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50),
  status VARCHAR(20),           -- 'active' or 'inactive'
  approval_status VARCHAR(20),  -- 'pending', 'approved', 'rejected'
  approved_by UUID,             -- Admin who approved/rejected
  approved_at TIMESTAMP,        -- When approved/rejected
  rejection_reason TEXT,        -- Reason if rejected
  auth_provider VARCHAR(50),    -- 'google', 'password', etc.
  google_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Notifications Table:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  user_id UUID,                 -- Recipient
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50),             -- 'success', 'error', 'warning', 'info'
  category VARCHAR(50),         -- 'approval', 'system', etc.
  priority VARCHAR(20),         -- 'high', 'medium', 'low'
  read_at TIMESTAMP,
  action_url VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🚀 Summary

**Complete Implementation Includes:**

1. ✅ OAuth user registration with pending status
2. ✅ Admin notification creation
3. ✅ Notification UI with "View" button
4. ✅ Approval modal with user details
5. ✅ Approve/Reject endpoints
6. ✅ Database status updates
7. ✅ In-app notifications for users
8. ✅ Email notifications (approval & rejection)
9. ✅ Beautiful HTML email templates
10. ✅ Error handling and logging
11. ✅ Development & production modes
12. ✅ Complete testing scripts

**Status:** ✅ **FULLY IMPLEMENTED AND READY TO USE**

**No additional code needed!** 🎉

---

**Last Updated:** December 10, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
