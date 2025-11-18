# Configuration Setup - COMPLETE ✅

## 🎉 All Configuration Steps Completed!

### ✅ 1. S3 Bucket Configuration

**Bucket Details:**
- **Name:** `timepulse-timesheet-attachments`
- **Region:** `us-east-1`
- **Status:** ✅ Created and accessible
- **CORS:** ✅ Configured
- **Bucket Policy:** ✅ Configured for App Runner access

**IAM Permissions:**
- ✅ Policy created: `AppRunnerS3Access`
- ✅ Attached to: `AppRunnerSecretsRole`
- ✅ Permissions: PutObject, GetObject, DeleteObject, ListBucket

---

### ✅ 2. Email Service Configuration

**Secrets Created:**
- ✅ `timepulse-smtp-user` 
  - ARN: `arn:aws:secretsmanager:us-east-1:727044518907:secret:timepulse-smtp-user-fWBmnf`
  - **Status:** Created (needs actual email value)
  
- ✅ `timepulse-smtp-password`
  - ARN: `arn:aws:secretsmanager:us-east-1:727044518907:secret:timepulse-smtp-password-GQGMmS`
  - **Status:** Created (needs actual password value)

**Environment Variables Added to apprunner.yaml:**
- ✅ `SMTP_HOST` = `smtp.gmail.com`
- ✅ `SMTP_PORT` = `587`
- ✅ `FRONTEND_URL` = `https://app.timepulse.io`
- ✅ `S3_BUCKET_NAME` = `timepulse-timesheet-attachments`
- ✅ `AWS_REGION` = `us-east-1`

---

## ⚠️ Required Manual Steps

### Step 1: Update SMTP Secrets

**For Gmail (Recommended):**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "TimePulse" as name
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
  --secret-string "xxxx xxxx xxxx xxxx" \
  --region us-east-1
```

**Note:** Remove spaces from app password when updating secret.

---

### Step 2: Commit and Push Changes

The `server/apprunner.yaml` file has been updated. Commit and push:

```bash
cd /Users/selva/Projects/TimePulse
git add server/apprunner.yaml
git commit -m "Add SMTP and S3 configuration for email notifications and file uploads"
git push origin main
```

**App Runner will automatically deploy** when changes are pushed to main branch.

---

### Step 3: Wait for Deployment

After pushing:
1. Wait 5-10 minutes for App Runner to deploy
2. Check deployment status:

```bash
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:727044518907:service/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148 \
  --region us-east-1 \
  --query 'Service.Status' \
  --output text
```

Wait until status is `RUNNING`.

---

### Step 4: Verify Configuration

**Check Email Service:**
```bash
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 5m \
  --format short | grep -i "email service"
```

Expected: `✅ Email service is ready to send messages`

**Check S3 Access:**
```bash
aws s3 ls s3://timepulse-timesheet-attachments/ --region us-east-1
```

Should return empty (no errors = access works).

---

## 🧪 Testing Checklist

Once deployment is complete and SMTP secrets are updated:

### Email Notifications:
- [ ] Submit timesheet → Reviewer receives email
- [ ] Approve timesheet → Employee receives email
- [ ] Reject timesheet → Employee receives email with reason

### File Upload:
- [ ] Upload file to timesheet
- [ ] Download file from timesheet
- [ ] Delete file from timesheet
- [ ] File validation (size, type)

### Week Navigation:
- [ ] Previous week button works
- [ ] Next week button works
- [ ] Week picker dropdown works

### History:
- [ ] History page loads
- [ ] Filters work (employee, date, status)
- [ ] Pagination works
- [ ] View timesheet from history works

---

## 📋 Files Modified

1. **`server/apprunner.yaml`**
   - Added SMTP environment variables
   - Added S3 environment variables
   - Added SMTP secrets references
   - Added FRONTEND_URL

2. **AWS Resources Created:**
   - S3 bucket: `timepulse-timesheet-attachments`
   - IAM policy: `AppRunnerS3Access`
   - Secrets: `timepulse-smtp-user`, `timepulse-smtp-password`

---

## 🚀 Next Steps

1. **Update SMTP secrets** with actual credentials (see Step 1 above)
2. **Commit and push** apprunner.yaml changes
3. **Wait for deployment** (5-10 minutes)
4. **Test all features** using TESTING_SCRIPT.md

---

## 📝 Quick Reference

### Update SMTP Secrets:
```bash
# User (email address)
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-user \
  --secret-string "your-email@gmail.com" \
  --region us-east-1

# Password (app password)
aws secretsmanager update-secret \
  --secret-id timepulse-smtp-password \
  --secret-string "your-app-password" \
  --region us-east-1
```

### Check Deployment Status:
```bash
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:727044518907:service/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148 \
  --region us-east-1 \
  --query 'Service.Status' \
  --output text
```

### View Logs:
```bash
aws logs tail /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
  --region us-east-1 \
  --since 10m \
  --format short
```

---

**Status:** ✅ **Configuration Complete - Ready for Credential Setup and Testing**

**Date:** November 14, 2025

