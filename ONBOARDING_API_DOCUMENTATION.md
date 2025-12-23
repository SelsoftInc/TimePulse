# TimePulse Onboarding API Documentation

## 🔐 Role-Based User Creation System

**Default Password for All Users:** `test123#`

All users are required to change their password on first login.

---

## 📋 Available Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access | ALL_PERMISSIONS - Complete control over all modules |
| **Manager** | Team oversight | View/Approve timesheets, View employees, View reports |
| **Approver** | Timesheet approval | View/Approve timesheets, View employees, View reports |
| **Employee** | Basic access | View/Create/Edit own timesheets |

---

## 🔧 API Endpoints

### **1. Create Custom Role-Based Users**

**Endpoint:** `POST /api/onboarding/create-role-users`

**Purpose:** Create specific users with custom roles for a tenant.

**Request Body:**
```json
{
  "subdomain": "selsfot",
  "users": [
    {
      "firstName": "John",
      "lastName": "Admin",
      "email": "john.admin@selsfot.com",
      "role": "admin",
      "phone": "555-0001",
      "department": "IT",
      "title": "System Administrator"
    },
    {
      "firstName": "Jane",
      "lastName": "Manager",
      "email": "jane.manager@selsfot.com",
      "role": "manager",
      "phone": "555-0002",
      "department": "Operations",
      "title": "Operations Manager"
    },
    {
      "firstName": "Bob",
      "lastName": "Approver",
      "email": "bob.approver@selsfot.com",
      "role": "approver",
      "phone": "555-0003",
      "department": "HR",
      "title": "Timesheet Approver"
    },
    {
      "firstName": "Alice",
      "lastName": "Smith",
      "email": "alice.smith@selsfot.com",
      "role": "employee",
      "phone": "555-0004",
      "department": "Engineering",
      "title": "Software Developer"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully created 4 users for tenant selsfot",
  "tenant": {
    "id": "tenant-uuid",
    "tenantName": "selsfot",
    "subdomain": "selsfot"
  },
  "users": [
    {
      "id": "user-uuid-1",
      "name": "John Admin",
      "email": "john.admin@selsfot.com",
      "role": "admin",
      "permissions": ["ALL_PERMISSIONS", "VIEW_DASHBOARD", ...]
    },
    {
      "id": "user-uuid-2",
      "name": "Jane Manager",
      "email": "jane.manager@selsfot.com",
      "role": "manager",
      "permissions": ["VIEW_DASHBOARD", "APPROVE_TIMESHEETS", ...]
    }
    // ... more users
  ],
  "employees": [
    {
      "id": "employee-uuid-1",
      "name": "John Admin",
      "role": "admin"
    }
    // ... more employees
  ],
  "defaultPassword": "test123#",
  "passwordNote": "All users must change their password on first login"
}
```

**Field Descriptions:**
- `subdomain` or `tenantId`: **Required** - Tenant identifier
- `users`: **Required** - Array of user objects
  - `firstName`: **Required** - User's first name
  - `lastName`: **Required** - User's last name
  - `email`: Optional - If not provided, will be auto-generated
  - `role`: Optional - Default is "employee" (valid: admin, manager, approver, employee)
  - `phone`: Optional - Contact phone number
  - `department`: Optional - Department name
  - `title`: Optional - Job title

---

### **2. Create Default Users (Quick Setup)**

**Endpoint:** `POST /api/onboarding/create-default-users`

**Purpose:** Quickly create one user of each role for testing/demo purposes.

**Request Body:**
```json
{
  "subdomain": "selsfot",
  "prefix": "Selsoft"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully created 4 default users for tenant selsfot",
  "tenant": {
    "id": "tenant-uuid",
    "tenantName": "selsfot",
    "subdomain": "selsfot"
  },
  "users": [
    {
      "id": "user-uuid-1",
      "name": "Selsoft Admin",
      "email": "admin@selsfot.com",
      "role": "admin",
      "permissions": ["ALL_PERMISSIONS", ...]
    },
    {
      "id": "user-uuid-2",
      "name": "Selsoft Manager",
      "email": "manager@selsfot.com",
      "role": "manager",
      "permissions": ["VIEW_DASHBOARD", ...]
    },
    {
      "id": "user-uuid-3",
      "name": "Selsoft Approver",
      "email": "approver@selsfot.com",
      "role": "approver",
      "permissions": ["VIEW_TIMESHEETS", ...]
    },
    {
      "id": "user-uuid-4",
      "name": "Selsoft Employee",
      "email": "employee@selsfot.com",
      "role": "employee",
      "permissions": ["VIEW_TIMESHEETS", ...]
    }
  ],
  "employees": [...],
  "defaultPassword": "test123#",
  "loginCredentials": [
    {
      "email": "admin@selsfot.com",
      "password": "test123#",
      "role": "admin"
    },
    {
      "email": "manager@selsfot.com",
      "password": "test123#",
      "role": "manager"
    },
    {
      "email": "approver@selsfot.com",
      "password": "test123#",
      "role": "approver"
    },
    {
      "email": "employee@selsfot.com",
      "password": "test123#",
      "role": "employee"
    }
  ],
  "passwordNote": "All users must change their password on first login"
}
```

**Field Descriptions:**
- `subdomain` or `tenantId`: **Required** - Tenant identifier
- `prefix`: Optional - Name prefix for users (default: "Demo")

**Default Users Created:**
1. **{Prefix} Admin** - admin@{subdomain}.com - Administrator
2. **{Prefix} Manager** - manager@{subdomain}.com - Operations Manager
3. **{Prefix} Approver** - approver@{subdomain}.com - Timesheet Approver
4. **{Prefix} Employee** - employee@{subdomain}.com - Staff Member

---

## 🔑 Role Permissions Breakdown

### **Admin Permissions:**
```javascript
[
  'ALL_PERMISSIONS',
  'VIEW_DASHBOARD',
  'VIEW_TIMESHEETS',
  'CREATE_TIMESHEETS',
  'EDIT_TIMESHEETS',
  'DELETE_TIMESHEETS',
  'APPROVE_TIMESHEETS',
  'VIEW_EMPLOYEES',
  'CREATE_EMPLOYEE',
  'EDIT_EMPLOYEE',
  'DELETE_EMPLOYEE',
  'VIEW_CLIENTS',
  'CREATE_CLIENT',
  'EDIT_CLIENT',
  'DELETE_CLIENT',
  'VIEW_INVOICES',
  'CREATE_INVOICE',
  'EDIT_INVOICE',
  'DELETE_INVOICE',
  'VIEW_REPORTS',
  'MANAGE_SETTINGS',
  'MANAGE_USERS'
]
```

### **Manager Permissions:**
```javascript
[
  'VIEW_DASHBOARD',
  'VIEW_TIMESHEETS',
  'APPROVE_TIMESHEETS',
  'VIEW_EMPLOYEES',
  'EDIT_EMPLOYEE',
  'VIEW_CLIENTS',
  'VIEW_INVOICES',
  'VIEW_REPORTS'
]
```

### **Approver Permissions:**
```javascript
[
  'VIEW_DASHBOARD',
  'VIEW_TIMESHEETS',
  'APPROVE_TIMESHEETS',
  'VIEW_EMPLOYEES',
  'VIEW_REPORTS'
]
```

### **Employee Permissions:**
```javascript
[
  'VIEW_TIMESHEETS',
  'CREATE_TIMESHEETS',
  'EDIT_TIMESHEETS'
]
```

---

## 📝 Usage Examples

### **Example 1: Create Selsoft Tenant Users**

**cURL:**
```bash
curl -X POST http://44.222.217.57:5001/api/onboarding/create-role-users \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "selsfot",
    "users": [
      {
        "firstName": "Pushban",
        "lastName": "Rajaiyan",
        "email": "pushban@selsfot.com",
        "role": "admin",
        "phone": "217-721-3186"
      },
      {
        "firstName": "Uma",
        "lastName": "Sivalingam",
        "email": "uma@selsfot.com",
        "role": "manager",
        "phone": "972-302-8849"
      },
      {
        "firstName": "Lalitah",
        "lastName": "Prabhu",
        "email": "lalitah@selsfot.com",
        "role": "approver",
        "phone": "469-328-6751"
      },
      {
        "firstName": "Selvakumar",
        "lastName": "Murugesan",
        "email": "selvakumar@selsfot.com",
        "role": "employee",
        "phone": "470-208-9651"
      }
    ]
  }'
```

**JavaScript (Fetch):**
```javascript
const response = await fetch('http://44.222.217.57:5001/api/onboarding/create-role-users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subdomain: 'selsfot',
    users: [
      {
        firstName: 'Pushban',
        lastName: 'Rajaiyan',
        email: 'pushban@selsfot.com',
        role: 'admin',
        phone: '217-721-3186'
      }
      // ... more users
    ]
  })
});

const result = await response.json();
console.log('Created users:', result.users);
console.log('Default password:', result.defaultPassword);
```

---

### **Example 2: Quick Setup with Default Users**

**cURL:**
```bash
curl -X POST http://44.222.217.57:5001/api/onboarding/create-default-users \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "selsfot",
    "prefix": "Selsoft"
  }'
```

**JavaScript (Fetch):**
```javascript
const response = await fetch('http://44.222.217.57:5001/api/onboarding/create-default-users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subdomain: 'selsfot',
    prefix: 'Selsoft'
  })
});

const result = await response.json();
console.log('Login credentials:', result.loginCredentials);
```

---

## ⚠️ Error Responses

### **400 Bad Request:**
```json
{
  "success": false,
  "error": "Either tenantId or subdomain is required"
}
```

### **404 Not Found:**
```json
{
  "success": false,
  "error": "Tenant not found"
}
```

### **409 Conflict:**
```json
{
  "success": false,
  "error": "User with email john@example.com already exists for this tenant"
}
```

### **500 Server Error:**
```json
{
  "success": false,
  "error": "Failed to create users",
  "details": "Database connection error"
}
```

---

## 🧪 Testing Guide

### **Step 1: Create Default Users**
```bash
curl -X POST http://44.222.217.57:5001/api/onboarding/create-default-users \
  -H "Content-Type: application/json" \
  -d '{"subdomain": "selsfot", "prefix": "Test"}'
```

### **Step 2: Test Login for Each Role**

**Admin Login:**
- Email: `admin@selsfot.com`
- Password: `test123#`

**Manager Login:**
- Email: `manager@selsfot.com`
- Password: `test123#`

**Approver Login:**
- Email: `approver@selsfot.com`
- Password: `test123#`

**Employee Login:**
- Email: `employee@selsfot.com`
- Password: `test123#`

### **Step 3: Verify Password Change Prompt**
All users should be prompted to change their password on first login.

### **Step 4: Verify Permissions**
- Admin: Should see all modules and settings
- Manager: Should see timesheets, employees, and reports
- Approver: Should see timesheet approval screen
- Employee: Should only see their own timesheets

---

## 🔄 Migration from Existing Data

If you have existing users from the Excel onboarding, you can:

1. **Update existing users with roles:**
```sql
-- Update specific user to admin
UPDATE users 
SET role = 'admin', 
    permissions = ARRAY['ALL_PERMISSIONS', 'VIEW_DASHBOARD', ...] 
WHERE email = 'pushban@selsfot.com';

-- Update to manager
UPDATE users 
SET role = 'manager', 
    permissions = ARRAY['VIEW_DASHBOARD', 'APPROVE_TIMESHEETS', ...]
WHERE email = 'uma@selsfot.com';
```

2. **Or create new role-based users:**
Use the `/create-role-users` endpoint to create proper role-based accounts.

---

## 🚀 Quick Start for Selsoft Tenant

```bash
# Create default users for quick testing
curl -X POST http://44.222.217.57:5001/api/onboarding/create-default-users \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "selsfot",
    "prefix": "Selsoft"
  }'

# Result: Creates 4 users
# - admin@selsfot.com (Admin)
# - manager@selsfot.com (Manager)
# - approver@selsfot.com (Approver)
# - employee@selsfot.com (Employee)
#
# All with password: test123#
```

---

## 📊 Summary

- **Default Password:** `test123#`
- **Password Change:** Required on first login
- **Roles:** Admin, Manager, Approver, Employee
- **Two Endpoints:**
  1. `/create-role-users` - Custom user creation
  2. `/create-default-users` - Quick setup with one of each role
- **Auto-creates:** Both User and Employee records
- **Duplicate Check:** Prevents duplicate emails per tenant

---

**Generated:** September 30, 2025  
**Version:** 1.0  
**Backend Port:** 5001
