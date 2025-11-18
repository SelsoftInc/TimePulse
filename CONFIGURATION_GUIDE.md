# Configuration Guide - Email Service & S3 Setup

## ✅ Completed Configuration Steps

### 1. S3 Bucket Setup ✅

**Bucket Created:**
- **Bucket Name:** `timepulse-timesheet-attachments`
- **Region:** `us-east-1`
- **Status:** ✅ Created and accessible

**CORS Configuration:**
- ✅ CORS rules configured for file uploads

**IAM Permissions:**
- ✅ Created IAM policy: `AppRunnerS3Access`
- ✅ Attached to role: `AppRunnerSecretsRole`
- ✅ Permissions: PutObject, GetObject, DeleteObject, ListBucket

---

### 2. Email Service Setup ✅

**Secrets Created:**
- ✅ `timepulse-smtp-user` - ARN: `arn:aws:secretsmanager:us-east-1:727044518907:secret:timepulse-smtp-user-fWBmnf`
- ✅ `timepulse-smtp-password` - ARN: `arn:aws:secretsmanager:us-east-1:727044518907:secret:timepulse-smtp-password-GQGMmS`

**Configuration Added to apprunner.yaml:**
- ✅ `SMTP_HOST` = `smtp.gmail.com`
- ✅ `SMTP_PORT` = `587`
- ✅ `FRONTEND_URL` = `https://app.timepulse.io`
- ✅ `S3_BUCKET_NAME` = `timepulse-timesheet-attachments`
- ✅ `AWS_REGION` = `us-east-1`

---

## ⚠️ Required Manual Steps

### Step 1: Update SMTP Secrets

You need to set the actual SMTP credentials in AWS Secrets Manager:

#### For Gmail:
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Create app password for "Mail"
   - Copy the 16-character password

3. **Update Secrets:**

```bash
# Update SMTP User (your Gmail address)
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-user \
  --secret-string "your-email@gmail.com" \
  --region us-east-1

# Update SMTP Password (Gmail app password)
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-password \
  --secret-string "your-16-char-app-password" \
  --region us-east-1
```

#### For Other Email Providers:

**SendGrid:**
```bash
# SMTP_HOST: smtp.sendgrid.net
# SMTP_PORT: 587
# SMTP_USER: apikey
# SMTP_PASS: your-sendgrid-api-key
```

**AWS SES:**
```bash
# SMTP_HOST: email-smtp.us-east-1.amazonaws.com
# SMTP_PORT: 587
# SMTP_USER: your-ses-smtp-username
# SMTP_PASS: your-ses-smtp-password
```

**Outlook/Office 365:**
```bash
# SMTP_HOST: smtp.office365.com
# SMTP_PORT: 587
# SMTP_USER: your-email@outlook.com
# SMTP_PASS: your-password
```

---

### Step 2: Commit and Push apprunner.yaml Changes

The `apprunner.yaml` file has been updated with new environment variables. You need to commit and push these changes:

```bash
cd /Users/selva/Projects/TimePulse
git add server/apprunner.yaml
git commit -m "Add SMTP and S3 configuration to App Runner"
git push origin main
```

**Note:** App Runner will automatically deploy when you push to the main branch (if auto-deployment is enabled).

---

### Step 3: Verify Deployment

After pushing, wait for App Runner to deploy (usually 5-10 minutes), then verify:

```bash
# Check service status
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:727044518907:service/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148 \
  --region us-east-1 \
  --query 'Service.Status' \
  --output text

# Check logs for email service initialization
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 10m \
  --format short | grep -i "email\|smtp"
```

---

## 🧪 Testing Guide

### Test 1: Email Service

Once SMTP secrets are updated, test email sending:

1. **Submit a timesheet** with a reviewer assigned
2. **Check reviewer's email** - Should receive submission notification
3. **Approve the timesheet** - Employee should receive approval email
4. **Reject the timesheet** - Employee should receive rejection email

**Check Logs:**
```bash
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "email"
```

Expected log messages:
- `✅ Email service is ready to send messages`
- `✅ Timesheet submission email sent`
- `✅ Timesheet approval email sent`
- `✅ Timesheet rejection email sent`

---

### Test 2: S3 File Upload

1. **Navigate to timesheet submission page**
2. **Upload a file** (image, PDF, etc.)
3. **Verify upload progress** shows
4. **Check file appears** in uploaded files list
5. **Download the file** - Should work
6. **Delete the file** - Should work

**Verify in S3:**
```bash
aws s3 ls s3://timepulse-timesheet-attachments/timesheets/ --recursive --region us-east-1
```

**Check Logs:**
```bash
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "s3\|upload\|file"
```

---

### Test 3: Week Navigation

1. **Navigate to timesheet page**
2. **Click Previous Week** button
3. **Click Next Week** button
4. **Select week from dropdown**
5. **Verify timesheet loads** correctly

**Check API:**
```bash
# Test week endpoint
curl "https://zewunzistm.us-east-1.awsapprunner.com/api/timesheets/week/2025-11-10?tenantId=YOUR_TENANT_ID&employeeId=YOUR_EMPLOYEE_ID"
```

---

### Test 4: History Page

1. **Navigate to history page**
2. **Apply filters** (employee, date range, status)
3. **Test pagination**
4. **Click to view timesheet**

**Check API:**
```bash
# Test history endpoint
curl "https://zewunzistm.us-east-1.awsapprunner.com/api/timesheets/history?tenantId=YOUR_TENANT_ID&limit=20&offset=0"
```

---

## 📋 Configuration Checklist

### S3 Configuration:
- [x] S3 bucket created: `timepulse-timesheet-attachments`
- [x] CORS configured
- [x] IAM permissions added to AppRunnerSecretsRole
- [x] Environment variable added: `S3_BUCKET_NAME`
- [x] Environment variable added: `AWS_REGION`

### Email Configuration:
- [x] Secrets created in Secrets Manager
- [x] Environment variables added: `SMTP_HOST`, `SMTP_PORT`
- [x] Secrets configured: `SMTP_USER`, `SMTP_PASS`
- [x] Environment variable added: `FRONTEND_URL`
- [ ] **TODO:** Update SMTP_USER secret with actual email
- [ ] **TODO:** Update SMTP_PASS secret with actual password
- [ ] **TODO:** Commit and push apprunner.yaml changes

### Testing:
- [ ] Test email sending (submission, approval, rejection)
- [ ] Test file upload to S3
- [ ] Test file download from S3
- [ ] Test file deletion from S3
- [ ] Test week navigation
- [ ] Test history page

---

## 🔧 Troubleshooting

### Email Not Sending?

1. **Check SMTP credentials:**
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id timepulse-smtp-user \
     --region us-east-1 \
     --query 'SecretString' \
     --output text
   ```

2. **Check logs for errors:**
   ```bash
   aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
     --region us-east-1 \
     --since 10m \
     --format short | grep -i "error\|smtp\|email"
   ```

3. **Common Issues:**
   - Gmail: Need app password (not regular password)
   - Gmail: 2FA must be enabled
   - Firewall: Port 587 may be blocked
   - Credentials: Check username/password are correct

### File Upload Failing?

1. **Check S3 permissions:**
   ```bash
   aws iam list-attached-role-policies \
     --role-name AppRunnerSecretsRole \
     --region us-east-1
   ```

2. **Check bucket exists:**
   ```bash
   aws s3 ls s3://timepulse-timesheet-attachments --region us-east-1
   ```

3. **Check logs:**
   ```bash
   aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
     --region us-east-1 \
     --since 10m \
     --format short | grep -i "s3\|upload\|error"
   ```

---

## 📝 Summary

### ✅ Completed:
1. S3 bucket created and configured
2. IAM permissions added
3. Secrets created for SMTP
4. apprunner.yaml updated with all environment variables

### ⏳ Pending:
1. Update SMTP secrets with actual credentials
2. Commit and push apprunner.yaml changes
3. Wait for App Runner deployment
4. Test all features

---

**Next Steps:**
1. Update SMTP secrets (see Step 1 above)
2. Commit and push changes
3. Wait for deployment
4. Test features

**Status:** Configuration complete, ready for credential setup and testing

