# 🔴 Database Connection Error - Quick Fix Guide

## The Problem

Your server is showing:
```
❌ Unable to connect to the database: ConnectionRefusedError
```

**Cause**: PostgreSQL is not installed or not running.

---

## ✅ Quick Solutions (Choose One)

### 🚀 Solution 1: Use Docker (Fastest - 2 Minutes)

**Requirements**: Docker Desktop installed

```powershell
# Option A: Run the helper script
.\start-database.ps1

# Option B: Use docker-compose
docker-compose up -d postgres

# Option C: Manual docker command
docker run --name timepulse-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=timepulse_db `
  -p 5432:5432 `
  -d postgres:15-alpine
```

**Then**:
```powershell
cd server
npm run setup-db
npm run dev
```

✅ **Done!** Server should start successfully.

---

### 🔧 Solution 2: Install PostgreSQL (10 Minutes)

1. **Download**: https://www.postgresql.org/download/windows/
2. **Install**: Use default settings, set password to `postgres`
3. **Create Database**:
   ```powershell
   # Navigate to PostgreSQL bin folder
   cd "C:\Program Files\PostgreSQL\16\bin"
   
   # Connect
   .\psql -U postgres
   
   # Create database
   CREATE DATABASE timepulse_db;
   \q
   ```

4. **Initialize Schema**:
   ```powershell
   cd server
   npm run setup-db
   npm run dev
   ```

✅ **Done!** Server should start successfully.

---

### 🔄 Solution 3: Use SQLite (Temporary - 30 Seconds)

**⚠️ For testing only, not for production!**

Edit `server\.env`:
```env
USE_SQLITE=true
USE_LOCAL_DB=false
```

Then:
```powershell
cd server
npm run setup-db
npm run dev
```

✅ **Done!** Server will use SQLite instead.

---

## 📋 After Fixing

Your server should show:
```
✅ Database connection has been established successfully.
🚀 Server is running on port 5001
```

---

## 🆘 Still Not Working?

See detailed guide: **FIX_DATABASE_CONNECTION.md**

Or run:
```powershell
.\start-database.ps1
```

---

## 🎯 Recommended

- **For Development**: Docker (Solution 1)
- **For Production**: PostgreSQL (Solution 2)
- **For Quick Test**: SQLite (Solution 3)
