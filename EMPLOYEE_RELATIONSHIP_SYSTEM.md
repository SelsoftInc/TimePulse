# Employee Relationship System - Complete Documentation

## Summary

Created a centralized employee_relationships table to manage all employee-approver/manager relationships.

## Key Features

- Single source of truth for all approval relationships
- Supports multiple relationship types (leave, timesheet, expense approvers)
- Primary and backup approvers
- Time-based relationships (effective dates)
- Cascade delete when employee removed

## Setup

Run migration:
```bash
psql -U postgres -d timepulse_db -f server/migrations/create-employee-relationships.sql
```

## Model Location
- /server/models/EmployeeRelationship.js
- Registered in /server/models/index.js

## Relationship Types
- manager
- leave_approver
- timesheet_approver
- expense_approver
- performance_reviewer
- mentor
- backup_approver

## Usage

Get leave approver for employee:
```javascript
const approver = await EmployeeRelationship.findOne({
  where: {
    employeeId: employeeId,
    relationshipType: 'leave_approver',
    isActive: true,
    isPrimary: true
  }
});
```

This ensures approvers only see requests from their assigned employees!
