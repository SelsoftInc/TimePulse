# Delete Test Users from Production Database

## Overview
This directory contains scripts to delete test users from the production AWS RDS database.

## Test Users to Delete
Based on the production screenshot, the following test users need to be deleted:
1. **Approver User** - approver@selsoft.com
2. **Employee User** - employee@selsoft.com  
3. **Manager User** - manager@selsoft.com

## Scripts Available

### 1. `delete-test-users-aws.js` (Recommended for AWS RDS)
- Designed for AWS RDS PostgreSQL database
- Includes SSL support
- Comprehensive error handling
- Shows related data count before deletion
- 5-second confirmation delay

### 2. `delete-test-users-production.js` (Generic PostgreSQL)
- Works with any PostgreSQL database
- Simpler implementation
- Good for local testing

## Prerequisites

### 1. Environment Variables
Create or update your `.env` file with AWS RDS credentials:

```bash
# AWS RDS Production Database
AWS_DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
AWS_DB_NAME=timepulse
AWS_DB_USER=postgres
AWS_DB_PASSWORD=your-secure-password
AWS_DB_PORT=5432
AWS_DB_SSL=true
```

### 2. Database Backup
**CRITICAL**: Create a database backup before running this script!

```bash
# For AWS RDS, create a snapshot via AWS Console or CLI
aws rds create-db-snapshot \
  --db-instance-identifier your-db-instance \
  --db-snapshot-identifier timepulse-backup-$(date +%Y%m%d-%H%M%S)
```

### 3. Dependencies
Ensure you have the required npm packages:
```bash
cd server
npm install sequelize pg pg-hstore dotenv
```

## How to Run

### Step 1: Navigate to server directory
```bash
cd d:\selsoft\WebApp\TimePulse\server
```

### Step 2: Run the AWS deletion script
```bash
node scripts/delete-test-users-aws.js
```

### Step 3: Review the output
The script will:
1. Display connection information
2. List users to be deleted
3. Wait 5 seconds for confirmation (Press Ctrl+C to cancel)
4. Connect to the database
5. For each test user:
   - Find the user record
   - Find associated employee record
   - Check for related data (timesheets, leaves, invoices)
   - Delete employee record (if exists)
   - Delete user account
6. Display summary of deletions

## Expected Output

```
==================================================================
⚠️  WARNING: PRODUCTION DATABASE DELETION SCRIPT
==================================================================

This script will DELETE the following test users from PRODUCTION:

   1. Approver User (approver@selsoft.com)
   2. Employee User (employee@selsoft.com)
   3. Manager User (manager@selsoft.com)

Database Configuration:
   Host: your-rds-endpoint.region.rds.amazonaws.com
   Database: timepulse
   User: postgres

⚠️  IMPORTANT:
   - Ensure you have a recent database backup
   - This action cannot be undone
   - Related data (timesheets, leaves) will be orphaned

==================================================================

Press Ctrl+C to CANCEL, or wait 5 seconds to proceed...

🔌 Connecting to AWS RDS Production database...
✅ Database connection established successfully

🔍 Searching for test users in production database...

📧 Processing: Approver User (approver@selsoft.com)
   ✓ Found user in database:
     - Name: Approver User
     - ID: xxx-xxx-xxx
     - Tenant ID: xxx-xxx-xxx
     - Role: employee
     - Status: active

   ✓ Found associated employee record:
     - Employee ID: xxx-xxx-xxx
     - Status: active
   🗑️  Deleting employee record...
   ✅ Employee record deleted

   📊 Related data found:
     - Timesheets: 0
     - Leave Requests: 0
     - Invoices: 0

   🗑️  Deleting user account from database...
   ✅ User account deleted successfully

... (similar output for other users)

✅ Test user deletion completed!

📊 Summary:
   - Total test users processed: 3
   - Successfully deleted: 3
   - Not found: 0
   - Database: timepulse
   - Host: your-rds-endpoint.region.rds.amazonaws.com

✅ Production database cleanup complete!

🔌 Database connection closed
```

## Troubleshooting

### Connection Errors
If you get connection errors:
1. Verify AWS RDS security group allows your IP
2. Check VPN connection if required
3. Verify database credentials in `.env`
4. Ensure SSL is properly configured

### User Not Found
If a user is not found:
- The user may have already been deleted
- Check the email address spelling
- Verify you're connected to the correct database

### Permission Errors
If you get permission errors:
- Ensure the database user has DELETE permissions
- Check if the user has access to both Users and Employees tables

## Safety Features

1. **5-Second Delay**: Gives you time to cancel (Ctrl+C)
2. **Detailed Logging**: Shows exactly what will be deleted
3. **Related Data Check**: Warns about orphaned data
4. **Error Handling**: Comprehensive error messages
5. **Connection Validation**: Tests connection before proceeding

## After Deletion

### Verify Deletion
Run this SQL query to verify users are deleted:

```sql
SELECT email, "firstName", "lastName", role, status 
FROM "Users" 
WHERE email IN (
  'approver@selsoft.com',
  'employee@selsoft.com',
  'manager@selsoft.com'
);
```

Should return 0 rows.

### Check Employee Table
```sql
SELECT id, email, "firstName", "lastName", status 
FROM "Employees" 
WHERE email IN (
  'approver@selsoft.com',
  'employee@selsoft.com',
  'manager@selsoft.com'
);
```

Should return 0 rows.

## Rollback (If Needed)

If you need to rollback:
1. Restore from the database snapshot you created
2. Or restore from automated AWS RDS backups

```bash
# Restore from snapshot via AWS CLI
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier your-db-instance-restored \
  --db-snapshot-identifier timepulse-backup-YYYYMMDD-HHMMSS
```

## Important Notes

⚠️ **WARNING**: This operation is IRREVERSIBLE without a backup!

- Always create a backup before running
- Test on a staging environment first if possible
- Verify you're connected to the correct database
- Review the output carefully before confirming
- Keep the terminal output for audit purposes

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify database connection settings
3. Ensure you have proper permissions
4. Check AWS RDS logs if needed
5. Contact database administrator if problems persist
