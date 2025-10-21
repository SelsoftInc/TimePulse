# TimePulse Login Credentials - Selsoft Tenant

## 📋 Overview
**Tenant Name:** selsfot  
**Subdomain:** (to be configured)  
**Onboarded Date:** August 7, 2025  
**Source File:** `TimePulse_Client_Onoarding_Document (2).xlsx`  
**Total Users:** 7  
**Total Employees:** 7  

---

## 🔐 Default Password Information

**Default Password for All Users:** `TempPass123!`

⚠️ **Important Notes:**
- All users are required to change their password on first login (`mustChangePassword: true`)
- Email addresses are not populated in the Excel file (empty strings)
- Users will need to use their **first name + last name** combination for login

---

## 👥 Employee Login Credentials

### **1. Pushban Rajaiyan**
- **Name:** Pushban Rajaiyan
- **Email:** (not provided)
- **Role:** Employee
- **Phone:** 217-721-3186
- **Password:** `TempPass123!`
- **Permissions:**
  - VIEW_TIMESHEETS
  - CREATE_TIMESHEETS
  - EDIT_TIMESHEETS
- **Status:** Active
- **User ID:** `d1629f91-a8c5-4cfe-90aa-ff0d97556154`
- **Employee ID:** `d8d65a76-3152-48bc-9cbd-c318760e8754`

---

### **2. Uma Sivalingam**
- **Name:** Uma Sivalingam
- **Email:** (not provided)
- **Phone:** 972-302-8849
- **Password:** `TempPass123!`
- **Role:** Employee
- **Permissions:**
  - VIEW_TIMESHEETS
  - CREATE_TIMESHEETS
  - EDIT_TIMESHEETS
- **Status:** Active
- **User ID:** `40a35297-8a05-4502-97a2-48d8d24483d5` (first instance)
- **Employee ID:** `1443a0a7-6913-41f2-96bc-c1059db8b294`

**Note:** Uma Sivalingam appears twice in the users list (duplicate entry):
- User ID 1: `40a35297-8a05-4502-97a2-48d8d24483d5`
- User ID 2: `bfe6eaee-b5cc-4a0b-9a70-d22f11726b01`

---

### **3. Lalitah Prabhu**
- **Name:** Lalitah Prabhu
- **Email:** (not provided)
- **Phone:** 469-328-6751
- **Password:** `TempPass123!`
- **Role:** Employee
- **Permissions:**
  - VIEW_TIMESHEETS
  - CREATE_TIMESHEETS
  - EDIT_TIMESHEETS
- **Status:** Active
- **User ID:** `c0b2d75d-e618-41ea-ad2f-dbab2e648b33`
- **Employee ID:** `e4002270-be57-4654-b151-9b3ec608e80e`

---

### **4. "First Name Last Name" (Placeholder Entries - 3 instances)**

These appear to be placeholder/template entries from the Excel file that were not filled in:

**Instance 1:**
- **User ID:** `93732513-17ec-4bd6-9b45-7f270b0d977a`
- **Password:** `TempPass123!`

**Instance 2:**
- **User ID:** `140a2a4c-3c6e-4579-80f3-a5615383d38b`
- **Password:** `TempPass123!`

**Instance 3:**
- **User ID:** `2b8416ba-1f7a-4f7e-b5c2-1c3c11719465`
- **Password:** `TempPass123!`

⚠️ **Action Required:** These entries should be updated or removed as they are not actual employees.

---

## 👤 Additional Employees (No User Accounts Yet)

These employees exist in the system but may not have user login accounts created:

### **1. Selvakumar Murugesan**
- **Phone:** 470-208-9651
- **Employee ID:** `889f7c87-d502-43d4-8b1d-d0658aef0e04`
- **Status:** Active
- ⚠️ **Note:** No corresponding user account found

### **2. Suresh Palakad Krishnan**
- **Phone:** 214-592-3937
- **Employee ID:** `7e4967f0-f631-4c45-8c52-0102caba9911`
- **Status:** Active
- ⚠️ **Note:** No corresponding user account found

### **3. Panneerselvam Arulanandam**
- **Phone:** 469-631-1957
- **Employee ID:** `35e9fa45-d9ee-44e0-ba47-1ca2d7235b00`
- **Status:** Active
- ⚠️ **Note:** No corresponding user account found

### **4. Empty Employee Record**
- **Employee ID:** `3ec9e47b-f5bb-4b14-b870-aa01f40b31e4`
- **No name or contact information**
- ⚠️ **Action Required:** This entry should be removed or updated

---

## 👑 Admin Login Credentials

**⚠️ NO ADMIN USERS FOUND**

Based on the onboarding data, all users have the role **"employee"**. There are no users with:
- Role: "admin"
- Role: "manager"  
- Role: "supervisor"

**Action Required:** You need to manually create an admin user or update one of the existing users to have admin privileges.

---

## 🔧 How to Create Admin User

### **Option 1: Update Existing User via Database**
```sql
-- Update Pushban Rajaiyan to Admin
UPDATE users 
SET role = 'admin', 
    permissions = ARRAY['ALL_PERMISSIONS']
WHERE id = 'd1629f91-a8c5-4cfe-90aa-ff0d97556154';
```

### **Option 2: Use the Registration/Setup Flow**
1. Navigate to the admin setup page
2. Create a new admin user with full permissions
3. Set a strong password

---

## 📊 Summary Statistics

| Category | Count |
|----------|-------|
| Total Users | 7 |
| Active Employees | 7 |
| Employee-role Users | 7 |
| Admin-role Users | 0 |
| Placeholder Entries | 3 |
| Duplicate Entries | 1 (Uma Sivalingam) |
| Employees without Login | 3 |

---

## 🚨 Issues to Address

1. **No Admin User**: All users have employee role - need to create/assign admin
2. **Missing Emails**: No email addresses provided for any user
3. **Placeholder Users**: 3 "First Name Last Name" placeholder entries need to be updated or removed
4. **Duplicate Entry**: Uma Sivalingam appears twice in users table
5. **Orphaned Employees**: 3 employees (Selvakumar, Suresh, Panneerselvam) have no user login accounts
6. **Empty Employee Record**: One employee record has no information
7. **Subdomain Not Set**: Tenant subdomain needs to be configured

---

## 🔐 Login Instructions

### **For Employees:**
1. Navigate to the login page
2. Enter your name (as it appears in the system)
3. Enter password: `TempPass123!`
4. You will be prompted to change your password on first login

### **Example Login Flow:**
```
Username: Pushban Rajaiyan (or however names are configured)
Password: TempPass123!
→ Forced password change screen
→ Set new password
→ Access granted with employee permissions
```

---

## 📁 Data File Locations

- **Excel Source:** `Onboard/selsfot/TimePulse_Client_Onoarding_Document (2).xlsx`
- **Processed Users:** `server/data/tenants/selsfot/users.json`
- **Processed Employees:** `server/data/tenants/selsfot/employees.json`
- **Onboarding Summary:** `server/data/tenants/selsfot/onboarding-summary.json`
- **Client Data:** `server/data/tenants/selsfot/client.json`

---

## 🛠️ Recommended Actions

1. ✅ **Create Admin User** - Highest priority
2. ✅ **Add Email Addresses** - For all users
3. ✅ **Remove/Update Placeholders** - Clean up "First Name Last Name" entries
4. ✅ **Resolve Duplicates** - Remove duplicate Uma Sivalingam entry
5. ✅ **Create User Accounts** - For Selvakumar, Suresh, and Panneerselvam
6. ✅ **Remove Empty Records** - Delete employee with no information
7. ✅ **Configure Subdomain** - Set proper subdomain for tenant
8. ✅ **Test Login Flow** - Verify all users can login and change passwords

---

**Generated:** September 30, 2025  
**Document Version:** 1.0  
**Last Updated:** 2025-09-30
