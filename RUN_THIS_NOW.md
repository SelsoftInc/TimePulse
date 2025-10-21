# 🚀 RUN THESE COMMANDS NOW

## Step 1: Create Timesheet Data (PostgreSQL)

```bash
cd server
node scripts/setup-postgres-timesheet.js
```

**This will:**
- ✅ Add missing database columns (PostgreSQL compatible)
- ✅ Link Selvakumar user to employee record
- ✅ Create timesheet for Sep 29 - Oct 05, 2025
- ✅ Assign Pushban as reviewer
- ✅ Set status to "submitted"
- ✅ Total hours: 40

---

## Step 2: Restart Backend Server

```bash
# Press Ctrl+C to stop the current server
npm start
```

---

## Step 3: In Browser

1. **Logout** from current session
2. **Login** as: `selvakumar@selsoftinc.com`
3. **Navigate to**: Timesheets page
4. **You will see**: Timesheet data displayed!

---

## ✅ Expected Result

**Timesheets Page will show:**
- Week Range: "29 SEP, 2025 To 05 OCT, 2025"
- Status: "Submitted for Approval"
- Hours: 40.00
- Total: 1 timesheet

**Browser Console will show:**
```
🔍 Loading timesheets... { tenantId: "...", employeeId: "...", ... }
📡 Calling API: /api/timesheets/employee/.../all?tenantId=...
✅ API Response: { success: true, timesheets: [...] }
📊 Formatted timesheets: [...]
```

---

## 🎯 To Test Approval Workflow

1. **Logout** from Selvakumar
2. **Login** as: `pushban@selsoftinc.com`
3. **Go to**: Timesheet Approval page
4. **Click**: "Review" on Selvakumar's timesheet
5. **Approve** the timesheet
6. **Logout** and login as Selvakumar again
7. **Status will show**: "Approved"

---

## 🔧 If It Still Doesn't Work

Check browser console (F12 → Console tab) and share:
1. Any error messages
2. The API call URL
3. The response data

---

**START WITH STEP 1 - Run the script now!** 🚀
