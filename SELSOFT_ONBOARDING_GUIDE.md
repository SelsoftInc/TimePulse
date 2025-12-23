# Selsoft Tenant Onboarding Guide

## 🎯 Overview

This guide will help you create proper role-based user accounts for the Selsoft tenant with the correct permissions.

**Default Password:** `test123#` (All users must change on first login)

---

## 🚀 Quick Start (Recommended)

### **Method 1: Using the Script (Easiest)**

```bash
cd server
node scripts/create-selsoft-users.js default
```

This creates 4 default users:
- **Selsoft Admin** - admin@selsfot.com - Full system access
- **Selsoft Manager** - manager@selsfot.com - Team management
- **Selsoft Approver** - approver@selsfot.com - Timesheet approval
- **Selsoft Employee** - employee@selsfot.com - Basic employee access

---

### **Method 2: Using API (Postman/cURL)**

```bash
curl -X POST http://localhost:5001/api/onboarding/create-default-users \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "selsfot",
    "prefix": "Selsoft"
  }'
```

---

## 👥 Custom User Creation (Recommended for Production)

### **Create Actual Selsoft Team Members**

```bash
cd server
node scripts/create-selsoft-users.js custom
```

This creates 6 users based on your Excel data:

**Admin:**
- Pushban Rajaiyan - pushban.rajaiyan@selsfot.com

**Manager:**
- Uma Sivalingam - uma.sivalingam@selsfot.com

**Approver:**
- Lalitah Prabhu - lalitah.prabhu@selsfot.com

**Employees:**
- Selvakumar Murugesan - selvakumar.murugesan@selsfot.com
- Suresh Palakad Krishnan - suresh.krishnan@selsfot.com
- Panneerselvam Arulanandam - panneerselvam.arulanandam@selsfot.com

All with password: `test123#`

---

## 📋 Role Comparison

| Feature | Admin | Manager | Approver | Employee |
|---------|-------|---------|----------|----------|
| View Dashboard | ✅ | ✅ | ✅ | ❌ |
| Create Timesheets | ✅ | ❌ | ❌ | ✅ |
| Edit Own Timesheets | ✅ | ❌ | ❌ | ✅ |
| Approve Timesheets | ✅ | ✅ | ✅ | ❌ |
| View All Timesheets | ✅ | ✅ | ✅ | ❌ |
| Manage Employees | ✅ | ✅ (Edit only) | ❌ | ❌ |
| Manage Clients | ✅ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| Create Invoices | ✅ | ❌ | ❌ | ❌ |
| Manage Settings | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |

---

## 🔐 Login Credentials

After running the creation script, you'll have these accounts:

### **For Default Users:**

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@selsfot.com | test123# | Full System |
| Manager | manager@selsfot.com | test123# | Team Management |
| Approver | approver@selsfot.com | test123# | Approval Only |
| Employee | employee@selsfot.com | test123# | Basic Access |

### **For Custom Users (If created):**

| Name | Email | Role | Password |
|------|-------|------|----------|
| Pushban Rajaiyan | pushban.rajaiyan@selsfot.com | Admin | test123# |
| Uma Sivalingam | uma.sivalingam@selsfot.com | Manager | test123# |
| Lalitah Prabhu | lalitah.prabhu@selsfot.com | Approver | test123# |
| Selvakumar Murugesan | selvakumar.murugesan@selsfot.com | Employee | test123# |
| Suresh P. Krishnan | suresh.krishnan@selsfot.com | Employee | test123# |
| Panneerselvam A. | panneerselvam.arulanandam@selsfot.com | Employee | test123# |

---

## 🛠️ API Usage

### **Endpoint 1: Create Custom Users**

**URL:** `POST http://localhost:5001/api/onboarding/create-role-users`

**Body:**
```json
{
  "subdomain": "selsfot",
  "users": [
    {
      "firstName": "Pushban",
      "lastName": "Rajaiyan",
      "email": "pushban.rajaiyan@selsfot.com",
      "role": "admin",
      "phone": "217-721-3186"
    }
  ]
}
```

---

### **Endpoint 2: Create Default Users**

**URL:** `POST http://localhost:5001/api/onboarding/create-default-users`

**Body:**
```json
{
  "subdomain": "selsfot",
  "prefix": "Selsoft"
}
```

---

## ✅ Verification Steps

### **1. Start the Backend**
```bash
cd server
npm start
```

### **2. Create Users**
```bash
node scripts/create-selsoft-users.js default
```

### **3. Test Login**

Open `https://goggly-casteless-torri.ngrok-free.dev/selsfot/login`

Try logging in with:
- **Email:** `admin@selsfot.com`
- **Password:** `test123#`

You should:
1. Be prompted to change password
2. After changing, see the full admin dashboard

### **4. Test Each Role**

Test all 4 roles to ensure proper permissions:
- Admin: Should see everything
- Manager: Should see timesheets, employees, reports
- Approver: Should see timesheet approval screen
- Employee: Should only see "My Timesheets"

---

## 🔄 Updating Existing Users

If you already have users from the Excel import that need role updates:

### **Option 1: Via SQL**

```sql
-- Update Pushban to Admin
UPDATE users 
SET role = 'admin',
    permissions = ARRAY[
      'ALL_PERMISSIONS',
      'VIEW_DASHBOARD',
      'MANAGE_SETTINGS',
      'MANAGE_USERS'
    ]
WHERE email = 'pushban.rajaiyan@selsfot.com'
  AND tenant_id = (SELECT id FROM tenants WHERE subdomain = 'selsfot');

-- Update Uma to Manager
UPDATE users 
SET role = 'manager',
    permissions = ARRAY[
      'VIEW_DASHBOARD',
      'VIEW_TIMESHEETS',
      'APPROVE_TIMESHEETS',
      'VIEW_EMPLOYEES',
      'VIEW_REPORTS'
    ]
WHERE email = 'uma.sivalingam@selsfot.com'
  AND tenant_id = (SELECT id FROM tenants WHERE subdomain = 'selsfot');
```

### **Option 2: Delete & Recreate**

```bash
# 1. Delete existing users (if needed)
# Via database or admin panel

# 2. Create new role-based users
node scripts/create-selsoft-users.js custom
```

---

## 📝 Post-Creation Checklist

- [ ] All users created successfully
- [ ] Default password is `test123#`
- [ ] Admin user can login
- [ ] Manager user can login
- [ ] Approver user can login  
- [ ] Employee user can login
- [ ] Admin sees all modules
- [ ] Manager can approve timesheets
- [ ] Approver can only approve (not create)
- [ ] Employee can only view/create own timesheets
- [ ] Password change prompt works
- [ ] New passwords are accepted

---

## 🐛 Troubleshooting

### **Issue: "Tenant not found"**
**Solution:** Verify the Selsoft tenant exists:
```sql
SELECT * FROM tenants WHERE subdomain = 'selsfot';
```

### **Issue: "User already exists"**
**Solution:** Email is already taken. Either:
1. Delete the existing user
2. Use a different email
3. Skip that user in your creation script

### **Issue: Login not working**
**Solution:** 
1. Verify user exists: `SELECT * FROM users WHERE email = 'admin@selsfot.com';`
2. Check password hash is set
3. Verify tenant_id matches
4. Check `status = 'active'`

### **Issue: "Cannot read properties of null"**
**Solution:** Make sure backend is running on port 5001

---

## 📞 Support

For issues or questions:
1. Check logs in `server/logs/`
2. Verify database connection
3. Check API responses in browser console
4. Review `ONBOARDING_API_DOCUMENTATION.md` for detailed API info

---

## 🎉 Success!

After following this guide, you should have:
- ✅ 4 default users (or 6 custom users)
- ✅ Each with proper role and permissions
- ✅ All using password `test123#`
- ✅ Password change required on first login
- ✅ Role-based access working correctly

**Next Steps:**
1. Have each user login and change their password
2. Verify permissions work correctly
3. Start using the timesheet system!

---

**Generated:** September 30, 2025  
**Version:** 1.0
