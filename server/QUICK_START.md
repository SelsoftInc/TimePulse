# Quick Start Guide - Data Encryption

## 🚀 Get Started in 3 Steps

### Step 1: Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Step 2: Add to Environment

Add the generated key to your `.env` file:

```bash
# Data Encryption Configuration
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Important:** Replace with your actual generated key!

### Step 3: Restart Server

```bash
npm restart
```

## ✅ Verify Installation

Run the test script to verify encryption is working:

```bash
node test-encryption.js
```

**Expected output:**
```
🔐 Testing Encryption Service

Test 1: Basic String Encryption
================================
Original: This is sensitive data that needs to be encrypted
Encrypted: a1b2c3d4e5f6:g7h8i9j0k1l2:m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Decrypted: This is sensitive data that needs to be encrypted
Result: ✅ PASS

...

Overall: ✅ ALL TESTS PASSED

🎉 Encryption is working correctly!
```

## 🎯 What's Encrypted?

### Timesheet Data
- Notes and comments
- Employee names
- Overtime information
- Daily hours breakdown

### Invoice Data
- Invoice notes
- Line items with descriptions

## 📝 Usage Example

### Creating a Timesheet (Frontend)

```javascript
// Frontend sends plain data - no changes needed!
const response = await fetch('/api/timesheets/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: '123',
    employeeId: '456',
    weekStart: '2024-12-01',
    weekEnd: '2024-12-07',
    notes: 'Worked on feature development',  // Will be encrypted
    dailyHours: { mon: 8, tue: 8, wed: 8 }  // Will be encrypted
  })
});
```

### Fetching Timesheets (Frontend)

```javascript
// Frontend receives plain data - no changes needed!
const response = await fetch('/api/timesheets/employee/456/all?tenantId=123');
const data = await response.json();

console.log(data.timesheets[0].notes);  // "Worked on feature development" (decrypted)
```

## 🔍 Verify in Database

Check that data is encrypted in the database:

```sql
-- Check timesheet encryption
SELECT id, notes FROM timesheets LIMIT 1;

-- Should show encrypted format:
-- id | notes
-- 1  | a1b2c3d4e5f6:g7h8i9j0k1l2:m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## 🛠️ Troubleshooting

### Problem: "ENCRYPTION_KEY not set" warning

**Solution:**
```bash
# Make sure .env file has ENCRYPTION_KEY
cat .env | grep ENCRYPTION_KEY

# If missing, add it:
echo "ENCRYPTION_KEY=your_key_here" >> .env

# Restart server
npm restart
```

### Problem: Data appears encrypted in API response

**Solution:**
Check that decryption is being called. Look for this in route files:
```javascript
const decryptedData = DataEncryptionService.decryptInstances(data, 'timesheet');
```

### Problem: Test script fails

**Solution:**
```bash
# Verify Node.js version (should be 14+)
node --version

# Reinstall dependencies
npm install

# Try test again
node test-encryption.js
```

## 📚 Additional Resources

- **Full Documentation**: See `ENCRYPTION_README.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Migration Guide**: See `MIGRATION_GUIDE.md` (for existing data)

## 🔐 Security Reminders

1. ✅ **Never commit** encryption keys to Git
2. ✅ Use **different keys** for dev/staging/production
3. ✅ **Backup** your encryption key securely
4. ✅ Store keys in **environment variables** or secrets manager
5. ✅ **Rotate keys** periodically (advanced)

## 🎉 You're All Set!

Encryption is now active for:
- ✅ All new timesheet submissions
- ✅ All new invoice creations
- ✅ Automatic invoice generation from timesheets

The frontend requires **no changes** - encryption/decryption happens transparently in the backend!

## 📞 Need Help?

1. Check the logs: `tail -f logs/server.log`
2. Review documentation files in this directory
3. Run test script: `node test-encryption.js`
4. Contact the development team

---

**Quick Start Version**: 1.0.0  
**Last Updated**: December 2024
