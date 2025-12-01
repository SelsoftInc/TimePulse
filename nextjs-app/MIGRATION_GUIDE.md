# TimePulse Next.js Migration Guide

## 🎯 Overview

This guide will help you complete the migration from React (Create React App) to Next.js 14 with App Router.

## ✅ What's Already Done

### 1. Project Structure
- ✅ Next.js 14 project initialized
- ✅ App Router structure created
- ✅ Configuration files (next.config.js, jsconfig.json)
- ✅ Middleware for authentication
- ✅ Environment variables setup

### 2. Context Providers
- ✅ AuthContext (with cookie support for SSR)
- ✅ ThemeContext (with SSR safety)
- ✅ ToastContext
- ✅ WebSocketContext

### 3. Utilities & Services
- ✅ All utility files copied
- ✅ All service files copied
- ✅ All hooks copied
- ✅ All constants copied

### 4. Styles
- ✅ All CSS files copied
- ✅ Theme system integrated
- ✅ Responsive styles
- ✅ Typography and icon preservation

### 5. Basic Pages
- ✅ Login page
- ✅ Register page
- ✅ Forgot password page
- ✅ Workspaces page
- ✅ Dashboard layout structure

## 📋 Next Steps

### Step 1: Copy All Components

Run this command to copy all components:

```powershell
xcopy /E /I /Y "d:\selsoft\WebApp\TimePulse\frontend\src\components" "d:\selsoft\WebApp\TimePulse\nextjs-app\src\components"
```

### Step 2: Update Component Imports

All components need to be updated to use Next.js patterns. Here's what needs to change:

#### A. Add 'use client' Directive

Any component that uses:
- `useState`, `useEffect`, `useContext`
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)

Must have `'use client';` at the top:

```javascript
'use client';

import { useState } from 'react';
// ... rest of imports
```

#### B. Update Import Paths

Change relative imports to use `@/` alias:

```javascript
// OLD
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from '../dashboard/Dashboard';

// NEW
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/dashboard/Dashboard';
```

#### C. Update Router Usage

Replace `react-router-dom` with Next.js router:

```javascript
// OLD
import { useNavigate, useParams, Link } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');

// NEW
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const router = useRouter();
router.push('/dashboard');
```

#### D. Update API Calls

API calls remain the same, but ensure the base URL uses environment variables:

```javascript
// In axios or fetch calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
```

### Step 3: Create Remaining App Router Pages

For each route in the old React app, create a corresponding page in Next.js:

#### Example: Timesheets

Create: `src/app/[subdomain]/timesheets/page.js`

```javascript
'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import TimesheetSummary from '@/components/timesheets/TimesheetSummary';
import { PERMISSIONS } from '@/utils/roles';

export default function TimesheetsPage() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_TIMESHEET}>
      <TimesheetSummary />
    </ProtectedRoute>
  );
}
```

#### Routes to Create:

1. **Timesheets**
   - `/[subdomain]/timesheets/page.js`
   - `/[subdomain]/timesheets/submit/page.js`
   - `/[subdomain]/timesheets/approval/page.js`
   - `/[subdomain]/timesheets/history/page.js`

2. **Clients**
   - `/[subdomain]/clients/page.js`
   - `/[subdomain]/clients/new/page.js`
   - `/[subdomain]/clients/[clientId]/page.js`
   - `/[subdomain]/clients/edit/[clientId]/page.js`

3. **Employees**
   - `/[subdomain]/employees/page.js`
   - `/[subdomain]/employees/new/page.js`
   - `/[subdomain]/employees/[id]/page.js`
   - `/[subdomain]/employees/[id]/edit/page.js`

4. **Invoices**
   - `/[subdomain]/invoices/page.js`
   - `/[subdomain]/invoices/new/page.js`
   - `/[subdomain]/invoices/dashboard/page.js`

5. **Reports**
   - `/[subdomain]/reports/page.js`

6. **Settings**
   - `/[subdomain]/settings/page.js`
   - `/[subdomain]/settings/invoices/page.js`

7. **Leave Management**
   - `/[subdomain]/leave/page.js`
   - `/[subdomain]/leave-management/page.js`

8. **Vendors**
   - `/[subdomain]/vendors/page.js`
   - `/[subdomain]/vendors/new/page.js`
   - `/[subdomain]/vendors/[id]/page.js`

### Step 4: Update Component Files

#### Automated Find & Replace

Use these find/replace patterns in VS Code:

1. **Add 'use client' to components with hooks:**
   - Find: `^import React`
   - Replace: `'use client';\n\nimport React`

2. **Update relative imports:**
   - Find: `from ['"]\.\.\/\.\.\/contexts\/`
   - Replace: `from '@/contexts/`
   
   - Find: `from ['"]\.\.\/\.\.\/utils\/`
   - Replace: `from '@/utils/`
   
   - Find: `from ['"]\.\.\/\.\.\/services\/`
   - Replace: `from '@/services/`

3. **Update React Router imports:**
   - Find: `import.*from ['"]react-router-dom['"]`
   - Replace manually with Next.js equivalents

4. **Update navigation:**
   - Find: `useNavigate\(\)`
   - Replace: `useRouter()`
   
   - Find: `navigate\(`
   - Replace: `router.push(`

### Step 5: Install Dependencies

```powershell
cd nextjs-app
npm install
```

### Step 6: Run Development Server

```powershell
npm run dev
```

The app will be available at `http://localhost:3000`

## 🔧 Common Issues & Solutions

### Issue 1: "window is not defined"

**Problem:** Component tries to access `window` or `localStorage` during SSR.

**Solution:** Wrap in `typeof window !== 'undefined'` check:

```javascript
if (typeof window !== 'undefined') {
  localStorage.setItem('key', 'value');
}
```

### Issue 2: "useRouter must be used within a client component"

**Problem:** Using Next.js router in a server component.

**Solution:** Add `'use client';` at the top of the file.

### Issue 3: CSS not loading

**Problem:** CSS imports not working.

**Solution:** Ensure CSS is imported in the component or layout file:

```javascript
import '@/styles/component.css';
```

### Issue 4: API calls failing

**Problem:** API proxy not working.

**Solution:** Check `next.config.js` rewrites and ensure backend is running on port 5001.

## 📦 Package Differences

### Removed (React-specific)
- `react-router-dom` → Use Next.js App Router
- `react-scripts` → Use Next.js build system

### Added (Next.js-specific)
- `next` → Next.js framework
- `js-cookie` → Cookie management for SSR

### Kept (Same)
- All other dependencies remain the same

## 🚀 Deployment

### Development
```powershell
npm run dev
```

### Production Build
```powershell
npm run build
npm start
```

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
NEXT_PUBLIC_APP_NAME=TimePulse
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📝 Testing Checklist

- [ ] Login/Logout works
- [ ] Authentication persists across page refreshes
- [ ] Protected routes redirect to login
- [ ] Theme switching works
- [ ] WebSocket connections establish
- [ ] Toast notifications appear
- [ ] All API calls work
- [ ] File uploads work
- [ ] PDF generation works
- [ ] Reports generate correctly
- [ ] Responsive design works on mobile

## 🎨 Key Differences from React App

### 1. Routing
- **React:** `<Route path="/dashboard" element={<Dashboard />} />`
- **Next.js:** File-based routing in `app/` directory

### 2. Navigation
- **React:** `navigate('/dashboard')`
- **Next.js:** `router.push('/dashboard')`

### 3. Links
- **React:** `<Link to="/dashboard">Dashboard</Link>`
- **Next.js:** `<Link href="/dashboard">Dashboard</Link>`

### 4. Data Fetching
- **React:** `useEffect` with axios/fetch
- **Next.js:** Can use Server Components, Server Actions, or client-side fetching

### 5. Environment Variables
- **React:** `process.env.REACT_APP_*`
- **Next.js:** `process.env.NEXT_PUBLIC_*`

## 🔄 Backend Integration

The backend remains **completely unchanged**. The Next.js app communicates with the existing Express backend through:

1. **API Proxy:** Configured in `next.config.js`
2. **Direct API Calls:** Using axios with `NEXT_PUBLIC_API_URL`
3. **WebSocket:** Using socket.io-client with `NEXT_PUBLIC_SOCKET_URL`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check the terminal for build errors
3. Verify all imports use `@/` alias
4. Ensure `'use client'` is added where needed
5. Check that backend server is running on port 5001

## ✨ Benefits of Next.js Migration

1. **Better Performance:** Automatic code splitting and optimization
2. **SEO Friendly:** Server-side rendering support
3. **Modern Routing:** File-based routing system
4. **Built-in Optimization:** Image optimization, font optimization
5. **Better Developer Experience:** Fast refresh, better error messages
6. **Production Ready:** Optimized builds out of the box
7. **Future Proof:** Active development and community support

---

**Status:** Core structure complete. Component migration in progress.

**Next Action:** Copy all components and update imports as described above.
