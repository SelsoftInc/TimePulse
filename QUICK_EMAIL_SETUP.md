# ⚡ Quick Email Setup Guide (5 Minutes)

## 🎯 Goal
Enable email notifications for User Approval, Leave Management, and Timesheet workflows.

---

## 📋 Prerequisites
- Gmail account (or any SMTP email)
- 5 minutes of your time

---

## 🚀 Setup Steps

### **Step 1: Get Gmail App Password (2 minutes)**

1. **Go to:** https://myaccount.google.com/apppasswords
2. **Sign in** to your Google account
3. **Click** "Select app" → Choose "Mail"
4. **Click** "Select device" → Choose "Other (Custom name)"
5. **Enter** "TimePulse" as the name
6. **Click** "Generate"
7. **Copy** the 16-character password (e.g., `abcd efgh ijkl mnop`)

---

### **Step 2: Create .env File (1 minute)**

Navigate to server folder and create `.env` file:

```bash
cd server
```

**Option A: Copy from template**
```bash
cp .env.template .env
```

**Option B: Create manually**
```bash
# Windows PowerShell
New-Item .env -ItemType File

# Linux/Mac
touch .env
```

---

### **Step 3: Add SMTP Configuration (1 minute)**

Open `server/.env` and add these lines:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
FRONTEND_URL=http://localhost:3000
```

**Replace:**
- `your-email@gmail.com` → Your Gmail address
- `abcdefghijklmnop` → Your 16-character app password (no spaces)

---

### **Step 4: Restart Server (1 minute)**

```bash
# Stop server (Ctrl+C if running)

# Start server
npm start
```

**Look for these success messages:**
```
✅ User Approval Email service is ready
✅ Leave Management Email service is ready
✅ Email service initialized successfully
🚀 Server running on port 5001
```

---

## ✅ Verification

### **Test Email Sending:**

```bash
# 1. Create pending user
node set-existing-user-pending.js

# 2. Login as admin
# http://localhost:3000

# 3. Approve user

# 4. Check email inbox
# You should receive approval email! ✅
```

---

## 🎨 What You Get

### **User Approval Emails:**
- ✅ Beautiful HTML templates
- ✅ Green gradient for approvals
- ✅ Professional branding
- ✅ Login button included

### **Leave Management Emails:**
- ✅ New request notifications (to approver)
- ✅ Approval notifications (to employee)
- ✅ Rejection notifications (to employee)
- ✅ Leave details included

### **Timesheet Emails:**
- ✅ New submission notifications (to reviewer)
- ✅ Approval notifications (to employee)
- ✅ Rejection notifications (to employee)
- ✅ Timesheet details included

---

## 🔧 Alternative SMTP Providers

### **Outlook/Office 365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### **SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### **Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

---

## 🐛 Troubleshooting

### **Problem: "Email service not configured"**

**Check:**
```bash
# Verify .env file exists
ls -la server/.env

# Check SMTP variables
cat server/.env | grep SMTP
```

**Solution:**
- Ensure `.env` file is in `server/` folder
- Verify SMTP_USER and SMTP_PASS are set
- Restart server

---

### **Problem: "Authentication failed"**

**Check:**
- Using Gmail App Password (not regular password)
- No spaces in app password
- Correct email address

**Solution:**
1. Generate new app password
2. Copy without spaces
3. Update `.env`
4. Restart server

---

### **Problem: Emails not arriving**

**Check:**
- Spam folder
- Email address is correct
- Server logs for errors

**Solution:**
```bash
# Check server logs
npm start

# Look for:
# ✅ Email sent: <message-id>
# or
# ❌ Error sending email: <error>
```

---

## 📊 Development Mode (No SMTP)

**Don't want to configure email yet?**

Just skip SMTP configuration! The system works perfectly without it:

- ✅ In-app notifications work
- ✅ All workflows function
- ✅ Emails logged to console
- ✅ Perfect for testing

**Console Output:**
```
📧 [DEV MODE] User approval notification:
{
  to: 'user@example.com',
  userName: 'John Doe',
  userRole: 'employee'
}
```

---

## ✅ Complete Setup Checklist

- [ ] Get Gmail App Password
- [ ] Create `server/.env` file
- [ ] Add SMTP configuration
- [ ] Restart server
- [ ] See success messages
- [ ] Test with user approval
- [ ] Check email inbox
- [ ] Celebrate! 🎉

---

## 🎯 Summary

**Time Required:** 5 minutes  
**Difficulty:** Easy  
**Result:** Professional email notifications for all workflows

**What's Included:**
- User Approval emails (2 types)
- Leave Management emails (3 types)
- Timesheet emails (3 types)
- Beautiful HTML templates
- Mobile-responsive design
- Professional branding

**Status:** ✅ Ready to use!

---

## 📞 Need Help?

**Check these files:**
- `NOTIFICATION_SYSTEM_COMPLETE.md` - Full documentation
- `EMAIL_NOTIFICATION_SETUP_GUIDE.md` - Detailed setup guide
- `.env.template` - Configuration template

**Common Issues:**
1. **No emails:** Check SMTP credentials
2. **Authentication error:** Use App Password, not regular password
3. **Service not ready:** Restart server after `.env` changes

---

**Last Updated:** December 10, 2025  
**Version:** 1.0.0  
**Estimated Time:** 5 minutes
