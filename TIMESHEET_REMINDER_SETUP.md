# Timesheet Reminder Email Setup

## ✅ What's Been Implemented

### 1. Email Template
A beautiful, responsive email template has been added to `EmailService` with:
- **Visual urgency indicators**: Color changes based on overdue status
- **Clear information display**: Week range, end date, days overdue
- **Call-to-action button**: Direct link to submit timesheet
- **Mobile-responsive design**: Works on all devices
- **Professional styling**: Modern gradient headers and clean layout

### 2. Reminder Script
A script has been created at `server/scripts/send-timesheet-reminders.js` that:
- Finds employees who haven't submitted timesheets for a given week
- Calculates days overdue
- Sends personalized reminder emails
- Provides detailed logging and summary

---

## 🚀 How to Use

### Manual Execution

**Check previous week (default):**
```bash
node server/scripts/send-timesheet-reminders.js
```

**Check specific week:**
```bash
node server/scripts/send-timesheet-reminders.js 2024-12-29
```

**For specific tenant:**
```bash
node server/scripts/send-timesheet-reminders.js 2024-12-29 <tenant-id>
```

---

## ⏰ Automated Scheduling

### Option 1: AWS EventBridge (Recommended for Production)

Create a scheduled rule to run daily:

```bash
# Create EventBridge rule (runs daily at 9 AM UTC)
aws events put-rule \
  --name timepulse-timesheet-reminders \
  --schedule-expression "cron(0 9 * * ? *)" \
  --description "Daily timesheet reminder emails" \
  --region us-east-1

# Create Lambda function to run the script
# (You'll need to package the script as a Lambda function)
```

### Option 2: Cron Job (For EC2/On-Premise)

Add to crontab:
```bash
# Run daily at 9 AM
0 9 * * * cd /path/to/TimePulse && node server/scripts/send-timesheet-reminders.js >> /var/log/timesheet-reminders.log 2>&1
```

### Option 3: App Runner Scheduled Task

If using App Runner, you can create a separate service that runs this script on a schedule.

---

## 📧 Email Template Features

### Visual Design
- **Header**: Gradient background (yellow for due soon, red for overdue)
- **Urgency Badge**: Shows "Due Soon" or "X Days Overdue"
- **Information Box**: Displays week period, end date, and days overdue
- **Action Button**: Prominent "Submit Timesheet" button
- **Responsive**: Works on desktop, tablet, and mobile

### Content
- Personalized greeting with employee name
- Clear reminder message
- Warning alert for overdue timesheets
- Direct link to timesheet submission page
- Professional footer with company name

---

## 🔧 Configuration

### Environment Variables Required
- `SMTP_HOST`: Email SMTP host (already configured)
- `SMTP_PORT`: Email SMTP port (already configured)
- `SMTP_USER`: Email SMTP username (from Secrets Manager)
- `SMTP_PASS`: Email SMTP password (from Secrets Manager)
- `FRONTEND_URL`: Frontend URL for timesheet links (default: https://app.timepulse.io)

### Database Access
The script requires database access to:
- Query timesheets for a given week
- Get active employees
- Get employee email addresses
- Get tenant information

---

## 📊 Example Output

```
═══════════════════════════════════════════════════════
⏰ Timesheet Reminder Script
═══════════════════════════════════════════════════════

📅 Checking for missing timesheets...
   Week: Dec 23 - Dec 29, 2024
   Week End: December 29, 2024
   Days Overdue: 3

✅ Found 5 submitted timesheet(s) for this week

👥 Found 10 active employee(s)

📧 5 employee(s) need reminder emails

📨 Sending reminder to: John Doe (john.doe@example.com)
   ✅ Reminder sent successfully
📨 Sending reminder to: Jane Smith (jane.smith@example.com)
   ✅ Reminder sent successfully
...

═══════════════════════════════════════════════════════
📊 Summary
═══════════════════════════════════════════════════════
Total reminders sent: 5
Total failures: 0

✅ Script completed successfully
```

---

## 🎨 Email Preview

### For Due Soon (Not Overdue)
- **Header Color**: Yellow/Orange gradient
- **Badge**: "Due Soon"
- **Button**: "Submit Timesheet" (yellow)

### For Overdue
- **Header Color**: Red gradient
- **Badge**: "X Days Overdue"
- **Alert Box**: Yellow warning box with action required message
- **Button**: "Submit Timesheet Now" (red)

---

## 🧪 Testing

### Test the Email Template
```bash
# Send a test reminder email
node -e "
const EmailService = require('./server/services/EmailService');
EmailService.sendTimesheetReminder({
  employeeEmail: 'selvakumar@selsoftinc.com',
  employeeName: 'Selva Kumar',
  weekRange: 'Dec 23 - Dec 29, 2024',
  weekEndDate: 'December 29, 2024',
  daysOverdue: 2,
  timesheetLink: 'https://app.timepulse.io/timesheets?week=2024-12-29',
  tenantName: 'Selsoft Inc.'
}).then(r => console.log('✅ Sent:', r)).catch(e => console.error('❌ Error:', e));
"
```

### Test the Reminder Script
```bash
# Test for a specific week
node server/scripts/send-timesheet-reminders.js 2024-12-29
```

---

## 📝 Next Steps

1. **Set up automated scheduling** (choose one of the options above)
2. **Test with a small group** before enabling for all employees
3. **Monitor email delivery** and adjust timing if needed
4. **Consider multiple reminders** (e.g., 1 day before, day of, 1 day after, 3 days after)

---

## 🔄 Future Enhancements

- [ ] Configurable reminder schedule (e.g., send on Monday, Wednesday, Friday)
- [ ] Escalation to managers if timesheet is very overdue (e.g., 7+ days)
- [ ] Reminder preferences per employee
- [ ] Batch email sending for better performance
- [ ] Email tracking (open rates, click rates)
- [ ] Reminder history/logging

---

## 📞 Support

If you encounter any issues:
1. Check SMTP configuration in AWS Secrets Manager
2. Verify database connection
3. Check logs for specific error messages
4. Ensure employees have valid email addresses in the system

