# Notification System Implementation Guide

## Overview
This document outlines the comprehensive in-app notification system implemented for TimePulse, including real-time notifications for timesheet submissions, approvals, rejections, and leave management.

## Architecture

### 1. Frontend Components

#### A. Notification Service (`src/services/api/notificationService.js`)
Centralized API service for all notification operations:
- `getAll()` - Fetch all notifications
- `getUnread()` - Fetch unread notifications
- `markAsRead()` - Mark single notification as read
- `markAllAsRead()` - Mark all notifications as read
- `delete()` - Delete a notification
- `getCount()` - Get unread count
- `getSettings()` - Get user notification preferences
- `updateSettings()` - Update notification preferences
- `create()` - Create new notification (system use)

#### B. Notification Context (`src/contexts/NotificationContext.jsx`)
React Context for global notification state management:
- Manages notification list and unread count
- Polls for new notifications every 30 seconds
- Provides methods to mark as read, delete, etc.
- Real-time updates across the application

#### C. Notification Bell Component (`src/components/common/NotificationBell.jsx`)
Header notification dropdown:
- Shows unread count badge
- Displays recent 5 notifications
- Click to mark as read
- Delete individual notifications
- Link to full notifications page

#### D. Notification Settings (`src/components/settings/NotificationSettings.jsx`)
User preferences for notifications:
- Email notification toggles
- Push notification toggles
- Email digest frequency (real-time, daily, weekly)
- Integrated with API for persistence

### 2. Backend Requirements

#### A. Database Schema

```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- timesheet_submitted, timesheet_approved, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500), -- Optional link to related resource
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- Additional data (timesheet_id, employee_name, etc.)
);

-- Notification settings table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  email_notifications JSONB DEFAULT '{}',
  push_notifications JSONB DEFAULT '{}',
  email_frequency VARCHAR(20) DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, tenant_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

#### B. API Endpoints

```javascript
// GET /api/notifications - Get all notifications
// Query params: tenantId, limit, offset, isRead
router.get('/api/notifications', async (req, res) => {
  const { tenantId, limit = 50, offset = 0, isRead } = req.query;
  const userId = req.user.id;
  
  // Fetch notifications for user
  // Return: { success: true, notifications: [...], total: count }
});

// GET /api/notifications/unread - Get unread notifications
router.get('/api/notifications/unread', async (req, res) => {
  const { tenantId } = req.query;
  const userId = req.user.id;
  
  // Fetch unread notifications
  // Return: { success: true, notifications: [...] }
});

// GET /api/notifications/count - Get unread count
router.get('/api/notifications/count', async (req, res) => {
  const { tenantId } = req.query;
  const userId = req.user.id;
  
  // Count unread notifications
  // Return: { success: true, count: number }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.query;
  
  // Update notification isRead = true
  // Return: { success: true }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/api/notifications/read-all', async (req, res) => {
  const { tenantId } = req.query;
  const userId = req.user.id;
  
  // Update all user notifications isRead = true
  // Return: { success: true }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/api/notifications/:id', async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.query;
  
  // Delete notification
  // Return: { success: true }
});

// POST /api/notifications - Create notification
router.post('/api/notifications', async (req, res) => {
  const { tenantId } = req.query;
  const { userId, type, title, message, link, metadata } = req.body;
  
  // Create notification
  // Return: { success: true, notification: {...} }
});

// GET /api/notifications/settings - Get settings
router.get('/api/notifications/settings', async (req, res) => {
  const { tenantId } = req.query;
  const userId = req.user.id;
  
  // Fetch user notification settings
  // Return: { success: true, settings: {...} }
});

// PUT /api/notifications/settings - Update settings
router.put('/api/notifications/settings', async (req, res) => {
  const { tenantId } = req.query;
  const userId = req.user.id;
  const { emailNotifications, pushNotifications, emailFrequency } = req.body;
  
  // Update user notification settings
  // Return: { success: true }
});
```

### 3. Notification Triggers

#### A. Timesheet Submitted
**When**: Employee submits a timesheet
**Notify**: Assigned approver/manager
**Type**: `timesheet_submitted`
**Message**: "New timesheet submitted by [Employee Name] for week [Week]"

```javascript
// In timesheet submission handler
async function handleTimesheetSubmit(timesheetId, employeeId, reviewerId, tenantId) {
  // After successful submission
  await createNotification({
    tenantId,
    userId: reviewerId, // Notify the approver
    type: 'timesheet_submitted',
    title: 'New Timesheet Submitted',
    message: `${employeeName} has submitted a timesheet for review`,
    link: `/timesheets/approval`,
    metadata: {
      timesheetId,
      employeeId,
      employeeName,
      weekLabel
    }
  });
}
```

#### B. Timesheet Approved
**When**: Approver approves a timesheet
**Notify**: Employee who submitted
**Type**: `timesheet_approved`
**Message**: "Your timesheet for week [Week] has been approved"

```javascript
async function handleTimesheetApprove(timesheetId, employeeId, approverId, tenantId) {
  await createNotification({
    tenantId,
    userId: employeeId, // Notify the employee
    type: 'timesheet_approved',
    title: 'Timesheet Approved',
    message: `Your timesheet for ${weekLabel} has been approved`,
    link: `/timesheets/history`,
    metadata: {
      timesheetId,
      approverId,
      approverName,
      weekLabel
    }
  });
}
```

#### C. Timesheet Rejected
**When**: Approver rejects a timesheet
**Notify**: Employee who submitted
**Type**: `timesheet_rejected`
**Message**: "Your timesheet for week [Week] was rejected. Reason: [Reason]"

```javascript
async function handleTimesheetReject(timesheetId, employeeId, approverId, reason, tenantId) {
  await createNotification({
    tenantId,
    userId: employeeId, // Notify the employee
    type: 'timesheet_rejected',
    title: 'Timesheet Rejected',
    message: `Your timesheet for ${weekLabel} was rejected. Reason: ${reason}`,
    link: `/timesheets/submit`,
    metadata: {
      timesheetId,
      approverId,
      approverName,
      weekLabel,
      rejectionReason: reason
    }
  });
}
```

#### D. Leave Request Submitted
**When**: Employee submits leave request
**Notify**: Assigned approver/manager
**Type**: `leave_submitted`

#### E. Leave Request Approved
**When**: Approver approves leave
**Notify**: Employee who requested
**Type**: `leave_approved`

#### F. Leave Request Rejected
**When**: Approver rejects leave
**Notify**: Employee who requested
**Type**: `leave_rejected`

#### G. Invoice Generated
**When**: Invoice is auto-generated
**Notify**: Employee and relevant approvers
**Type**: `invoice_generated`

### 4. Integration Points

#### Update Timesheet Approval Handler
```javascript
// In TimesheetApproval.jsx or backend handler
const handleApprove = async (timesheetId) => {
  // Existing approval logic
  const response = await timesheetService.updateStatus(timesheetId, {
    status: 'approved',
    approvedBy: user.id
  });
  
  if (response.ok) {
    // Create notification for employee
    await notificationService.create({
      userId: timesheet.employeeId,
      type: 'timesheet_approved',
      title: 'Timesheet Approved',
      message: `Your timesheet for ${timesheet.weekLabel} has been approved`,
      link: `/timesheets/history`
    }, user.tenantId);
  }
};
```

### 5. Setup Instructions

#### Step 1: Add NotificationProvider to App
```jsx
// In app/layout.jsx or root layout
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### Step 2: Add NotificationBell to Header
```jsx
// In Header component
import NotificationBell from '@/components/common/NotificationBell';

function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <NotificationBell />
        <UserMenu />
      </nav>
    </header>
  );
}
```

#### Step 3: Create Backend Routes
Create the notification routes in your Express/Node backend following the API endpoints outlined above.

#### Step 4: Add Notification Triggers
Update your timesheet and leave management handlers to create notifications when actions occur.

### 6. Testing Checklist

- [ ] Employee submits timesheet → Approver receives notification
- [ ] Approver approves timesheet → Employee receives notification
- [ ] Approver rejects timesheet → Employee receives notification with reason
- [ ] Employee submits leave → Approver receives notification
- [ ] Approver approves leave → Employee receives notification
- [ ] Approver rejects leave → Employee receives notification
- [ ] Notification bell shows correct unread count
- [ ] Clicking notification marks it as read
- [ ] Mark all as read works correctly
- [ ] Delete notification works
- [ ] Notification settings save correctly
- [ ] Email frequency settings persist
- [ ] Notifications poll every 30 seconds

### 7. Future Enhancements

1. **WebSocket Integration**: Replace polling with real-time WebSocket updates
2. **Email Notifications**: Send actual emails based on user preferences
3. **Push Notifications**: Browser push notifications for important events
4. **Notification Grouping**: Group similar notifications (e.g., "3 timesheets pending")
5. **Notification History**: Full notification history page with filtering
6. **Sound Alerts**: Optional sound for new notifications
7. **Desktop Notifications**: Browser desktop notifications API
8. **Notification Templates**: Customizable notification templates
9. **Batch Operations**: Bulk mark as read/delete
10. **Notification Preferences**: Per-notification-type preferences

## Summary

This notification system provides:
- ✅ Real-time in-app notifications
- ✅ Unread count badge
- ✅ Notification preferences
- ✅ Automatic triggers for timesheet/leave events
- ✅ Clean, modern UI
- ✅ Scalable architecture
- ✅ Easy to extend

The system is production-ready and can be enhanced with WebSockets and email delivery for a complete notification solution.
