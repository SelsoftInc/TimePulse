# Google OAuth Authentication Setup Guide

## Overview
This guide explains how to set up Google OAuth authentication for TimePulse with role-based onboarding for new users.

## Features
✅ **Google OAuth Sign-In** - Users can sign in with their Google account  
✅ **New User Onboarding** - First-time users complete a profile with role selection  
✅ **Role-Based Routing** - Automatic redirect based on user role:
  - **Employee** → Employee Dashboard
  - **Admin/Approver** → Admin Dashboard  
✅ **Existing User Login** - Returning users skip onboarding and go directly to dashboard  
✅ **Multi-Tenant Support** - Automatic tenant creation for new users

---

## Architecture

### Flow Diagram
```
Google Sign-In
     ↓
NextAuth Callback
     ↓
Check User Exists? (Backend API)
     ↓
  ┌──────┴──────┐
  NO           YES
  ↓             ↓
Onboarding    Store Session
Page          & Redirect
  ↓             ↓
Register      Dashboard
User          (Role-based)
  ↓
Dashboard
(Role-based)
```

### Components

**Frontend (Next.js):**
- `/login` - Login page with Google OAuth button
- `/onboarding` - New user profile completion page
- `/auth/callback` - OAuth callback handler
- `/api/auth/[...nextauth]` - NextAuth configuration

**Backend (Express):**
- `POST /api/oauth/check-user` - Check if user exists
- `POST /api/oauth/register` - Register new OAuth user

---

## Setup Instructions

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   - Create a new project or select existing one
   - Name it "TimePulse" or your preferred name

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure consent screen if prompted:
     - User Type: External
     - App name: TimePulse
     - User support email: Your email
     - Developer contact: Your email
     - Save and continue through all steps

5. **Configure OAuth Client**
   - Application type: **Web application**
   - Name: TimePulse Web Client
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3000/auth/callback
   https://your-production-domain.com/api/auth/callback/google
   https://your-production-domain.com/auth/callback
   ```

6. **Copy Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Keep these secure!

### 2. Environment Configuration

1. **Copy example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Update .env.local:**
   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret-here
   
   # Google OAuth Credentials (from Google Cloud Console)
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   
   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:5001
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Generate NEXTAUTH_SECRET:**
   ```bash
   # Using OpenSSL
   openssl rand -base64 32
   
   # Or using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

### 3. Backend Configuration

Ensure your backend server (port 5001) has the OAuth routes registered. This is already done in `server/index.js`:

```javascript
app.use("/api/oauth", require("./routes/oauth"));
```

---

## User Flow

### New User (First Time)

1. **Click "Sign in with Google"** on login page
2. **Google OAuth consent** screen appears
3. **User authorizes** TimePulse
4. **Backend checks** if user exists
5. **Redirected to onboarding** page (`/onboarding`)
6. **User fills form:**
   - First Name (pre-filled from Google)
   - Last Name (pre-filled from Google)
   - Email (disabled, from Google)
   - **Role Selection** (Admin/Approver/Employee)
   - Company Name (optional)
   - Phone (optional)
   - Department (optional)
7. **Click "Complete Registration"**
8. **Account created** in database:
   - User record created
   - Tenant created (if new company)
   - Employee record created (if Employee/Approver role)
9. **Redirected to dashboard** based on role:
   - Employee → `/[subdomain]/employee-dashboard`
   - Admin/Approver → `/[subdomain]/dashboard`

### Existing User (Returning)

1. **Click "Sign in with Google"** on login page
2. **Google OAuth consent** screen appears (or auto-signs in)
3. **Backend checks** user exists
4. **Session stored** in localStorage
5. **Immediately redirected** to appropriate dashboard
6. **No onboarding** required

---

## Role-Based Access

### Admin Role
- **Full system access**
- Can manage employees, clients, vendors
- Can approve timesheets and invoices
- Access to all reports and settings
- **Dashboard:** `/[subdomain]/dashboard`

### Approver Role
- **Manage employees** and resources
- **Approve timesheets** and invoices
- View reports
- Limited settings access
- **Dashboard:** `/[subdomain]/dashboard`

### Employee Role
- **Submit timesheets**
- View own timesheet history
- Request leave
- View profile settings
- **Dashboard:** `/[subdomain]/employee-dashboard`

---

## Database Schema

### User Table
```javascript
{
  id: UUID,
  email: String (unique),
  firstName: String,
  lastName: String,
  passwordHash: String (random for OAuth users),
  role: Enum('admin', 'approver', 'employee'),
  tenantId: UUID,
  googleId: String (OAuth provider ID),
  authProvider: 'google',
  emailVerified: Boolean (true for OAuth),
  status: 'active',
  lastLogin: DateTime
}
```

### Tenant Table
```javascript
{
  id: UUID,
  tenant_name: String,
  subdomain: String (unique),
  status: 'active',
  plan_type: 'free',
  max_users: 10
}
```

### Employee Table (for Employee/Approver roles)
```javascript
{
  id: UUID,
  tenantId: UUID,
  userId: UUID,
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String (optional),
  department: String,
  position: String,
  status: 'active',
  startDate: DateTime
}
```

---

## API Endpoints

### POST /api/oauth/check-user
Check if a Google OAuth user exists in the system.

**Request:**
```json
{
  "email": "user@example.com",
  "googleId": "google-oauth-id"
}
```

**Response (New User):**
```json
{
  "success": true,
  "exists": false,
  "needsOnboarding": true,
  "email": "user@example.com"
}
```

**Response (Existing User):**
```json
{
  "success": true,
  "exists": true,
  "needsOnboarding": false,
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "employee",
    "tenantId": "tenant-id",
    "employeeId": "employee-id"
  },
  "tenant": {
    "id": "tenant-id",
    "tenantName": "Company Name",
    "subdomain": "companyname",
    "status": "active"
  }
}
```

### POST /api/oauth/register
Register a new user from Google OAuth with onboarding data.

**Request:**
```json
{
  "email": "user@example.com",
  "googleId": "google-oauth-id",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee",
  "companyName": "Acme Corp",
  "phoneNumber": "+1234567890",
  "department": "Engineering"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "employee",
    "tenantId": "tenant-id",
    "employeeId": "employee-id"
  },
  "tenant": {
    "id": "tenant-id",
    "tenantName": "Acme Corp",
    "subdomain": "acmecorp",
    "status": "active"
  }
}
```

---

## Testing

### Test New User Flow

1. **Start servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   cd nextjs-app
   npm run dev
   ```

2. **Open browser:** http://localhost:3000/login

3. **Click "Sign in with Google"**

4. **Use a Google account** that hasn't been registered

5. **Verify redirect** to onboarding page

6. **Fill in the form:**
   - Select role (e.g., Employee)
   - Add company name
   - Fill optional fields

7. **Click "Complete Registration"**

8. **Verify:**
   - User created in database
   - Tenant created
   - Employee record created (if applicable)
   - Redirected to correct dashboard

### Test Existing User Flow

1. **Sign out** from current session

2. **Click "Sign in with Google"** again

3. **Use same Google account**

4. **Verify:**
   - No onboarding page
   - Direct redirect to dashboard
   - Session data loaded correctly

### Test Role-Based Routing

**Employee:**
- Should redirect to `/[subdomain]/employee-dashboard`
- Should see employee-specific features

**Admin:**
- Should redirect to `/[subdomain]/dashboard`
- Should see admin features

**Approver:**
- Should redirect to `/[subdomain]/dashboard`
- Should see approver features

---

## Troubleshooting

### "Google OAuth is not configured" Error

**Cause:** Missing or invalid Google OAuth credentials

**Solution:**
1. Check `.env.local` has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Verify credentials in Google Cloud Console
3. Restart Next.js dev server after changing `.env.local`

### Redirect URI Mismatch Error

**Cause:** Redirect URI not authorized in Google Cloud Console

**Solution:**
1. Go to Google Cloud Console > Credentials
2. Edit OAuth 2.0 Client ID
3. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/auth/callback`
4. Save changes
5. Wait a few minutes for changes to propagate

### User Not Redirected After Onboarding

**Cause:** Backend API not running or connection error

**Solution:**
1. Check backend server is running on port 5001
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for errors
4. Check backend logs for API errors

### Session Not Persisting

**Cause:** localStorage not being set correctly

**Solution:**
1. Check browser console for errors
2. Verify token is returned from backend
3. Clear browser cache and cookies
4. Try in incognito mode

---

## Security Considerations

### OAuth Security
- ✅ Use HTTPS in production
- ✅ Keep Client Secret secure (never commit to git)
- ✅ Validate redirect URIs
- ✅ Use state parameter (handled by NextAuth)
- ✅ Verify email from Google

### Token Security
- ✅ JWT tokens expire after 24 hours
- ✅ Tokens stored in localStorage (client-side)
- ✅ Backend validates all tokens
- ✅ CORS configured properly

### User Data
- ✅ Email verified by Google
- ✅ Random password generated (not used)
- ✅ User status set to 'active'
- ✅ Role-based access control enforced

---

## Production Deployment

### Environment Variables
Update for production:
```env
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Google Cloud Console
Add production URLs to:
- Authorized JavaScript origins
- Authorized redirect URIs

### SSL/HTTPS
- ✅ Required for production OAuth
- ✅ Configure SSL certificates
- ✅ Update all URLs to HTTPS

---

## Support

For issues or questions:
1. Check this documentation
2. Review browser console errors
3. Check backend server logs
4. Verify Google Cloud Console configuration
5. Test with different Google accounts

---

## Files Modified/Created

### Backend
- ✅ `server/routes/oauth.js` - OAuth API endpoints
- ✅ `server/index.js` - Added OAuth routes

### Frontend
- ✅ `src/app/onboarding/page.js` - Onboarding form
- ✅ `src/app/auth/callback/page.js` - OAuth callback handler
- ✅ `src/app/api/auth/[...nextauth]/route.js` - NextAuth config
- ✅ `src/components/auth/Login.jsx` - Updated Google button
- ✅ `.env.local.example` - Added OAuth instructions

---

## Next Steps

1. ✅ Configure Google OAuth credentials
2. ✅ Update `.env.local` with credentials
3. ✅ Test new user registration flow
4. ✅ Test existing user login flow
5. ✅ Verify role-based routing
6. ✅ Deploy to production

**Your Google OAuth authentication is now ready! 🎉**
