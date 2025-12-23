# Google OAuth Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen (if needed)
6. Set Application type: **Web application**
7. Add Authorized redirect URIs:
   ```
   https://goggly-casteless-torri.ngrok-free.dev/api/auth/callback/google
   https://goggly-casteless-torri.ngrok-free.dev/auth/callback
   ```
8. Copy **Client ID** and **Client Secret**

### Step 2: Configure Environment

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

3. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```
   Add it to `.env.local`:
   ```env
   NEXTAUTH_SECRET=generated-secret-here
   ```

### Step 3: Start Servers

1. **Backend (Terminal 1):**
   ```bash
   cd server
   npm start
   ```
   Should run on http://localhost:5001

2. **Frontend (Terminal 2):**
   ```bash
   cd nextjs-app
   npm run dev
   ```
   Should run on https://goggly-casteless-torri.ngrok-free.dev

### Step 4: Test OAuth Flow

1. Open https://goggly-casteless-torri.ngrok-free.dev/login
2. Click **"Sign in with Google"**
3. Select your Google account
4. **First time:** Fill onboarding form
   - Select role (Admin/Approver/Employee)
   - Add company name (optional)
   - Complete registration
5. **Redirected to dashboard** based on role!

---

## 🎯 What Happens?

### New User Flow:
```
Login → Google OAuth → Onboarding Form → Register → Dashboard
```

### Existing User Flow:
```
Login → Google OAuth → Dashboard (Direct)
```

---

## 📋 Role-Based Routing

| Role | Dashboard URL |
|------|--------------|
| **Employee** | `/[subdomain]/employee-dashboard` |
| **Admin** | `/[subdomain]/dashboard` |
| **Approver** | `/[subdomain]/dashboard` |

---

## ✅ Checklist

- [ ] Google OAuth credentials obtained
- [ ] `.env.local` configured with credentials
- [ ] NEXTAUTH_SECRET generated
- [ ] Backend server running (port 5001)
- [ ] Frontend server running (port 3000)
- [ ] Tested new user registration
- [ ] Tested existing user login
- [ ] Verified role-based routing

---

## 🐛 Common Issues

### "OAuth not configured" error
- Check `.env.local` has correct credentials
- Restart Next.js server after changing `.env.local`

### "Redirect URI mismatch" error
- Verify redirect URIs in Google Cloud Console
- Must include: `https://goggly-casteless-torri.ngrok-free.dev/api/auth/callback/google`

### Backend connection error
- Ensure backend is running on port 5001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

---

## 📚 Full Documentation

For detailed information, see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

---

## 🎉 You're Ready!

Your Google OAuth authentication is now configured. Users can sign in with Google and get role-based access to TimePulse!
