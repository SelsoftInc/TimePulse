# 🔧 Fix 404 Error - Google OAuth

## The Problem
You're getting a **404 error** when clicking "Sign in with Google" because the `.env.local` file is missing or not configured.

---

## ⚡ Quick Fix (2 Minutes)

### Option 1: Automated Setup (Recommended)

Run this PowerShell script:
```powershell
cd d:\selsoft\WebApp\TimePulse\nextjs-app
.\setup-oauth.ps1
```

The script will:
- ✅ Create `.env.local` file
- ✅ Generate NEXTAUTH_SECRET
- ✅ Help you configure Google credentials
- ✅ Verify configuration

### Option 2: Manual Setup

1. **Create .env.local file:**
   ```powershell
   cd d:\selsoft\WebApp\TimePulse\nextjs-app
   copy .env.local.example .env.local
   ```

2. **Edit .env.local** and add this content:
   ```env
   NEXTAUTH_URL=https://goggly-casteless-torri.ngrok-free.dev
   NEXTAUTH_SECRET=8KzP9mN2vL5xR7wQ3jT6hY4nB1gF0sA8dE2cV5xZ9mK3pL7wR4tY6hN8jB0gF2sA
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NEXT_PUBLIC_API_URL=http://localhost:5001
   NEXT_PUBLIC_APP_URL=https://goggly-casteless-torri.ngrok-free.dev
   ```

3. **Restart Next.js server:**
   - Press `Ctrl+C` to stop
   - Run `npm run dev` to start

4. **Test:**
   - Open https://goggly-casteless-torri.ngrok-free.dev/test-oauth
   - Check if environment variables are loaded
   - Try Google sign-in

---

## 🎯 Why This Happens

NextAuth requires environment variables to be set in `.env.local` file. Without this file:
- ❌ NextAuth routes don't initialize properly
- ❌ Google OAuth configuration is missing
- ❌ Results in 404 errors

---

## ✅ Verification

After fixing, you should see:

1. **Test page works:**
   ```
   https://goggly-casteless-torri.ngrok-free.dev/test-oauth
   ```
   Shows: ✅ Environment variables loaded

2. **NextAuth providers endpoint works:**
   ```
   https://goggly-casteless-torri.ngrok-free.dev/api/auth/providers
   ```
   Returns: JSON with Google provider

3. **Login page works:**
   ```
   https://goggly-casteless-torri.ngrok-free.dev/login
   ```
   Google button redirects to Google OAuth (not 404)

---

## 🚨 Still Not Working?

### Check 1: File Location
Verify `.env.local` is in the correct location:
```
d:\selsoft\WebApp\TimePulse\nextjs-app\.env.local
```
NOT in `src` folder!

### Check 2: File Name
Must be exactly `.env.local` (not `.env.local.txt`)

### Check 3: Server Restart
You MUST restart the server after creating/editing `.env.local`

### Check 4: File Content
Open `.env.local` and verify it has content (not empty)

---

## 📞 Need Google OAuth Credentials?

### For Testing (Temporary)
You can use the placeholder values in `.env.local.example` just to test that the 404 is fixed. Google sign-in won't work until you add real credentials.

### For Production (Real Credentials)
1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://goggly-casteless-torri.ngrok-free.dev/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

---

## 🎉 Success!

Once `.env.local` is configured and server restarted:
- ✅ No more 404 errors
- ✅ OAuth routes work
- ✅ Google sign-in redirects properly

**Next:** Add real Google OAuth credentials to enable actual sign-in!
