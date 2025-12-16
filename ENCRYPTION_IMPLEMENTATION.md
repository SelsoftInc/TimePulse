# Encryption and Decryption Implementation for Authentication and OAuth

## Overview
This document describes the implementation of AES encryption for all authentication and OAuth API endpoints to secure sensitive data transmission between the backend and frontend.

## Implementation Summary

### 1. Libraries Used
- **crypto-js**: AES encryption/decryption library installed on both backend and frontend

### 2. Backend Implementation

#### Encryption Utility (`server/utils/encryption.js`)
- **Purpose**: Encrypts sensitive authentication response data before sending to frontend
- **Key Functions**:
  - `encryptData(data)`: Encrypts any data using AES encryption
  - `encryptAuthResponse(responseData)`: Wraps response data in encrypted format
  - `decryptData(encryptedData)`: Decrypts data (for testing purposes)

#### Updated Backend Routes

##### Authentication Routes (`server/routes/auth.js`)
- **POST /api/auth/login**: Login endpoint now encrypts response data
- **GET /api/auth/me**: User info endpoint now encrypts response data

##### OAuth Routes (`server/routes/oauth.js`)
- **POST /api/oauth/check-user**: User check endpoint now encrypts response data
- **POST /api/oauth/register**: Registration endpoint now encrypts response data

### 3. Frontend Implementation

#### Decryption Utility (`nextjs-app/src/utils/encryption.js`)
- **Purpose**: Decrypts encrypted API responses from backend
- **Key Functions**:
  - `decryptData(encryptedData)`: Decrypts AES encrypted data
  - `decryptAuthResponse(response)`: Handles encrypted response format
  - `encryptData(data)`: Encrypts data (for testing purposes)

#### Updated Frontend Components

##### Login Component (`nextjs-app/src/components/auth/Login.jsx`)
- Decrypts login response data in both test user and regular login flows
- Maintains backward compatibility with unencrypted responses

##### Onboarding Page (`nextjs-app/src/app/onboarding/page.js`)
- Decrypts OAuth registration response data
- Handles encrypted user and tenant information

##### Auth Callback Page (`nextjs-app/src/app/auth/callback/page.js`)
- Decrypts OAuth check-user response data
- Processes encrypted authentication tokens and user data

## Security Features

### Encryption Key Management
- **Backend**: Uses `ENCRYPTION_KEY` environment variable (default: 'timepulse-default-encryption-key-2024')
- **Frontend**: Uses `NEXT_PUBLIC_ENCRYPTION_KEY` environment variable (default: 'timepulse-default-encryption-key-2024')
- **Recommendation**: Set custom encryption keys in production via environment variables

### Encrypted Response Format
```json
{
  "encrypted": true,
  "data": "U2FsdGVkX1+... (encrypted AES string)"
}
```

### Decrypted Data Format
Original response data structure is preserved after decryption:
```json
{
  "success": true,
  "token": "jwt-token",
  "user": { ... },
  "tenant": { ... }
}
```

## Configuration

### Backend Environment Variables
Add to `server/.env`:
```env
ENCRYPTION_KEY=your-secure-encryption-key-here
```

### Frontend Environment Variables
Add to `nextjs-app/.env.local`:
```env
NEXT_PUBLIC_ENCRYPTION_KEY=your-secure-encryption-key-here
```

**Important**: Both keys must match for encryption/decryption to work correctly.

## Backward Compatibility
The implementation includes backward compatibility:
- If response is not encrypted (no `encrypted` flag), it returns data as-is
- This allows gradual migration and testing without breaking existing functionality

## Testing

### Test Encryption/Decryption
You can test the encryption/decryption utilities:

```javascript
// Backend (Node.js)
const { encryptData, decryptData } = require('./utils/encryption');
const testData = { message: 'Hello, World!' };
const encrypted = encryptData(testData);
const decrypted = decryptData(encrypted);
console.log('Original:', testData);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
```

```javascript
// Frontend (React)
import { encryptData, decryptData } from '@/utils/encryption';
const testData = { message: 'Hello, World!' };
const encrypted = encryptData(testData);
const decrypted = decryptData(encrypted);
console.log('Original:', testData);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
```

## Affected API Endpoints

### Authentication APIs
1. **POST /api/auth/login**
   - Encrypts: token, user data, tenant data
   - Frontend: Login.jsx decrypts response

2. **GET /api/auth/me**
   - Encrypts: user data, tenant data
   - Frontend: Any component using this endpoint should decrypt

### OAuth APIs
1. **POST /api/oauth/check-user**
   - Encrypts: token, user data, tenant data, approval status
   - Frontend: auth/callback/page.js decrypts response

2. **POST /api/oauth/register**
   - Encrypts: token, user data, tenant data, approval status
   - Frontend: onboarding/page.js decrypts response

## Security Best Practices

1. **Never hardcode encryption keys** - Always use environment variables
2. **Use strong encryption keys** - Minimum 32 characters, mix of letters, numbers, and symbols
3. **Rotate keys periodically** - Update encryption keys regularly in production
4. **HTTPS only** - Always use HTTPS in production to prevent man-in-the-middle attacks
5. **Key synchronization** - Ensure backend and frontend keys are always in sync

## Troubleshooting

### Common Issues

1. **Decryption fails with empty string**
   - Check if encryption keys match on backend and frontend
   - Verify environment variables are loaded correctly

2. **Response not encrypted**
   - Check if backend encryption utility is imported correctly
   - Verify `encryptAuthResponse()` is called before sending response

3. **Frontend cannot decrypt**
   - Ensure `decryptAuthResponse()` is called on raw response
   - Check browser console for decryption errors
   - Verify crypto-js is installed in frontend

## Files Modified

### Backend
- `server/utils/encryption.js` (NEW)
- `server/routes/auth.js` (MODIFIED)
- `server/routes/oauth.js` (MODIFIED)
- `server/package.json` (MODIFIED - added crypto-js)

### Frontend
- `nextjs-app/src/utils/encryption.js` (NEW)
- `nextjs-app/src/components/auth/Login.jsx` (MODIFIED)
- `nextjs-app/src/app/onboarding/page.js` (MODIFIED)
- `nextjs-app/src/app/auth/callback/page.js` (MODIFIED)
- `nextjs-app/package.json` (MODIFIED - added crypto-js)

## Next Steps

1. **Set production encryption keys** in environment variables
2. **Test all authentication flows** to ensure encryption/decryption works correctly
3. **Monitor logs** for any encryption/decryption errors
4. **Consider extending** encryption to other sensitive API endpoints
5. **Implement key rotation** strategy for production environment

## Support

For issues or questions regarding the encryption implementation:
1. Check this documentation first
2. Review console logs for encryption/decryption errors
3. Verify environment variables are set correctly
4. Test with default keys first, then switch to custom keys

---
**Implementation Date**: December 10, 2024
**Version**: 1.0.0
**Status**: ✅ Completed
