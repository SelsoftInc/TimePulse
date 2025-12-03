# 🔧 Next.js Migration Fix Guide

## Quick Fix Summary

### ✅ What We've Fixed
1. **Invoice Module** - Complete hydration fix applied
2. **Created Utility Hooks** - `useClientOnly.js` for safe client-side operations

### 🔄 What Needs Fixing

#### Critical Issues Found:
1. **localStorage Access** - Many components access localStorage without hydration protection
2. **API Calls** - Some API calls happen before component mounts
3. **Dropdown Menus** - Need outside-click handlers
4. **Routing** - Some components may still use React Router

---

## 🛠️ Step-by-Step Fix Process

### Step 1: Add Hydration Protection to All Components

**Pattern to Apply:**

```javascript
'use client';

import { useState, useEffect } from 'react';

const Component = () => {
  // Add isMounted state
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState([]);
  
  // Set mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only fetch after mounted
  useEffect(() => {
    if (isMounted) {
      fetchData();
    }
  }, [isMounted]);
  
  const fetchData = async () => {
    // Safe to access localStorage here
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // ... fetch logic
  };
  
  // Show loading until mounted
  if (!isMounted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    // ... component JSX
  );
};
```

### Step 2: Fix Components by Priority

#### Priority 1: Dashboard Components
- [ ] `ModernDashboard.jsx` - Add hydration fix
- [ ] `EmployeeDashboard.jsx` - Add hydration fix  
- [ ] `Dashboard.jsx` - Already has routing logic, verify

#### Priority 2: Employee Module
- [ ] `EmployeeList.jsx` - Add hydration fix
- [ ] `EmployeeDetail.jsx` - Add hydration fix
- [ ] `EmployeeEdit.jsx` - Add hydration fix
- [ ] `EmployeeForm.jsx` - Add hydration fix
- [ ] `EmployeeSettings.jsx` - Add hydration fix

#### Priority 3: Timesheet Module
- [ ] Check all timesheet components
- [ ] Add hydration fixes
- [ ] Verify calendar functionality

#### Priority 4: Other Modules
- [ ] Clients
- [ ] Vendors
- [ ] Reports
- [ ] Settings
- [ ] Leave
- [ ] Documents
- [ ] Implementation Partners

---

## 📝 Component-Specific Fixes

### ModernDashboard.jsx

**Current Issue:**
```javascript
// Line 55 - Direct localStorage access
const headers = {
  Authorization: `Bearer ${localStorage.getItem("token")}`
};
```

**Fix:**
```javascript
'use client';

import { useState, useEffect } from 'react';

const ModernDashboard = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (isMounted) {
      fetchDashboardData();
      fetchEmployees();
    }
  }, [isMounted]);
  
  const fetchDashboardData = async () => {
    // Now safe to access localStorage
    const token = localStorage.getItem("token");
    // ... rest of fetch logic
  };
  
  if (!isMounted) {
    return <LoadingSpinner />;
  }
  
  // ... rest of component
};
```

### EmployeeDashboard.jsx

**Current Issue:**
```javascript
// Line 375 - Direct localStorage access in fetch
headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`
}
```

**Fix:** Same pattern as ModernDashboard

### EmployeeList.jsx

**Multiple Issues:**
- Line 142: localStorage in POST request
- Line 241: localStorage in GET request
- Line 294: localStorage in GET request
- Line 345: localStorage in GET request
- Line 382: localStorage in PUT request
- Line 430: localStorage in GET request
- Line 470: localStorage in PUT request
- Line 525: localStorage in PUT request
- Line 572: localStorage in DELETE request

**Fix:** Add isMounted check and move all API calls inside useEffect

---

## 🎯 Automated Fix Script

### Option 1: Manual Fix (Recommended for Learning)
Go through each file and apply the pattern above.

### Option 2: Use the Utility Hook

```javascript
import { useClientOnly, useAuthToken, useUserInfo } from '@/hooks/useClientOnly';

const Component = () => {
  const isMounted = useClientOnly();
  const { token } = useAuthToken();
  const { user } = useUserInfo();
  
  useEffect(() => {
    if (isMounted && token && user) {
      fetchData();
    }
  }, [isMounted, token, user]);
  
  if (!isMounted) {
    return <LoadingSpinner />;
  }
  
  // ... component logic
};
```

---

## 🧪 Testing Checklist

### For Each Fixed Component:

1. **Console Check**
   ```bash
   # Open browser console
   # Should see NO warnings about:
   - Hydration mismatch
   - localStorage is not defined
   - window is not defined
   ```

2. **Functionality Check**
   - [ ] Page loads without errors
   - [ ] Data fetches correctly
   - [ ] UI updates after actions
   - [ ] No flickering on refresh

3. **Performance Check**
   - [ ] No excessive re-renders
   - [ ] Loading states show appropriately
   - [ ] Smooth transitions

---

## 📊 Progress Tracking

### Dashboard Module: 0% Complete
- [ ] ModernDashboard.jsx
- [ ] EmployeeDashboard.jsx
- [ ] ChartWidget.jsx

### Employee Module: 0% Complete
- [ ] EmployeeList.jsx
- [ ] EmployeeDetail.jsx
- [ ] EmployeeEdit.jsx
- [ ] EmployeeForm.jsx
- [ ] EmployeeSettings.jsx
- [ ] EmployeeInvite.jsx

### Timesheet Module: 0% Complete
- [ ] TimesheetList.jsx
- [ ] TimesheetForm.jsx
- [ ] TimesheetApproval.jsx
- [ ] TimesheetCalendar.jsx

### Other Modules: 0% Complete
- [ ] Clients
- [ ] Vendors
- [ ] Reports
- [ ] Settings
- [ ] Leave
- [ ] Documents
- [ ] Implementation Partners

---

## 🚀 Quick Start

### To Fix a Component:

1. **Open the component file**
2. **Add isMounted state**
   ```javascript
   const [isMounted, setIsMounted] = useState(false);
   ```

3. **Add mount effect**
   ```javascript
   useEffect(() => {
     setIsMounted(true);
   }, []);
   ```

4. **Move data fetching to effect**
   ```javascript
   useEffect(() => {
     if (isMounted) {
       fetchData();
     }
   }, [isMounted]);
   ```

5. **Add loading check**
   ```javascript
   if (!isMounted) {
     return <LoadingSpinner />;
   }
   ```

6. **Test the component**
   - Refresh page
   - Check console
   - Verify functionality

---

## 💡 Common Patterns

### Pattern 1: Simple Data Fetch
```javascript
const [isMounted, setIsMounted] = useState(false);
const [data, setData] = useState([]);

useEffect(() => {
  setIsMounted(true);
}, []);

useEffect(() => {
  if (isMounted) {
    fetchData();
  }
}, [isMounted]);
```

### Pattern 2: Data Fetch with Dependencies
```javascript
const [isMounted, setIsMounted] = useState(false);
const [data, setData] = useState([]);

useEffect(() => {
  setIsMounted(true);
}, []);

useEffect(() => {
  if (isMounted && someCondition) {
    fetchData();
  }
}, [isMounted, someCondition]);
```

### Pattern 3: Multiple API Calls
```javascript
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

useEffect(() => {
  if (isMounted) {
    Promise.all([
      fetchData1(),
      fetchData2(),
      fetchData3()
    ]);
  }
}, [isMounted]);
```

---

## ⚠️ Important Notes

1. **Always use `'use client'` directive** for components that:
   - Access localStorage
   - Use browser APIs
   - Have interactive features
   - Use hooks like useState, useEffect

2. **Don't access localStorage outside useEffect**
   - ❌ `const token = localStorage.getItem('token');` (at component level)
   - ✅ Inside useEffect after isMounted check

3. **Provide loading states**
   - Users should see something while waiting
   - Use spinners or skeleton screens

4. **Handle errors gracefully**
   - Always wrap API calls in try-catch
   - Show error messages to users

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify `'use client'` directive is present
3. Ensure isMounted check is in place
4. Check that localStorage access is in useEffect
5. Verify API endpoints are correct

---

**Last Updated:** December 3, 2025
**Status:** IN PROGRESS
**Next Action:** Fix ModernDashboard.jsx
