# 🔄 COMPLETE REVERSION PLAN - ALL MODULES TO AXIOS

## 📋 COMPONENTS TO REVERT

All Next.js components need to be reverted to use **axios directly** (like the original React app).

### **Pattern to Follow:**

**REMOVE:**
```javascript
import { someService } from '@/services';
const data = await someService.method(params);
```

**REPLACE WITH:**
```javascript
import axios from 'axios';
import { API_BASE } from '@/config/api';
const response = await axios.get(`${API_BASE}/api/endpoint`, { params });
const data = response.data;
```

---

## 🎯 MODULES TO REVERT

### **1. Invoice Module (5 components)**
- Invoice.jsx
- InvoiceView.jsx
- InvoiceDashboard.jsx
- InvoiceList.jsx (if exists)
- InvoiceCreation.jsx (if exists)

### **2. Employee Module (5 components)**
- EmployeeList.jsx
- EmployeeDetail.jsx
- EmployeeEdit.jsx
- EmployeeForm.jsx
- EmployeeSettings.jsx

### **3. Timesheet Module (5 components)**
- ✅ TimesheetSummary.jsx (DONE)
- TimesheetSubmit.jsx
- TimesheetApproval.jsx
- TimesheetHistory.jsx
- EmployeeTimesheet.jsx

### **4. Client Module (4 components)**
- ClientsList.jsx
- ClientDetail.jsx
- ClientForm.jsx
- ClientEdit.jsx

### **5. Vendor Module (4 components)**
- VendorList.jsx
- VendorDetail.jsx
- VendorForm.jsx
- VendorEdit.jsx

### **6. Leave Module (2 components)**
- LeaveManagement.jsx
- LeaveApprovals.jsx

### **7. Settings Module (5 components)**
- ProfileSettings.jsx
- CompanyInformation.jsx
- BillingSettings.jsx
- NotificationSettings.jsx
- UserManagement.jsx

### **8. Auth Module (4 components)**
- Login.jsx
- ChangePassword.jsx
- ForgotPassword.jsx
- ResetPassword.jsx

### **9. Dashboard Module (1 component)**
- ModernDashboard.jsx

---

## 🔧 IMPLEMENTATION PRIORITY

**HIGH PRIORITY (Fix First):**
1. Invoice Module - Critical for business
2. Employee Module - Core functionality
3. Timesheet Module - Already partially done
4. Dashboard - Main entry point

**MEDIUM PRIORITY:**
5. Client Module
6. Vendor Module
7. Leave Module

**LOW PRIORITY:**
8. Settings Module
9. Auth Module (if working, leave for now)

---

## ✅ VERIFICATION CHECKLIST

After reverting each component:
- [ ] No service imports remain
- [ ] axios and API_BASE are imported
- [ ] All API calls use axios.get/post/put/delete
- [ ] Response data is accessed via response.data
- [ ] No compilation errors
- [ ] Component loads without errors
- [ ] Data displays correctly

---

## 🚀 NEXT STEPS

1. Revert Invoice components (highest priority)
2. Revert Employee components
3. Revert remaining Timesheet components
4. Revert Dashboard
5. Test all modules
6. Revert remaining modules if needed
