# Google OAuth User Registration Fix

## Problem Identified
Users signing in with Google OAuth were not being added to the User and Employee tables, preventing them from appearing in the admin employee list.

## Root Cause
The User model was missing the required OAuth fields (`googleId`, `authProvider`, `emailVerified`) that the OAuth registration code was trying to use.

## Solution Implemented

### 1. Updated User Model (`server/models/index.js`)
Added three new fields to support OAuth authentication:

```javascript
googleId: {
  type: DataTypes.STRING(255),
  allowNull: true,
  field: "google_id",
},
authProvider: {
  type: DataTypes.STRING(50),
  allowNull: true,
  defaultValue: "local",
  field: "auth_provider",
},
emailVerified: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  field: "email_verified",
},
```

Also made `passwordHash` nullable to support OAuth users who don't have passwords:
```javascript
passwordHash: {
  type: DataTypes.STRING(255),
  allowNull: true, // Nullable for OAuth users
  field: "password_hash",
},
```

### 2. Created Database Migration
- **File**: `server/migrations/add-oauth-fields.js`
- **Purpose**: Adds the new OAuth columns to the existing users table
- **Run Script**: `server/run-oauth-migration.js`

### 3. OAuth Registration Flow (Already Implemented)
The OAuth registration endpoint (`POST /api/oauth/register`) already:
- ✅ Creates User record with OAuth data
- ✅ Creates Employee record for all roles (admin, approver, employee)
- ✅ Links Employee to User via `userId`
- ✅ Sets appropriate title based on role
- ✅ Returns JWT token for authentication

### 4. OAuth Check-User Flow (Already Implemented)
The check-user endpoint (`POST /api/oauth/check-user`) already:
- ✅ Checks if user exists in database
- ✅ Creates Employee record if missing (for existing users)
- ✅ Returns user data with employeeId

## How to Apply the Fix

### Step 1: Run the Database Migration
```bash
cd server
node run-oauth-migration.js
```

This will add the required OAuth columns to your users table.

### Step 2: Restart the Backend Server
```bash
cd server
npm start
```

### Step 3: Test OAuth Sign-In
1. Go to the login page
2. Click "Sign in with Google"
3. Complete the OAuth flow
4. For new users: Fill out the onboarding form
5. Verify the user appears in the admin employee list

## What Gets Created for OAuth Users

### User Record
- `id`: UUID
- `tenantId`: Auto-created tenant ID
- `firstName`: From Google profile
- `lastName`: From Google profile
- `email`: From Google account
- `passwordHash`: NULL (OAuth users don't have passwords)
- `role`: Selected during onboarding (admin/approver/employee)
- `googleId`: Google user ID
- `authProvider`: "google"
- `emailVerified`: true
- `status`: "active"

### Employee Record
- `id`: UUID
- `tenantId`: Same as user's tenant
- `userId`: Links to User record
- `firstName`: From onboarding form
- `lastName`: From onboarding form
- `email`: From Google account
- `phone`: From onboarding form (optional)
- `department`: From onboarding form or "General"
- `title`: Based on role (Administrator/Manager/Employee)
- `status`: "active"
- `startDate`: Current date

### Tenant Record (for new users)
- `id`: UUID
- `tenantName`: Company name from onboarding
- `subdomain`: Generated from company name
- `status`: "active"
- `plan_type`: "free"

## Verification Steps

### 1. Check User Table
```sql
SELECT id, email, first_name, last_name, role, google_id, auth_provider, email_verified 
FROM users 
WHERE auth_provider = 'google';
```

### 2. Check Employee Table
```sql
SELECT e.id, e.first_name, e.last_name, e.email, e.title, e.department, u.role
FROM employees e
JOIN users u ON e.user_id = u.id
WHERE u.auth_provider = 'google';
```

### 3. Check Admin Employee List
1. Login as admin
2. Navigate to Employees section
3. Verify OAuth users appear in the list
4. Check that their role and details are correct

## API Endpoints

### POST /api/oauth/check-user
Checks if a Google OAuth user exists in the system.

**Request:**
```json
{
  "email": "user@example.com",
  "googleId": "google-user-id"
}
```

**Response (New User):**
```json
{
  "success": true,
  "exists": false,
  "needsOnboarding": true,
  "email": "user@example.com"
}
```

**Response (Existing User):**
```json
{
  "success": true,
  "exists": true,
  "needsOnboarding": false,
  "token": "jwt-token",
  "user": {
    "id": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "employee",
    "tenantId": "tenant-uuid",
    "employeeId": "employee-uuid",
    "status": "active"
  },
  "tenant": {
    "id": "tenant-uuid",
    "tenantName": "Company Name",
    "subdomain": "companyname",
    "status": "active"
  }
}
```

### POST /api/oauth/register
Registers a new Google OAuth user with onboarding data.

**Request:**
```json
{
  "email": "user@example.com",
  "googleId": "google-user-id",
  "firstName": "John",
  "lastName": "Doe",
  "role": "employee",
  "companyName": "My Company",
  "phoneNumber": "+1234567890",
  "department": "Engineering"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "id": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "employee",
    "tenantId": "tenant-uuid",
    "employeeId": "employee-uuid",
    "status": "active"
  },
  "tenant": {
    "id": "tenant-uuid",
    "tenantName": "My Company",
    "subdomain": "mycompany",
    "status": "active"
  }
}
```

## Files Modified

1. **`server/models/index.js`**
   - Added `googleId`, `authProvider`, `emailVerified` fields to User model
   - Made `passwordHash` nullable

2. **`server/migrations/add-oauth-fields.js`** (NEW)
   - Migration to add OAuth columns to users table

3. **`server/run-oauth-migration.js`** (NEW)
   - Script to run the OAuth migration

4. **`server/routes/oauth.js`** (Already exists)
   - OAuth registration and check-user endpoints

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: The columns may already exist. Check your database schema:
```sql
\d users  -- PostgreSQL
PRAGMA table_info(users);  -- SQLite
```

### Issue: OAuth users still not appearing in employee list
**Solution**: 
1. Check if Employee record was created:
   ```sql
   SELECT * FROM employees WHERE email = 'oauth-user@example.com';
   ```
2. Check if User record has correct tenantId:
   ```sql
   SELECT * FROM users WHERE email = 'oauth-user@example.com';
   ```
3. Verify the employee list is filtering by correct tenantId

### Issue: "passwordHash cannot be null" error
**Solution**: Run the migration to make passwordHash nullable, or restart the server after model changes.

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Restart backend server
- [ ] Sign in with Google (new user)
- [ ] Complete onboarding form
- [ ] Verify user created in users table
- [ ] Verify employee created in employees table
- [ ] Verify user appears in admin employee list
- [ ] Sign out and sign in again (existing user)
- [ ] Verify no duplicate records created
- [ ] Verify employee details are correct

## Next Steps

1. Run the migration: `node server/run-oauth-migration.js`
2. Restart the backend server
3. Test OAuth sign-in flow
4. Verify users appear in employee list
5. Monitor server logs for any errors

## Support

If you encounter any issues:
1. Check server logs for detailed error messages
2. Verify database connection is working
3. Ensure Google OAuth credentials are configured
4. Check that NEXT_PUBLIC_API_URL is set correctly
