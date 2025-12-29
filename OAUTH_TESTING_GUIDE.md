# OAuth Approver Dropdown - Testing Guide

## ✅ IMPLEMENTATION COMPLETE

All code changes have been implemented. Now you need to **test the complete OAuth flow**.

---

## **🔧 Prerequisites**

### **Backend Server**
✅ Running on port 5001  
✅ All routes loaded successfully  
✅ OAuth endpoints functional

### **Frontend**
⚠️ **IMPORTANT**: You must **hard refresh** the browser to see the approver dropdown
- **Windows/Linux**: `Ctrl + F5` or `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### **Database**
- At least one admin user must exist in the system
- Admin user must have:
  - `status: 'active'`
  - `approvalStatus: 'approved'`
  - `role: 'admin'` or `'approver'`

---

## **📋 Complete Testing Flow**

### **Step 1: Start OAuth Registration**

1. Navigate to login page: `http://localhost:3000/login`
2. Click **"Sign in with Google"** button
3. Authenticate with Google (use a **NEW email** not in the system)
4. Google will redirect back to your app

### **Step 2: Onboarding Form**

After Google authentication, you should be redirected to the onboarding page.

**✅ Verify the following:**

1. **Email field** is pre-filled and locked (read-only)
2. **First Name** and **Last Name** fields are editable
3. **Role dropdown** shows:
   - Select your role
   - Admin - Full system access
   - Approver - Manage and approve timesheets
   - Employee - Submit timesheets

4. **Select Role: "Employee"**
   
   **✅ CRITICAL CHECK**: After selecting "Employee", the **Approver dropdown should appear**

5. **Approver Dropdown Verification:**
   ```
   ┌─────────────────────────────────────┐
   │ Select Approver *                   │
   │ [Select an approver ▼]              │
   │                                      │
   │ Options:                             │
   │ - Selvakumar (admin)                │
   │ - Panneer (admin)                   │
   │ - John Doe (approver)               │
   └─────────────────────────────────────┘
   ```

   **Check:**
   - ✅ Dropdown appears below Role field
   - ✅ Label says "Select Approver *" (with asterisk)
   - ✅ Shows loading spinner initially
   - ✅ Populates with admin/approver users
   - ✅ Format: "FirstName LastName (role)"
   - ✅ Sorted alphabetically by first name

6. **If Approver dropdown is empty:**
   - Should show message: "No approvers available. Please contact your administrator."
   - This means no admin/approver users exist for your email domain

7. **Select an approver** from the dropdown

8. **Fill remaining fields:**
   - Phone Number (optional)
   - Department (optional)

9. Click **"Complete Registration"**

### **Step 3: Pending Approval Page**

After submitting the form:

**✅ Verify:**
1. Redirected to `/pending-approval` page
2. Message displays: "Your registration is pending admin approval"
3. Cannot login until approved

**Check Browser Console:**
```
[Onboarding] Fetching approvers for domain: selsoftinc.com
[Onboarding] Fetched approvers: 2
```

### **Step 4: Admin Receives Notification**

1. **Login as admin user**
2. **Check notification bell** (top-right corner)
   
   **✅ Verify notification appears:**
   ```
   Title: "New User Registration Pending Approval"
   Message: "John Doe (john@company.com) has registered via 
            Google OAuth and selected Selvakumar as their 
            approver. Awaiting approval."
   Type: Warning (yellow/orange)
   Priority: High
   ```

3. **Click notification** or navigate to `/[subdomain]/user-approvals`

### **Step 5: User Approvals Page**

**✅ Verify pending user card shows:**

```
┌─────────────────────────────────────────────┐
│  JD  John Doe                    [Pending]  │
│      john@company.com                       │
├─────────────────────────────────────────────┤
│  Role: Employee                             │
│  Department: Engineering                    │
│  Selected Approver: 👤 Selvakumar          │  ← NEW
│  Auth Provider: 🔵 Google                   │
│  Registered: Dec 29, 2024, 11:30 AM        │
├─────────────────────────────────────────────┤
│  [✓ Approve]  [✗ Reject]                   │
└─────────────────────────────────────────────┘
```

**✅ Critical Check:**
- **"Selected Approver: Selvakumar"** row is visible
- Shows the approver name you selected during registration
- Has user-check icon (👤)

### **Step 6: Approver Receives Notification**

If the selected approver is **NOT an admin**:

1. **Login as the selected approver**
2. **Check notification bell**

   **✅ Verify notification:**
   ```
   Title: "New Employee Assigned to You"
   Message: "John Doe (john@company.com) has registered and 
            selected you as their approver. Pending admin approval."
   Type: Info (blue)
   Priority: Medium
   ```

### **Step 7: Admin Approves User**

1. **As admin**, on the user approvals page
2. Click **"Approve"** button
3. **✅ Verify:**
   - Success message appears
   - User removed from pending list
   - Approval email sent (if SMTP configured)

**Check Backend Console:**
```
[User Approval] User john@company.com approved by admin@company.com
[User Approval] Approval email sent to john@company.com
```

### **Step 8: User Can Login**

1. **Logout admin**
2. Navigate to login page
3. Click **"Sign in with Google"**
4. Authenticate with the newly approved user's Google account

**✅ Verify:**
- ✅ User successfully logs in
- ✅ Redirected to appropriate dashboard based on role:
  - **Employee**: Employee dashboard
  - **Admin**: Admin dashboard
  - **Approver**: Approver dashboard

### **Step 9: Verify Database**

**Check Employee Record:**
```sql
SELECT 
  e.id,
  e.first_name,
  e.last_name,
  e.email,
  e.approver_id,
  u.first_name as approver_first_name,
  u.last_name as approver_last_name
FROM employees e
LEFT JOIN users u ON e.approver_id = u.id
WHERE e.email = 'john@company.com';
```

**Expected Result:**
- `approver_id`: UUID of selected approver (e.g., "abc123...")
- `approver_first_name`: "Selvakumar"
- `approver_last_name`: "..."

**Check User Record:**
```sql
SELECT 
  id,
  first_name,
  last_name,
  email,
  role,
  status,
  approval_status
FROM users
WHERE email = 'john@company.com';
```

**Expected Result:**
- `approval_status`: 'approved' (after admin approval)
- `status`: 'active' (after admin approval)
- `role`: 'employee'

---

## **🧪 Additional Test Scenarios**

### **Test 2: Admin/Approver Registration (No Approver Dropdown)**

1. Start OAuth flow with new email
2. On onboarding form, select role: **"Admin"** or **"Approver"**
3. **✅ Verify**: Approver dropdown does **NOT** appear
4. Complete registration
5. Should still go to pending approval
6. Admin approves
7. User can login

### **Test 3: No Approvers Available**

1. Use email from a **new domain** (no existing users)
2. Start OAuth flow
3. Select role: **"Employee"**
4. **✅ Verify**: 
   - Approver dropdown appears
   - Shows message: "No approvers available. Please contact your administrator."
   - Dropdown is disabled
   - Cannot submit form (validation error)

### **Test 4: Multiple Approvers**

1. Ensure database has multiple admin/approver users
2. Start OAuth flow
3. Select role: "Employee"
4. **✅ Verify**: Dropdown shows all active admin/approver users
5. Select different approver
6. Complete registration
7. Verify correct approver saved in database

---

## **🐛 Troubleshooting**

### **Issue: Approver dropdown not appearing**

**Solutions:**
1. **Hard refresh browser**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear browser cache**
3. **Check role selection**: Must select "Employee" role
4. **Check browser console** for errors:
   ```
   F12 → Console tab
   Look for: [Onboarding] Fetching approvers...
   ```

### **Issue: Dropdown is empty**

**Possible Causes:**
1. No admin/approver users in the system
2. Email domain doesn't match any existing tenant
3. All admin/approver users are inactive or pending

**Solutions:**
1. Create at least one admin user first
2. Ensure admin has:
   - `status: 'active'`
   - `approvalStatus: 'approved'`
   - `role: 'admin'` or `'approver'`

### **Issue: API endpoint not found**

**Error**: `Route /api/oauth/approvers not found`

**Solutions:**
1. Restart backend server:
   ```bash
   taskkill /F /IM node.exe
   cd d:\selsoft\WebApp\TimePulse\server
   node index.js
   ```
2. Check server logs for "Loading oauth routes..."
3. Verify file saved: `server/routes/oauth.js`

### **Issue: Approver not showing in user approvals page**

**Solutions:**
1. Check Employee record has `approverId` set
2. Check backend logs for enrichment errors
3. Verify approver user exists and is not deleted
4. Hard refresh browser

### **Issue: Notification not created**

**Solutions:**
1. Check Notification model exists
2. Check backend logs for notification creation errors
3. Verify admin users exist and are active

---

## **📊 Backend API Endpoints**

### **GET /api/oauth/approvers**

**Purpose**: Fetch list of approvers for dropdown

**Query Parameters:**
- `emailDomain` (required): Email domain (e.g., "selsoftinc.com")

**Example Request:**
```bash
curl "http://localhost:5001/api/oauth/approvers?emailDomain=selsoftinc.com"
```

**Example Response:**
```json
{
  "success": true,
  "approvers": [
    {
      "id": "uuid-1",
      "firstName": "Selvakumar",
      "lastName": "...",
      "email": "selvakumar@selsoftinc.com",
      "role": "admin"
    },
    {
      "id": "uuid-2",
      "firstName": "Panneer",
      "lastName": "...",
      "email": "panneer@selsoftinc.com",
      "role": "admin"
    }
  ],
  "count": 2
}
```

### **POST /api/oauth/register**

**Purpose**: Register new OAuth user

**Request Body:**
```json
{
  "email": "john@company.com",
  "googleId": "google-oauth-id",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee",
  "phoneNumber": "1234567890",
  "department": "Engineering",
  "approverId": "uuid-of-selected-approver"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "requiresApproval": true,
  "user": {
    "id": "user-uuid",
    "email": "john@company.com",
    "approvalStatus": "pending"
  }
}
```

---

## **✅ Success Criteria Checklist**

Use this checklist to verify complete implementation:

### **Frontend**
- [ ] Approver dropdown appears when "Employee" role selected
- [ ] Dropdown fetches admin/approver users from backend
- [ ] Dropdown shows format: "FirstName LastName (role)"
- [ ] Dropdown sorted alphabetically
- [ ] Loading spinner shows while fetching
- [ ] Empty state message if no approvers
- [ ] Validation error if employee doesn't select approver
- [ ] Form submits with approverId

### **Backend**
- [ ] `/api/oauth/approvers` endpoint works
- [ ] Returns active admin/approver users
- [ ] Filters by email domain to find tenant
- [ ] `/api/oauth/register` accepts approverId
- [ ] Saves approverId to Employee record
- [ ] Creates notification for admins with approver info
- [ ] Creates notification for selected approver (if not admin)

### **User Approvals Page**
- [ ] Shows "Selected Approver" field in pending user card
- [ ] Displays approver name correctly
- [ ] Shows user-check icon
- [ ] Backend enriches pending users with approver details

### **Complete Flow**
- [ ] New user registers via OAuth
- [ ] Selects approver during onboarding
- [ ] User status set to 'pending'
- [ ] Admin receives notification with approver info
- [ ] Selected approver receives notification (if not admin)
- [ ] Admin can see selected approver in approvals page
- [ ] Admin approves user
- [ ] User can login via OAuth
- [ ] User redirected to correct dashboard based on role
- [ ] Approver relationship persists in database

---

## **📝 Files Modified**

### **Frontend**
1. `nextjs-app/src/app/onboarding/page.js`
   - Added approver dropdown state
   - Fetch approvers when email is set
   - Conditional rendering for employee role
   - Validation for approver selection
   - Send approverId to backend

2. `nextjs-app/src/app/[subdomain]/user-approvals/page.js`
   - Display selected approver in pending user card

### **Backend**
1. `server/routes/oauth.js`
   - Added `GET /approvers` endpoint
   - Updated `POST /register` to accept approverId
   - Save approverId to Employee record
   - Enhanced notifications with approver info

2. `server/routes/userApprovals.js`
   - Enrich pending users with approver information
   - Fetch approver details from Employee table

3. `server/models/index.js`
   - Added `approverId` field to Employee model

---

## **🎯 Next Steps**

1. **Hard refresh browser** (`Ctrl + F5`)
2. **Test complete OAuth flow** following the steps above
3. **Verify approver dropdown appears** for employee role
4. **Check notifications** are created correctly
5. **Confirm database** has approver relationship saved

---

**Implementation Date**: December 29, 2024  
**Status**: ✅ Complete - Ready for Testing  
**Backend Server**: Running on port 5001  
**Frontend**: Requires hard refresh to see changes
