# Google OAuth Setup Guide - TimePulse

## Problem
After recent changes, Google OAuth login shows error: **"Google OAuth is not configured. Please use email/password login or contact administrator."**

## Root Cause
Google OAuth credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) are not configured in the environment variables. The NextAuth configuration requires these credentials to enable Google OAuth functionality.

---

## Solution Overview

### What Was Fixed

1. **Added OAuth Configuration Check** - Login component now checks if OAuth is configured before showing the button
2. **Conditional OAuth Button** - Google OAuth button only appears when credentials are properly configured
3. **Updated .env.example** - Added required OAuth environment variables
4. **Better Error Handling** - Clear error messages when OAuth is not configured

---

## Setup Instructions

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click "Select a project" → "New Project"
   - Name: "TimePulse OAuth"
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "TimePulse Web Client"

5. **Configure Authorized URLs**
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:3001
   https://yourdomain.com
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3001/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```

6. **Copy Credentials**
   - After creating, you'll see:
     - Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
     - Client Secret (looks like: `GOCSPX-abc123xyz`)
   - **Keep these secure!**

---

### Step 2: Configure Environment Variables

1. **Create `.env.local` file** in `nextjs-app/` directory:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001

# Application Configuration
NEXT_PUBLIC_APP_NAME=TimePulse
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

2. **Generate NEXTAUTH_SECRET**:

```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use online generator:
# https://generate-secret.vercel.app/32
```

3. **Replace placeholder values**:
   - `GOOGLE_CLIENT_ID`: Your actual Google Client ID
   - `GOOGLE_CLIENT_SECRET`: Your actual Google Client Secret
   - `NEXTAUTH_SECRET`: Generated random secret

---

### Step 3: Restart the Application

```bash
# Stop the Next.js server (Ctrl+C)

# Start it again
cd D:\selsoft\WebApp\TimePulse\nextjs-app
npm run dev
```

---

## How It Works Now

### When OAuth IS Configured (Credentials Present)

1. **Login Page Loads**
   - Component checks `/api/auth/providers`
   - Detects Google provider is available
   - Shows "Sign in with Google" button

2. **User Clicks Google Button**
   - NextAuth redirects to Google login
   - User authenticates with Google
   - Google redirects back to `/auth/callback`

3. **Callback Processing**
   - `/auth/callback` page receives session
   - Calls `/api/oauth/check-user` to verify user
   - Redirects to appropriate dashboard

### When OAuth IS NOT Configured (No Credentials)

1. **Login Page Loads**
   - Component checks `/api/auth/providers`
   - No Google provider detected
   - **Google button is hidden**

2. **User Can Only Use Email/Password**
   - Standard login form remains available
   - No confusing OAuth errors
   - Clear user experience

---

## Files Modified

### 1. **Login.jsx** (`nextjs-app/src/components/auth/Login.jsx`)

**Added OAuth Configuration Check:**
```javascript
const [isOAuthConfigured, setIsOAuthConfigured] = useState(true);

useEffect(() => {
  const checkOAuthConfig = async () => {
    try {
      const response = await fetch('/api/auth/providers');
      const providers = await response.json();
      const hasGoogle = providers && providers.google;
      setIsOAuthConfigured(hasGoogle);
    } catch (error) {
      setIsOAuthConfigured(false);
    }
  };
  
  checkOAuthConfig();
}, [searchParams]);
```

**Conditional OAuth Button Rendering:**
```javascript
{/* Only show if OAuth is configured */}
{isOAuthConfigured && (
  <div className="auth-divider">
    <span>OR</span>
  </div>
)}

{isOAuthConfigured && (
  <button
    type="button"
    className="btn-google btn-block"
    onClick={() => {
      setLoading(true);
      signIn('google', { 
        callbackUrl: '/auth/callback',
        redirect: true
      });
    }}
    disabled={loading}
  >
    <svg>...</svg>
    Sign in with Google
  </button>
)}
```

### 2. **.env.example** (`nextjs-app/.env.example`)

**Added OAuth Configuration Section:**
```bash
# Google OAuth Configuration (Required for OAuth login)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## Testing

### Test 1: Without OAuth Credentials

1. **Don't create `.env.local` or leave OAuth vars empty**
2. **Start the app**: `npm run dev`
3. **Navigate to login page**
4. **Expected Result**:
   - ✅ Login form visible
   - ✅ No "Sign in with Google" button
   - ✅ No error messages
   - ✅ Email/password login works

### Test 2: With OAuth Credentials

1. **Create `.env.local` with valid credentials**
2. **Restart the app**: Stop and run `npm run dev`
3. **Navigate to login page**
4. **Expected Result**:
   - ✅ Login form visible
   - ✅ "OR" divider visible
   - ✅ "Sign in with Google" button visible
   - ✅ Clicking button redirects to Google
   - ✅ After Google auth, redirects to dashboard

### Test 3: OAuth Flow

1. **Click "Sign in with Google"**
2. **Select Google account**
3. **Grant permissions**
4. **Expected Result**:
   - ✅ Redirects to `/auth/callback`
   - ✅ Shows "Authenticating..." spinner
   - ✅ Calls `/api/oauth/check-user`
   - ✅ For new users: Redirects to onboarding
   - ✅ For existing users: Redirects to dashboard

---

## Troubleshooting

### Issue: "Google OAuth is not configured" error still appears

**Solution:**
1. Check `.env.local` file exists in `nextjs-app/` directory
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
3. Restart the Next.js server
4. Clear browser cache and reload

### Issue: "Redirect URI mismatch" error from Google

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add the exact redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Save and try again

### Issue: OAuth button still shows but doesn't work

**Solution:**
1. Check browser console for errors
2. Verify `NEXTAUTH_URL` matches your app URL
3. Ensure `NEXTAUTH_SECRET` is set
4. Check that Google API is enabled in Cloud Console

### Issue: "Session not found" or "Unauthorized" errors

**Solution:**
1. Clear browser cookies and localStorage
2. Verify backend `/api/oauth/check-user` endpoint is working
3. Check server logs for errors
4. Ensure database connection is working

---

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Use different credentials for production** - Don't reuse dev credentials
3. **Rotate secrets regularly** - Change `NEXTAUTH_SECRET` periodically
4. **Restrict redirect URIs** - Only add necessary domains
5. **Monitor OAuth usage** - Check Google Cloud Console for suspicious activity

---

## Production Deployment

### Environment Variables for Production

```bash
# Production .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

GOOGLE_CLIENT_ID=production-client-id
GOOGLE_CLIENT_SECRET=production-client-secret
NEXTAUTH_SECRET=production-secret-different-from-dev
NEXTAUTH_URL=https://yourdomain.com
```

### Google Cloud Console Production Setup

1. **Create separate OAuth client for production**
2. **Add production redirect URIs**:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
3. **Use environment-specific credentials**
4. **Enable production APIs**

---

## Architecture Overview

```
User clicks "Sign in with Google"
         ↓
NextAuth redirects to Google
         ↓
User authenticates with Google
         ↓
Google redirects to /api/auth/callback/google
         ↓
NextAuth processes callback
         ↓
Redirects to /auth/callback (our custom page)
         ↓
Calls /api/oauth/check-user (backend)
         ↓
Backend checks if user exists
         ↓
If new user → /onboarding
If existing user → /dashboard
```

---

## Summary

### ✅ What's Fixed
- OAuth button only shows when credentials are configured
- No more confusing error messages
- Better user experience
- Proper environment variable documentation

### ✅ What's Required
- Google OAuth credentials from Google Cloud Console
- `.env.local` file with proper configuration
- Server restart after adding credentials

### ✅ What Works
- Email/password login (always available)
- Google OAuth login (when configured)
- Automatic detection of OAuth availability
- Graceful fallback to email/password only

---

## Status: ✅ COMPLETE

The OAuth system now works properly with proper configuration detection and graceful degradation when credentials are not available.
