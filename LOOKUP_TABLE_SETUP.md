# Lookup Table Implementation Guide

## Overview
Created a comprehensive lookup table system for payment terms and other configurable values in TimePulse.

## What Was Implemented

### 1. Database Model (`/server/models/Lookup.js`)
- **Table**: `lookups`
- **Fields**:
  - `id` - Primary key
  - `category` - Type of lookup (e.g., 'payment_terms', 'client_type')
  - `code` - Unique code for the value
  - `label` - Display label
  - `value` - Optional additional value
  - `displayOrder` - Sort order
  - `isActive` - Active/inactive flag
  - `tenantId` - Optional for tenant-specific lookups
  - `createdAt`, `updatedAt` - Timestamps

### 2. Backend API (`/server/routes/lookups.js`)
**Endpoints**:
- `GET /api/lookups/:category` - Get lookups by category
- `GET /api/lookups` - Get all lookups grouped by category
- `POST /api/lookups` - Create new lookup (admin)
- `PUT /api/lookups/:id` - Update lookup (admin)
- `DELETE /api/lookups/:id` - Soft delete lookup (admin)

### 3. Seed Data Script (`/server/seedLookups.js`)
Seeds initial lookup data:
- **Payment Terms**: Due on Receipt, Net 15, Net 30, Net 45, Net 60, Net 90
- **Client Types**: Direct Client, Through Vendor, Implementation Partner
- **Invoice Statuses**: Draft, Sent, Paid, Overdue, Cancelled
- **Timesheet Statuses**: Draft, Submitted, Approved, Rejected

### 4. Frontend Integration
- Updated `/frontend/src/config/lookups.js` with `fetchPaymentTerms()` function
- Updated `/frontend/src/components/clients/ClientForm.jsx` to load payment terms dynamically
- Fallback to hardcoded values if API fails

## Setup Instructions

### Step 1: Run the Seed Script

```bash
cd server
node seedLookups.js
```

**Expected Output**:
```
🌱 Starting lookup data seeding...
🔧 Using LOCAL database configuration
✅ Lookup data seeded successfully!
   - Payment Terms: 6 records
   - Client Types: 3 records
   - Invoice Statuses: 5 records
   - Timesheet Statuses: 4 records
   - Total: 18 records
```

### Step 2: Restart the Server

The server should automatically pick up the new Lookup model. If using nodemon, it will restart automatically.

### Step 3: Verify API Endpoints

Test the payment terms endpoint:
```bash
curl http://44.222.217.57:5001/api/lookups/payment_terms
```

**Expected Response**:
```json
{
  "success": true,
  "category": "payment_terms",
  "lookups": [
    { "id": 1, "code": "due_on_receipt", "label": "Due on Receipt", "value": "0", "displayOrder": 1 },
    { "id": 2, "code": "net15", "label": "Net 15", "value": "15", "displayOrder": 2 },
    { "id": 3, "code": "net30", "label": "Net 30", "value": "30", "displayOrder": 3 },
    { "id": 4, "code": "net45", "label": "Net 45", "value": "45", "displayOrder": 4 },
    { "id": 5, "code": "net60", "label": "Net 60", "value": "60", "displayOrder": 5 },
    { "id": 6, "code": "net90", "label": "Net 90", "value": "90", "displayOrder": 6 }
  ],
  "total": 6
}
```

### Step 4: Test Frontend

1. Navigate to client creation/edit page
2. Check the Payment Term dropdown
3. It should now load values from the database

## API Usage Examples

### Get Payment Terms
```javascript
const response = await fetch('http://44.222.217.57:5001/api/lookups/payment_terms');
const data = await response.json();
// data.lookups contains the payment terms
```

### Get All Lookups
```javascript
const response = await fetch('http://44.222.217.57:5001/api/lookups');
const data = await response.json();
// data.lookups is grouped by category
```

### Create Custom Lookup (Admin)
```javascript
const response = await fetch('http://44.222.217.57:5001/api/lookups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'payment_terms',
    code: 'net120',
    label: 'Net 120',
    value: '120',
    displayOrder: 7
  })
});
```

## Database Schema

```sql
CREATE TABLE lookups (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  code VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  value VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tenant_id INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(category, code)
);

CREATE INDEX idx_lookups_category_active ON lookups(category, is_active);
CREATE INDEX idx_lookups_tenant ON lookups(tenant_id);
```

## Benefits

✅ **Centralized Configuration**: All lookup values in one table
✅ **Dynamic Updates**: Change values without code deployment
✅ **Tenant-Specific**: Support for tenant-specific lookups
✅ **Soft Delete**: Deactivate instead of delete for data integrity
✅ **Ordered Display**: Control display order with displayOrder field
✅ **API-Driven**: Frontend loads values dynamically
✅ **Fallback Support**: Hardcoded fallback if API fails

## Future Enhancements

1. **Admin UI**: Create admin interface to manage lookups
2. **Caching**: Add caching layer for better performance
3. **Validation**: Add validation rules to lookup values
4. **Audit Trail**: Track changes to lookup values
5. **Import/Export**: Bulk import/export of lookup data
6. **Multi-language**: Support for multiple languages

## Lookup Categories Available

- `payment_terms` - Payment terms for invoices
- `client_type` - Types of clients
- `invoice_status` - Invoice statuses
- `timesheet_status` - Timesheet statuses

## Adding New Lookup Categories

1. Add seed data in `/server/seedLookups.js`
2. Create fetch function in `/frontend/src/config/lookups.js`
3. Update components to use dynamic lookups
4. Run seed script to populate data

## Troubleshooting

### Lookups table doesn't exist
Run: `node server/seedLookups.js`

### API returns empty array
Check database connection and verify seed script ran successfully

### Frontend shows hardcoded values
Check browser console for API errors. Verify API endpoint is accessible.

### Duplicate key error
Lookups with same category+code already exist. Update existing or use different code.
