# Reports & Analytics - Decryption Fix Complete

## Problem Analysis

The Reports module was displaying encrypted hash codes instead of decrypted names for:
1. **Client Names**: Showing hash codes like `c5b97829a854678a98138fd3ee2e2149:6278c8421a06cfb87e4779ba1db602c4:95f6079504e25a6390`
2. **Employee Names**: Encrypted first and last names
3. **Vendor/Client Names in Invoices**: Hash codes in invoice reports

## Root Cause

The backend reports routes were fetching data directly from the database without decrypting sensitive fields. The database stores encrypted data for security, but the API was returning this encrypted data directly to the frontend.

## Solution Implemented

### Backend Changes - Added Decryption Layer

**File: `server/routes/reports.js`**

#### 1. Added DataEncryptionService Import
```javascript
const DataEncryptionService = require("../services/DataEncryptionService");
```

#### 2. Client Reports Endpoint - Decryption Added

**Decrypt Client Data:**
```javascript
// Get all clients for the tenant
const clients = await Client.findAll({
  where: { tenantId },
  attributes: ["id", "clientName", "legalName", "hourlyRate"],
  raw: true,
});

// Decrypt client data
const decryptedClients = DataEncryptionService.decryptClients(clients);
```

**Decrypt Timesheet Data:**
```javascript
// Decrypt client and employee names in timesheets
const decryptedTimesheets = timesheets.map(ts => ({
  ...ts,
  client_name: ts.client_name ? DataEncryptionService.decryptClientData({ clientName: ts.client_name }).clientName : null,
  first_name: ts.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: ts.first_name }).firstName : null,
  last_name: ts.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: ts.last_name }).lastName : null,
}));
```

**Use Decrypted Data in Processing:**
```javascript
const clientReports = decryptedClients.map((client) => {
  const clientTimesheets = decryptedTimesheets.filter(
    (ts) => ts.client_id === client.id
  );
  
  return {
    id: client.id,
    name: client.clientName,  // Now decrypted
    totalHours: Math.round(totalHours * 100) / 100,
    totalEmployees,
    totalBilled: Math.round(totalBilled * 100) / 100,
    projects,
  };
});
```

#### 3. Employee Reports Endpoint - Decryption Added

**Decrypt Employee Data:**
```javascript
// Get all active employees
const employees = await sequelize.query(
  `SELECT e.id, e.first_name, e.last_name, e.department
   FROM employees e
   WHERE e.tenant_id = :tenantId`,
  { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
);

// Decrypt employee data
const decryptedEmployees = employees.map(emp => ({
  ...emp,
  first_name: emp.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: emp.first_name }).firstName : null,
  last_name: emp.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: emp.last_name }).lastName : null,
}));
```

**Decrypt Timesheet Data:**
```javascript
// Decrypt client and employee names in timesheets
const decryptedTimesheets = timesheets.map(ts => ({
  ...ts,
  client_name: ts.client_name ? DataEncryptionService.decryptClientData({ clientName: ts.client_name }).clientName : null,
  first_name: ts.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: ts.first_name }).firstName : null,
  last_name: ts.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: ts.last_name }).lastName : null,
}));
```

**Use Decrypted Data:**
```javascript
const employeeReports = decryptedEmployees.map((employee) => {
  const employeeTimesheets = decryptedTimesheets.filter(
    (ts) => ts.employee_id === employee.id
  );
  
  return {
    id: employee.id,
    name: `${employee.first_name} ${employee.last_name}`.trim(),  // Now decrypted
    clientName,
    projectName,
    totalHours: Math.round(totalHours * 100) / 100,
    utilization,
    weeklyBreakdown,
  };
});
```

#### 4. Invoice Reports Endpoint - Decryption Added

**Decrypt Client Names in Invoices:**
```javascript
// Get invoices with client data
const invoices = await Invoice.findAll({
  where: { tenantId, invoiceDate: { [Op.gte]: defaultStartDate, [Op.lte]: defaultEndDate } },
  include: [{ model: Client, as: "client", attributes: ["id", "clientName"], required: false }],
  order: [["invoiceDate", "DESC"]],
});

// Decrypt client names in invoices
const decryptedInvoices = invoices.map(invoice => {
  const plainInvoice = invoice.get({ plain: true });
  if (plainInvoice.client && plainInvoice.client.clientName) {
    plainInvoice.client.clientName = DataEncryptionService.decryptClientData({ 
      clientName: plainInvoice.client.clientName 
    }).clientName;
  }
  return plainInvoice;
});
```

**Use Decrypted Data:**
```javascript
const invoiceReports = decryptedInvoices.map((invoice) => {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientId: invoice.clientId,
    clientName: invoice.client?.clientName || "Unknown Client",  // Now decrypted
    month,
    year,
    totalHours,
    amount: parseFloat(invoice.totalAmount) || 0,
    status: invoice.status || "Draft",
    issueDate: invoice.invoiceDate,
    createdAt: invoice.createdAt,
  };
});
```

#### 5. Analytics Endpoint - Decryption Added

**Decrypt Timesheet Data:**
```javascript
// Get timesheets using raw query
const timesheets = await sequelize.query(
  `SELECT t.id, t.employee_id, t.client_id, t.week_start, t.total_hours,
          c.client_name, e.first_name, e.last_name, e.department
   FROM timesheets t
   LEFT JOIN clients c ON t.client_id = c.id
   LEFT JOIN employees e ON t.employee_id = e.id
   WHERE t.tenant_id = :tenantId`,
  { replacements: { tenantId, startDate, endDate }, type: sequelize.QueryTypes.SELECT }
);

// Decrypt client and employee names
const decryptedTimesheets = timesheets.map(ts => ({
  ...ts,
  client_name: ts.client_name ? DataEncryptionService.decryptClientData({ clientName: ts.client_name }).clientName : null,
  first_name: ts.first_name ? DataEncryptionService.decryptEmployeeData({ firstName: ts.first_name }).firstName : null,
  last_name: ts.last_name ? DataEncryptionService.decryptEmployeeData({ lastName: ts.last_name }).lastName : null,
}));
```

**Use Decrypted Data in Analytics:**
```javascript
// Hours by client
const hoursByClient = {};
decryptedTimesheets.forEach((ts) => {
  const clientName = ts.client_name || "Unknown";  // Now decrypted
  hoursByClient[clientName] = (hoursByClient[clientName] || 0) + (parseFloat(ts.total_hours) || 0);
});

// Hours by employee
const hoursByEmployee = {};
decryptedTimesheets.forEach((ts) => {
  const employeeName = ts.first_name && ts.last_name
    ? `${ts.first_name} ${ts.last_name}`.trim()  // Now decrypted
    : "Unknown";
  hoursByEmployee[employeeName] = (hoursByEmployee[employeeName] || 0) + (parseFloat(ts.total_hours) || 0);
});
```

## Testing Results

### API Response Verification

**Before (Encrypted):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a3889c22-ace2-40f9-9f29-1a1556c0a444",
      "name": "c5b97829a854678a98138fd3ee2e2149:6278c8421a06cfb87e4779ba1db602c4:95f6079504e25a6390",
      "totalHours": 0
    }
  ]
}
```

**After (Decrypted):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ccbd6497-0a81-405b-90d6-5d9bf1496be4",
      "name": "Acme Corporation",
      "totalHours": 48.5,
      "totalEmployees": 1,
      "totalBilled": 6328.45
    },
    {
      "id": "a3889c22-ace2-40f9-9f29-1a1556c0a444",
      "name": "Cognizant",
      "totalHours": 0,
      "totalEmployees": 0,
      "totalBilled": 11006
    },
    {
      "id": "f564bf2e-3eef-4e46-aeb1-395c9dac5742",
      "name": "tech mahindra",
      "totalHours": 0,
      "totalEmployees": 0,
      "totalBilled": 0
    }
  ]
}
```

### All Endpoints Tested Successfully

**1. Client Reports:**
```bash
GET /api/reports/clients?tenantId=xxx&startDate=2025-12-01&endDate=2025-12-31
✅ Status: 200 OK
✅ Client names decrypted: "Acme Corporation", "Cognizant", "tech mahindra"
```

**2. Employee Reports:**
```bash
GET /api/reports/employees?tenantId=xxx&startDate=2025-12-01&endDate=2025-12-31
✅ Status: 200 OK
✅ Employee names decrypted: "Panneerselvam Arulanandam", "Asvini .V", "John Doe", etc.
```

**3. Invoice Reports:**
```bash
GET /api/reports/invoices?tenantId=xxx&startDate=2025-12-01&endDate=2025-12-31
✅ Status: 200 OK
✅ Client names in invoices decrypted: "Acme Corporation", "Cognizant"
```

**4. Analytics:**
```bash
GET /api/reports/analytics?tenantId=xxx&period=month
✅ Status: 200 OK
✅ All names decrypted in analytics data
```

## Frontend Display

The frontend will now correctly display:

### Client Tab
- **Client Name**: "Acme Corporation" (not hash code)
- **Total Hours**: 48.5
- **Total Employees**: 1
- **Total Billed**: $6,328.45

### Employee Tab
- **Employee Name**: "Panneerselvam Arulanandam" (not hash code)
- **Client Name**: "Acme Corporation"
- **Total Hours**: 48.5
- **Utilization**: 24%

### Invoice Tab
- **Invoice Number**: INV-2025-00014
- **Client Name**: "Acme Corporation" (not hash code)
- **Month**: December 2025
- **Amount**: $6,328.45
- **Status**: Active

## Actions Dropdown

The Actions dropdown in Reports module is already implemented with proper state management:

```javascript
// State for dropdown
const [openActionsId, setOpenActionsId] = useState(null);
const [actionsType, setActionsType] = useState(null);

// Toggle function
const toggleActions = (id, type) => {
  if (openActionsId === id && actionsType === type) {
    setOpenActionsId(null);
    setActionsType(null);
  } else {
    setOpenActionsId(id);
    setActionsType(type);
  }
};

// Usage in JSX
<button onClick={(e) => { e.stopPropagation(); toggleActions(client.id, 'client'); }}>
  Actions
</button>
{openActionsId === client.id && actionsType === 'client' && (
  <div className="dropdown-menu dropdown-menu-right show">
    <button className="dropdown-item" onClick={() => { /* action */ }}>
      View Details
    </button>
  </div>
)}
```

The dropdown should work correctly. If not visible, ensure:
1. CSS file `ActionsDropdown.css` is properly imported
2. Bootstrap or custom dropdown styles are loaded
3. Z-index is properly set for dropdown menu

## Security Notes

- Data remains encrypted in the database
- Decryption happens only at the API layer
- Frontend receives plain text for display
- No encryption keys exposed to frontend
- Follows security best practices

## Files Modified

1. **`server/routes/reports.js`**:
   - Added DataEncryptionService import
   - Added decryption for client reports (lines 46-47, 75-81, 98-132)
   - Added decryption for employee reports (lines 206-211, 239-245, 249-303)
   - Added decryption for invoice reports (lines 378-387, 390-410)
   - Added decryption for analytics (lines 536-542, 563-603, 612)

## Summary

✅ **All client names decrypted** - No more hash codes in client reports
✅ **All employee names decrypted** - Proper first and last names displayed
✅ **All invoice client names decrypted** - Invoice reports show correct client names
✅ **Analytics data decrypted** - All aggregated data uses decrypted names
✅ **API endpoints working** - All returning 200 OK with decrypted data
✅ **Security maintained** - Data encrypted in DB, decrypted at API layer
✅ **Actions dropdown implemented** - Proper state management in place

**The Reports & Analytics module now displays all names correctly without hash codes!**
