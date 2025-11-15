# selsoftinc.com SMTP Configuration

## ✅ Domain Status

**Domain:** `selsoftinc.com`
- ✅ Registered in Route 53
- ✅ Hosted Zone exists: `/hostedzone/Z08790232GEOWZ0A03BIL`
- ✅ Domain added to AWS SES
- ⚠️ Domain verification status: **FAILED** (needs DNS records)
- ✅ SES sending enabled
- ✅ Sending quota: 50,000 emails/day, 14 emails/second

**Verified Email Addresses in SES:**
- aji@selsoftinc.com
- no-reply@selsoftinc.com
- murali@selsoftinc.com
- ramesh@selsoftinc.com
- barath@selsoftinc.com
- dhaya@selsoftinc.com
- thara@selsoftinc.com
- sridhar@selsoftinc.com
- priya@selsoftinc.com
- umam@selsoftinc.com
- bala@selsoftinc.com
- vanaja@selsoftinc.com
- shataj@selsoftinc.com
- manikandan@selsoftinc.com
- deepika@selsoftinc.com
- raghul@selsoftinc.com
- naveen@selsoftinc.com
- uma@selsoftinc.com
- ramesh.iyengar@selsoftinc.com
- joshua@selsoftinc.com
- selsoft@selsoftinc.com

---

## 🔧 AWS SES SMTP Configuration

### SMTP Endpoint Details:
```
SMTP_HOST: email-smtp.us-east-1.amazonaws.com
SMTP_PORT: 587 (TLS) or 465 (SSL)
SMTP_USER: [See below - Access Key ID converted]
SMTP_PASS: [See below - Secret Access Key]
```

### IAM User Created:
- **User Name:** `timepulse-ses-smtp`
- **User ID:** `AIDA2SRZ26P5SXB5A4QKA`
- **ARN:** `arn:aws:iam::727044518907:user/timepulse-ses-smtp`

---

## 📝 Getting SMTP Credentials

### Step 1: Get Access Key

The access key was created. You need to retrieve it:

```bash
# List access keys
aws iam list-access-keys --user-name timepulse-ses-smtp --region us-east-1

# If you need to create a new one:
aws iam create-access-key --user-name timepulse-ses-smtp --region us-east-1
```

**Output will show:**
- `AccessKeyId`: Use this as SMTP username (after conversion)
- `SecretAccessKey`: Use this as SMTP password

### Step 2: Convert Access Key to SMTP Username

AWS SES requires converting the Access Key ID to SMTP username format.

**Option A: Use AWS Console**
1. Go to: AWS Console → SES → SMTP Settings
2. Click "Create SMTP credentials"
3. Select existing IAM user: `timepulse-ses-smtp`
4. AWS will show you the SMTP username and password

**Option B: Manual Conversion (Python Script)**
```python
import hmac
import hashlib
import base64

# Your Access Key ID
access_key = "YOUR_ACCESS_KEY_ID"
secret_key = "YOUR_SECRET_ACCESS_KEY"

# Create SMTP password (same as secret key)
smtp_password = secret_key

# SMTP username is the Access Key ID
smtp_username = access_key
```

**Actually, for SES SMTP:**
- **SMTP Username:** Your Access Key ID (directly)
- **SMTP Password:** Your Secret Access Key (directly)

---

## 🔐 Update AWS Secrets

Once you have the credentials:

```bash
# Update SMTP User (Access Key ID)
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-user \
  --secret-string "YOUR_ACCESS_KEY_ID" \
  --region us-east-1

# Update SMTP Password (Secret Access Key)
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-password \
  --secret-string "YOUR_SECRET_ACCESS_KEY" \
  --region us-east-1
```

**Also update apprunner.yaml:**
```yaml
env:
  - name: SMTP_HOST
    value: "email-smtp.us-east-1.amazonaws.com"
  - name: SMTP_PORT
    value: "587"
```

---

## ⚠️ Important: Domain Verification

**Current Status:** Domain verification is **FAILED**

To use `selsoftinc.com` as sender domain, you need to:

1. **Verify Domain in SES:**
   - Go to: AWS Console → SES → Verified identities
   - Click on `selsoftinc.com`
   - Add the required DNS records to Route 53

2. **Add DNS Records:**
   - SES will provide TXT records for verification
   - Add them to Route 53 hosted zone

3. **Alternative: Use Verified Email Addresses**
   - You can use any of the verified email addresses listed above
   - Example: `no-reply@selsoftinc.com` or `selsoft@selsoftinc.com`

---

## 📧 Recommended Setup

### Option 1: Use Verified Email Address (Easiest)

Use one of the verified email addresses as sender:

```yaml
# In EmailService.js, the "from" field will be:
from: `"TimePulse" <no-reply@selsoftinc.com>`
```

**SMTP Settings:**
```
SMTP_HOST: email-smtp.us-east-1.amazonaws.com
SMTP_PORT: 587
SMTP_USER: [Access Key ID]
SMTP_PASS: [Secret Access Key]
```

### Option 2: Verify Domain (Better for Production)

1. Complete domain verification in SES
2. Use `noreply@selsoftinc.com` or `notifications@selsoftinc.com`
3. Better deliverability and branding

---

## 🧪 Test SMTP Connection

After updating secrets, test the connection:

```bash
# Check logs after deployment
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "email service"
```

Expected: `✅ Email service is ready to send messages`

---

## 📋 Quick Setup Commands

### 1. Get Access Key (if not saved):
```bash
aws iam create-access-key --user-name timepulse-ses-smtp --region us-east-1
```

### 2. Update Secrets:
```bash
# Get the Access Key ID and Secret from above command, then:

aws secretsmanager update-secret \
  --secret-id timepulse-smtp-user \
  --secret-string "AKIA..." \
  --region us-east-1

aws secretsmanager update-secret \
  --secret-id timepulse-smtp-password \
  --secret-string "your-secret-access-key" \
  --region us-east-1
```

### 3. Update apprunner.yaml SMTP_HOST:
```yaml
- name: SMTP_HOST
  value: "email-smtp.us-east-1.amazonaws.com"
```

### 4. Commit and Push:
```bash
git add server/apprunner.yaml
git commit -m "Update SMTP to use AWS SES for selsoftinc.com"
git push origin main
```

---

## ✅ Summary

**What's Ready:**
- ✅ Domain registered in Route 53
- ✅ Domain added to SES
- ✅ Multiple email addresses verified
- ✅ IAM user created for SMTP
- ✅ SES sending enabled

**What You Need:**
1. Get Access Key ID and Secret Access Key
2. Update AWS Secrets Manager
3. Update apprunner.yaml SMTP_HOST
4. Commit and push changes

**SMTP Details:**
- Host: `email-smtp.us-east-1.amazonaws.com`
- Port: `587`
- Username: Access Key ID
- Password: Secret Access Key
- From Email: Use verified address like `no-reply@selsoftinc.com`

---

**Next Step:** Get the Access Key credentials and update the secrets!

