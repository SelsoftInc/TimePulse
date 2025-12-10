# OAuth User Approval System - Implementation Guide

## Overview

Successfully implemented a comprehensive in-app notification and approval workflow for OAuth user registrations in TimePulse. When new users register via Google OAuth, they require admin approval before gaining access to the application.

---

## 🎯 Features Implemented

### 1. **User Approval Workflow**
- New OAuth users are created with `pending` approval status
- Users cannot login until approved by an administrator
- Pending status displayed on onboarding completion
- Admin receives real-time notifications for new registrations

### 2. **In-App Notification System**
- Real-time notification bell in header
- Unread count badge
- Notification dropdown with categorized alerts
- Mark as read/mark all as read functionality
- Action URLs for quick navigation

### 3. **Admin Approval Interface**
- Dedicated user approval page for administrators
- Card-based UI showing pending user details
- Approve/Reject actions with reason tracking
- Real-time updates after approval/rejection

### 4. **Pending Approval Screen**
- Beautiful pending status page for new users
- Shows registration details and status
- Informative messaging about approval process
- Back to login functionality

---

## 📁 Files Created/Modified

### **Backend Files**

#### Created:
1. **`server/migrations/add-user-approval-status.js`**
   - Database migration for approval status fields
   - Adds: `approval_status`, `approved_by`, `approved_at`, `rejection_reason`

2. **`server/routes/userApprovals.js`**
   - API endpoints for user approval management
   - Routes: `/pending`, `/approve/:userId`, `/reject/:userId`, `/history`

#### Modified:
1. **`server/models/index.js`**
   - Added approval status fields to User model
   - Fields: `approvalStatus`, `approvedBy`, `approvedAt`, `rejectionReason`

2. **`server/routes/oauth.js`**
   - Updated registration to set `pending` status
   - Added notification creation for admins
   - Enhanced check-user endpoint with approval status checks

3. **`server/index.js`**
   - Registered user approval routes

4. **`server/routes/notifications.js`** (Already existed)
   - Used for notification management

### **Frontend Files**

#### Created:
1. **`nextjs-app/src/app/pending-approval/page.js`**
   - Pending approval status page
   - Shows user info and pending status
   - Beautiful UI with status indicators

2. **`nextjs-app/src/components/notifications/NotificationBell.jsx`**
   - Notification bell component for header
   - Real-time notification fetching
   - Dropdown with notification list
   - Mark as read functionality

3. **`nextjs-app/src/components/notifications/NotificationBell.css`**
   - Styling for notification bell
   - Dark mode support
   - Responsive design

4. **`nextjs-app/src/app/[subdomain]/user-approvals/page.js`**
   - Admin user approval page
   - Card-based pending user display
   - Approve/Reject actions
   - Rejection reason modal

5. **`nextjs-app/src/app/[subdomain]/user-approvals/UserApprovals.css`**
   - Styling for approval page
   - Modern card design
   - Dark mode support

#### Modified:
1. **`nextjs-app/src/app/onboarding/page.js`**
   - Added pending approval handling
   - Redirect to pending page if approval required
   - Store pending user info in localStorage

2. **`nextjs-app/src/components/layout/Header.jsx`**
   - Integrated NotificationBell component
   - Added to header toolbar

---

## 🔄 Complete User Flow

### **New User Registration Flow**

```
1. User clicks "Sign in with Google"
   ↓
2. Google OAuth authentication
   ↓
3. Redirected to onboarding page
   ↓
4. User fills out profile form (name, role, department, etc.)
   ↓
5. Submit registration
   ↓
6. Backend creates user with status: 'inactive', approvalStatus: 'pending'
   ↓
7. Notification sent to all admin users
   ↓
8. User redirected to "Pending Approval" page
   ↓
9. User sees pending status message
```

### **Admin Approval Flow**

```
1. Admin receives notification (bell icon shows badge)
   ↓
2. Admin clicks notification or navigates to User Approvals page
   ↓
3. Admin sees pending user card with details
   ↓
4. Admin clicks "Approve" or "Reject"
   ↓
5. If Approve:
   - User status → 'active'
   - approvalStatus → 'approved'
   - Notification sent to user
   - User can now login
   
   If Reject:
   - User status → 'inactive'
   - approvalStatus → 'rejected'
   - Rejection reason stored
   - Notification sent to user
   ↓
6. User removed from pending list
```

### **Returning User Login Flow**

```
1. User clicks "Sign in with Google"
   ↓
2. Google OAuth authentication
   ↓
3. Backend checks user approval status
   ↓
4. If pending:
   - Show "Pending Approval" message
   - Cannot login
   
   If rejected:
   - Show rejection message with reason
   - Cannot login
   
   If approved:
   - Login successful
   - Redirect to dashboard
```

---

## 🗄️ Database Schema Changes

### **Users Table - New Fields**

```sql
approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'
approved_by UUID REFERENCES users(id)
approved_at TIMESTAMP
rejection_reason TEXT
```

### **Notifications Table** (Already existed)

```sql
id UUID PRIMARY KEY
tenant_id UUID
user_id UUID
title VARCHAR(255)
message TEXT
type ENUM('info', 'success', 'warning', 'error')
category ENUM('general', 'timesheet', 'leave', 'invoice', 'system', 'approval', 'reminder')
priority ENUM('low', 'medium', 'high', 'urgent')
read_at TIMESTAMP
action_url VARCHAR(500)
metadata JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## 🔌 API Endpoints

### **OAuth Endpoints**

#### `POST /api/oauth/check-user`
Check if user exists and approval status
```json
Request:
{
  "email": "user@example.com",
  "googleId": "google-id-123"
}

Response (Pending):
{
  "success": false,
  "isPending": true,
  "message": "Your registration is pending admin approval",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "approvalStatus": "pending"
  }
}

Response (Rejected):
{
  "success": false,
  "isRejected": true,
  "message": "Your registration has been rejected",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "approvalStatus": "rejected",
    "rejectionReason": "Reason text"
  }
}
```

#### `POST /api/oauth/register`
Register new OAuth user
```json
Request:
{
  "email": "user@example.com",
  "googleId": "google-id-123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee",
  "phoneNumber": "1234567890",
  "department": "Engineering"
}

Response:
{
  "success": true,
  "requiresApproval": true,
  "message": "Registration submitted successfully. Awaiting admin approval.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "approvalStatus": "pending",
    "status": "inactive"
  }
}
```

### **User Approval Endpoints**

#### `GET /api/user-approvals/pending?tenantId=<uuid>`
Get all pending users for a tenant
```json
Response:
{
  "success": true,
  "pendingUsers": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "employee",
      "department": "Engineering",
      "authProvider": "google",
      "createdAt": "2025-12-10T10:00:00Z",
      "approvalStatus": "pending"
    }
  ],
  "count": 1
}
```

#### `POST /api/user-approvals/approve/:userId`
Approve a pending user
```json
Request:
{
  "tenantId": "uuid",
  "adminId": "uuid"
}

Response:
{
  "success": true,
  "message": "User approved successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "approvalStatus": "approved",
    "status": "active"
  }
}
```

#### `POST /api/user-approvals/reject/:userId`
Reject a pending user
```json
Request:
{
  "tenantId": "uuid",
  "adminId": "uuid",
  "reason": "Does not meet requirements"
}

Response:
{
  "success": true,
  "message": "User rejected successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "approvalStatus": "rejected",
    "status": "inactive"
  }
}
```

### **Notification Endpoints**

#### `GET /api/notifications?userId=<uuid>&tenantId=<uuid>&limit=10`
Get user notifications

#### `GET /api/notifications/unread-count?userId=<uuid>&tenantId=<uuid>`
Get unread notification count

#### `PATCH /api/notifications/:id/read`
Mark notification as read

#### `PATCH /api/notifications/mark-all-read`
Mark all notifications as read

---

## 🎨 UI Components

### **1. Notification Bell**
- **Location**: Header (top right)
- **Features**:
  - Red badge showing unread count
  - Dropdown with notification list
  - Color-coded notification icons
  - Time ago display
  - Click to mark as read
  - Action URL navigation

### **2. Pending Approval Page**
- **Route**: `/pending-approval`
- **Features**:
  - Large pending icon (⏳)
  - User registration details
  - Status badge
  - Information about next steps
  - Back to login button

### **3. User Approvals Page**
- **Route**: `/[subdomain]/user-approvals`
- **Access**: Admin only
- **Features**:
  - Grid of pending user cards
  - User avatar with initials
  - Registration details
  - Approve/Reject buttons
  - Rejection reason modal
  - Real-time updates

---

## 🚀 Setup Instructions

### **1. Run Database Migration**

```bash
cd server
node migrations/add-user-approval-status.js
```

Or manually run the SQL:
```sql
ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN rejection_reason TEXT;
```

### **2. Restart Backend Server**

```bash
cd server
npm start
```

The server will automatically load the new routes.

### **3. Restart Frontend**

```bash
cd nextjs-app
npm run dev
```

---

## ✅ Testing Checklist

### **New User Registration**
- [ ] User can register via Google OAuth
- [ ] User is redirected to onboarding page
- [ ] User fills out profile form
- [ ] User sees pending approval page after submission
- [ ] User cannot login with pending status

### **Admin Notifications**
- [ ] Admin receives notification for new registration
- [ ] Notification bell shows unread count
- [ ] Notification appears in dropdown
- [ ] Clicking notification navigates to approval page

### **Admin Approval**
- [ ] Admin can see pending users page
- [ ] Pending user cards display correct information
- [ ] Approve button works correctly
- [ ] User status changes to approved
- [ ] User receives approval notification
- [ ] User can now login successfully

### **Admin Rejection**
- [ ] Reject button opens modal
- [ ] Admin can enter rejection reason
- [ ] User status changes to rejected
- [ ] User receives rejection notification
- [ ] User sees rejection message on login attempt

### **Returning User**
- [ ] Approved user can login normally
- [ ] Pending user sees pending message
- [ ] Rejected user sees rejection message

---

## 🎯 Key Features Summary

✅ **Pending Approval Status** - New OAuth users require admin approval  
✅ **In-App Notifications** - Real-time notifications for admins  
✅ **Notification Bell** - Header component with unread count  
✅ **Admin Approval Page** - Dedicated UI for managing pending users  
✅ **Pending Status Page** - Beautiful UI showing pending approval status  
✅ **Approval/Rejection Workflow** - Complete workflow with notifications  
✅ **Dark Mode Support** - All components support dark/light themes  
✅ **Responsive Design** - Works on all screen sizes  
✅ **Database Integration** - Proper schema with migrations  
✅ **API Endpoints** - RESTful APIs for all operations  

---

## 📝 Notes

- **Existing Users**: Users created before this implementation will have `approvalStatus: 'approved'` by default
- **Local Auth Users**: Users who register with email/password are not affected (auto-approved)
- **Multi-Tenant**: Approval workflow is tenant-specific
- **Notifications**: Stored in database and persist across sessions
- **Security**: Only admins can approve/reject users
- **Email Notifications**: Can be added in future (currently in-app only)

---

## 🔧 Future Enhancements

1. **Email Notifications**: Send email when user is approved/rejected
2. **Bulk Actions**: Approve/reject multiple users at once
3. **Approval History**: View all approval/rejection history
4. **Auto-Approval Rules**: Configure rules for auto-approval
5. **Notification Preferences**: Allow users to configure notification settings
6. **Push Notifications**: Browser push notifications for real-time alerts

---

## 🐛 Troubleshooting

### User stuck in pending status
- Check database: `SELECT * FROM users WHERE approval_status = 'pending'`
- Manually approve: Update user record or use admin UI

### Notifications not appearing
- Check notification table: `SELECT * FROM notifications WHERE user_id = '<admin-id>'`
- Verify admin role: User must have `role = 'admin'`
- Check browser console for API errors

### Approval page not accessible
- Verify user role is 'admin'
- Check route: Should be `/[subdomain]/user-approvals`
- Verify authentication token is valid

---

## 📞 Support

For issues or questions, contact the development team or refer to the main TimePulse documentation.

---

**Implementation Date**: December 10, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete and Ready for Testing
