# 🔧 Static Authentication for UI Development

## Overview

This guide explains how to work on the TimePulse UI **without needing the backend server**. Perfect for UI developers who want to work independently!

---

## 🎯 Quick Start

### Static Admin Credentials

Use these credentials to login without backend connection:

```
Email:    shunmugavel@selsoftinc.com
Password: test123#
```

### How to Login

1. Start the Next.js app:
   ```bash
   npm run dev
   ```

2. Go to: https://goggly-casteless-torri.ngrok-free.dev/login

3. Enter the static credentials above

4. Click "Sign In"

5. ✅ You'll be logged in and redirected to `/selsoft/dashboard`

---

## 📦 What's Included

### Static User Data

When logged in with static credentials, you get:

```javascript
{
  id: 'static-admin-001',
  email: 'shunmugavel@selsoftinc.com',
  firstName: 'Shunmugavel',
  lastName: 'Admin',
  name: 'Shunmugavel Admin',
  role: 'admin',
  tenantId: 'static-tenant-001',
  employeeId: 'EMP001'
}
```

### Static Tenant Data

```javascript
{
  id: 'static-tenant-001',
  tenantName: 'Selsoft Inc',
  subdomain: 'selsoft',
  status: 'active',
  role: 'admin'
}
```

### Mock Data Available

The system includes mock data for:
- ✅ **Employees** (3 sample employees)
- ✅ **Projects** (2 sample projects)
- ✅ **Timesheets** (1 sample timesheet)
- ✅ **Notifications** (1 welcome notification)

---

## 🛠️ For Developers

### Using Static API Service

Import and use the static API service in your components:

```javascript
import { apiRequest, isStaticMode } from '@/services/staticApiService';

// Check if in static mode
if (isStaticMode()) {
  console.log('Working in UI development mode');
}

// Make API requests (automatically uses mock data in static mode)
const employees = await apiRequest('GET', '/api/employees');
const newProject = await apiRequest('POST', '/api/projects', projectData);
```

### Available API Methods

```javascript
// GET requests
await apiRequest('GET', '/api/employees');
await apiRequest('GET', '/api/projects');
await apiRequest('GET', '/api/timesheets');
await apiRequest('GET', '/api/notifications');
await apiRequest('GET', '/api/dashboard');

// POST requests
await apiRequest('POST', '/api/timesheets', timesheetData);
await apiRequest('POST', '/api/projects', projectData);

// PUT requests
await apiRequest('PUT', '/api/employees/EMP001', updateData);

// DELETE requests
await apiRequest('DELETE', '/api/projects/PRJ001');
```

### Adding More Mock Data

Edit `src/utils/staticAuth.js` to add more mock data:

```javascript
export const STATIC_MOCK_DATA = {
  employees: [
    // Add more employees here
  ],
  projects: [
    // Add more projects here
  ],
  // Add new data types
  clients: [
    {
      id: 'CLI001',
      name: 'Acme Corp',
      status: 'active'
    }
  ]
};
```

### Static Mode Banner

A banner appears at the top when in static mode:

```
🔧 UI Development Mode
Using static data - Backend server not connected
```

To show this banner in your layout:

```javascript
import StaticModeBanner from '@/components/common/StaticModeBanner';

export default function Layout({ children }) {
  return (
    <>
      <StaticModeBanner />
      {children}
    </>
  );
}
```

---

## 🔄 Switching Modes

### Enable Static Mode

Static mode is automatically enabled when you login with static credentials.

Or manually enable it:

```javascript
import { enableStaticMode } from '@/utils/staticAuth';

enableStaticMode();
```

### Disable Static Mode

To switch back to real backend:

```javascript
import { disableStaticMode } from '@/utils/staticAuth';

disableStaticMode();
// Then logout and login with real credentials
```

### Check Current Mode

```javascript
import { isStaticMode } from '@/utils/staticAuth';

if (isStaticMode()) {
  console.log('Using static data');
} else {
  console.log('Connected to real backend');
}
```

---

## 📝 Files Created

### Core Files

1. **`src/utils/staticAuth.js`**
   - Static credentials
   - Mock data
   - Authentication helpers

2. **`src/services/staticApiService.js`**
   - Mock API responses
   - Request handlers
   - Automatic routing

3. **`src/components/common/StaticModeBanner.jsx`**
   - Visual indicator
   - Shows when in static mode

### Modified Files

1. **`src/components/auth/Login.jsx`**
   - Added static credential check
   - Bypasses backend when using static login

---

## ✨ Features

### ✅ Works Offline
- No backend server needed
- All data is mocked locally
- Realistic API delays simulated

### ✅ Full UI Testing
- Test all components
- Test all pages
- Test all interactions

### ✅ Easy Development
- No backend setup required
- No database needed
- No API configuration

### ✅ Realistic Experience
- Simulated network delays
- Proper success/error responses
- Consistent data structure

---

## 🎨 UI Development Workflow

### Step 1: Start Development

```bash
cd nextjs-app
npm run dev
```

### Step 2: Login

- Go to https://goggly-casteless-torri.ngrok-free.dev/login
- Email: `shunmugavel@selsoftinc.com`
- Password: `test123#`

### Step 3: Develop

- Work on any UI component
- All API calls use mock data
- No backend errors

### Step 4: Test

- Test forms, buttons, navigation
- Test data display
- Test user interactions

---

## 🚀 Example Usage

### Component with Static API

```javascript
'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/services/staticApiService';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const response = await apiRequest('GET', '/api/employees');
      if (response.success) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Employees</h2>
      {employees.map(emp => (
        <div key={emp.id}>
          {emp.name} - {emp.department}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔍 Debugging

### Check Static Mode Status

Open browser console and run:

```javascript
localStorage.getItem('staticMode')
// Returns: 'true' if in static mode
```

### View Stored Data

```javascript
// View user data
JSON.parse(localStorage.getItem('user'))

// View tenant data
JSON.parse(localStorage.getItem('currentTenant'))

// View token
localStorage.getItem('token')
```

### Console Logs

Static API calls are logged with 📦 emoji:

```
📦 Static API: GET /api/employees
📦 Static API: POST /api/timesheets
```

Real API calls are logged with 🌐 emoji:

```
🌐 Real API: GET /api/employees
```

---

## ⚠️ Important Notes

### For UI Developers

1. ✅ **Use static credentials** for UI development
2. ✅ **All data is mocked** - changes won't persist
3. ✅ **No backend needed** - work independently
4. ✅ **Banner shows** when in static mode

### For Backend Integration

1. ⚠️ **Static mode is for UI only** - not for production
2. ⚠️ **Real credentials** will use real backend
3. ⚠️ **Disable static mode** before backend testing
4. ⚠️ **Mock data** is reset on page refresh

---

## 🎯 Benefits

### For UI Developers

- ✅ Work without backend team
- ✅ No server setup required
- ✅ Faster development cycle
- ✅ Test UI independently

### For Team

- ✅ Parallel development
- ✅ Reduced dependencies
- ✅ Faster iterations
- ✅ Better separation of concerns

---

## 📚 Additional Resources

### Files to Reference

- `src/utils/staticAuth.js` - Add more mock data here
- `src/services/staticApiService.js` - Add more API endpoints here
- `src/components/auth/Login.jsx` - See authentication flow

### Need Help?

1. Check console logs for 📦 static API calls
2. Verify `localStorage.getItem('staticMode')` is 'true'
3. Check `STATIC_MOCK_DATA` in `staticAuth.js`
4. Look for StaticModeBanner at top of page

---

## ✅ Quick Checklist

- [ ] Started dev server: `npm run dev`
- [ ] Opened https://goggly-casteless-torri.ngrok-free.dev/login
- [ ] Used email: `shunmugavel@selsoftinc.com`
- [ ] Used password: `test123#`
- [ ] Logged in successfully
- [ ] See "UI Development Mode" banner
- [ ] Can access all pages
- [ ] All API calls work with mock data

---

**🎉 You're ready to develop the UI without any backend dependencies!**

Last Updated: December 5, 2025
