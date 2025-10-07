# 🔧 MANUAL FIX STEPS - Timesheet Data Not Loading

## Current Problem:
- Backend server is stuck on port 5001
- Code has been updated but .env file overrides the port
- Data exists in database but not showing in UI

## ✅ SOLUTION - Follow These Steps Exactly:

### Step 1: Stop All Running Servers

1. **Find ALL terminals/command prompts** running Node.js
2. **Press Ctrl+C** in each one to stop them
3. **Close those terminal windows**

### Step 2: Kill Process on Port 5001

Open a **NEW** PowerShell window and run:
```powershell
$process = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
    Write-Host "Killed process on port 5001"
} else {
    Write-Host "No process found on port 5001"
}
```

### Step 3: Start Backend Server

In the same PowerShell window:
```bash
cd D:\selsoft\WebApp\TimePulse\server
npm start
```

**Wait for these messages:**
```
✅ Database connection established successfully
🚀 TimePulse Server running on port 5001
```

### Step 4: Test the API

Open **ANOTHER** PowerShell window and run:
```powershell
# Test 1: Check server is running
curl http://localhost:5001/health

# Test 2: Check pending approvals
curl "http://localhost:5001/api/timesheets/pending-approval?tenantId=5eda5596-b1d9-4963-953d-7af9d0511ce8"

# Test 3: Check employee lookup
curl "http://localhost:5001/api/timesheets/employees/by-email/selvakumar@selsoftinc.com?tenantId=5eda5596-b1d9-4963-953d-7af9d0511ce8"
```

**Expected Results:**
- Test 1: Should return `{"status":"healthy"...}`
- Test 2: Should return `{"success":true,"timesheets":[...]}`  with 1 timesheet
- Test 3: Should return `{"success":true,"employee":{"id":"5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3"...}}`

### Step 5: Restart Frontend (if needed)

If frontend is running:
1. Go to frontend terminal
2. Press Ctrl+C
3. Run: `npm start`

### Step 6: Clear Browser Cache and Login

1. **Open browser DevTools** (F12)
2. **Go to Application tab** → Clear Storage → Clear site data
3. **Refresh page** (Ctrl+F5)
4. **Login as**: `selvakumar@selsoftinc.com`
5. **Go to**: Timesheets page

### Step 7: Check Browser Console

In DevTools Console tab, you should see:
```
🔍 Loading timesheets... { tenantId: "...", userEmail: "selvakumar@selsoftinc.com" }
📡 Fetching employee by email...
✅ Got employeeId: 5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3
📡 Calling API: /api/timesheets/employee/5c1982f0-bf32-4945-b6a6-b3eaf5a27cb3/all?tenantId=...
✅ API Response: { success: true, timesheets: [...] }
```

---

## 🎯 Expected Final Result:

### Employee View (Selvakumar):
- **Shows**: "1 of 1 items"
- **Week**: "SEP 29, 2025 To OCT 05, 2025"
- **Status**: "Submitted for Approval"
- **Hours**: 40.00

### Admin View (Pushban):
- **Pending**: 1
- **Employee**: Selvakumar Murugesan
- **Week**: Sep 29 - Oct 05, 2025
- **Can click**: "Review" button

---

## 🚨 If Still Not Working:

### Check 1: Verify Database
```bash
cd D:\selsoft\WebApp\TimePulse\server
node scripts/check-pending.js
```
Should show: "Found 1 submitted timesheets"

### Check 2: Check Browser Network Tab
1. Open DevTools → Network tab
2. Refresh Timesheets page
3. Look for failed API calls (red)
4. Click on them to see error details

### Check 3: Share Console Errors
If you see errors in browser console, share them so I can help debug.

---

**START WITH STEP 1 - Stop all servers and follow each step carefully!** 🚀
