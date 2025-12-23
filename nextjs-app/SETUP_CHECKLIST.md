# OAuth Setup Checklist

## ⚠️ Current Issue: 404 Error on Google Sign-In

The 404 error occurs because NextAuth routes are not properly configured or environment variables are missing.

---

## 🔧 Quick Fix Steps

### Step 1: Create .env.local File

1. **Navigate to nextjs-app directory:**
   ```bash
   cd d:\selsoft\WebApp\TimePulse\nextjs-app
   ```

2. **Create .env.local file** (if it doesn't exist):
   ```bash
   copy .env.local.example .env.local
   ```

3. **Edit .env.local** and add these values:
   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=https://goggly-casteless-torri.ngrok-free.dev
   NEXTAUTH_SECRET=your-secret-here
   
   # Google OAuth Credentials
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://44.222.217.57:5001
   
   # App URL
   NEXT_PUBLIC_APP_URL=https://goggly-casteless-torri.ngrok-free.dev
   ```

### Step 2: Generate NEXTAUTH_SECRET

Run one of these commands:

**Option 1 - Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Option 2 - Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3 - Use this temporary secret for testing:**
```
8KzP9mN2vL5xR7wQ3jT6hY4nB1gF0sA8dE2cV5xZ9mK3pL7wR4tY6hN8jB0gF2sA
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env.local`

### Step 3: Get Google OAuth Credentials

**If you don't have Google OAuth credentials yet:**

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen (if prompted)
6. Set Application type: **Web application**
7. Add these **Authorized redirect URIs**:
   ```
   https://goggly-casteless-torri.ngrok-free.dev/api/auth/callback/google
   https://goggly-casteless-torri.ngrok-free.dev/auth/callback
   ```
8. Copy **Client ID** and **Client Secret**
9. Paste them in `.env.local`

**For testing without Google credentials:**
You can use placeholder values temporarily, but Google sign-in won't work until you add real credentials.

### Step 4: Restart Next.js Server

**IMPORTANT:** After creating/editing `.env.local`, you MUST restart the server:

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
npm run dev
```

### Step 5: Test OAuth Configuration

Open this URL in your browser:
```
https://goggly-casteless-torri.ngrok-free.dev/test-oauth
```

This page will show:
- ✅ Environment variables status
- ✅ Session status
- ✅ Test sign-in button

---

## 📋 Verification Checklist

- [ ] `.env.local` file exists in `nextjs-app` directory
- [ ] `NEXTAUTH_SECRET` is set (32+ character random string)
- [ ] `NEXTAUTH_URL` is set to `https://goggly-casteless-torri.ngrok-free.dev`
- [ ] `GOOGLE_CLIENT_ID` is set (even if placeholder)
- [ ] `GOOGLE_CLIENT_SECRET` is set (even if placeholder)
- [ ] `NEXT_PUBLIC_API_URL` is set to `http://44.222.217.57:5001`
- [ ] Next.js server restarted after creating `.env.local`
- [ ] Backend server is running on port 5001
- [ ] Test page loads: https://goggly-casteless-torri.ngrok-free.dev/test-oauth

---

## 🐛 Common Issues & Solutions

### Issue 1: "404 /api/auth/error not found"

**Cause:** NextAuth routes not loading or `.env.local` missing

**Solution:**
1. Verify `.env.local` exists
2. Restart Next.js server
3. Check browser console for errors
4. Visit https://goggly-casteless-torri.ngrok-free.dev/test-oauth to verify config

### Issue 2: "OAuth not configured" warning

**Cause:** Google credentials not set in `.env.local`

**Solution:**
1. Add Google OAuth credentials to `.env.local`
2. Or use placeholder values for testing
3. Restart server

### Issue 3: "Redirect URI mismatch"

**Cause:** Google Cloud Console redirect URIs don't match

**Solution:**
1. Go to Google Cloud Console
2. Edit OAuth 2.0 Client ID
3. Add exact redirect URI: `https://goggly-casteless-torri.ngrok-free.dev/api/auth/callback/google`
4. Save and wait a few minutes

### Issue 4: Server not reading .env.local

**Cause:** File not in correct location or server not restarted

**Solution:**
1. Verify file is in `nextjs-app` directory (not `nextjs-app/src`)
2. File must be named exactly `.env.local` (not `.env.local.txt`)
3. Restart server completely (stop and start, not just refresh)

---

## 🧪 Testing Steps

### Test 1: Environment Variables
```bash
# In nextjs-app directory
node -e "require('dotenv').config({ path: '.env.local' }); console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');"
```

### Test 2: NextAuth Route
Open browser and visit:
```
https://goggly-casteless-torri.ngrok-free.dev/api/auth/providers
```

Should return JSON with Google provider info.

### Test 3: Test Page
```
https://goggly-casteless-torri.ngrok-free.dev/test-oauth
```

Should show environment status and sign-in button.

### Test 4: Login Page
```
https://goggly-casteless-torri.ngrok-free.dev/login
```

Click "Sign in with Google" - should redirect to Google (or show error if credentials invalid).

---

## 📝 Example .env.local File

```env
# NextAuth Configuration
NEXTAUTH_URL=https://goggly-casteless-torri.ngrok-free.dev
NEXTAUTH_SECRET=8KzP9mN2vL5xR7wQ3jT6hY4nB1gF0sA8dE2cV5xZ9mK3pL7wR4tY6hN8jB0gF2sA

# Google OAuth Credentials
# Get these from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# Backend API URL
NEXT_PUBLIC_API_URL=http://44.222.217.57:5001

# App URL
NEXT_PUBLIC_APP_URL=https://goggly-casteless-torri.ngrok-free.dev
```

---

## 🚀 Quick Start Command

Run this in PowerShell (nextjs-app directory):

```powershell
# Create .env.local if it doesn't exist
if (!(Test-Path .env.local)) {
    Copy-Item .env.local.example .env.local
    Write-Host "✅ Created .env.local file"
    Write-Host "⚠️ Please edit .env.local and add your credentials"
    Write-Host "⚠️ Then restart the server with: npm run dev"
} else {
    Write-Host "✅ .env.local already exists"
    Write-Host "⚠️ Make sure to restart server after editing"
}
```

---

## 📞 Next Steps

1. ✅ Create `.env.local` file
2. ✅ Add NEXTAUTH_SECRET (use generated value)
3. ✅ Add Google credentials (or placeholders)
4. ✅ Restart Next.js server
5. ✅ Test at https://goggly-casteless-torri.ngrok-free.dev/test-oauth
6. ✅ Try Google sign-in

**After completing these steps, the 404 error should be resolved!**
