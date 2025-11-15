# Email Notifications Summary

## 📧 Complete List of Email Notifications

### 1. **Employee Reminders** (Missing Timesheets)
**Who receives:** Employees who haven't submitted their timesheet after the week ends

**When sent:**
- Automatically via scheduler (twice daily at 9 AM and 5 PM UTC)
- Checks previous week (last Sunday)
- Sent to employees who haven't submitted

**Email details:**
- **To:** Employee email address
- **From:** `noreply@timepulse.io`
- **Subject:** `⏰ Reminder: Timesheet Due - [Week Range]` or `⏰ Reminder: Timesheet Due - [Week Range] ([X] days overdue)`
- **Content:** 
  - Week range
  - Week end date
  - Days overdue (if applicable)
  - Direct link to submit timesheet

**Example recipients:**
- `john.doe@example.com` (if John hasn't submitted for last week)
- `jane.smith@example.com` (if Jane hasn't submitted for last week)

---

### 2. **Manager Missing Timesheet Reminders**
**Who receives:** Managers whose employees haven't submitted timesheets (2+ days after week end)

**When sent:**
- Automatically via scheduler (twice daily at 9 AM and 5 PM UTC)
- Only if timesheet is 2+ days overdue
- Groups all missing employees per manager (one email per manager)

**Email details:**
- **To:** Manager/Reviewer email address
- **From:** `noreply@timepulse.io`
- **Subject:** `⚠️ Manager Alert: [X] Employee(s) Missing Timesheets - [Week Range] ([X] days overdue)`
- **Content:**
  - List of employees with missing timesheets
  - Week information
  - Days overdue
  - Link to timesheets dashboard

**Manager lookup priority:**
1. EmployeeRelationship (manager/timesheet_approver relationship)
2. User.managerId field
3. Fallback to tenant admins/managers

**Example recipients:**
- `manager@example.com` (receives list of all their employees who haven't submitted)
- `admin@example.com` (if no specific manager assigned)

---

### 3. **Manager Pending Approval Reminders**
**Who receives:** Managers/Reviewers who have timesheets pending approval (2+ days after submission)

**When sent:**
- Automatically via scheduler (twice daily at 9 AM and 5 PM UTC)
- Only if timesheet was submitted 2+ days ago and still pending

**Email details:**
- **To:** Reviewer/Manager email address (assigned reviewer or employee's manager)
- **From:** `noreply@timepulse.io`
- **Subject:** `⏰ Pending Approval: [X] Timesheet(s) Awaiting Your Review`
- **Content:**
  - List of pending timesheets with employee names
  - Week ranges
  - Days pending
  - Link to pending approvals page

**Reviewer lookup priority:**
1. Assigned reviewerId from timesheet
2. EmployeeRelationship (manager/timesheet_approver)
3. Fallback to tenant admins

**Example recipients:**
- `reviewer@example.com` (receives list of all timesheets pending their approval)
- `manager@example.com` (if they're the assigned reviewer)

---

### 4. **Timesheet Submission Notification**
**Who receives:** Reviewer/Manager assigned to review the timesheet

**When sent:**
- Immediately when employee submits a timesheet
- Triggered by `POST /api/timesheets` endpoint

**Email details:**
- **To:** Reviewer email address (from timesheet.reviewerId)
- **From:** `noreply@timepulse.io`
- **Subject:** `Timesheet Submitted for Review - [Employee Name] - [Week Range]`
- **Content:**
  - Employee name
  - Week range
  - Link to review timesheet

**Example recipients:**
- `reviewer@example.com` (assigned reviewer for the submitted timesheet)

---

### 5. **Timesheet Approval Notification**
**Who receives:** Employee whose timesheet was approved

**When sent:**
- Immediately when manager/reviewer approves a timesheet
- Triggered by `PUT /api/timesheets/:id` with status='approved'

**Email details:**
- **To:** Employee email address
- **From:** `noreply@timepulse.io`
- **Subject:** `Timesheet Approved - [Week Range]`
- **Content:**
  - Week range
  - Reviewer name
  - Link to view timesheet

**Example recipients:**
- `employee@example.com` (employee whose timesheet was approved)

---

### 6. **Timesheet Rejection Notification**
**Who receives:** Employee whose timesheet was rejected

**When sent:**
- Immediately when manager/reviewer rejects a timesheet
- Triggered by `PUT /api/timesheets/:id` with status='rejected'

**Email details:**
- **To:** Employee email address
- **From:** `noreply@timepulse.io`
- **Subject:** `Timesheet Rejected - [Week Range] - Action Required`
- **Content:**
  - Week range
  - Reviewer name
  - Rejection reason
  - Link to review and resubmit

**Example recipients:**
- `employee@example.com` (employee whose timesheet was rejected)

---

### 7. **Invoice Notification**
**Who receives:** Vendor/Client when an invoice is generated

**When sent:**
- When invoice is generated (via invoice generation process)

**Email details:**
- **To:** Vendor email address
- **From:** `noreply@timepulse.io`
- **Subject:** `Invoice [Invoice Number] - [Employee Name] - [Week Range]`
- **Content:**
  - Invoice number
  - Employee name
  - Week range
  - Total amount
  - Secure invoice link

**Example recipients:**
- `vendor@example.com` (vendor/client receiving the invoice)

---

## 📊 Notification Flow Summary

### Daily Automated Notifications (Scheduler - 2x per day)

**9 AM UTC & 5 PM UTC:**
1. **Employee Reminders** → Employees with missing timesheets
2. **Manager Missing Reminders** → Managers (if 2+ days overdue)
3. **Manager Pending Approval** → Reviewers (if 2+ days pending)

### Real-Time Notifications (Triggered by Actions)

**On Timesheet Submit:**
- **Submission Notification** → Assigned Reviewer

**On Timesheet Approval:**
- **Approval Notification** → Employee

**On Timesheet Rejection:**
- **Rejection Notification** → Employee

**On Invoice Generation:**
- **Invoice Notification** → Vendor/Client

---

## 👥 Recipient Categories

### Employees
- Receive: Reminders (missing timesheets), Approval notifications, Rejection notifications

### Managers/Reviewers
- Receive: Missing timesheet alerts (for their employees), Pending approval reminders, Submission notifications

### Vendors/Clients
- Receive: Invoice notifications

---

## 🔄 Notification Frequency

| Notification Type | Frequency | Condition |
|------------------|-----------|-----------|
| Employee Reminder | 2x daily | If timesheet not submitted after week end |
| Manager Missing Alert | 2x daily | If timesheet 2+ days overdue |
| Manager Pending Alert | 2x daily | If approval 2+ days pending |
| Submission Notification | Real-time | When timesheet submitted |
| Approval Notification | Real-time | When timesheet approved |
| Rejection Notification | Real-time | When timesheet rejected |
| Invoice Notification | On-demand | When invoice generated |

---

## 📝 Example Scenarios

### Scenario 1: Employee Forgets to Submit
- **Monday 9 AM:** Employee reminder sent to `employee@example.com`
- **Monday 5 PM:** Employee reminder sent again (if still not submitted)
- **Tuesday 9 AM:** Employee reminder + Manager alert sent to `manager@example.com` (2+ days overdue)

### Scenario 2: Timesheet Submitted but Not Reviewed
- **Monday:** Employee submits → Reviewer receives submission notification
- **Wednesday 9 AM:** Reviewer receives pending approval reminder (2+ days pending)
- **Wednesday 5 PM:** Reviewer receives reminder again (if still pending)

### Scenario 3: Timesheet Approved
- **Immediately:** Employee receives approval notification

### Scenario 4: Timesheet Rejected
- **Immediately:** Employee receives rejection notification with reason

---

## 🎯 Key Points

1. **Grouped Notifications:** Managers receive one email with all their employees/timesheets (not spam)
2. **Smart Timing:** Only sends reminders when appropriate (2+ days overdue/pending)
3. **Fallback Logic:** If no manager assigned, uses tenant admins
4. **All Emails From:** `noreply@timepulse.io` (verified domain)
5. **Beautiful Templates:** All emails have professional, responsive HTML templates

---

## 🔧 Configuration

All email notifications are configured via:
- **SMTP Settings:** AWS SES (email-smtp.us-east-1.amazonaws.com:587)
- **From Address:** `noreply@timepulse.io`
- **Scheduler:** Runs twice daily (configurable via `NOTIFICATION_SCHEDULE`)

---

## 📧 Email Address Requirements

For notifications to work:
- ✅ Employees must have valid email addresses in `users.email`
- ✅ Managers/Reviewers must have valid email addresses
- ✅ Domain `timepulse.io` must be verified in AWS SES
- ✅ SMTP credentials must be configured in AWS Secrets Manager

