# Routes Encryption Update Guide

## Overview
This guide provides instructions for updating all remaining routes to encrypt their responses using `encryptAuthResponse()`.

## Pattern to Follow

### 1. Import the encryption utility
```javascript
const { encryptAuthResponse } = require('../utils/encryption');
```

### 2. Update response pattern
**Before:**
```javascript
res.json({ success: true, data: someData });
```

**After:**
```javascript
const responseData = { success: true, data: someData };
res.json(encryptAuthResponse(responseData));
```

## Routes Already Updated ✅

### Authentication & OAuth
- ✅ `server/routes/auth.js` - All endpoints encrypted
- ✅ `server/routes/oauth.js` - All endpoints encrypted

### Core Modules
- ✅ `server/routes/vendors.js` - All CRUD operations encrypted
- ✅ `server/routes/employees.js` - All CRUD operations encrypted

## Routes Requiring Manual Updates

### Clients Module (`server/routes/clients.js`)
**Import added:** ✅
**Endpoints to update:**
1. `GET /` - List all clients
2. `GET /:id` - Get client by ID
3. `POST /` - Create client
4. `PUT /:id` - Update client
5. `DELETE /:id` - Delete client

**Search for:** `res.json({ success: true` or `res.status(201).json({`
**Update pattern:** Wrap all successful responses with `encryptAuthResponse()`

### Implementation Partners (`server/routes/implementationPartners.js`)
**Import added:** ✅
**Endpoints to update:**
1. `GET /` - List all partners
2. `GET /:id` - Get partner by ID
3. `POST /` - Create partner
4. `PUT /:id` - Update partner
5. `DELETE /:id` - Delete partner

### Leave Management (`server/routes/leaveManagement.js`)
**Import added:** ✅
**Endpoints to update:**
1. `POST /request` - Submit leave request
2. `GET /requests` - Get all leave requests
3. `GET /requests/:id` - Get leave request by ID
4. `PUT /requests/:id/approve` - Approve leave request
5. `PUT /requests/:id/reject` - Reject leave request
6. `DELETE /requests/:id` - Delete leave request
7. `GET /balance/:employeeId` - Get leave balance
8. `POST /balance` - Create/update leave balance

## Quick Update Script

For each route file, run this search and replace pattern:

### Pattern 1: Simple responses
```javascript
// Find:
res.json({
  success: true,
  // ... any data

// Replace with:
const responseData = {
  success: true,
  // ... any data
};
res.json(encryptAuthResponse(responseData));
```

### Pattern 2: Status code responses
```javascript
// Find:
res.status(201).json({
  success: true,
  // ... any data

// Replace with:
const responseData = {
  success: true,
  // ... any data
};
res.status(201).json(encryptAuthResponse(responseData));
```

## Important Notes

1. **Only encrypt successful responses** - Error responses (status >= 400) should NOT be encrypted
2. **Preserve status codes** - Keep the same HTTP status codes
3. **Don't encrypt errors** - Validation errors and server errors remain unencrypted
4. **Test after updates** - Ensure all endpoints still work correctly

## Frontend Decryption

All frontend components that call these APIs must use `decryptAuthResponse()`:

```javascript
import { decryptAuthResponse } from '@/utils/encryption';

const response = await fetch('/api/endpoint');
const rawData = await response.json();
const data = decryptAuthResponse(rawData);
```

## Verification Checklist

After updating each route file:
- [ ] Import statement added
- [ ] All successful GET responses encrypted
- [ ] All successful POST responses encrypted
- [ ] All successful PUT responses encrypted
- [ ] All successful DELETE responses encrypted
- [ ] Error responses remain unencrypted
- [ ] No syntax errors
- [ ] Server starts without errors

## Next Steps

1. Update remaining route files following the pattern above
2. Update frontend components to decrypt responses
3. Test all API endpoints
4. Update API documentation

---
**Status:** In Progress
**Last Updated:** December 10, 2024
