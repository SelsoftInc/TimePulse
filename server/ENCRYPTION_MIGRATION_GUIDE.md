# 🔐 Encryption Migration Guide

## Problem Identified

Your **existing database records contain plain text data**. The encryption implementation will:
- ✅ Encrypt **NEW** data when created
- ✅ Decrypt data when fetched
- ❌ **Does NOT automatically encrypt existing data**

This is why you see plain text in the API responses - the data in your database is not encrypted yet.

---

## Solution: Data Migration Script

I've created a migration script that will encrypt all existing plain text data in your database.

---

## 📋 Pre-Migration Checklist

### 1. **CRITICAL: Backup Your Database**
```bash
# PostgreSQL backup
pg_dump -U postgres -d timepulse_db > backup_before_encryption_$(date +%Y%m%d_%H%M%S).sql

# Or use your database management tool to create a backup
```

### 2. **Verify Encryption Key is Set**

Check your `.env` file:
```bash
# Open .env file
notepad server\.env
```

Ensure `ENCRYPTION_KEY` is set:
```env
ENCRYPTION_KEY=your_64_character_hex_key_here
```

If not set, generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it to your `.env` file:
```env
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 3. **Stop Your Server**
```bash
# Stop the running server (Ctrl+C in terminal)
```

---

## 🚀 Running the Migration

### Step 1: Navigate to Server Directory
```bash
cd c:\TimePulse\TimePulse\server
```

### Step 2: Run the Migration Script
```bash
node scripts/encryptExistingData.js
```

### Step 3: Monitor the Output

You should see output like:
```
🔐 ========================================
🔐 DATA ENCRYPTION MIGRATION SCRIPT
🔐 ========================================

✅ Encryption key found
📊 Database: timepulse_db
🌐 Environment: development

⚠️  WARNING: This script will encrypt all plain text data in the database
⚠️  Make sure you have backed up your database before proceeding

✅ Database connection established

📋 Starting Employee encryption...
Found 5 employees to process
✅ Encrypted employee: 1
✅ Encrypted employee: 2
✅ Employee encryption complete: 5 encrypted, 0 skipped

📋 Starting Vendor encryption...
Found 3 vendors to process
✅ Encrypted vendor: 1 - tech mahindra
✅ Encrypted vendor: 2 - Acme Corp
✅ Vendor encryption complete: 3 encrypted, 0 skipped

📋 Starting Client encryption...
Found 10 clients to process
✅ Encrypted client: 1
✅ Client encryption complete: 10 encrypted, 0 skipped

📋 Starting Implementation Partner encryption...
Found 2 implementation partners to process
✅ Implementation Partner encryption complete: 2 encrypted, 0 skipped

📋 Starting Leave Request encryption...
Found 15 leave requests to process
✅ Leave Request encryption complete: 15 encrypted, 0 skipped

🎉 ========================================
🎉 ENCRYPTION MIGRATION COMPLETED SUCCESSFULLY
🎉 ========================================

✅ All existing data has been encrypted
✅ New data will be automatically encrypted
✅ API responses will return decrypted data

👋 Database connection closed
```

---

## ✅ Verification Steps

### 1. **Check Database - Data Should Be Encrypted**

Connect to your database and run:
```sql
-- Check vendors table
SELECT id, name, email, phone FROM vendors LIMIT 3;

-- You should see encrypted data like:
-- name: a1b2c3d4e5f6789012345678:b2c3d4e5f6789012345678:c3d4e5f6789012345678
```

### 2. **Start Your Server**
```bash
npm start
```

### 3. **Test API Endpoints - Data Should Be Decrypted**

Open your browser DevTools (F12) and check the Network tab:

**Test Vendors API:**
```
GET http://44.222.217.57:5001/api/vendors?tenantId=your-tenant-id
```

Response should show **decrypted plain text**:
```json
{
  "success": true,
  "vendors": [
    {
      "id": "77f7f854-90be-4bf3-8fa0-9d7bc5b9b5f1",
      "name": "tech mahindra",
      "email": "contact@techmahindra.com",
      "phone": "(096) 325-8741"
    }
  ]
}
```

**Test Employees API:**
```
GET http://44.222.217.57:5001/api/employees?tenantId=your-tenant-id
```

Response should show **decrypted plain text**:
```json
{
  "success": true,
  "employees": [
    {
      "id": "employee-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  ]
}
```

---

## 🔍 What the Script Does

### Modules Encrypted:
1. ✅ **Employee Module**
   - firstName, lastName, email, phone, contactInfo
   - hourlyRate, salaryAmount (numeric fields)

2. ✅ **Vendor Module**
   - name, email, phone, contactPerson, address, taxId

3. ✅ **Client Module**
   - clientName, legalName, contactPerson, email, phone
   - billingAddress, shippingAddress, taxId
   - hourlyRate (numeric)

4. ✅ **Implementation Partner Module**
   - name, email, phone, contactPerson, address

5. ✅ **Leave Management Module**
   - reason, reviewComments, attachmentName

### Safety Features:
- ✅ **Transaction-based**: All changes rolled back if any error occurs
- ✅ **Idempotent**: Safe to run multiple times (skips already encrypted data)
- ✅ **Validation**: Checks if data is already encrypted before processing
- ✅ **Logging**: Detailed progress logs for monitoring

---

## ⚠️ Troubleshooting

### Issue: "ENCRYPTION_KEY not set in .env file"
**Solution:**
1. Generate a key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Add to `.env`: `ENCRYPTION_KEY=your_generated_key`
3. Restart the migration

### Issue: "Database connection failed"
**Solution:**
1. Check database is running
2. Verify `.env` database credentials
3. Test connection: `psql -U postgres -d timepulse_db`

### Issue: "Migration failed, rolling back changes"
**Solution:**
1. Check the error message in console
2. Verify database has sufficient space
3. Ensure no other processes are locking the tables
4. Restore from backup if needed

### Issue: API still shows plain text after migration
**Solution:**
1. Restart your Node.js server
2. Clear browser cache
3. Check server logs for decryption errors
4. Verify `ENCRYPTION_KEY` matches the one used for encryption

---

## 🔄 Re-running the Migration

The script is **idempotent** - safe to run multiple times:
- Already encrypted data will be **skipped**
- Only plain text data will be encrypted
- No data loss or corruption

To re-run:
```bash
node scripts/encryptExistingData.js
```

---

## 📊 Expected Results

### Before Migration:
**Database (Plain Text):**
```
name: "tech mahindra"
email: "contact@techmahindra.com"
```

**API Response (Plain Text):**
```json
{
  "name": "tech mahindra",
  "email": "contact@techmahindra.com"
}
```

### After Migration:
**Database (Encrypted):**
```
name: "a1b2c3d4e5f6789012345678:b2c3d4e5f6789012345678:c3d4e5f6789012345678"
email: "d4e5f6789012345678901234:e5f6789012345678901234:f6789012345678901234"
```

**API Response (Decrypted):**
```json
{
  "name": "tech mahindra",
  "email": "contact@techmahindra.com"
}
```

---

## 🎯 Post-Migration Tasks

### 1. **Test All Modules**
- [ ] Test Employee CRUD operations
- [ ] Test Vendor CRUD operations
- [ ] Test Client CRUD operations
- [ ] Test Implementation Partner CRUD operations
- [ ] Test Leave Management operations

### 2. **Verify Encryption**
- [ ] Check database - data should be encrypted
- [ ] Check API responses - data should be decrypted
- [ ] Test creating new records - should be encrypted
- [ ] Test updating records - should remain encrypted

### 3. **Monitor Logs**
Look for these log messages:
- `🔒 [Module] data encrypted` - When saving to database
- `🔓 [Module] data decrypted` - When fetching from database

### 4. **Update Team**
- [ ] Inform team about encryption implementation
- [ ] Share encryption key securely (use password manager)
- [ ] Document key rotation procedure

---

## 🔐 Security Best Practices

### 1. **Encryption Key Management**
- ✅ Store in environment variables (`.env`)
- ✅ Never commit to version control
- ✅ Use different keys for dev/staging/prod
- ✅ Rotate keys periodically
- ✅ Store securely (password manager, secrets vault)

### 2. **Backup Strategy**
- ✅ Backup before migration
- ✅ Regular automated backups
- ✅ Test restore procedures
- ✅ Store backups securely

### 3. **Access Control**
- ✅ Limit access to encryption keys
- ✅ Audit key usage
- ✅ Monitor for unauthorized access

---

## 📞 Support

### If Migration Fails:
1. **DO NOT PANIC** - Data is safe in backup
2. Check error logs in console
3. Restore from backup if needed:
   ```bash
   psql -U postgres -d timepulse_db < backup_file.sql
   ```
4. Contact development team

### If API Shows Encrypted Data:
1. Check server logs for decryption errors
2. Verify `ENCRYPTION_KEY` is correct
3. Restart server
4. Check `DataEncryptionService` is being called

---

## 📝 Migration Checklist

- [ ] Database backup created
- [ ] `ENCRYPTION_KEY` set in `.env`
- [ ] Server stopped
- [ ] Migration script executed successfully
- [ ] Database verified (encrypted data)
- [ ] Server restarted
- [ ] API tested (decrypted responses)
- [ ] All modules tested
- [ ] Team notified
- [ ] Documentation updated

---

## 🎉 Success Criteria

✅ **Database**: All sensitive fields are encrypted (format: `iv:authTag:encryptedData`)  
✅ **API Responses**: All data is decrypted and readable  
✅ **New Records**: Automatically encrypted when created  
✅ **Updates**: Data remains encrypted in database  
✅ **No Errors**: Server logs show successful encryption/decryption  

---

**Migration Script Location:** `server/scripts/encryptExistingData.js`  
**Documentation:** `server/ENCRYPTION_IMPLEMENTATION_COMPLETE.md`  
**Status:** Ready to execute  

---

## Quick Start (TL;DR)

```bash
# 1. Backup database
pg_dump -U postgres -d timepulse_db > backup.sql

# 2. Ensure ENCRYPTION_KEY is set in .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add output to .env as ENCRYPTION_KEY

# 3. Run migration
cd server
node scripts/encryptExistingData.js

# 4. Restart server
npm start

# 5. Test API endpoints
# Data should be encrypted in DB, decrypted in API responses
```

---

**Ready to proceed? Run the migration script and verify the results!** 🚀
