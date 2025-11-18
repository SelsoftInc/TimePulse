# Fix Timesheet Submission Error

## 🔴 Error

```
column "daily_hours" does not exist
500 Internal Server Error
```

## 🔍 Root Cause

The production database schema (`timepulse_schema.sql`) is missing the `daily_hours` column that the Sequelize model expects.

**Database Schema (Current):**
- ✅ Has: `week_start_date`, `week_end_date`, `time_entries`, `total_hours`
- ❌ Missing: `daily_hours`, `notes`, `attachments`, `reviewer_id`

**Sequelize Model (Expected):**
- Expects: `dailyHours` → maps to `daily_hours` column
- Expects: `notes` → maps to `notes` column
- Expects: `attachments` → maps to `attachments` column
- Expects: `reviewerId` → maps to `reviewer_id` column

## ✅ Solution

### Step 1: Run Migration Script

Execute the migration script to add missing columns:

```bash
cd server
node scripts/add-daily-hours-column.js
```

**What it does:**
1. Connects to the database (uses same config as the app)
2. Checks if `daily_hours` column exists
3. Adds `daily_hours` column if missing
4. Also adds `notes`, `attachments`, `reviewer_id` if missing
5. Sets appropriate defaults and constraints

### Step 2: Verify Columns Added

After running the script, verify the columns exist:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'timesheets'
ORDER BY column_name;
```

You should see:
- `daily_hours` (JSONB)
- `notes` (TEXT)
- `attachments` (JSONB)
- `reviewer_id` (UUID)

### Step 3: Test Timesheet Submission

1. Go to timesheet submission page
2. Fill in timesheet data
3. Submit timesheet
4. Should work without errors now

## 📝 Manual SQL Alternative

If you prefer to run SQL directly:

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
```

## 🔧 For Production (AWS RDS)

If running against production database:

1. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export USE_LOCAL_DB=false
   ```

2. **Or use AWS RDS connection directly:**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com \
        -U postgres \
        -d timepulse_db \
        -f add-daily-hours.sql
   ```

3. **Or run via App Runner/EC2:**
   ```bash
   # SSH into your server or use App Runner console
   cd /app/server
   node scripts/add-daily-hours-column.js
   ```

## ✅ Expected Result

After running the migration:
- ✅ `daily_hours` column exists
- ✅ `notes` column exists
- ✅ `attachments` column exists
- ✅ `reviewer_id` column exists
- ✅ Timesheet submission works without errors

## 🚨 Important Notes

1. **Backup First**: Always backup your database before running migrations
2. **Downtime**: Adding columns is usually fast, but consider brief maintenance window
3. **Data Safety**: Existing timesheet records will get default values for new columns
4. **Rollback**: If needed, you can drop the columns (but data will be lost)

## 📊 Column Details

### `daily_hours` (JSONB)
- **Purpose**: Store daily hours breakdown (Mon-Sun)
- **Default**: `{"mon":0,"tue":0,"wed":0,"thu":0,"fri":0,"sat":0,"sun":0}`
- **Required**: Yes (has default)

### `notes` (TEXT)
- **Purpose**: Store timesheet notes/comments
- **Default**: NULL
- **Required**: No

### `attachments` (JSONB)
- **Purpose**: Store file attachment metadata
- **Default**: `[]`
- **Required**: Yes (has default)

### `reviewer_id` (UUID)
- **Purpose**: Reference to user who reviews/approves timesheet
- **Default**: NULL
- **Required**: No
- **Foreign Key**: References `users(id)`

## 🔄 Next Steps

1. Run the migration script
2. Test timesheet submission
3. Verify data is saved correctly
4. Monitor for any other missing columns

