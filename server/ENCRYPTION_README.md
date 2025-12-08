# Data Encryption Implementation

## Overview

This document describes the data encryption and decryption implementation for the Timesheet and Invoice modules in TimePulse. The system uses **AES-256-GCM** encryption to protect sensitive data at rest.

## Architecture

### Encryption Flow
```
Frontend (Plain Data) 
    ↓
Backend API (Receives Plain Data)
    ↓
DataEncryptionService (Encrypts Data)
    ↓
Database (Stores Encrypted Data)
```

### Decryption Flow
```
Database (Encrypted Data)
    ↓
Backend API (Fetches Encrypted Data)
    ↓
DataEncryptionService (Decrypts Data)
    ↓
Frontend (Receives Plain Data)
```

## Components

### 1. Encryption Utility (`utils/encryptionService.js`)
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: scrypt with salt
- **Features**:
  - Secure encryption with authentication tags
  - Initialization vector (IV) for each encryption
  - Automatic key derivation from environment variable

### 2. Data Transformation Service (`services/DataEncryptionService.js`)
- Handles encryption/decryption at the API layer
- Provides methods for:
  - `encryptTimesheetData()` - Encrypts timesheet fields before DB save
  - `decryptTimesheetData()` - Decrypts timesheet fields after DB fetch
  - `encryptInvoiceData()` - Encrypts invoice fields before DB save
  - `decryptInvoiceData()` - Decrypts invoice fields after DB fetch
  - `decryptInstances()` - Batch decryption for arrays of records

### 3. Route Integration
- **Timesheet Routes** (`routes/timesheets.js`):
  - Encrypts data in POST /api/timesheets/submit
  - Decrypts data in all GET endpoints
  
- **Invoice Routes** (`routes/invoices.js`):
  - Encrypts data in POST /api/invoices
  - Decrypts data in GET /api/invoices
  
- **Invoice Service** (`services/InvoiceService.js`):
  - Encrypts data when auto-generating invoices from timesheets

## Encrypted Fields

### Timesheet Module
- `notes` - Text field containing timesheet notes
- `employeeName` - Employee name stored with timesheet
- `overtimeComment` - Comments about overtime work
- `rejectionReason` - Reason for timesheet rejection
- `dailyHours` - JSONB object with daily hour breakdown
- `overtimeDays` - JSONB object with overtime day information

### Invoice Module
- `notes` - Text field containing invoice notes
- `lineItems` - JSONB array containing invoice line items with descriptions, hours, rates

## Configuration

### Environment Variable
Add the following to your `.env` file:

```bash
# Data Encryption Configuration
ENCRYPTION_KEY=your_secure_encryption_key_here
```

### Generating a Secure Key
Run this command to generate a cryptographically secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important**: 
- Use a different key for each environment (development, staging, production)
- Store keys securely (use environment variables, secrets management)
- Never commit encryption keys to version control

## Security Features

1. **AES-256-GCM Encryption**
   - Industry-standard symmetric encryption
   - Authenticated encryption with associated data (AEAD)
   - Prevents tampering and ensures data integrity

2. **Unique Initialization Vectors (IV)**
   - Each encryption operation uses a unique IV
   - Prevents pattern recognition in encrypted data

3. **Authentication Tags**
   - Ensures data hasn't been tampered with
   - Provides cryptographic verification

4. **Key Derivation**
   - Uses scrypt for key derivation
   - Adds additional security layer

## Data Format

Encrypted data is stored in the format:
```
iv:authTag:encryptedData
```

Example:
```
a1b2c3d4e5f6:g7h8i9j0k1l2:m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

For JSONB fields, encrypted data is wrapped in an object:
```json
{
  "_encrypted": "iv:authTag:encryptedData"
}
```

## API Behavior

### Frontend Perspective
The frontend always sends and receives **plain (unencrypted) data**. Encryption and decryption happen transparently in the backend.

**Example - Creating a Timesheet:**
```javascript
// Frontend sends plain data
POST /api/timesheets/submit
{
  "notes": "Worked on feature X",
  "dailyHours": { "mon": 8, "tue": 8, ... }
}

// Backend encrypts before saving to DB
// Frontend receives success response
```

**Example - Fetching Timesheets:**
```javascript
// Frontend requests data
GET /api/timesheets/employee/123/all

// Backend fetches encrypted data from DB
// Backend decrypts data
// Frontend receives plain data
{
  "timesheets": [
    {
      "notes": "Worked on feature X",  // Decrypted
      "dailyHours": { "mon": 8, ... }  // Decrypted
    }
  ]
}
```

## Migration Considerations

### Existing Data
The encryption service includes fallback logic:
- If data is not in encrypted format, it returns the original value
- This allows gradual migration of existing data
- No immediate data migration required

### Backward Compatibility
- Decryption attempts to parse encrypted format
- Falls back to original data if decryption fails
- Logs warnings for non-encrypted data

## Testing

### Manual Testing
1. Create a new timesheet with notes
2. Check database - notes should be encrypted
3. Fetch the timesheet via API - notes should be decrypted
4. Verify frontend displays correct plain text

### Verification Queries
```sql
-- Check encrypted timesheet data
SELECT id, notes, daily_hours FROM timesheets LIMIT 5;

-- Check encrypted invoice data
SELECT id, notes, line_items FROM invoices LIMIT 5;
```

Encrypted fields should show format: `iv:authTag:encryptedData`

## Troubleshooting

### Issue: "ENCRYPTION_KEY not set" Warning
**Solution**: Add `ENCRYPTION_KEY` to your `.env` file

### Issue: Data appears encrypted in frontend
**Solution**: Ensure `DataEncryptionService.decryptInstances()` is called in route handlers

### Issue: "Failed to decrypt data" Errors
**Possible Causes**:
1. Encryption key changed between encrypt/decrypt operations
2. Data corrupted in database
3. Attempting to decrypt non-encrypted legacy data

**Solution**: Check encryption key consistency, verify data integrity

## Performance Considerations

- Encryption/decryption adds minimal overhead (~1-2ms per operation)
- Batch operations use efficient array mapping
- No impact on database query performance
- Consider caching decrypted data for frequently accessed records

## Compliance

This implementation helps meet compliance requirements for:
- **GDPR**: Personal data protection
- **HIPAA**: Healthcare data security (if applicable)
- **SOC 2**: Data encryption at rest
- **PCI DSS**: Sensitive data protection

## Future Enhancements

1. **Field-Level Encryption Keys**: Different keys for different data types
2. **Key Rotation**: Automated encryption key rotation
3. **Audit Logging**: Track encryption/decryption operations
4. **Performance Monitoring**: Monitor encryption overhead
5. **Data Masking**: Additional layer for sensitive fields in logs

## Support

For questions or issues related to encryption:
1. Check this documentation
2. Review error logs for specific error messages
3. Verify environment configuration
4. Contact the development team

---

**Last Updated**: December 2024  
**Version**: 1.0.0
