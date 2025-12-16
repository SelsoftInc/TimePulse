# Data Encryption Migration Guide

## Overview

This guide explains how to migrate existing unencrypted data to the new encrypted format. The encryption implementation includes backward compatibility, so migration is **optional** and can be done gradually.

## Migration Strategy

### Option 1: Gradual Migration (Recommended)
- No immediate action required
- New data is automatically encrypted
- Existing data remains unencrypted but still accessible
- Data gets encrypted when updated

**Pros:**
- Zero downtime
- No risk of data loss
- Natural migration over time

**Cons:**
- Mixed encrypted/unencrypted data in database
- Takes time for full migration

### Option 2: Immediate Migration
- Run migration script to encrypt all existing data
- All data encrypted at once

**Pros:**
- Consistent data format
- Immediate compliance

**Cons:**
- Requires downtime
- Needs careful testing
- Risk of data corruption if not done correctly

## Backward Compatibility

The encryption service includes fallback logic:

```javascript
// Decryption attempts to parse encrypted format
decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) {
    // Not in encrypted format - return as-is (legacy data)
    console.warn('⚠️ Data not in encrypted format, returning as-is');
    return encryptedText;
  }
  
  // Decrypt normally
  // ...
}
```

This means:
- ✅ Old unencrypted data can still be read
- ✅ New data is automatically encrypted
- ✅ No breaking changes to existing functionality

## Migration Script (Optional)

If you want to encrypt all existing data immediately, use this script:

### 1. Create Migration Script

Create `scripts/migrate-encryption.js`:

```javascript
/**
 * Data Encryption Migration Script
 * Encrypts all existing timesheet and invoice data
 * 
 * Usage: node scripts/migrate-encryption.js
 */

const { models, connectDB } = require('../models');
const DataEncryptionService = require('../services/DataEncryptionService');

async function migrateTimesheets() {
  console.log('🔄 Migrating Timesheets...');
  
  const timesheets = await models.Timesheet.findAll();
  let encrypted = 0;
  let skipped = 0;
  
  for (const timesheet of timesheets) {
    try {
      // Check if already encrypted (contains ':' pattern)
      const isEncrypted = timesheet.notes && timesheet.notes.includes(':');
      
      if (isEncrypted) {
        skipped++;
        continue;
      }
      
      // Prepare data for encryption
      const data = {
        employeeName: timesheet.employeeName,
        notes: timesheet.notes,
        dailyHours: timesheet.dailyHours,
        overtimeComment: timesheet.overtimeComment,
        overtimeDays: timesheet.overtimeDays,
      };
      
      // Encrypt
      const encryptedData = DataEncryptionService.encryptTimesheetData(data);
      
      // Update record
      await timesheet.update({
        employeeName: encryptedData.employeeName,
        notes: encryptedData.notes,
        dailyHours: encryptedData.dailyHours,
        overtimeComment: encryptedData.overtimeComment,
        overtimeDays: encryptedData.overtimeDays,
      });
      
      encrypted++;
      
      if (encrypted % 100 === 0) {
        console.log(`  Encrypted ${encrypted} timesheets...`);
      }
    } catch (error) {
      console.error(`  ❌ Error encrypting timesheet ${timesheet.id}:`, error.message);
    }
  }
  
  console.log(`✅ Timesheets: ${encrypted} encrypted, ${skipped} skipped`);
}

async function migrateInvoices() {
  console.log('🔄 Migrating Invoices...');
  
  const invoices = await models.Invoice.findAll();
  let encrypted = 0;
  let skipped = 0;
  
  for (const invoice of invoices) {
    try {
      // Check if already encrypted
      const isEncrypted = invoice.notes && invoice.notes.includes(':');
      
      if (isEncrypted) {
        skipped++;
        continue;
      }
      
      // Prepare data for encryption
      const data = {
        notes: invoice.notes,
        lineItems: invoice.lineItems,
      };
      
      // Encrypt
      const encryptedData = DataEncryptionService.encryptInvoiceData(data);
      
      // Update record
      await invoice.update({
        notes: encryptedData.notes,
        lineItems: encryptedData.lineItems,
      });
      
      encrypted++;
      
      if (encrypted % 100 === 0) {
        console.log(`  Encrypted ${encrypted} invoices...`);
      }
    } catch (error) {
      console.error(`  ❌ Error encrypting invoice ${invoice.id}:`, error.message);
    }
  }
  
  console.log(`✅ Invoices: ${encrypted} encrypted, ${skipped} skipped`);
}

async function main() {
  console.log('🔐 Starting Data Encryption Migration\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Migrate timesheets
    await migrateTimesheets();
    console.log('');
    
    // Migrate invoices
    await migrateInvoices();
    console.log('');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
```

### 2. Run Migration

```bash
# Backup database first!
# For SQLite
cp database.sqlite database.sqlite.backup

# For PostgreSQL
pg_dump timepulse_db > backup.sql

# Run migration
node scripts/migrate-encryption.js
```

### 3. Verify Migration

```bash
# Test encryption script
node test-encryption.js

# Check a few records in database
# Encrypted data should have format: iv:authTag:encryptedData
```

## Rollback Procedure

If migration fails or you need to rollback:

### 1. Restore Database Backup

```bash
# For SQLite
cp database.sqlite.backup database.sqlite

# For PostgreSQL
psql timepulse_db < backup.sql
```

### 2. Remove Encryption Code (if needed)

Revert the changes to:
- `routes/timesheets.js`
- `routes/invoices.js`
- `services/InvoiceService.js`

### 3. Restart Server

```bash
npm restart
```

## Testing After Migration

### 1. Test Timesheet Endpoints

```bash
# Create new timesheet
POST /api/timesheets/submit
{
  "notes": "Test after migration",
  ...
}

# Fetch timesheets
GET /api/timesheets/employee/{id}/all

# Verify notes are readable (not encrypted)
```

### 2. Test Invoice Endpoints

```bash
# Create new invoice
POST /api/invoices
{
  "notes": "Test invoice",
  ...
}

# Fetch invoices
GET /api/invoices?tenantId=...

# Verify data is readable
```

### 3. Check Database

```sql
-- Check timesheet encryption
SELECT id, 
       CASE 
         WHEN notes LIKE '%:%:%' THEN 'Encrypted'
         ELSE 'Plain'
       END as notes_status
FROM timesheets
LIMIT 10;

-- Check invoice encryption
SELECT id,
       CASE 
         WHEN notes LIKE '%:%:%' THEN 'Encrypted'
         ELSE 'Plain'
       END as notes_status
FROM invoices
LIMIT 10;
```

## Best Practices

### 1. Pre-Migration
- ✅ Backup database
- ✅ Test in development environment first
- ✅ Verify encryption key is set
- ✅ Run test-encryption.js to verify setup

### 2. During Migration
- ✅ Schedule during low-traffic period
- ✅ Monitor logs for errors
- ✅ Keep backup accessible
- ✅ Have rollback plan ready

### 3. Post-Migration
- ✅ Verify API responses are correct
- ✅ Test frontend functionality
- ✅ Monitor error logs
- ✅ Check database encryption status

## Monitoring

### Check Encryption Status

```sql
-- Count encrypted vs unencrypted timesheets
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN notes LIKE '%:%:%' THEN 1 ELSE 0 END) as encrypted,
  SUM(CASE WHEN notes NOT LIKE '%:%:%' THEN 1 ELSE 0 END) as unencrypted
FROM timesheets
WHERE notes IS NOT NULL;

-- Count encrypted vs unencrypted invoices
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN notes LIKE '%:%:%' THEN 1 ELSE 0 END) as encrypted,
  SUM(CASE WHEN notes NOT LIKE '%:%:%' THEN 1 ELSE 0 END) as unencrypted
FROM invoices
WHERE notes IS NOT NULL;
```

## Troubleshooting

### Issue: Migration Script Fails

**Symptoms:**
- Script crashes with error
- Some records not encrypted

**Solutions:**
1. Check encryption key is set: `echo $ENCRYPTION_KEY`
2. Verify database connection
3. Check for null/invalid data in records
4. Run with smaller batches

### Issue: Data Appears Corrupted

**Symptoms:**
- Encrypted format visible in API responses
- Decryption errors in logs

**Solutions:**
1. Verify decryption is called in routes
2. Check encryption key matches
3. Verify DataEncryptionService import

### Issue: Performance Degradation

**Symptoms:**
- Slow API responses
- High CPU usage

**Solutions:**
1. Add indexes on encrypted fields
2. Implement caching for frequently accessed data
3. Consider batch decryption optimization

## FAQ

**Q: Do I need to migrate immediately?**  
A: No, the system has backward compatibility. Migration can be gradual.

**Q: Will migration cause downtime?**  
A: Gradual migration has zero downtime. Immediate migration requires brief downtime.

**Q: Can I decrypt data later if needed?**  
A: Yes, as long as you have the encryption key.

**Q: What if I lose the encryption key?**  
A: Encrypted data cannot be recovered without the key. **Always backup your encryption key securely.**

**Q: How do I rotate encryption keys?**  
A: Key rotation requires decrypting with old key and re-encrypting with new key. This is an advanced operation not covered in this guide.

---

**Last Updated**: December 2024  
**Version**: 1.0.0
