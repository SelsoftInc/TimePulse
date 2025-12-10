# 📧 Email Notification Setup & Testing Guide

## ✅ Current Implementation Status

The email notification system is **FULLY IMPLEMENTED** and ready to use! Here's what's already working:

### **✅ Implemented Features:**

1. **User Approval Email** - Sent when admin approves a user
   - ✅ Beautiful HTML template with green success theme
   - ✅ User account details (name, role, approved by)
   - ✅ Login button with direct link
   - ✅ Welcome message
   - ✅ Professional branding

2. **User Rejection Email** - Sent when admin rejects a user
   - ✅ Professional HTML template with neutral theme
   - ✅ Rejection reason display
   - ✅ Contact information for questions
   - ✅ Respectful and clear messaging

3. **Email Service** - `UserApprovalEmailService.js`
   - ✅ Nodemailer integration
   - ✅ SMTP configuration
   - ✅ Development mode (logs without sending)
   - ✅ Production mode (sends actual emails)
   - ✅ Error handling and logging

4. **API Integration** - `userApprovals.js`
   - ✅ Approval endpoint sends email
   - ✅ Rejection endpoint sends email
   - ✅ Database notifications created
   - ✅ User status updated
   - ✅ Comprehensive logging

---

## 🔧 SMTP Configuration

### **Option 1: Gmail (Recommended for Testing)**

#### **Step 1: Enable 2-Factor Authentication**
1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification

#### **Step 2: Generate App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it: "TimePulse"
4. Click "Generate"
5. Copy the 16-character password

#### **Step 3: Update .env File**
```env
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FRONTEND_URL=http://localhost:3000
```

---

### **Option 2: Outlook/Office 365**

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
FRONTEND_URL=http://localhost:3000
```

---

### **Option 3: SendGrid (Production)**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FRONTEND_URL=https://your-production-domain.com
```

---

### **Option 4: Development Mode (No SMTP)**

If you don't configure SMTP, the system will run in development mode:
- ✅ Emails won't actually send
- ✅ Email content logged to console
- ✅ Approval/rejection still works
- ✅ Perfect for testing without email setup

---

## 🧪 Testing the Email System

### **Complete Test Flow:**

#### **Step 1: Configure SMTP (Optional)**

Edit `server/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

---

#### **Step 2: Create Pending User**

```bash
cd server
node create-pending-oauth-user.js
```

**Expected Output:**
```
✅ User created successfully!
   Email: testpending@gmail.com
   Status: inactive
   Approval: pending
```

---

#### **Step 3: Verify User**

```bash
node check-all-users.js
```

**Should show:**
```
🔍 Pending users: 1
  - testpending@gmail.com (Test Pending)
```

---

#### **Step 4: Start Server**

```bash
npm start
```

**Look for:**
```
✅ User Approval Email service is ready
```

Or if SMTP not configured:
```
📧 Email service not configured (development mode)
```

---

#### **Step 5: Test Approval in Browser**

1. **Login as Admin:**
   - Go to: http://localhost:3000
   - Login with admin credentials

2. **Navigate to Notifications:**
   - Click bell icon OR
   - Go to: http://localhost:3000/selsoft/notifications

3. **Open Approval Modal:**
   - Click "View" button on notification
   - Modal opens with user details

4. **Approve User:**
   - Click "Approve User" button
   - Wait for success message

---

#### **Step 6: Check Email**

**If SMTP Configured:**
- Check inbox of `testpending@gmail.com`
- You should receive email with subject: "✅ Welcome to Selsoft - Your Account Has Been Approved"

**If SMTP Not Configured:**
- Check server console logs
- You'll see:
```
📧 Email service not configured. User approval notification:
{
  to: 'testpending@gmail.com',
  userName: 'Test Pending',
  userRole: 'employee'
}
```

---

#### **Step 7: Verify Database**

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

## 📧 Email Templates Preview

### **Approval Email Template:**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    ✅                           │
│            Account Approved!                    │
│          Welcome to Selsoft                     │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Dear Test Pending,                             │
│                                                 │
│  Great news! Your registration for Selsoft      │
│  has been reviewed and approved. You now have   │
│  full access to the TimePulse system.           │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  🎉 Welcome Aboard!                       │ │
│  │  We're excited to have you as part of     │ │
│  │  our team.                                │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Your Account Details:                          │
│  ┌───────────────────────────────────────────┐ │
│  │  Name:         Test Pending               │ │
│  │  Role:         employee                   │ │
│  │  Approved by:  Admin Name                 │ │
│  │  Status:       Active                     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│         [Login to TimePulse]                    │
│                                                 │
│  You can now login to TimePulse using your      │
│  Google account and start managing your         │
│  timesheets, projects, and more.                │
│                                                 │
│  Best regards,                                  │
│  Selsoft                                        │
│  TimePulse Team                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### **Rejection Email Template:**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    ℹ️                           │
│        Registration Status Update               │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Dear Test User,                                │
│                                                 │
│  Thank you for your interest in joining         │
│  Selsoft through TimePulse.                     │
│                                                 │
│  After reviewing your registration request,     │
│  we regret to inform you that we are unable     │
│  to approve your account at this time.          │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Reason for Decision:                     │ │
│  │  [Admin's rejection reason here]          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Have Questions?                          │ │
│  │  If you believe this is an error or have  │ │
│  │  any questions, please contact Admin Name │ │
│  │  for more information.                    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  We appreciate your understanding.              │
│                                                 │
│  Best regards,                                  │
│  Selsoft                                        │
│  TimePulse Team                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### **Issue 1: Email Not Sending**

**Check Server Logs:**
```
❌ User Approval Email service configuration error: ...
```

**Solutions:**
1. Verify SMTP credentials in `.env`
2. Check Gmail App Password (not regular password)
3. Ensure 2FA is enabled on Gmail
4. Check SMTP_HOST and SMTP_PORT are correct

---

### **Issue 2: "Email service not configured"**

**Console Shows:**
```
📧 Email service not configured. User approval notification:
```

**This is normal!** It means:
- SMTP_USER or SMTP_PASS not set in `.env`
- System running in development mode
- Approval/rejection still works
- Emails logged to console instead

**To fix:** Add SMTP credentials to `.env` and restart server

---

### **Issue 3: Email Goes to Spam**

**Solutions:**
1. Check spam/junk folder
2. Add sender to contacts
3. Use production SMTP service (SendGrid, AWS SES)
4. Configure SPF/DKIM records (production only)

---

### **Issue 4: "Invalid login" Error**

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password (not regular password)
3. Use 16-character app password in `.env`

---

## 📊 Email Service Features

### **Automatic Fallback:**
- If SMTP not configured → Development mode
- If email fails → Logs error, continues approval
- User approval never blocked by email issues

### **Logging:**
```
✅ User approval email sent successfully: {
  messageId: '<...>',
  to: 'user@example.com',
  userName: 'John Doe'
}
```

### **Error Handling:**
```
❌ Error sending user approval email: [error details]
[User Approval] Failed to send approval email: [message]
```

### **Development Mode:**
```
📧 Email service not configured. User approval notification:
{
  to: 'user@example.com',
  userName: 'John Doe',
  userRole: 'employee'
}
```

---

## 🎯 Complete Workflow

```
┌─────────────────────────────────────────────────┐
│ 1. User Registers via OAuth                     │
│    ↓                                            │
│    approvalStatus: 'pending'                    │
│    status: 'inactive'                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Notification Created for Admin               │
│    ↓                                            │
│    category: 'approval'                         │
│    title: 'New User Registration...'           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Admin Reviews & Clicks "Approve"             │
│    ↓                                            │
│    POST /api/user-approvals/approve/:userId     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Database Updated                             │
│    ↓                                            │
│    approvalStatus: 'approved'                   │
│    status: 'active'                             │
│    approvedBy: adminId                          │
│    approvedAt: timestamp                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. Notification Created for User                │
│    ↓                                            │
│    title: 'Registration Approved'               │
│    message: 'You can now login...'              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 6. Email Sent to User ✉️                        │
│    ↓                                            │
│    Subject: '✅ Welcome to Selsoft...'          │
│    Beautiful HTML template                      │
│    Login button with link                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 7. User Receives Email                          │
│    ↓                                            │
│    Opens email                                  │
│    Clicks "Login to TimePulse"                  │
│    Successfully logs in                         │
└─────────────────────────────────────────────────┘
```

---

## 📝 Quick Setup Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Add Gmail credentials (or leave blank for dev mode)
- [ ] Generate Gmail App Password (if using Gmail)
- [ ] Set FRONTEND_URL in `.env`
- [ ] Restart server: `npm start`
- [ ] Look for "✅ User Approval Email service is ready"
- [ ] Create test user: `node create-pending-oauth-user.js`
- [ ] Test approval in browser
- [ ] Check email inbox (or console logs)

---

## 🚀 Production Deployment

### **Environment Variables:**
```env
# Production SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FRONTEND_URL=https://your-domain.com

# Or AWS SES
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
FRONTEND_URL=https://your-domain.com
```

### **Recommended Services:**
1. **SendGrid** - 100 emails/day free
2. **AWS SES** - Pay as you go
3. **Mailgun** - 5,000 emails/month free
4. **Postmark** - Transactional email specialist

---

## 📧 Email Content Customization

To customize email templates, edit:
```
server/services/UserApprovalEmailService.js
```

**Methods:**
- `getUserApprovedTemplate()` - Approval email HTML
- `getUserRejectedTemplate()` - Rejection email HTML

**Customizable:**
- Colors and styling
- Logo and branding
- Button text and links
- Message content
- Footer information

---

## ✅ Summary

**Status:** ✅ **FULLY IMPLEMENTED AND READY**

**Features:**
- ✅ Approval email with beautiful HTML template
- ✅ Rejection email with professional design
- ✅ SMTP configuration support
- ✅ Development mode (no SMTP needed)
- ✅ Error handling and logging
- ✅ Database notifications
- ✅ User status management

**Next Steps:**
1. Configure SMTP in `.env` (optional)
2. Create test user
3. Test approval flow
4. Check email inbox

**No additional code needed - everything is ready to use!** 🎉

---

**Last Updated:** December 10, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
