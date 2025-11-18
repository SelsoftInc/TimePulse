# Run Production Database Migration

## 🎯 Goal
Add missing columns (`daily_hours`, `notes`, `attachments`, `reviewer_id`) to the production `timesheets` table.

## 📋 Production Database Details
- **Host**: `timepulse-cluster.cluster-chb4yd9ykrnf.us-east-1.rds.amazonaws.com`
- **Database**: `timepulse_db`
- **User**: `postgres`
- **Password**: Stored in AWS Secrets Manager (`timepulse-db-password-ockLr9`)

## ✅ Option 1: AWS RDS Query Editor (Recommended - Easiest)

1. **Go to AWS Console** → RDS → Databases
2. **Select your database**: `timepulse-cluster`
3. **Click "Query Editor"** (or use RDS Query Editor in AWS Console)
4. **Connect to database** using:
   - Database: `timepulse_db`
   - Username: `postgres`
   - Password: Get from AWS Secrets Manager
5. **Copy and paste** the SQL from `server/scripts/add-daily-hours-production.sql`
6. **Execute** the query
7. **Verify** the columns were added

## ✅ Option 2: Using psql Command Line

```bash
# Get password from AWS Secrets Manager first
aws secretsmanager get-secret-value \
  --secret-id timepulse-db-password-ockLr9 \
  --region us-east-1 \
  --query SecretString --output text

# Then connect and run migration
psql -h timepulse-cluster.cluster-chb4yd9ykrnf.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d timepulse_db \
     -f server/scripts/add-daily-hours-production.sql
```

## ✅ Option 3: Run via App Runner Instance

If you have SSH access to App Runner or can execute commands:

```bash
# Set production environment
export NODE_ENV=production
export USE_LOCAL_DB=false
export DB_HOST=timepulse-cluster.cluster-chb4yd9ykrnf.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=timepulse_db
export DB_USER=postgres
export DB_SSL=true
export DB_SSL_REJECT_UNAUTHORIZED=false

# Get password from Secrets Manager
export DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id timepulse-db-password-ockLr9 \
  --region us-east-1 \
  --query SecretString --output text)

# Run migration
cd server
node scripts/add-daily-hours-column.js
```

## ✅ Option 4: Direct SQL (Simplest)

Just run this SQL directly in RDS Query Editor:

```sql
-- Add daily_hours column
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS daily_hours JSONB 
DEFAULT '{"mon":0,"tue":0,"wed":0,"thu":0,"fri":0,"sat":0,"sun":0}'::jsonb;

-- Add notes column
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add attachments column
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS attachments JSONB 
DEFAULT '[]'::jsonb;

-- Add reviewer_id column
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS reviewer_id UUID 
REFERENCES users(id) ON DELETE SET NULL;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'timesheets'
AND column_name IN ('daily_hours', 'notes', 'attachments', 'reviewer_id');
```

## 🔍 Verify Migration

After running, verify the columns exist:

```sql
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'timesheets'
AND column_name IN ('daily_hours', 'notes', 'attachments', 'reviewer_id')
ORDER BY column_name;
```

Expected output:
```
column_name   | data_type | column_default
--------------+-----------+----------------------------------------
attachments   | jsonb     | '[]'::jsonb
daily_hours   | jsonb     | '{"mon":0,"tue":0,...}'::jsonb
notes         | text      | null
reviewer_id   | uuid      | null
```

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before running migrations
2. **Downtime**: Adding columns is usually fast (< 1 second), but consider a brief maintenance window
3. **Data Safety**: Existing timesheet records will get default values for new columns
4. **Idempotent**: The SQL uses `IF NOT EXISTS` so it's safe to run multiple times

## 🚀 After Migration

Once the migration is complete:
1. ✅ Timesheet submission will work
2. ✅ No more `column "daily_hours" does not exist` error
3. ✅ All timesheet data will save correctly

## 📝 Quick Reference

**SQL File**: `server/scripts/add-daily-hours-production.sql`

**Columns to Add**:
- `daily_hours` (JSONB) - Daily hours breakdown
- `notes` (TEXT) - Timesheet notes
- `attachments` (JSONB) - File attachments
- `reviewer_id` (UUID) - Reviewer reference

