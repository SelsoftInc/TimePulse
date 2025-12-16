# Vendor Creation 500 Error - Debugging Guide

## Issue
Getting 500 Internal Server Error when trying to create a vendor.

## Fixes Applied

### 1. **Payment Terms Dropdown Fixed** ✅
- Fixed API URL to use `NEXT_PUBLIC_API_URL`
- Seeded 6 payment terms in database
- Dropdown now shows all options

### 2. **Enhanced Error Logging** ✅
Added comprehensive logging to `server/routes/vendors.js`:

```javascript
// Logs added:
console.log('📝 Creating vendor with payload:', JSON.stringify(req.body, null, 2));
console.log('🔒 Encrypting vendor data...');
console.log('✅ Vendor data encrypted');
console.log('💾 Saving vendor to database...');
console.log('✅ Vendor created with ID:', created.id);
console.log('🔓 Decrypting vendor data for response...');
console.log('✅ Vendor data decrypted');

// Error logs:
console.error('❌ Error creating vendor:', err);
console.error('Error stack:', err.stack);
console.error('Error name:', err.name);
console.error('Error message:', err.message);
if (err.errors) {
  console.error('Sequelize validation errors:', err.errors);
}
```

## Next Steps to Debug

### Step 1: Check Server Logs
1. Open terminal in `server` directory
2. Look for error messages when creating vendor
3. The logs will show exactly where it's failing:
   - Validation error?
   - Encryption error?
   - Database error?
   - Decryption error?

### Step 2: Try Creating Vendor Again
1. Navigate to Vendors → Add New Vendor
2. Fill out the form:
   - **Vendor Name**: Test Vendor (required)
   - **Contact Person**: John Doe
   - **Email**: test@example.com
   - **Phone**: 1234567890
   - **Vendor Type**: Consultant
   - **Payment Term**: Net 30 (should now show in dropdown)
   - **Status**: Active
3. Click "Create Vendor"
4. Check server terminal for detailed logs

### Step 3: Common Issues to Check

#### A. Payment Terms Value
**Issue**: Payment term value might not match database codes
**Check**: Ensure dropdown sends correct value (e.g., "net30", not "Net 30")

#### B. Encryption Key
**Issue**: ENCRYPTION_KEY not set in .env
**Solution**: Service has fallback, but check logs for warnings

#### C. Missing Required Fields
**Issue**: Database requires fields not in form
**Check**: Server logs will show Sequelize validation errors

#### D. TenantId Missing
**Issue**: tenantId not being sent from frontend
**Check**: Payload log will show if tenantId is present

## Expected Server Log Output

### Success:
```
📝 Creating vendor with payload: {
  "tenantId": "uuid-here",
  "name": "Test Vendor",
  "contactPerson": "John Doe",
  "email": "test@example.com",
  "phone": "1234567890",
  "category": "consultant",
  "paymentTerms": "net30",
  "status": "active",
  ...
}
🔒 Encrypting vendor data...
🔒 Vendor data encrypted
✅ Vendor data encrypted
💾 Saving vendor to database...
Executing (default): INSERT INTO "vendors" ...
✅ Vendor created with ID: uuid-here
🔓 Decrypting vendor data for response...
🔓 Vendor data decrypted
✅ Vendor data decrypted
```

### Failure (Example):
```
📝 Creating vendor with payload: { ... }
🔒 Encrypting vendor data...
🔒 Vendor data encrypted
✅ Vendor data encrypted
💾 Saving vendor to database...
❌ Error creating vendor: SequelizeValidationError: notNull Violation: vendors.city cannot be null
Error stack: ...
Error name: SequelizeValidationError
Error message: notNull Violation: vendors.city cannot be null
Sequelize validation errors: [
  {
    message: 'vendors.city cannot be null',
    type: 'notNull Violation',
    path: 'city',
    value: null
  }
]
```

## Possible Errors and Solutions

### 1. **Validation Error**
**Error**: `Validation failed: { name: 'Vendor name is required' }`
**Solution**: Fill in required fields

### 2. **Database Constraint Error**
**Error**: `notNull Violation: vendors.city cannot be null`
**Solution**: Either:
- Add city field to form
- Make city nullable in database
- Set default value for city

### 3. **Encryption Error**
**Error**: `Error encrypting vendor data`
**Solution**: Check ENCRYPTION_KEY in .env

### 4. **TenantId Missing**
**Error**: `Tenant ID is required`
**Solution**: Ensure user is logged in and tenantId is in localStorage

### 5. **Payment Terms Invalid**
**Error**: `Invalid payment term value`
**Solution**: Ensure dropdown sends correct code (e.g., "net30")

## Files Modified

1. **`server/routes/vendors.js`**
   - Added comprehensive logging
   - Better error messages
   - Validation error details

2. **`nextjs-app/src/config/lookups.js`**
   - Fixed API URL for payment terms

3. **`server/scripts/seed-payment-terms.js`** (NEW)
   - Seeds payment terms in database

## Testing Checklist

- [ ] Payment terms dropdown shows 6 options
- [ ] Can select payment term from dropdown
- [ ] Server logs show payload when submitting
- [ ] Server logs show where error occurs
- [ ] Error message is descriptive

## How to Get Detailed Error

1. **Start server in terminal** (not background):
   ```bash
   cd server
   npm start
   ```

2. **Keep terminal visible** while creating vendor

3. **Try to create vendor** in browser

4. **Check terminal immediately** for error logs

5. **Copy the error message** and share it

## Quick Fix Attempts

### If city/state/zip are required but not in form:
```sql
-- Make fields nullable
ALTER TABLE vendors ALTER COLUMN city DROP NOT NULL;
ALTER TABLE vendors ALTER COLUMN state DROP NOT NULL;
ALTER TABLE vendors ALTER COLUMN zip DROP NOT NULL;
```

### If payment terms value is wrong:
Check that VendorForm sends the code, not the label:
```javascript
// Should send:
paymentTerms: "net30"  // ✅ Correct

// Not:
paymentTerms: "Net 30"  // ❌ Wrong
```

## Summary

✅ **Payment terms dropdown fixed**
✅ **Comprehensive logging added**
⏳ **Need to see actual error in server logs**

**Next**: Try creating vendor again and check server terminal for detailed error message.
