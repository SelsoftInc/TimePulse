# Backend Notification System - Quick Start Guide

## Database Setup

### 1. Create Tables

```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Notification settings table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications JSONB DEFAULT '{"timeEntryReminders":true,"approvalRequests":true,"weeklyReports":true,"projectUpdates":false,"systemAnnouncements":true}'::jsonb,
  push_notifications JSONB DEFAULT '{"timeEntryReminders":false,"approvalRequests":true,"projectUpdates":true,"systemAnnouncements":false}'::jsonb,
  email_frequency VARCHAR(20) DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_tenant ON notifications(user_id, tenant_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

## API Routes (Express.js Example)

### 2. Create Notification Routes

```javascript
// routes/notifications.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// GET /api/notifications - Get all notifications
router.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { tenantId, limit = 50, offset = 0, isRead } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 AND tenant_id = $2
    `;
    const params = [userId, tenantId];

    if (isRead !== undefined) {
      query += ` AND is_read = $${params.length + 1}`;
      params.push(isRead === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const countResult = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    res.json({
      success: true,
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread - Get unread notifications
router.get('/api/notifications/unread', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 AND tenant_id = $2 AND is_read = FALSE 
       ORDER BY created_at DESC`,
      [userId, tenantId]
    );

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch unread notifications' });
  }
});

// GET /api/notifications/count - Get unread count
router.get('/api/notifications/count', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const userId = req.user.id;

    const result = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND tenant_id = $2 AND is_read = FALSE',
      [userId, tenantId]
    );

    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch count' });
  }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications 
       SET is_read = TRUE, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
      [id, userId, tenantId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications 
       SET is_read = TRUE, updated_at = NOW() 
       WHERE user_id = $1 AND tenant_id = $2 AND is_read = FALSE`,
      [userId, tenantId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const userId = req.user.id;

    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 AND tenant_id = $3',
      [id, userId, tenantId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// POST /api/notifications - Create notification
router.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { userId, type, title, message, link, metadata } = req.body;

    const result = await db.query(
      `INSERT INTO notifications (tenant_id, user_id, type, title, message, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenantId, userId, type, title, message, link || null, metadata || {}]
    );

    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

// GET /api/notifications/settings - Get settings
router.get('/api/notifications/settings', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const userId = req.user.id;

    let result = await db.query(
      'SELECT * FROM notification_settings WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    // Create default settings if none exist
    if (result.rows.length === 0) {
      result = await db.query(
        `INSERT INTO notification_settings (tenant_id, user_id)
         VALUES ($1, $2)
         RETURNING *`,
        [tenantId, userId]
      );
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/notifications/settings - Update settings
router.put('/api/notifications/settings', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const userId = req.user.id;
    const { emailNotifications, pushNotifications, emailFrequency } = req.body;

    const result = await db.query(
      `INSERT INTO notification_settings (tenant_id, user_id, email_notifications, push_notifications, email_frequency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, user_id) 
       DO UPDATE SET 
         email_notifications = $3,
         push_notifications = $4,
         email_frequency = $5,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, userId, emailNotifications, pushNotifications, emailFrequency]
    );

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

module.exports = router;
```

## Notification Helper Function

### 3. Create Notification Helper

```javascript
// utils/notificationHelper.js
const db = require('../config/database');

/**
 * Create a notification
 */
async function createNotification({
  tenantId,
  userId,
  type,
  title,
  message,
  link = null,
  metadata = {}
}) {
  try {
    const result = await db.query(
      `INSERT INTO notifications (tenant_id, user_id, type, title, message, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenantId, userId, type, title, message, link, metadata]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

module.exports = { createNotification };
```

## Integration Examples

### 4. Timesheet Submission

```javascript
// In your timesheet submission handler
const { createNotification } = require('../utils/notificationHelper');

router.post('/api/timesheets', authenticateToken, async (req, res) => {
  try {
    const { reviewerId, tenantId, ...timesheetData } = req.body;
    const employeeId = req.user.id;

    // Create timesheet
    const timesheet = await createTimesheet(timesheetData);

    // Get employee name
    const employee = await db.query('SELECT first_name, last_name FROM employees WHERE id = $1', [employeeId]);
    const employeeName = `${employee.rows[0].first_name} ${employee.rows[0].last_name}`;

    // Create notification for approver
    await createNotification({
      tenantId,
      userId: reviewerId,
      type: 'timesheet_submitted',
      title: 'New Timesheet Submitted',
      message: `${employeeName} has submitted a timesheet for review`,
      link: `/timesheets/approval`,
      metadata: {
        timesheetId: timesheet.id,
        employeeId,
        employeeName,
        weekLabel: timesheet.week_label
      }
    });

    res.json({ success: true, timesheet });
  } catch (error) {
    console.error('Error submitting timesheet:', error);
    res.status(500).json({ success: false, error: 'Failed to submit timesheet' });
  }
});
```

### 5. Timesheet Approval

```javascript
router.patch('/api/timesheets/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const approverId = req.user.id;

    // Get timesheet details
    const timesheet = await db.query(
      'SELECT * FROM timesheets WHERE id = $1',
      [id]
    );

    // Update timesheet status
    await db.query(
      'UPDATE timesheets SET status = $1, approved_by = $2 WHERE id = $3',
      ['approved', approverId, id]
    );

    // Create notification for employee
    await createNotification({
      tenantId,
      userId: timesheet.rows[0].employee_id,
      type: 'timesheet_approved',
      title: 'Timesheet Approved',
      message: `Your timesheet for ${timesheet.rows[0].week_label} has been approved`,
      link: `/timesheets/history`,
      metadata: {
        timesheetId: id,
        approverId,
        weekLabel: timesheet.rows[0].week_label
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ success: false, error: 'Failed to approve timesheet' });
  }
});
```

### 6. Timesheet Rejection

```javascript
router.patch('/api/timesheets/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.query;
    const { rejectionReason } = req.body;
    const approverId = req.user.id;

    // Get timesheet details
    const timesheet = await db.query(
      'SELECT * FROM timesheets WHERE id = $1',
      [id]
    );

    // Update timesheet status
    await db.query(
      'UPDATE timesheets SET status = $1, rejection_reason = $2 WHERE id = $3',
      ['rejected', rejectionReason, id]
    );

    // Create notification for employee
    await createNotification({
      tenantId,
      userId: timesheet.rows[0].employee_id,
      type: 'timesheet_rejected',
      title: 'Timesheet Rejected',
      message: `Your timesheet for ${timesheet.rows[0].week_label} was rejected. Reason: ${rejectionReason}`,
      link: `/timesheets/submit`,
      metadata: {
        timesheetId: id,
        approverId,
        weekLabel: timesheet.rows[0].week_label,
        rejectionReason
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting timesheet:', error);
    res.status(500).json({ success: false, error: 'Failed to reject timesheet' });
  }
});
```

## Testing

### 7. Test Endpoints

```bash
# Get all notifications
curl -X GET "http://44.222.217.57:5001/api/notifications?tenantId=YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread count
curl -X GET "http://44.222.217.57:5001/api/notifications/count?tenantId=YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark as read
curl -X PATCH "http://44.222.217.57:5001/api/notifications/NOTIFICATION_ID/read?tenantId=YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create notification (for testing)
curl -X POST "http://44.222.217.57:5001/api/notifications?tenantId=YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "type": "timesheet_submitted",
    "title": "Test Notification",
    "message": "This is a test notification",
    "link": "/timesheets"
  }'
```

## Checklist

- [ ] Run database migration to create tables
- [ ] Add notification routes to Express app
- [ ] Create notification helper function
- [ ] Add notification triggers to timesheet submit
- [ ] Add notification triggers to timesheet approve
- [ ] Add notification triggers to timesheet reject
- [ ] Add notification triggers to leave management
- [ ] Test all notification endpoints
- [ ] Test notification creation
- [ ] Test notification display in UI

## Summary

This quick start guide provides everything needed to implement the backend for the notification system. The frontend is already complete and ready to integrate once these backend endpoints are implemented.

**Estimated Implementation Time**: 2-4 hours
**Complexity**: Medium
**Dependencies**: PostgreSQL, Express.js, Authentication middleware
