# TimePulse - Complete Setup Guide

## 🎯 Overview

TimePulse consists of three main components:
1. **Server** (Node.js/Express) - Backend API on port **5001**
2. **Engine** (Python/FastAPI) - Document processing engine on port **8000**
3. **Next.js App** - Frontend application on port **3000**

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Python** (v3.9 or higher)
   - Download: https://www.python.org/downloads/
   - Verify: `python --version`

3. **PostgreSQL** (v12 or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

4. **npm** (comes with Node.js)
   - Verify: `npm --version`

5. **pip** (comes with Python)
   - Verify: `pip --version`

## 🗄️ Database Setup

### 1. Install PostgreSQL

If not already installed, download and install PostgreSQL from:
https://www.postgresql.org/download/windows/

### 2. Create Database

Open PowerShell or Command Prompt and run:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE timepulse_db;

# Verify
\l

# Exit
\q
```

### 3. Configure Database Credentials

Default credentials (can be changed):
- **Host**: localhost
- **Port**: 5432
- **Database**: timepulse_db
- **Username**: postgres
- **Password**: postgres

## ⚙️ Configuration

### 1. Server Configuration

Create `server/.env` file:

```bash
cd server
copy .env.example .env
```

Edit `server/.env`:

```env
# Server Configuration
PORT=5001
NODE_ENV=development
USE_LOCAL_DB=true

# CORS Configuration
CORS_ORIGIN=https://goggly-casteless-torri.ngrok-free.dev

# Database Configuration - PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timepulse_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this
JWT_EXPIRES_IN=24h

# Data Encryption Configuration
ENCRYPTION_KEY=your_encryption_key_here_minimum_32_characters

# Optional: OpenAI/Azure Configuration
# OPENAI_API_KEY=your_openai_api_key_here
```

**Generate Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Engine Configuration

Create `engine/.env` file:

```bash
cd engine
copy .env.example .env
```

Edit `engine/.env`:

```env
# Application Settings
APP_NAME=Timesheet Generator API
APP_VERSION=1.0.0
DEBUG=False
HOST=0.0.0.0
PORT=8000

# CORS Settings
CORS_ORIGINS=https://goggly-casteless-torri.ngrok-free.dev,http://localhost:5001

# File Upload Settings
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=png,jpg,jpeg,pdf,csv,docx,xlsx

# Logging
LOG_LEVEL=INFO
LOG_FILE=app.log

# Optional: AWS/Claude Configuration
# AWS_ACCESS_KEY_ID=your_aws_access_key_id
# AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
# AWS_REGION=us-east-1
# CLAUDE_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 3. Next.js App Configuration

Create `nextjs-app/.env.local` file:

```bash
cd nextjs-app
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_ENGINE_URL=http://localhost:8000
```

## 📦 Install Dependencies

### 1. Server Dependencies

```bash
cd server
npm install
```

### 2. Next.js App Dependencies

```bash
cd nextjs-app
npm install
```

### 3. Engine Dependencies (Python)

```bash
cd engine

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\Activate.ps1

# On Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 🗃️ Initialize Database

Run database setup scripts:

```bash
cd server

# Setup database tables
npm run setup-db

# Optional: Seed with sample data
npm run seed-dashboard
```

## 🚀 Start Services

### Option 1: Automated Start (Recommended)

Use the provided PowerShell script to start all services at once:

```powershell
.\START_ALL.ps1
```

This will:
- Check PostgreSQL status
- Verify port availability
- Create .env files if missing
- Install dependencies if needed
- Start all three services in separate windows

### Option 2: Manual Start

Start each service in a separate terminal:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Engine:**
```bash
cd engine
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Linux/Mac
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Next.js App:**
```bash
cd nextjs-app
npm run dev
```

## 🌐 Access Applications

Once all services are running:

- **Frontend (Next.js)**: https://goggly-casteless-torri.ngrok-free.dev
- **Backend API (Server)**: http://localhost:5001
- **Engine API**: http://localhost:8000
- **Engine API Docs**: http://localhost:8000/docs

## ✅ Verify Installation

### 1. Check Server

```bash
curl http://localhost:5001/api/health
```

Expected response: `{"status":"ok"}`

### 2. Check Engine

```bash
curl http://localhost:8000/health
```

Expected response: `{"status":"healthy"}`

### 3. Check Next.js App

Open browser: https://goggly-casteless-torri.ngrok-free.dev

You should see the TimePulse login page.

## 🔧 Troubleshooting

### Issue: PostgreSQL not running

**Solution:**
```powershell
# Check service status
Get-Service -Name postgresql*

# Start service
Start-Service postgresql-x64-XX  # Replace XX with your version
```

### Issue: Port already in use

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :5001  # or :3000 or :8000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Database connection failed

**Solutions:**
1. Verify PostgreSQL is running
2. Check database credentials in `server/.env`
3. Ensure database `timepulse_db` exists
4. Test connection:
   ```bash
   psql -U postgres -d timepulse_db
   ```

### Issue: Module not found errors

**Solution:**
```bash
# Reinstall dependencies
cd server
rm -rf node_modules package-lock.json
npm install

cd ../nextjs-app
rm -rf node_modules package-lock.json
npm install

cd ../engine
rm -rf venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Issue: Python virtual environment activation fails

**Solution:**
```powershell
# Enable script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try activating again
cd engine
.\venv\Scripts\Activate.ps1
```

### Issue: Encryption key not set warning

**Solution:**
```bash
# Generate key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to server/.env
ENCRYPTION_KEY=<generated_key>
```

## 📝 Development Workflow

### Starting Development

```powershell
# Start all services
.\START_ALL.ps1
```

### Stopping Services

- Close the PowerShell windows, or
- Press `Ctrl+C` in each terminal

### Making Changes

- **Server changes**: Auto-reload with nodemon
- **Engine changes**: Auto-reload with uvicorn --reload
- **Next.js changes**: Auto-reload with Next.js dev server

### Database Migrations

```bash
cd server

# Create new migration
npm run migrate:dev

# Apply migrations
npm run migrate:deploy
```

## 🧪 Testing

### Test Encryption

```bash
cd server
node test-encryption.js
```

Expected: `✅ ALL TESTS PASSED`

### Test API Endpoints

```bash
# Test server health
curl http://localhost:5001/api/health

# Test engine health
curl http://localhost:8000/health
```

## 📚 Additional Resources

- **Server Documentation**: `server/README.md`
- **Engine Documentation**: `engine/README.md`
- **Encryption Documentation**: `server/ENCRYPTION_README.md`
- **API Documentation**: http://localhost:8000/docs (when engine is running)

## 🔐 Security Notes

1. **Never commit** `.env` files to version control
2. Use **different credentials** for production
3. **Change default passwords** before deploying
4. **Generate unique keys** for JWT and encryption
5. Keep **dependencies updated** regularly

## 🆘 Getting Help

If you encounter issues:

1. Check the logs in each service window
2. Review this setup guide
3. Check the troubleshooting section
4. Verify all prerequisites are installed
5. Ensure PostgreSQL is running

## 📊 System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 5 GB free space

**Recommended:**
- CPU: 4 cores
- RAM: 8 GB
- Disk: 10 GB free space

## 🎉 Success!

If all services are running without errors, you're ready to use TimePulse!

Visit https://goggly-casteless-torri.ngrok-free.dev to get started.

---

**Version**: 1.0.0  
**Last Updated**: December 2024
