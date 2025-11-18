# Manager Notifications & Scheduler Setup

## ✅ What's Been Implemented

### 1. Manager Email Templates
Two new email templates have been added to `EmailService`:

#### A. Manager Missing Timesheet Reminder
- Sent to managers when employees haven't submitted timesheets (2+ days after week end)
- Shows list of employees with missing timesheets
- Includes week information and days overdue
- Professional alert-style design

#### B. Pending Approval Reminder
- Sent to managers/reviewers when timesheets are pending approval (2+ days after submission)
- Shows list of pending timesheets with employee names and week ranges
- Includes days pending information
- Clean, actionable design

### 2. Notification Scripts

#### `send-manager-notifications.js`
Comprehensive script that:
- **Missing Timesheet Reminders**: Finds employees who haven't submitted (2+ days overdue) and notifies their managers
- **Pending Approval Reminders**: Finds timesheets pending approval (2+ days) and notifies reviewers
- Groups notifications by manager to avoid spam
- Handles manager lookup via:
  1. Employee relationships (EmployeeRelationship model)
  2. User.managerId field
  3. Fallback to tenant admins/managers

#### `notification-scheduler.js`
Scheduler that runs notifications twice daily:
- **Schedule**: 9 AM and 5 PM UTC (configurable)
- Runs all notification types:
  1. Employee reminders (missing timesheets)
  2. Manager reminders (missing timesheets - 2+ days)
  3. Manager reminders (pending approvals - 2+ days)

---

## 🚀 Installation

### Step 1: Install node-cron

```bash
cd server
npm install node-cron
```

### Step 2: Verify Dependencies

```bash
npm list node-cron
```

---

## 📋 Usage

### Manual Execution

**Run manager notifications manually:**
```bash
node server/scripts/send-manager-notifications.js
```

**For specific tenant:**
```bash
node server/scripts/send-manager-notifications.js <tenant-id>
```

### Automated Scheduler

**Start the scheduler:**
```bash
node server/scripts/notification-scheduler.js
```

**With PM2 (recommended for production):**
```bash
# Install PM2 globally
npm install -g pm2

# Start scheduler
pm2 start server/scripts/notification-scheduler.js --name timesheet-notifications

# View logs
pm2 logs timesheet-notifications

# Stop scheduler
pm2 stop timesheet-notifications

# Restart scheduler
pm2 restart timesheet-notifications
```

**With systemd (Linux):**
```bash
# Create service file: /etc/systemd/system/timesheet-notifications.service
[Unit]
Description=TimePulse Notification Scheduler
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/TimePulse/server
ExecStart=/usr/bin/node scripts/notification-scheduler.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable timesheet-notifications
sudo systemctl start timesheet-notifications
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Optional: Run notifications immediately on scheduler start
RUN_IMMEDIATELY=true

# Optional: Filter by tenant
TENANT_ID=<tenant-uuid>

# Required: SMTP configuration (already set)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<from-secrets-manager>
SMTP_PASS=<from-secrets-manager>
FRONTEND_URL=https://app.timepulse.io
```

### Schedule Customization

Edit `server/scripts/notification-scheduler.js`:

```javascript
// Current: 9 AM and 5 PM UTC
const SCHEDULE = '0 9,17 * * *';

// Examples:
// 9 AM and 3 PM UTC
const SCHEDULE = '0 9,15 * * *';

// Every 12 hours
const SCHEDULE = '0 */12 * * *';

// 9 AM and 5 PM EST (14:00 and 22:00 UTC)
const SCHEDULE = '0 14,22 * * *';
```

Cron format: `minute hour day month day-of-week`

---

## 📊 Notification Logic

### Missing Timesheet Reminders (Managers)

**Trigger**: Timesheet is 2+ days overdue (after week end date)

**Process**:
1. Find previous week (last Sunday)
2. Get all employees who haven't submitted
3. Find manager for each employee:
   - Check EmployeeRelationship (manager/timesheet_approver)
   - Check User.managerId
   - Fallback to tenant admins/managers
4. Group employees by manager
5. Send one email per manager with all their employees

**Email Content**:
- List of employees with missing timesheets
- Week information
- Days overdue
- Link to timesheets dashboard

### Pending Approval Reminders (Managers)

**Trigger**: Timesheet submitted 2+ days ago and still pending

**Process**:
1. Find timesheets with status 'submitted' and submittedAt <= 2 days ago
2. Get reviewer for each timesheet:
   - Use assigned reviewerId
   - Check EmployeeRelationship
   - Fallback to tenant admins
3. Group timesheets by reviewer
4. Send one email per reviewer with all pending timesheets

**Email Content**:
- List of pending timesheets
- Employee names and week ranges
- Days pending
- Link to pending approvals page

---

## 🧪 Testing

### Test Manager Missing Timesheet Reminders

```bash
# Run manually
node server/scripts/send-manager-notifications.js
```

Expected output:
```
📋 Checking for missing timesheets (2+ days overdue)...
   Week: Dec 23 - Dec 29, 2024
   Days Overdue: 3
   Found 5 employee(s) with missing timesheets
   Found 2 manager(s) to notify
📨 Sending reminder to manager: John Manager (john@example.com)
   ✅ Reminder sent successfully
```

### Test Pending Approval Reminders

The script automatically checks for pending approvals. Expected output:
```
📋 Checking for pending approvals (2+ days pending)...
   Found 3 timesheet(s) pending approval
   Found 2 reviewer(s) to notify
📨 Sending pending approval reminder to: Jane Reviewer (jane@example.com)
   ✅ Reminder sent successfully
```

### Test Scheduler

```bash
# Start scheduler
node server/scripts/notification-scheduler.js

# Or with immediate run
RUN_IMMEDIATELY=true node server/scripts/notification-scheduler.js
```

---

## 🏗️ Deployment Options

### Option 1: AWS App Runner (Recommended)

Create a separate App Runner service for the scheduler:

1. Create `scheduler/Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
CMD ["node", "scripts/notification-scheduler.js"]
```

2. Deploy to App Runner with:
   - Environment variables from Secrets Manager
   - Auto-scaling: 1 instance (always running)

### Option 2: AWS Lambda + EventBridge

1. Create Lambda function that runs the notification scripts
2. Create EventBridge rule (twice daily)
3. Lambda invokes the scripts

### Option 3: EC2 Instance

1. Deploy scheduler script to EC2
2. Use systemd or PM2 to keep it running
3. Set up monitoring and logging

### Option 4: Docker Container

```bash
# Build
docker build -t timesheet-scheduler -f scheduler/Dockerfile .

# Run
docker run -d \
  --name timesheet-scheduler \
  --env-file .env \
  timesheet-scheduler
```

---

## 📝 Logging

The scheduler logs all activities:

```
═══════════════════════════════════════════════════════
⏰ Scheduled Run: 2024-12-30T09:00:00.000Z
═══════════════════════════════════════════════════════

📧 Running Employee Reminders...
───────────────────────────────────────────────────────
📅 Checking for missing timesheets...
...

📧 Running Manager Missing Timesheet Reminders...
───────────────────────────────────────────────────────
📋 Checking for missing timesheets (2+ days overdue)...
...

📧 Running Manager Pending Approval Reminders...
───────────────────────────────────────────────────────
📋 Checking for pending approvals (2+ days pending)...
...
```

---

## 🔍 Troubleshooting

### Issue: No notifications sent

**Check**:
1. SMTP credentials are correct
2. Employees have valid email addresses
3. Managers/reviewers have valid email addresses
4. Timesheets are actually overdue/pending (check dates)

### Issue: Scheduler not running

**Check**:
1. Process is still running: `ps aux | grep notification-scheduler`
2. Check logs for errors
3. Verify cron schedule is correct
4. Check timezone settings

### Issue: Too many emails

**Solution**: The script groups notifications by manager, so each manager receives one email with all their employees/timesheets. This prevents spam.

---

## 📈 Monitoring

### Key Metrics to Track

1. **Notification Success Rate**: Emails sent vs. failed
2. **Missing Timesheets**: Count of employees with missing timesheets
3. **Pending Approvals**: Count of timesheets pending approval
4. **Scheduler Uptime**: Ensure scheduler is running

### Recommended Alerts

- Scheduler process down
- High email failure rate (>10%)
- No notifications sent for 3+ days (might indicate issue)

---

## ✅ Summary

**Implemented**:
- ✅ Manager missing timesheet reminders (2+ days overdue)
- ✅ Manager pending approval reminders (2+ days pending)
- ✅ Automated scheduler (runs twice daily)
- ✅ Beautiful email templates
- ✅ Grouped notifications (one email per manager)
- ✅ Multiple manager lookup methods

**Next Steps**:
1. Install `node-cron`: `npm install node-cron`
2. Test manually: `node server/scripts/send-manager-notifications.js`
3. Deploy scheduler (choose deployment option above)
4. Monitor logs and adjust schedule as needed

---

## 🔗 Related Files

- `server/services/EmailService.js` - Email templates and sending logic
- `server/scripts/send-manager-notifications.js` - Manager notification logic
- `server/scripts/send-timesheet-reminders.js` - Employee reminder logic
- `server/scripts/notification-scheduler.js` - Scheduler
- `TIMESHEET_REMINDER_SETUP.md` - Employee reminder setup

