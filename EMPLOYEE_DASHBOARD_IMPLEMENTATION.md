# Employee Dashboard Implementation

## Overview
Created a comprehensive backend service for the employee dashboard with live data from timesheets and invoices, plus logo navigation functionality.

## Backend Implementation

### 1. New API Endpoint: `/api/employee-dashboard`

**File**: `/server/routes/employeeDashboard.js`

#### Main Endpoint: `GET /api/employee-dashboard`
**Query Parameters**:
- `employeeId` - The employee's ID
- `tenantId` - The tenant/organization ID

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "...",
      "employeeId": "...",
      "name": "...",
      "email": "...",
      "department": "...",
      "title": "...",
      "hourlyRate": 0
    },
    "timesheets": {
      "total": 0,
      "pending": 0,
      "approved": 0,
      "rejected": 0,
      "totalHoursThisMonth": 0,
      "currentWeek": { ... },
      "recent": [ ... ]
    },
    "invoices": {
      "total": 0,
      "paid": 0,
      "pending": 0,
      "overdue": 0,
      "totalEarningsThisMonth": 0,
      "pendingEarnings": 0,
      "recent": [ ... ]
    },
    "summary": {
      "hoursThisMonth": 0,
      "earningsThisMonth": 0,
      "pendingEarnings": 0,
      "averageHourlyRate": 0,
      "estimatedEarnings": 0
    }
  }
}
```

#### Additional Endpoints:

**`GET /api/employee-dashboard/timesheets`**
- Get paginated timesheet history
- Query params: `employeeId`, `tenantId`, `limit`, `offset`

**`GET /api/employee-dashboard/invoices`**
- Get paginated invoice history
- Query params: `employeeId`, `tenantId`, `limit`, `offset`

### 2. Server Registration

Updated `/server/index.js`:
- Added route import: `const employeeDashboardRoutes = require('./routes/employeeDashboard');`
- Registered route: `app.use('/api/employee-dashboard', employeeDashboardRoutes);`
- Added to API endpoints list in root response

## Frontend Implementation

### 1. Updated EmployeeDashboard Component

**File**: `/frontend/src/components/dashboard/EmployeeDashboard.jsx`

**Changes**:
- Replaced mock data with live API calls to `/api/employee-dashboard`
- Fetches real-time data for:
  - Timesheet statistics (total, pending, approved, rejected)
  - Hours worked this month
  - Invoice statistics (paid, pending, overdue)
  - Earnings this month and pending earnings
  - Recent timesheets and invoices
- Generates dynamic notifications based on:
  - Pending timesheets
  - Approved timesheets
  - Overdue invoices
  - Paid invoices

**Data Flow**:
1. Component loads with user's `employeeId` and `tenantId`
2. Calls `/api/employee-dashboard` API
3. Transforms data to match component UI expectations
4. Displays live statistics, charts, and notifications

### 2. Logo Navigation

**File**: `/frontend/src/components/layout/Header.jsx`

**Changes**:
- Made TimePulse logo clickable
- Added `onClick` handler to navigate to employee dashboard
- Added cursor pointer and title tooltip
- Navigation path: `/${subdomain}/employee-dashboard`

**User Experience**:
- Click on TimePulse logo anywhere in the app
- Instantly navigate to employee dashboard
- Works for all authenticated employees

### 3. Route Configuration

**File**: `/frontend/src/App.js`

Route already exists:
```javascript
<Route path="/:subdomain/employee-dashboard" element={
  <ProtectedRoute><EmployerLayout><EmployeeDashboard /></EmployerLayout></ProtectedRoute>
} />
```

## Features

### Dashboard Statistics
- **Timesheet Metrics**:
  - Total timesheets this month
  - Pending approval count
  - Approved count
  - Rejected count
  - Total hours worked this month
  - Current week timesheet status

- **Invoice Metrics**:
  - Total invoices this month
  - Paid invoices count
  - Pending invoices count
  - Overdue invoices count
  - Total earnings this month
  - Pending earnings amount

- **Summary Cards**:
  - Hours this month
  - Earnings this month
  - Pending earnings
  - Estimated earnings based on hourly rate

### Live Data Updates
- Real-time data from PostgreSQL database
- Automatic calculation of monthly statistics
- Current week timesheet detection
- Overdue invoice detection

### Smart Notifications
- Pending timesheet alerts
- Approval notifications
- Overdue invoice warnings
- Payment confirmations

## API Usage Example

### Frontend Call:
```javascript
const response = await apiFetch(
  `/api/employee-dashboard?employeeId=${user.employeeId}&tenantId=${user.tenantId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }
);

const dashboardData = await response.json();
```

### Backend Query:
```javascript
// Fetches from Employee, Timesheet, and Invoice tables
// Calculates statistics for current month
// Returns aggregated dashboard data
```

## Database Tables Used

1. **Employee** - Employee details and hourly rates
2. **Timesheet** - Time tracking records with status
3. **Invoice** - Invoice records with payment status

## Testing

### Test the Implementation:

1. **Start the server** (should already be running with nodemon):
   ```bash
   cd server
   npm run dev
   ```

2. **Access employee dashboard**:
   - Login as an employee
   - Click on the TimePulse logo in the header
   - Or navigate to: `https://goggly-casteless-torri.ngrok-free.dev/selsoft/employee-dashboard`

3. **Verify live data**:
   - Check timesheet statistics match database
   - Verify invoice amounts are correct
   - Confirm notifications appear for pending items
   - Test that hours and earnings calculations are accurate

### API Testing:

Test the endpoint directly:
```bash
curl "http://44.222.217.57:5001/api/employee-dashboard?employeeId=YOUR_EMPLOYEE_ID&tenantId=YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Benefits

✅ **Real-time Data** - Live statistics from database
✅ **Comprehensive View** - All employee metrics in one place
✅ **Smart Notifications** - Actionable alerts and updates
✅ **Easy Navigation** - One-click access via logo
✅ **Performance** - Optimized queries with proper indexing
✅ **Scalable** - Pagination support for large datasets

## Future Enhancements

Potential additions:
- Leave/PTO tracking integration
- Performance metrics and goals
- Downloadable reports
- Calendar integration
- Mobile-optimized view
- Real-time WebSocket updates
- Export to PDF/Excel
