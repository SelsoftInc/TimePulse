# GoDaddy SMTP Configuration for timepulse.io

## 📧 GoDaddy Email SMTP Settings

Once you have the SMTP details from GoDaddy, we'll configure them. Here's what we'll need:

### Typical GoDaddy SMTP Settings:

**Option 1: GoDaddy Workspace Email (if you have email hosting):**
```
SMTP_HOST: smtpout.secureserver.net
SMTP_PORT: 587 (or 465 for SSL)
SMTP_USER: your-email@timepulse.io
SMTP_PASS: your-email-password
```

**Option 2: GoDaddy Business Email:**
```
SMTP_HOST: smtpout.secureserver.net
SMTP_PORT: 587
SMTP_USER: your-email@timepulse.io
SMTP_PASS: your-email-password
```

**Option 3: GoDaddy Office 365 Email:**
```
SMTP_HOST: smtp.office365.com
SMTP_PORT: 587
SMTP_USER: your-email@timepulse.io
SMTP_PASS: your-office365-password
```

---

## 🔧 Once You Have the Details

### Step 1: Update AWS Secrets

```bash
# Update SMTP User (your email address)
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-user \
  --secret-string "your-email@timepulse.io" \
  --region us-east-1

# Update SMTP Password
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-password \
  --secret-string "your-email-password" \
  --region us-east-1
```

### Step 2: Update apprunner.yaml

I'll update the SMTP_HOST to match GoDaddy's settings once you provide them.

---

## 📝 What Information I Need From You

Please provide:
1. **SMTP Server/Host:** (e.g., `smtpout.secureserver.net`)
2. **SMTP Port:** (usually 587 or 465)
3. **Email Address:** (e.g., `noreply@timepulse.io` or `notifications@timepulse.io`)
4. **Email Password:** (the password for that email account)

---

## 🎯 Recommended Email Address

For TimePulse notifications, I recommend using:
- `noreply@timepulse.io` - For automated notifications
- `notifications@timepulse.io` - For system notifications
- `support@timepulse.io` - If you want replies

---

## ⏳ Waiting for Your SMTP Details

Once you have the GoDaddy SMTP information, share it with me and I'll:
1. ✅ Update the AWS Secrets Manager
2. ✅ Update apprunner.yaml with correct SMTP_HOST
3. ✅ Configure everything to use timepulse.io domain

**Ready when you are!** 🚀

