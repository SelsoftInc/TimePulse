# Encryption Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies (Already Done ✅)
The `crypto-js` library has been installed in both backend and frontend.

### Step 2: Configure Encryption Keys

#### Backend Configuration
1. Open or create `server/.env`
2. Add the encryption key:
```env
ENCRYPTION_KEY=timepulse-default-encryption-key-2024
```

#### Frontend Configuration
1. Open or create `nextjs-app/.env.local`
2. Add the encryption key:
```env
NEXT_PUBLIC_ENCRYPTION_KEY=timepulse-default-encryption-key-2024
```

**⚠️ IMPORTANT**: Both keys must match exactly!

### Step 3: Test the Implementation

#### Test Backend Encryption
```bash
cd server
node test-auth-encryption.js
```

Expected output: All tests should pass ✅

#### Test Full Flow
1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend:
```bash
cd nextjs-app
npm run dev
```

3. Test login at `https://goggly-casteless-torri.ngrok-free.dev/login`

### Step 4: Verify in Browser Console

When you login, you should see console logs like:
```
Raw response data: { encrypted: true, data: "U2FsdGVkX1..." }
Decrypted response data: { success: true, token: "...", user: {...}, tenant: {...} }
```

## 🔒 What's Been Encrypted?

### Backend APIs (Encryption Applied)
- ✅ POST `/api/auth/login` - Login endpoint
- ✅ GET `/api/auth/me` - Get current user
- ✅ POST `/api/oauth/check-user` - Check OAuth user
- ✅ POST `/api/oauth/register` - Register OAuth user

### Frontend Components (Decryption Applied)
- ✅ Login.jsx - Login form
- ✅ onboarding/page.js - OAuth onboarding
- ✅ auth/callback/page.js - OAuth callback

## 🛠️ Production Setup

### Generate Secure Encryption Key

#### Using Node.js:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

#### Using OpenSSL:
```bash
openssl rand -hex 32
```

### Set Production Keys

1. **Backend** (`server/.env`):
```env
ENCRYPTION_KEY=your-generated-secure-key-here
```

2. **Frontend** (`nextjs-app/.env.local`):
```env
NEXT_PUBLIC_ENCRYPTION_KEY=your-generated-secure-key-here
```

## 📋 Verification Checklist

- [ ] crypto-js installed in backend
- [ ] crypto-js installed in frontend
- [ ] ENCRYPTION_KEY set in server/.env
- [ ] NEXT_PUBLIC_ENCRYPTION_KEY set in nextjs-app/.env.local
- [ ] Both keys match exactly
- [ ] Backend encryption test passes
- [ ] Login works correctly
- [ ] OAuth login works correctly
- [ ] Console shows encrypted/decrypted data

## 🐛 Troubleshooting

### Issue: "Decryption resulted in empty string"
**Solution**: Keys don't match. Verify both environment variables are identical.

### Issue: Response not encrypted
**Solution**: 
1. Check if encryption utility is imported in backend route
2. Verify `encryptAuthResponse()` is called
3. Restart backend server to load new environment variables

### Issue: Frontend cannot decrypt
**Solution**:
1. Check if `decryptAuthResponse()` is imported
2. Verify it's called on the raw response
3. Restart frontend dev server to load new environment variables

## 📚 Additional Resources

- Full Documentation: `ENCRYPTION_IMPLEMENTATION.md`
- Backend Encryption Utility: `server/utils/encryption.js`
- Frontend Decryption Utility: `nextjs-app/src/utils/encryption.js`
- Test Script: `server/test-auth-encryption.js`

## 🎯 Key Points to Remember

1. **Keys must match** between backend and frontend
2. **Restart servers** after changing environment variables
3. **Use HTTPS** in production
4. **Never commit** encryption keys to version control
5. **Rotate keys** periodically in production

---
**Status**: ✅ Implementation Complete
**Ready for**: Testing and Production Deployment
