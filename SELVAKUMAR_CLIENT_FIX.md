# Selvakumar Client Fix - Only Cognizant

## Issue
Selvakumar's timesheet was showing multiple hardcoded clients (JPMC, IBM, Accenture) instead of only Cognizant from the database.

## Root Cause
The `TimesheetSubmit.jsx` component had hardcoded mock client data that was being displayed instead of fetching real data from the API.

## Changes Made

### 1. Database Setup
Created script to ensure Cognizant client exists and Selvakumar is linked to it:
- **File**: `server/scripts/fix-selvakumar-client.js`
- **Actions**:
  - Creates/verifies Cognizant client in database
  - Links Selvakumar employee to Cognizant
  - Updates all Selvakumar's timesheets to use Cognizant

### 2. Frontend Fix - TimesheetSubmit.jsx

**Removed Hardcoded Mock Data:**
```javascript
// OLD - Hardcoded clients
const mockClientData = [
  { id: '1', clientName: 'JPMC', ... },
  { id: '2', clientName: 'IBM', ... },
  { id: '3', clientName: 'Accenture', ... }
];
```

**Added Real API Integration:**
```javascript
// NEW - Fetch from API
const response = await axios.get(`/api/clients?tenantId=${tenantId}`);
const empResponse = await axios.get(`/api/timesheets/employees/by-email/${user.email}?tenantId=${tenantId}`);

// If employee has assigned client, show only that client
if (employee.clientId) {
  const assignedClient = response.data.clients.find(c => c.id === employee.clientId);
  clientData = [{
    id: assignedClient.id,
    clientName: assignedClient.clientName,
    project: assignedClient.clientName + ' Project',
    hourlyRate: assignedClient.hourlyRate || 0,
    clientType: assignedClient.clientType || 'external',
    hours: Array(7).fill(0)
  }];
}
```

**Added Missing Imports:**
```javascript
import axios from 'axios';
const { isAdmin, isEmployee, user } = useAuth();
```

### 3. Files Modified

**Frontend:**
- `frontend/src/components/timesheets/TimesheetSubmit.jsx`
  - Added axios import
  - Added user from useAuth
  - Replaced mock client data with API calls
  - Fetches employee's assigned client
  - Shows only assigned client if employee has one
  - Falls back to all clients if no assignment

**Backend:**
- `server/scripts/fix-selvakumar-client.js` (new)
  - Creates Cognizant client if not exists
  - Links Selvakumar to Cognizant
  - Updates timesheets

- `server/scripts/check-selvakumar-data.js` (new)
  - Utility to check current data state

## How It Works

### Employee with Assigned Client (Selvakumar)
1. User logs in as selvakumar@selsoftinc.com
2. Component fetches all clients from `/api/clients`
3. Component fetches employee data from `/api/timesheets/employees/by-email`
4. If employee has `clientId` set, shows only that client
5. **Result**: Selvakumar sees only Cognizant

### Employee without Assigned Client
1. User logs in
2. Component fetches all clients
3. Employee has no `clientId` set
4. Shows all available clients
5. **Result**: User can select from all clients

## Database Structure

### Client Record (Cognizant)
```javascript
{
  id: 'a3889c22-ace2-40f9-9f29-1a1556c0a444',
  clientName: 'Cognizant',
  clientType: 'external',
  tenantId: 1,
  status: 'active'
}
```

### Employee Record (Selvakumar)
```javascript
{
  id: '5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3',
  firstName: 'Selvakumar',
  lastName: 'Murugesan',
  email: 'selvakumar@selsoftinc.com',
  clientId: 'a3889c22-ace2-40f9-9f29-1a1556c0a444', // Cognizant
  tenantId: 1
}
```

## Testing Instructions

### Step 1: Run Database Script (Optional)
```bash
cd server
node scripts/fix-selvakumar-client.js
```

This ensures:
- ✅ Cognizant client exists
- ✅ Selvakumar is linked to Cognizant
- ✅ All timesheets updated

### Step 2: Restart Backend
```bash
cd server
npm start
```

### Step 3: Test Frontend
1. Login as: `selvakumar@selsoftinc.com`
2. Navigate to Timesheets page
3. ✅ Should see only **Cognizant** in client list
4. ✅ No JPMC, IBM, or Accenture

### Step 4: Verify Data Flow
Open browser console and check:
```
📡 Fetching clients from API...
✅ Got 1 client: Cognizant
✅ Employee has assigned client: Cognizant
✅ Showing only assigned client
```

## API Endpoints Used

### GET /api/clients?tenantId=X
Returns all clients for tenant:
```json
{
  "success": true,
  "clients": [
    {
      "id": "a3889c22-ace2-40f9-9f29-1a1556c0a444",
      "clientName": "Cognizant",
      "clientType": "external",
      "hourlyRate": 0
    }
  ]
}
```

### GET /api/timesheets/employees/by-email/:email?tenantId=X
Returns employee data:
```json
{
  "success": true,
  "employee": {
    "id": "5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3",
    "firstName": "Selvakumar",
    "lastName": "Murugesan",
    "email": "selvakumar@selsoftinc.com",
    "clientId": "a3889c22-ace2-40f9-9f29-1a1556c0a444"
  }
}
```

## Benefits

### ✅ Data-Driven
- All client data comes from database
- No hardcoded mock data
- Real-time updates

### ✅ Employee-Specific
- Each employee sees only their assigned client
- Admins can manage client assignments
- Flexible for different scenarios

### ✅ Maintainable
- Single source of truth (database)
- Easy to add/remove clients
- No code changes needed for client updates

## Future Enhancements

### 1. Multiple Clients per Employee
Currently supports one client per employee. Could be extended to:
```javascript
// Employee model
{
  clientIds: ['client1-id', 'client2-id', 'client3-id']
}
```

### 2. Project-Level Assignment
Instead of client-level, assign at project level:
```javascript
// Employee model
{
  projects: [
    { clientId: 'cognizant-id', projectId: 'project1-id' },
    { clientId: 'cognizant-id', projectId: 'project2-id' }
  ]
}
```

### 3. Time-Based Assignments
Support client assignments with start/end dates:
```javascript
// Employee model
{
  clientAssignments: [
    {
      clientId: 'cognizant-id',
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    }
  ]
}
```

## Troubleshooting

### Issue: Still seeing multiple clients
**Solution**: Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: No clients showing
**Check**:
1. Employee has `clientId` set in database
2. Client exists in database
3. API endpoints returning data
4. Browser console for errors

### Issue: Wrong client showing
**Fix**:
1. Run `node scripts/check-selvakumar-data.js`
2. Verify `clientId` in employee record
3. Run `node scripts/fix-selvakumar-client.js` to fix

## Summary

✅ **Fixed**: Removed hardcoded mock client data  
✅ **Implemented**: Real API integration  
✅ **Result**: Selvakumar sees only Cognizant  
✅ **Benefit**: All data comes from database  
✅ **Scalable**: Easy to manage client assignments  

---

**Date**: 2025-10-07  
**Status**: ✅ Complete  
**Testing**: Ready for user verification
