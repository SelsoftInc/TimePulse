# Fix Database Connection Error

## 🔴 Problem

```
❌ Unable to connect to the database: ConnectionRefusedError
```

This error means **PostgreSQL is not installed or not running** on your system.

## ✅ Solutions

You have **3 options** to fix this:

---

## Option 1: Install PostgreSQL (Recommended for Production)

### Step 1: Download PostgreSQL

Download from: https://www.postgresql.org/download/windows/

**Recommended Version**: PostgreSQL 16.x or 15.x

### Step 2: Install PostgreSQL

1. Run the installer
2. **Important Settings:**
   - Port: `5432` (default)
   - Password: Set a password (e.g., `postgres`)
   - Remember this password!
3. Install all components (PostgreSQL Server, pgAdmin, Command Line Tools)

### Step 3: Verify Installation

```powershell
# Check if PostgreSQL service is running
Get-Service -Name "postgresql*"

# Should show Status: Running
```

### Step 4: Create Database

```powershell
# Open Command Prompt or PowerShell
# Navigate to PostgreSQL bin directory (usually):
cd "C:\Program Files\PostgreSQL\16\bin"

# Connect to PostgreSQL
.\psql -U postgres

# Enter your password when prompted

# Create database
CREATE DATABASE timepulse_db;

# Verify
\l

# Exit
\q
```

### Step 5: Update Server Configuration

Edit `server\.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timepulse_db
DB_USER=postgres
DB_PASSWORD=your_password_here  # Change this!
DB_SSL=false
```

### Step 6: Initialize Database Schema

```powershell
cd server
npm run setup-db
```

### Step 7: Start Server

```powershell
npm run dev
```

---

## Option 2: Use Docker PostgreSQL (Quick Setup)

If you have Docker installed:

### Step 1: Install Docker Desktop

Download from: https://www.docker.com/products/docker-desktop/

### Step 2: Start PostgreSQL Container

```powershell
docker run --name timepulse-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=timepulse_db `
  -p 5432:5432 `
  -d postgres:15
```

### Step 3: Verify Container is Running

```powershell
docker ps
```

Should show `timepulse-postgres` container running.

### Step 4: Update Server Configuration

Edit `server\.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timepulse_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

### Step 5: Initialize Database

```powershell
cd server
npm run setup-db
```

### Step 6: Start Server

```powershell
npm run dev
```

**To stop PostgreSQL:**
```powershell
docker stop timepulse-postgres
```

**To start again:**
```powershell
docker start timepulse-postgres
```

---

## Option 3: Use SQLite (Development Only - Quick Fix)

**⚠️ Warning**: SQLite is NOT recommended for production. Use only for quick testing.

### Step 1: Update Server Configuration

Edit `server\.env`:

```env
# Change this line
USE_LOCAL_DB=false

# Add this line
USE_SQLITE=true
```

### Step 2: Update Database Config

Edit `server\models\index.js` around line 16-27:

```javascript
const getDbConfig = () => {
  const env = process.env.NODE_ENV || "development";
  
  // Check if SQLite mode is enabled
  if (process.env.USE_SQLITE === "true") {
    return {
      dialect: "sqlite",
      storage: "./database.sqlite",
      logging: console.log
    };
  }
  
  const isLocal = env === "development" || process.env.USE_LOCAL_DB === "true";
  
  if (isLocal) {
    const localConfig = require("../config/database.local.js");
    return localConfig.development;
  } else {
    const remoteConfig = require("../config/database.remote.js");
    return remoteConfig[env] || remoteConfig.production;
  }
};
```

### Step 3: Initialize Database

```powershell
cd server
npm run setup-db
```

### Step 4: Start Server

```powershell
npm run dev
```

---

## 🔍 Troubleshooting

### Check if PostgreSQL is Running

```powershell
# Method 1: Check service
Get-Service -Name "postgresql*"

# Method 2: Try to connect
psql -U postgres -c "SELECT version();"

# Method 3: Check port
Test-NetConnection -ComputerName localhost -Port 5432
```

### Start PostgreSQL Service

```powershell
# Find service name
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}

# Start service (replace with actual name)
Start-Service postgresql-x64-16
```

### Common Errors

**Error: "psql: command not found"**
- PostgreSQL is not installed or not in PATH
- Install PostgreSQL or add to PATH:
  ```powershell
  $env:Path += ";C:\Program Files\PostgreSQL\16\bin"
  ```

**Error: "password authentication failed"**
- Wrong password in `.env` file
- Update `DB_PASSWORD` in `server\.env`

**Error: "database does not exist"**
- Create database:
  ```powershell
  psql -U postgres -c "CREATE DATABASE timepulse_db;"
  ```

**Error: "Port 5432 already in use"**
- Another PostgreSQL instance is running
- Stop it or use different port

---

## 📋 Quick Checklist

- [ ] PostgreSQL installed (or Docker running)
- [ ] PostgreSQL service is running
- [ ] Database `timepulse_db` created
- [ ] `server\.env` has correct database credentials
- [ ] Can connect: `psql -U postgres -d timepulse_db`
- [ ] Database schema initialized: `npm run setup-db`
- [ ] Server starts without errors: `npm run dev`

---

## 🎯 Recommended Solution

**For Development**: Use **Option 2 (Docker)** - Fastest and cleanest
**For Production**: Use **Option 1 (PostgreSQL)** - Most reliable

---

## 🆘 Still Having Issues?

1. Check PostgreSQL logs:
   - Windows: `C:\Program Files\PostgreSQL\16\data\log`
   
2. Verify connection manually:
   ```powershell
   psql -h localhost -p 5432 -U postgres -d timepulse_db
   ```

3. Check firewall settings (allow port 5432)

4. Restart PostgreSQL service:
   ```powershell
   Restart-Service postgresql-x64-16
   ```

---

**After fixing, run:**
```powershell
cd server
npm run dev
```

You should see:
```
✅ Database connection has been established successfully.
🚀 Server is running on port 5001
```
