# How to Get SMTP Credentials from Email Providers

## 📧 Gmail (Google Workspace)

### Option 1: Gmail Personal Account (Free)

**Steps:**
1. **Enable 2-Factor Authentication:**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow setup instructions

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as app type
   - Select "Other (Custom name)" as device
   - Enter "TimePulse" as name
   - Click "Generate"
   - **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)

3. **SMTP Settings:**
   ```
   SMTP_HOST: smtp.gmail.com
   SMTP_PORT: 587
   SMTP_USER: your-email@gmail.com
   SMTP_PASS: xxxxxxxxxxxxxxxx (16-char app password, remove spaces)
   ```

**Note:** You cannot use your regular Gmail password. You MUST use an app password.

---

### Option 2: Google Workspace (Business)

**Steps:**
1. **Enable "Less secure app access"** (if using regular password):
   - Admin Console → Security → Less secure app access
   - Enable for your account

2. **OR Use App Password** (recommended):
   - Same as personal Gmail (see Option 1)

3. **SMTP Settings:**
   ```
   SMTP_HOST: smtp.gmail.com
   SMTP_PORT: 587
   SMTP_USER: your-email@yourdomain.com
   SMTP_PASS: app-password (16 characters)
   ```

---

## 📧 Outlook / Microsoft 365

### Personal Outlook Account

**Steps:**
1. **Enable App Password:**
   - Go to: https://account.microsoft.com/security
   - Click "Security" → "Advanced security options"
   - Under "App passwords", click "Create a new app password"
   - Enter "TimePulse" as name
   - **Copy the app password**

2. **SMTP Settings:**
   ```
   SMTP_HOST: smtp.office365.com
   SMTP_PORT: 587
   SMTP_USER: your-email@outlook.com (or @hotmail.com, @live.com)
   SMTP_PASS: your-app-password
   ```

### Microsoft 365 Business

**Steps:**
1. **Get SMTP Settings from Admin:**
   - Contact your IT admin, OR
   - Check Microsoft 365 Admin Center

2. **SMTP Settings:**
   ```
   SMTP_HOST: smtp.office365.com
   SMTP_PORT: 587
   SMTP_USER: your-email@yourdomain.com
   SMTP_PASS: your-password (or app password if MFA enabled)
   ```

---

## 📧 SendGrid (Recommended for Production)

**Why SendGrid?**
- ✅ More reliable for production
- ✅ Better deliverability
- ✅ Free tier: 100 emails/day
- ✅ Detailed analytics

**Steps:**
1. **Sign up:** https://sendgrid.com
2. **Create API Key:**
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Name: "TimePulse"
   - Permissions: "Full Access" or "Mail Send"
   - **Copy the API key** (you'll only see it once!)

3. **SMTP Settings:**
   ```
   SMTP_HOST: smtp.sendgrid.net
   SMTP_PORT: 587
   SMTP_USER: apikey
   SMTP_PASS: your-sendgrid-api-key (starts with SG.)
   ```

**Note:** The username is literally `apikey`, not your email!

---

## 📧 AWS SES (Amazon Simple Email Service)

**Why AWS SES?**
- ✅ Very cheap ($0.10 per 1,000 emails)
- ✅ High deliverability
- ✅ Integrates with AWS infrastructure
- ✅ Free tier: 62,000 emails/month (if on EC2)

**Steps:**
1. **Verify Email Address:**
   - Go to: AWS Console → SES → Verified identities
   - Click "Create identity"
   - Select "Email address"
   - Enter your email
   - Click verification link in email

2. **Create SMTP Credentials:**
   - Go to: SES → SMTP settings
   - Click "Create SMTP credentials"
   - Enter IAM user name: "timepulse-smtp"
   - Click "Create"
   - **Download credentials** (CSV file)

3. **SMTP Settings:**
   ```
   SMTP_HOST: email-smtp.us-east-1.amazonaws.com (or your region)
   SMTP_PORT: 587
   SMTP_USER: your-smtp-username (from CSV)
   SMTP_PASS: your-smtp-password (from CSV)
   ```

**Regions:**
- `us-east-1`: `email-smtp.us-east-1.amazonaws.com`
- `us-west-2`: `email-smtp.us-west-2.amazonaws.com`
- `eu-west-1`: `email-smtp.eu-west-1.amazonaws.com`

---

## 📧 Mailgun

**Steps:**
1. **Sign up:** https://www.mailgun.com
2. **Get SMTP Credentials:**
   - Dashboard → Sending → Domain settings
   - Find "SMTP credentials"
   - **Copy username and password**

3. **SMTP Settings:**
   ```
   SMTP_HOST: smtp.mailgun.org
   SMTP_PORT: 587
   SMTP_USER: postmaster@your-domain.mailgun.org
   SMTP_PASS: your-mailgun-password
   ```

---

## 📧 Zoho Mail

**Steps:**
1. **Enable SMTP:**
   - Go to: https://mail.zoho.com
   - Settings → Mail → POP/IMAP Access
   - Enable "IMAP Access"

2. **Generate App Password:**
   - Settings → Security → App Passwords
   - Create new app password
   - **Copy the password**

3. **SMTP Settings:**
   ```
   SMTP_HOST: smtp.zoho.com
   SMTP_PORT: 587
   SMTP_USER: your-email@zoho.com
   SMTP_PASS: your-app-password
   ```

---

## 📧 Yahoo Mail

**Steps:**
1. **Generate App Password:**
   - Go to: https://login.yahoo.com/account/security
   - Click "Generate app password"
   - Select "Mail" and "Other"
   - Enter "TimePulse"
   - **Copy the password**

2. **SMTP Settings:**
   ```
   SMTP_HOST: smtp.mail.yahoo.com
   SMTP_PORT: 587
   SMTP_USER: your-email@yahoo.com
   SMTP_PASS: your-app-password
   ```

---

## 📧 Custom Email Provider / Hosting

If you have your own domain email (e.g., `yourname@yourdomain.com`):

**Steps:**
1. **Contact your hosting provider** (GoDaddy, Bluehost, etc.)
2. **Ask for SMTP settings** - They usually provide:
   - SMTP server/host
   - Port (usually 587 or 465)
   - Username (usually your full email)
   - Password (your email password or app password)

**Common Hosting Providers:**

### GoDaddy:
```
SMTP_HOST: smtpout.secureserver.net
SMTP_PORT: 587
SMTP_USER: your-email@yourdomain.com
SMTP_PASS: your-email-password
```

### Bluehost:
```
SMTP_HOST: mail.yourdomain.com
SMTP_PORT: 587
SMTP_USER: your-email@yourdomain.com
SMTP_PASS: your-email-password
```

### cPanel Hosting:
```
SMTP_HOST: mail.yourdomain.com (or provided by host)
SMTP_PORT: 587
SMTP_USER: your-email@yourdomain.com
SMTP_PASS: your-email-password
```

---

## 🔧 How to Update Secrets in AWS

Once you have your SMTP credentials:

### Update SMTP User:
```bash
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-user \
  --secret-string "your-email@example.com" \
  --region us-east-1
```

### Update SMTP Password:
```bash
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-password \
  --secret-string "your-smtp-password" \
  --region us-east-1
```

**For Gmail App Password (remove spaces):**
```bash
# If app password is: "abcd efgh ijkl mnop"
# Use: "abcdefghijklmnop"
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-password \
  --secret-string "abcdefghijklmnop" \
  --region us-east-1
```

---

## ✅ Recommended Setup for TimePulse

### For Development/Testing:
- **Gmail** (free, easy setup)
- Use app password (see Gmail section above)

### For Production:
- **SendGrid** (free tier: 100 emails/day)
- **AWS SES** (very cheap, $0.10 per 1,000 emails)
- **Mailgun** (free tier: 5,000 emails/month)

---

## 🧪 Test Your SMTP Configuration

After updating secrets, test the email service:

```bash
# Check logs after deployment
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "email service"
```

Expected output:
```
✅ Email service is ready to send messages
```

If you see errors, check:
- SMTP credentials are correct
- Port 587 is not blocked
- App password is used (for Gmail/Outlook)
- Email address is verified (for AWS SES)

---

## 📝 Quick Reference Table

| Provider | SMTP Host | Port | Username | Password |
|----------|-----------|------|----------|----------|
| **Gmail** | smtp.gmail.com | 587 | your-email@gmail.com | App password |
| **Outlook** | smtp.office365.com | 587 | your-email@outlook.com | App password |
| **SendGrid** | smtp.sendgrid.net | 587 | `apikey` | API key |
| **AWS SES** | email-smtp.us-east-1.amazonaws.com | 587 | SMTP username | SMTP password |
| **Mailgun** | smtp.mailgun.org | 587 | postmaster@domain | API key |
| **Zoho** | smtp.zoho.com | 587 | your-email@zoho.com | App password |
| **Yahoo** | smtp.mail.yahoo.com | 587 | your-email@yahoo.com | App password |

---

## 🆘 Troubleshooting

### "Authentication failed" error:
- ✅ Check username and password are correct
- ✅ For Gmail/Outlook: Use app password, not regular password
- ✅ Remove spaces from app passwords
- ✅ Verify 2FA is enabled (for Gmail/Outlook)

### "Connection timeout" error:
- ✅ Check port 587 is not blocked by firewall
- ✅ Try port 465 with SSL (requires code change)
- ✅ Verify SMTP host is correct

### "Email not sending" but no errors:
- ✅ Check spam folder
- ✅ Verify sender email is correct
- ✅ Check email provider limits (daily sending limits)

---

**Need Help?** Check your email provider's documentation or contact their support for SMTP settings.

