# 🔍 CORRECT API PATTERN - CRITICAL DISCOVERY

## ⚠️ IMPORTANT FINDING

The original React app uses **FETCH**, not axios!

---

## 📋 CORRECT PATTERN FROM ORIGINAL REACT APP

### **Imports:**
```javascript
import { API_BASE } from '../../config/api';
// NO axios import!
// NO service imports!
```

### **API Calls:**
```javascript
// GET request
const response = await fetch(`${API_BASE}/api/endpoint?param=value`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();

// POST request
const response = await fetch(`${API_BASE}/api/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify(dataToSend)
});
const data = await response.json();

// PUT request
const response = await fetch(`${API_BASE}/api/endpoint/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify(dataToUpdate)
});
const data = await response.json();

// DELETE request
const response = await fetch(`${API_BASE}/api/endpoint/${id}`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## 🔄 WHAT NEEDS TO CHANGE

### **Current (WRONG - uses axios):**
```javascript
import axios from 'axios';
import { API_BASE } from '@/config/api';

const response = await axios.get(`${API_BASE}/api/endpoint`, {
  params: { tenantId }
});
const data = response.data;
```

### **Correct (uses fetch):**
```javascript
import { API_BASE } from '@/config/api';

const response = await fetch(`${API_BASE}/api/endpoint?tenantId=${tenantId}`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
```

---

## 📝 KEY DIFFERENCES

1. **NO axios** - Use native `fetch()`
2. **Query params in URL** - Not in params object
3. **Manual headers** - Include Authorization header
4. **Manual JSON parsing** - Call `.json()` on response
5. **Manual error handling** - Check `response.ok`

---

## ✅ EXAMPLES FROM ORIGINAL REACT APP

### **Leave Management:**
```javascript
// Fetch leave balance
const balanceResponse = await fetch(
  `${API_BASE}/api/leave-management/balance?employeeId=${user.id}&tenantId=${user.tenantId}`,
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }
);
const balanceData = await balanceResponse.json();
```

### **Timesheet Summary:**
```javascript
// Fetch pending approval
const response = await fetch(`${API_BASE}/api/timesheets/pending-approval?tenantId=${tenantId}`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
```

### **Invoice:**
```javascript
// Get all invoices
const response = await fetch(`${API_BASE}/api/invoices?tenantId=${tenantId}&startDate=${startDate}&endDate=${endDate}`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
```

---

## 🚨 CRITICAL ACTION REQUIRED

**ALL components must be changed from axios to fetch!**

This is why modules are not working - axios has different behavior than fetch:
- axios auto-parses JSON → fetch requires `.json()`
- axios uses params object → fetch uses query string
- axios auto-includes headers → fetch requires manual headers

---

## 🎯 NEXT STEPS

1. Replace ALL axios imports with API_BASE only
2. Replace ALL axios calls with fetch calls
3. Add manual `.json()` parsing
4. Add manual Authorization headers
5. Convert params objects to query strings

This is the ONLY way to match the original React app exactly!
