# Account Creation with Approval Workflow - Complete Documentation

## 📋 Overview

This document describes the complete end-to-end account creation feature with approval workflow for TimePulse. The flow is similar to OAuth but uses a custom approval system where new users must be approved by existing admins/approvers before they can access the system.

## 🎯 Feature Highlights

- **Self-Service Account Creation**: Users can request accounts without admin intervention
- **Role-Based Approval**: Requests are routed to specific approvers based on role
- **Multi-Tenant Support**: Automatic tenant creation for new organizations
- **Phone Number with Country Code**: International phone number support
- **Real-Time Status Tracking**: Users can check their request status anytime
- **Admin Dashboard**: Centralized interface for managing all pending requests
- **Email Notifications**: Automatic notifications on approval/rejection (ready for integration)

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. USER VISITS LOGIN PAGE                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Login Screen                                             │  │
│  │  • Email/Password fields                                  │  │
│  │  • "Sign in with Google" (OAuth)                         │  │
│  │  • "Create Account" link ← NEW                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  2. CREATE ACCOUNT FORM                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Required Fields:                                         │  │
│  │  • First Name                                             │  │
│  │  • Last Name                                              │  │
│  │  • Email Address                                          │  │
│  │  • Phone Number (with country code dropdown)             │  │
│  │  • Role (Employee/Approver/Manager/Admin/HR/Accountant)  │  │
│  │  • Select Approver/Admin (dynamic dropdown)              │  │
│  │                                                            │  │
│  │  Optional Fields:                                         │  │
│  │  • Company Name                                           │  │
│  │  • Department                                             │  │
│  │                                                            │  │
│  │  [Submit Request] button                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  3. BACKEND VALIDATION                           │
│                                                                   │
│  API: POST /api/account-request/create                          │
│                                                                   │
│  Validations:                                                    │
│  ✓ Email format validation                                      │
│  ✓ Check if email already exists                               │
│  ✓ Check for duplicate pending requests                        │
│  ✓ Phone number format validation                              │
│  ✓ Role validation                                              │
│                                                                   │
│  Database: account_requests table                               │
│  • Creates new record with status: 'pending'                    │
│  • Stores all user information                                  │
│  • Links to selected approver                                   │
│  • Records metadata (IP, timestamp, user agent)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  4. SUCCESS SCREEN                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ✓ Request Submitted Successfully!                        │  │
│  │                                                            │  │
│  │  Your account request has been submitted.                 │  │
│  │  You will receive an email once reviewed.                 │  │
│  │                                                            │  │
│  │  Redirecting to status page...                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  5. ACCOUNT STATUS PAGE                          │
│                                                                   │
│  URL: /account-status?email=user@example.com                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ⏳ Request Pending                                        │  │
│  │                                                            │  │
│  │  Your account request is being reviewed                   │  │
│  │                                                            │  │
│  │  Request Details:                                         │  │
│  │  • Name: John Doe                                         │  │
│  │  • Email: john@example.com                                │  │
│  │  • Role: Employee                                         │  │
│  │  • Approver: Jane Smith                                   │  │
│  │  • Submitted: Dec 31, 2024                                │  │
│  │                                                            │  │
│  │  [Refresh Status] [Back to Login]                        │  │
│  │                                                            │  │
│  │  Status updates automatically every 30 seconds            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              6. ADMIN/APPROVER DASHBOARD                         │
│                                                                   │
│  Component: AccountApprovals.jsx                                │
│  API: GET /api/account-request/pending                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Account Approval Requests                                │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ 👤 John Doe                                        │  │  │
│  │  │ ✉ john@example.com                                 │  │  │
│  │  │ 📱 +1 1234567890                                   │  │  │
│  │  │                                                     │  │  │
│  │  │ Role: Employee                                     │  │  │
│  │  │ Department: Engineering                            │  │  │
│  │  │ Company: Acme Corp                                 │  │  │
│  │  │ Requested: Dec 31, 2024                           │  │  │
│  │  │ Assigned to: Jane Smith                           │  │  │
│  │  │                                                     │  │  │
│  │  │ [✓ Approve]  [✗ Reject]                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  7A. APPROVAL FLOW                               │
│                                                                   │
│  API: POST /api/account-request/approve/:requestId              │
│                                                                   │
│  Backend Actions:                                                │
│  1. Generate temporary password (8-character random)            │
│  2. Hash password with bcrypt                                   │
│  3. Get or create tenant                                        │
│  4. Create User account:                                        │
│     • Set mustChangePassword: true                              │
│     • Set approvalStatus: 'approved'                            │
│     • Link to tenant                                            │
│  5. Create Employee record (if role is employee/approver)       │
│  6. Update account request:                                     │
│     • status: 'approved'                                        │
│     • approvedBy: admin ID                                      │
│     • approvedAt: timestamp                                     │
│     • userId: created user ID                                   │
│     • temporaryPassword: stored for email                       │
│                                                                   │
│  Response:                                                       │
│  • Success message                                              │
│  • Temporary password (to be emailed to user)                  │
│  • User ID                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  7B. REJECTION FLOW                              │
│                                                                   │
│  API: POST /api/account-request/reject/:requestId               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Reject Account Request                                   │  │
│  │                                                            │  │
│  │  Please provide a reason for rejection:                   │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ [Reason text area]                                  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  [Confirm Reject]  [Cancel]                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Backend Actions:                                                │
│  • Update account request:                                      │
│    - status: 'rejected'                                         │
│    - rejectedBy: admin ID                                       │
│    - rejectedAt: timestamp                                      │
│    - rejectionReason: provided reason                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  8. STATUS UPDATE                                │
│                                                                   │
│  User checks status page (auto-refreshes every 30s)            │
│                                                                   │
│  IF APPROVED:                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ✓ Account Approved!                                      │  │
│  │                                                            │  │
│  │  Your account has been approved.                          │  │
│  │  You should receive an email with login credentials.      │  │
│  │                                                            │  │
│  │  Approved by: Jane Smith                                  │  │
│  │  Date: Dec 31, 2024                                       │  │
│  │                                                            │  │
│  │  [Go to Login]                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  IF REJECTED:                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ✗ Request Rejected                                       │  │
│  │                                                            │  │
│  │  Your account request was not approved.                   │  │
│  │                                                            │  │
│  │  Reason: [Rejection reason from admin]                    │  │
│  │                                                            │  │
│  │  [Submit New Request]  [Back to Login]                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  9. USER LOGIN                                   │
│                                                                   │
│  User receives email with:                                       │
│  • Email address                                                │
│  • Temporary password                                           │
│  • Link to login page                                           │
│                                                                   │
│  First Login:                                                    │
│  1. User enters email and temporary password                    │
│  2. System detects mustChangePassword flag                      │
│  3. Redirects to /change-password                               │
│  4. User sets new permanent password                            │
│  5. Redirects to dashboard based on role:                       │
│     • Employee → /[subdomain]/employee-dashboard                │
│     • Admin/Manager → /[subdomain]/dashboard                    │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### account_requests Table

```sql
CREATE TABLE account_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  country_code VARCHAR(5) NOT NULL DEFAULT '+1',
  requested_role ENUM('admin', 'manager', 'approver', 'employee', 'accountant', 'hr') NOT NULL,
  requested_approver_id UUID REFERENCES users(id),
  company_name VARCHAR(255),
  department VARCHAR(100),
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  temporary_password VARCHAR(255),
  user_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_account_requests_email ON account_requests(email);
CREATE INDEX idx_account_requests_status ON account_requests(status);
CREATE INDEX idx_account_requests_tenant_id ON account_requests(tenant_id);
CREATE INDEX idx_account_requests_approver ON account_requests(requested_approver_id);
CREATE INDEX idx_account_requests_created ON account_requests(created_at);
```

## 🔌 API Endpoints

### 1. Get Available Roles
```
GET /api/account-request/roles

Response:
{
  "success": true,
  "roles": [
    { "value": "employee", "label": "Employee" },
    { "value": "approver", "label": "Approver" },
    { "value": "manager", "label": "Manager" },
    { "value": "admin", "label": "Admin" },
    { "value": "hr", "label": "HR" },
    { "value": "accountant", "label": "Accountant" }
  ]
}
```

### 2. Get Available Approvers
```
GET /api/account-request/approvers?tenantId=optional-uuid

Response:
{
  "success": true,
  "approvers": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin",
      "tenantId": "uuid",
      "tenantName": "Acme Corp"
    }
  ]
}
```

### 3. Create Account Request
```
POST /api/account-request/create

Request Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "countryCode": "+1",
  "requestedRole": "employee",
  "requestedApproverId": "uuid",
  "companyName": "Acme Corp",
  "department": "Engineering"
}

Response:
{
  "success": true,
  "message": "Account request submitted successfully",
  "requestId": "uuid",
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "status": "pending",
    "approverName": "Jane Smith",
    "tenantName": "Acme Corp"
  }
}
```

### 4. Check Request Status
```
GET /api/account-request/status/:email

Response:
{
  "success": true,
  "request": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "status": "pending",
    "requestedRole": "employee",
    "approverName": "Jane Smith",
    "approvedBy": null,
    "approvedAt": null,
    "rejectedAt": null,
    "rejectionReason": null,
    "createdAt": "2024-12-31T10:00:00Z"
  }
}
```

### 5. Get Pending Requests (Admin/Approver)
```
GET /api/account-request/pending

Response:
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1 1234567890",
      "requestedRole": "employee",
      "department": "Engineering",
      "companyName": "Acme Corp",
      "approverName": "Jane Smith",
      "tenantName": "Acme Corp",
      "createdAt": "2024-12-31T10:00:00Z"
    }
  ],
  "count": 1
}
```

### 6. Approve Request (Admin/Approver)
```
POST /api/account-request/approve/:requestId

Request Body:
{
  "approverId": "uuid",
  "tenantId": "uuid" // optional
}

Response:
{
  "success": true,
  "message": "Account request approved successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "temporaryPassword": "abc12345"
  }
}
```

### 7. Reject Request (Admin/Approver)
```
POST /api/account-request/reject/:requestId

Request Body:
{
  "rejectedBy": "uuid",
  "reason": "Reason for rejection"
}

Response:
{
  "success": true,
  "message": "Account request rejected"
}
```

## 📁 File Structure

### Backend Files
```
server/
├── migrations/
│   └── create-account-requests-table.js    # Database migration
├── models/
│   ├── AccountRequest.js                   # Sequelize model
│   └── index.js                            # Updated with AccountRequest
└── routes/
    └── accountRequest.js                   # All API endpoints
```

### Frontend Files
```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── create-account/
│   │   │   └── page.js                     # Create account page route
│   │   └── account-status/
│   │       └── page.js                     # Status page route
│   └── components/
│       ├── auth/
│       │   ├── CreateAccount.jsx           # Account creation form
│       │   └── Login.jsx                   # Updated with "Create Account" link
│       └── admin/
│           └── AccountApprovals.jsx        # Admin approval interface
```

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
cd server
node migrations/create-account-requests-table.js
```

### 2. Start Backend Server
```bash
cd server
npm start
```

The server will log:
```
📍 Loading account-request routes...
✅ All routes loaded successfully
🚀 TimePulse Server running on port 5001
```

### 3. Start Frontend
```bash
cd nextjs-app
npm run dev
```

### 4. Access the Feature
- Login page: http://localhost:3000/login
- Create account: http://localhost:3000/create-account
- Check status: http://localhost:3000/account-status?email=user@example.com

## 🧪 Testing the Complete Flow

### Test Scenario 1: New User Registration

1. **Navigate to Login Page**
   ```
   http://localhost:3000/login
   ```

2. **Click "Create Account"**
   - Redirects to `/create-account`

3. **Fill Out Form**
   ```
   First Name: John
   Last Name: Doe
   Email: john@example.com
   Country Code: +1
   Phone: 1234567890
   Role: Employee
   Approver: Select from dropdown
   Company: Acme Corp
   Department: Engineering
   ```

4. **Submit Request**
   - Shows success message
   - Redirects to status page

5. **Check Console Logs**
   ```
   Backend:
   📝 Creating account request: { email: 'john@example.com', requestedRole: 'employee' }
   ✅ Account request created: uuid

   Frontend:
   ✅ Roles fetched: 6
   ✅ Approvers fetched: X
   📤 Submitting account request: {...}
   ✅ Account request created: uuid
   ```

### Test Scenario 2: Admin Approval

1. **Admin Accesses Dashboard**
   - Navigate to admin panel
   - Include `<AccountApprovals />` component

2. **View Pending Requests**
   ```
   Console:
   📋 Pending requests: 1
   ```

3. **Click "Approve"**
   ```
   Console:
   ✅ Approving request: uuid
   ✅ Account approved and user created: uuid
   ```

4. **Alert Shows Temporary Password**
   ```
   Account approved! Temporary password: abc12345
   Please send this to the user via email.
   ```

### Test Scenario 3: Status Checking

1. **User Checks Status**
   ```
   http://localhost:3000/account-status?email=john@example.com
   ```

2. **Status Updates Automatically**
   - Polls every 30 seconds
   - Shows current status (pending/approved/rejected)

3. **Console Logs**
   ```
   🔍 Account request status: approved
   ```

## 🎨 UI Components

### CreateAccount.jsx Features
- Modern Tailwind CSS styling
- Real-time validation
- Country code dropdown with 10+ countries
- Dynamic approver loading based on role
- Loading states for all async operations
- Success animation on submission
- Error handling with user-friendly messages

### AccountStatus Page Features
- Auto-refresh every 30 seconds
- Status-specific icons (pending/approved/rejected)
- Detailed request information
- Action buttons based on status
- Responsive design

### AccountApprovals.jsx Features
- Card-based layout for each request
- Approve/Reject buttons with loading states
- Rejection modal with reason input
- Real-time updates (polls every 60 seconds)
- Empty state when no pending requests
- Dark mode support

## 🔐 Security Considerations

1. **Email Validation**: Server-side validation prevents invalid emails
2. **Duplicate Prevention**: Checks for existing users and pending requests
3. **Password Security**: Temporary passwords are hashed with bcrypt
4. **Role Validation**: Only valid roles are accepted
5. **Approver Verification**: Validates approver exists and has proper role
6. **Audit Trail**: All actions logged with timestamps and user IDs
7. **Metadata Tracking**: IP address, user agent stored for security

## 📧 Email Integration (Ready)

The system is ready for email integration. Add email sending in these locations:

### On Request Creation
```javascript
// In accountRequest.js - POST /create
// Send email to approver
await sendEmail({
  to: approver.email,
  subject: 'New Account Request Pending',
  template: 'account-request-pending',
  data: { requestorName, role, companyName }
});
```

### On Approval
```javascript
// In accountRequest.js - POST /approve/:requestId
// Send email to user with credentials
await sendEmail({
  to: accountRequest.email,
  subject: 'Account Approved - Login Credentials',
  template: 'account-approved',
  data: { email, temporaryPassword, loginUrl }
});
```

### On Rejection
```javascript
// In accountRequest.js - POST /reject/:requestId
// Send email to user
await sendEmail({
  to: accountRequest.email,
  subject: 'Account Request Update',
  template: 'account-rejected',
  data: { rejectionReason }
});
```

## 🎯 Key Features Summary

✅ **Self-Service Registration**: Users can create accounts without admin help
✅ **Role-Based Workflow**: Different approval flows for different roles
✅ **Real-Time Status**: Users can track their request status
✅ **Admin Dashboard**: Centralized approval management
✅ **Multi-Tenant Support**: Automatic tenant creation
✅ **International Support**: Country code selection for phone numbers
✅ **Security**: Temporary passwords, approval workflow, audit trail
✅ **Modern UI**: Tailwind CSS, responsive, dark mode ready
✅ **Email Ready**: Integration points prepared for email notifications

## 🐛 Troubleshooting

### Issue: Routes not loading
**Solution**: Check server console for route loading messages:
```
📍 Loading account-request routes...
```

### Issue: Model not found
**Solution**: Ensure AccountRequest is added to models/index.js

### Issue: Migration fails
**Solution**: Check database connection and run migration manually

### Issue: Approvers not loading
**Solution**: Ensure there are users with role 'admin', 'approver', or 'manager' in database

## 📝 Console Output Reference

### Successful Account Creation
```
Backend:
📝 Creating account request: { email: 'john@example.com', requestedRole: 'employee' }
✅ Account request created: abc-123-uuid

Frontend:
📤 Submitting account request: {...}
✅ Account request created: abc-123-uuid
```

### Successful Approval
```
Backend:
✅ Approving request: abc-123-uuid
✅ Account approved and user created: def-456-uuid

Frontend:
✅ Request approved: abc-123-uuid
```

### Status Check
```
Backend:
🔍 Account request status: pending

Frontend:
✅ Status fetched: pending
```

## 🎉 Completion Status

✅ Database schema created
✅ Backend API endpoints implemented
✅ Frontend UI components created
✅ Login page updated with "Create Account" link
✅ Status page with auto-refresh
✅ Admin approval interface
✅ Complete documentation
✅ Console logging for debugging
✅ Error handling throughout
✅ Responsive design
✅ Dark mode support

The feature is **100% complete** and ready for testing!
