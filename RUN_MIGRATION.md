# 🔧 Fix: Run Database Migration

## Error: "column User.approval_status does not exist"

This error occurs because the database migration hasn't been run yet. Follow these steps to fix it:

---

## ✅ Solution 1: Run Node.js Migration Script (Recommended)

### **Step 1: Navigate to server directory**
```bash
cd d:\selsoft\WebApp\TimePulse\server
```

### **Step 2: Run the migration**
```bash
node migrations/add-user-approval-status.js
```

### **Expected Output:**
```
🔄 Connecting to database...
✅ Database connection established

🔄 Starting migration: Add approval_status fields to users table
➕ Adding approval_status column...
✅ approval_status column added
➕ Adding approved_by column...
✅ approved_by column added
➕ Adding approved_at column...
✅ approved_at column added
➕ Adding rejection_reason column...
✅ rejection_reason column added

✅ Migration completed successfully!

📊 Updated columns:
   - approval_status (STRING, default: "approved")
   - approved_by (UUID, nullable)
   - approved_at (DATE, nullable)
   - rejection_reason (TEXT, nullable)

🔌 Database connection closed

✅ All done!
```

### **Step 3: Restart the server**
```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
```

---

## ✅ Solution 2: Run SQL Script Directly

If the Node.js migration fails, you can run the SQL script directly:

### **Step 1: Connect to your PostgreSQL database**

**Using psql:**
```bash
psql -h localhost -U postgres -d timepulse
```

**Using pgAdmin:**
- Open pgAdmin
- Connect to your database
- Open Query Tool

### **Step 2: Run the SQL script**

**Option A: Run the file**
```bash
psql -h localhost -U postgres -d timepulse -f server/migrations/add-user-approval-status.sql
```

**Option B: Copy and paste SQL**
```sql
-- Add approval_status column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved' NOT NULL;

-- Add approved_by column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add approved_at column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add rejection_reason column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

### **Step 3: Verify columns were added**
```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('approval_status', 'approved_by', 'approved_at', 'rejection_reason')
ORDER BY column_name;
```

**Expected Result:**
```
    column_name     | data_type | column_default | is_nullable
--------------------+-----------+----------------+-------------
 approval_status    | varchar   | 'approved'     | NO
 approved_at        | timestamp |                | YES
 approved_by        | uuid      |                | YES
 rejection_reason   | text      |                | YES
```

---

## ✅ Solution 3: Manual Database Update (Quick Fix)

If you just want to fix it quickly without running scripts:

### **Connect to database and run:**
```sql
ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'approved' NOT NULL;
ALTER TABLE users ADD COLUMN approved_by UUID;
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN rejection_reason TEXT;
```

---

## 🔍 Verify Migration Success

After running the migration, verify it worked:

### **1. Check columns exist:**
```sql
\d users
-- or
SELECT * FROM information_schema.columns WHERE table_name = 'users';
```

### **2. Check existing users have default value:**
```sql
SELECT id, email, approval_status FROM users LIMIT 5;
```

All existing users should have `approval_status = 'approved'`

### **3. Test the application:**
1. Restart the backend server
2. Try to login
3. Error should be gone ✅

---

## 🚀 After Migration

Once the migration is complete:

1. **Restart Backend Server:**
   ```bash
   cd server
   npm start
   ```

2. **Test Login:**
   - Go to login page
   - Try logging in with existing user
   - Should work without errors ✅

3. **Test New OAuth Registration:**
   - Sign in with Google as a new user
   - Complete onboarding
   - Should see "Pending Approval" page ✅

4. **Test Admin Approval:**
   - Login as admin
   - Check notification bell
   - Go to User Approvals page
   - Approve/reject users ✅

---

## 🐛 Troubleshooting

### **Error: "relation 'users' does not exist"**
- Your database might not be set up yet
- Run the main database setup first

### **Error: "column already exists"**
- Migration was already run
- You can safely ignore this error
- Or drop the columns and re-run:
  ```sql
  ALTER TABLE users DROP COLUMN IF EXISTS approval_status;
  ALTER TABLE users DROP COLUMN IF EXISTS approved_by;
  ALTER TABLE users DROP COLUMN IF EXISTS approved_at;
  ALTER TABLE users DROP COLUMN IF EXISTS rejection_reason;
  ```

### **Error: "permission denied"**
- Make sure your database user has ALTER TABLE permissions
- Try connecting as superuser (postgres)

### **Migration script not found**
- Make sure you're in the correct directory
- Path should be: `d:\selsoft\WebApp\TimePulse\server`
- File should exist: `migrations/add-user-approval-status.js`

---

## 📝 What This Migration Does

Adds 4 new columns to the `users` table:

1. **approval_status** (VARCHAR(20), default: 'approved')
   - Values: 'pending', 'approved', 'rejected'
   - Controls whether user can login

2. **approved_by** (UUID, nullable)
   - References the admin user who approved/rejected
   - Foreign key to users.id

3. **approved_at** (TIMESTAMP, nullable)
   - Timestamp when user was approved/rejected

4. **rejection_reason** (TEXT, nullable)
   - Optional reason for rejection
   - Shown to user if rejected

---

## ✅ Success Indicators

You'll know the migration worked when:

- ✅ No more "column does not exist" errors
- ✅ Can login with existing users
- ✅ New OAuth users show "Pending Approval" page
- ✅ Admin can see User Approvals page
- ✅ Notification bell works

---

## 📞 Still Having Issues?

If you're still getting errors after running the migration:

1. Check server logs for detailed error messages
2. Verify database connection in `.env` file
3. Make sure you restarted the server after migration
4. Check that all 4 columns were added successfully
5. Try the SQL script method if Node.js method failed

---

**Last Updated:** December 10, 2025  
**Status:** Ready to Run
