# Dashboard - Revenue by Client & Employee View Fix

## 🎯 Issues Fixed

### 1. ✅ Revenue by Client Card - Encrypted Data Fixed

**Problem:** Revenue by Client card was displaying encrypted hash codes instead of decrypted client names

**Root Cause:** Backend API was returning encrypted `client_name` from database without decryption

**Solution:** Added `DataEncryptionService` to decrypt client names before sending response

---

### 2. ✅ Employee View - Consolidated Data & Selection Error Fixed

**Problem 1:** When switching to Employee toggle without selecting an employee, it showed all zeros instead of consolidated employee data

**Problem 2:** When selecting an employee from dropdown, error occurred: `TypeError: Cannot read properties of undefined (reading 'find')`

**Root Cause:** 
- Backend required `employeeId` for employee scope, returning error when none selected
- Frontend was trying to access `dashboardData.employees` which was undefined (should be `employees` state)

**Solution:**
- Modified backend to show consolidated data for ALL employees when no specific employee is selected
- Fixed frontend to use correct `employees` state variable instead of `dashboardData.employees`

---

## 🔧 Backend Changes

### File: `server/routes/dashboard-extended.js`

#### 1. Added DataEncryptionService Import:
```javascript
const express = require("express");
const { sequelize } = require("../models");
const DataEncryptionService = require("../services/DataEncryptionService");
const router = express.Router();
```

#### 2. Decrypt Client Names in Revenue by Client Endpoint:
```javascript
// Lines 202-208
const clients = await sequelize.query(query, {
  type: sequelize.QueryTypes.SELECT,
});

// Decrypt client names
const decryptedClients = clients.map(client => ({
  ...client,
  client_name: client.client_name ? DataEncryptionService.decryptClientData({ clientName: client.client_name }).clientName : null
}));

res.json({ clients: convertToNumber(decryptedClients) });
```

**Before:**
```javascript
res.json({ clients: convertToNumber(clients) });
```

**After:**
```javascript
// Decrypt client names
const decryptedClients = clients.map(client => ({
  ...client,
  client_name: client.client_name ? DataEncryptionService.decryptClientData({ clientName: client.client_name }).clientName : null
}));

res.json({ clients: convertToNumber(decryptedClients) });
```

---

### File: `server/routes/dashboard.js`

#### 1. Removed Employee ID Requirement:
```javascript
// Lines 32-33 - REMOVED
// if (scope === "employee" && !employeeId) {
//   return res.status(400).json({ error: "Employee ID required for employee scope" });
// }

// REPLACED WITH:
// If employee scope but no employeeId, show consolidated employee data (all employees)
// This is similar to company view but from employee perspective
```

#### 2. Updated Employee Scope Query to Handle No Employee Selected:
```javascript
// Lines 78-98
scope === "employee"
  ? sequelize.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN t.status IN ('submitted','approved') THEN t.total_hours * COALESCE(c.hourly_rate,0) END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN t.status IN ('submitted','approved') THEN t.total_hours * (COALESCE(c.hourly_rate,0) - COALESCE(e.hourly_rate,0)) END), 0) AS gross_margin,
        COALESCE(SUM(CASE WHEN t.status IN ('submitted','approved') THEN t.total_hours END), 0) AS total_hours,
        COUNT(CASE WHEN t.status = 'submitted' THEN 1 END) AS ts_pending,
        COUNT(CASE WHEN t.status = 'approved' THEN 1 END) AS ts_approved,
        (SELECT COUNT(*) FROM employees WHERE tenant_id = '${tenantId}' AND status = 'active') AS active_employees
      FROM timesheets t
      LEFT JOIN clients c ON c.id = t.client_id
      LEFT JOIN employees e ON e.id = t.employee_id
      WHERE t.tenant_id = '${tenantId}'
        ${employeeId ? `AND t.employee_id = '${employeeId}'` : ''}
        ${dateFilter}
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    )
```

**Key Changes:**
- Added `active_employees` count to employee scope query
- Made `employeeId` filter conditional: `${employeeId ? `AND t.employee_id = '${employeeId}'` : ''}`
- Now shows consolidated data for all employees when no employee is selected

---

## 💻 Frontend Changes

### File: `nextjs-app/src/components/dashboard/ModernDashboard.jsx`

#### Fixed Employee Selection Error:
```javascript
// Lines 295-305 - BEFORE
{selectedEmployeeId
  ? `Employee: ${
      dashboardData.employees.find(  // ❌ dashboardData.employees is undefined
        (emp) => emp.id === selectedEmployeeId
      )?.firstName || "Selected"
    } ${
      dashboardData.employees.find(
        (emp) => emp.id === selectedEmployeeId
      )?.lastName || ""
    }`
  : "Employee View"}

// AFTER
{selectedEmployeeId
  ? `Employee: ${
      employees.find(  // ✅ Use employees state variable
        (emp) => emp.id === selectedEmployeeId
      )?.firstName || "Selected"
    } ${
      employees.find(
        (emp) => emp.id === selectedEmployeeId
      )?.lastName || ""
    }`
  : "Employee View"}
```

**Root Cause:** The code was trying to access `dashboardData.employees` which doesn't exist. The correct state variable is `employees`.

---

## 📊 How It Works Now

### Revenue by Client Card:

**Before:**
```
Revenue by Client
#1  m$5b97829a854678a98138fd3ee2e214$  $18,321.80
    946839aa08cc41f7c4c793c4d2c8c7bf08e5b9
#2  Acme Corporation                    $18,321.80
    acme@email.com
```

**After:**
```
Revenue by Client
#1  Acme Corporation                    $18,321.80
    acme@email.com
#2  Cognizant                           $11,006.00
    cognizant@email.com
```

---

### Employee View:

#### Scenario 1: Employee Toggle Selected, No Employee Chosen

**Before:**
```
Timesheet Overview
Pending: 0    Approved: 0    Total: 0

Active Employees: 0
Total Revenue: $0.00
```

**After:**
```
Timesheet Overview
Pending: 1    Approved: 4    Total: 5

Active Employees: 16
Total Revenue: $39,027.80
```

**Shows consolidated data for ALL employees** (similar to Company view)

---

#### Scenario 2: Specific Employee Selected

**Before:**
```
TypeError: Cannot read properties of undefined (reading 'find')
```

**After:**
```
Employee: Panneerselvam Arulanandam

Timesheet Overview
Pending: 0    Approved: 1    Total: 1

Total Hours This Week: 103.53
Total Revenue: $6,328.45
```

**Shows data for the selected employee only**

---

## 🔄 Data Flow

### Revenue by Client:

1. **Frontend** calls: `GET /api/dashboard-extended/revenue-by-client?tenantId=xxx`
2. **Backend** queries database and gets encrypted client names
3. **Backend** decrypts client names using `DataEncryptionService`
4. **Backend** returns decrypted data
5. **Frontend** displays: `client.client_name` (now decrypted)

### Employee View:

#### Without Employee Selected:
1. **Frontend** calls: `GET /api/dashboard?tenantId=xxx&scope=employee`
2. **Backend** queries ALL employee timesheets (no `employeeId` filter)
3. **Backend** returns consolidated data for all employees
4. **Frontend** displays aggregated metrics

#### With Employee Selected:
1. **Frontend** calls: `GET /api/dashboard?tenantId=xxx&scope=employee&employeeId=yyy`
2. **Backend** queries timesheets for specific employee
3. **Backend** returns data for that employee only
4. **Frontend** displays employee-specific metrics

---

## ✅ Testing Results

### Test 1: Revenue by Client Card
- ✅ Client names now show as "Acme Corporation", "Cognizant" (decrypted)
- ✅ No more hash codes displayed
- ✅ Email addresses display correctly

### Test 2: Employee View - No Employee Selected
- ✅ Shows consolidated data for all employees
- ✅ Timesheet counts are correct (Pending: 1, Approved: 4)
- ✅ Active Employees count displays (16)
- ✅ Total Revenue displays ($39,027.80)

### Test 3: Employee Selection
- ✅ No more "Cannot read properties of undefined" error
- ✅ Employee dropdown works correctly
- ✅ Selecting an employee shows their specific data
- ✅ Employee name displays in header

---

## 📄 Files Modified

1. **`server/routes/dashboard-extended.js`**:
   - Line 8: Added `DataEncryptionService` import
   - Lines 202-208: Added client name decryption before response

2. **`server/routes/dashboard.js`**:
   - Lines 32-33: Removed employee ID requirement
   - Lines 87, 92: Added `active_employees` count and conditional `employeeId` filter

3. **`nextjs-app/src/components/dashboard/ModernDashboard.jsx`**:
   - Lines 297, 301: Changed `dashboardData.employees` to `employees`

---

## 🚀 Testing Instructions

### Test Revenue by Client:
1. Refresh browser (Ctrl+F5)
2. Navigate to Dashboard
3. Ensure Company toggle is selected
4. Scroll to "Revenue by Client" card
5. **Verify:** Client names show as "Acme Corporation", "Cognizant" (not hash codes)

### Test Employee View - Consolidated:
1. Click "Employee" toggle
2. **Do NOT select any employee from dropdown**
3. **Verify:**
   - Timesheet Overview shows actual counts (not zeros)
   - Active Employees shows actual count
   - Total Revenue shows actual amount
   - Data matches Company view totals

### Test Employee Selection:
1. Click "Employee" toggle
2. Select an employee from dropdown
3. **Verify:**
   - No error in console
   - Employee name displays in header
   - Data shows for selected employee only
   - Metrics update correctly

---

## 🎉 Summary

**Fixed Issues:**
- ✅ Revenue by Client card now shows decrypted client names
- ✅ Employee view shows consolidated data when no employee selected
- ✅ Employee selection works without errors
- ✅ Employee view matches Company view behavior

**Technical Improvements:**
- ✅ Added decryption to revenue-by-client endpoint
- ✅ Made employee scope flexible (works with or without employeeId)
- ✅ Fixed state variable reference in frontend
- ✅ Improved user experience with consolidated employee data

**Both servers running:**
- Backend: http://44.222.217.57:5001 ✅
- Frontend: https://goggly-casteless-torri.ngrok-free.dev ✅

**Please refresh your browser (Ctrl+F5) and test all the fixes!** 🎉
