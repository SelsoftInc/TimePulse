# TimePulse - Complete Project Setup & Execution Guide

## 📋 Project Overview

**TimePulse** is a comprehensive timesheet and invoice management system consisting of three integrated components:

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TimePulse System                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Next.js    │  │    Node.js   │  │    Python    │ │
│  │   Frontend   │◄─┤    Server    │◄─┤    Engine    │ │
│  │   Port 3000  │  │   Port 5001  │  │   Port 8000  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│                   ┌────────▼────────┐                   │
│                   │   PostgreSQL    │                   │
│                   │   Port 5432     │                   │
│                   └─────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Components

1. **Server (Node.js/Express)** - Port **5001**
   - Backend REST API
   - Database ORM (Sequelize)
   - Authentication & Authorization
   - Business Logic
   - Data Encryption

2. **Engine (Python/FastAPI)** - Port **8000**
   - Document Processing
   - OCR & AI Processing
   - File Upload Handling
   - LangChain Integration

3. **Next.js App** - Port **3000**
   - Frontend UI
   - User Interface
   - Client-side Logic

4. **PostgreSQL Database** - Port **5432**
   - Data Storage
   - Relational Database

## 🚀 Quick Start (Automated)

### One-Command Startup

```powershell
.\START_PROJECT.ps1
```

This script will:
- ✅ Check all prerequisites
- ✅ Verify PostgreSQL is running
- ✅ Check port availability
- ✅ Create environment files
- ✅ Install dependencies
- ✅ Start all three services

## 📋 Manual Setup (Step-by-Step)

### Prerequisites

Install the following software:

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | v18+ | https://nodejs.org/ |
| Python | v3.9+ | https://www.python.org/downloads/ |
| PostgreSQL | v12+ | https://www.postgresql.org/download/ |

### Verification Commands

```powershell
# Check installations
node --version    # Should show v18.x.x or higher
npm --version     # Should show 8.x.x or higher
python --version  # Should show 3.9.x or higher
psql --version    # Should show 12.x or higher
```

## 🗄️ Database Setup

### 1. Start PostgreSQL

```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# Start PostgreSQL if not running
Start-Service postgresql-x64-XX  # Replace XX with your version
```

### 2. Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE timepulse_db;

# Verify
\l

# Exit
\q
```

### 3. Initialize Database Schema

```powershell
cd server
npm run setup-db
```

## ⚙️ Configuration

### 1. Server Configuration (`server/.env`)

```env
# Server Configuration
PORT=5001
NODE_ENV=development
USE_LOCAL_DB=true

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timepulse_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# CORS Configuration
CORS_ORIGIN=https://goggly-casteless-torri.ngrok-free.dev

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this
JWT_EXPIRES_IN=24h

# Data Encryption Configuration
ENCRYPTION_KEY=your_encryption_key_here_minimum_32_characters
```

**Generate Encryption Key:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Engine Configuration (`engine/.env`)

```env
# Application Settings
PORT=8000
HOST=0.0.0.0
DEBUG=False

# CORS Settings
CORS_ORIGINS=https://goggly-casteless-torri.ngrok-free.dev,http://localhost:5001

# File Upload Settings
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=png,jpg,jpeg,pdf,csv,docx,xlsx

# Logging
LOG_LEVEL=INFO
LOG_FILE=app.log
```

### 3. Next.js Configuration (`nextjs-app/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_ENGINE_URL=http://localhost:8000
```

## 📦 Install Dependencies

### Server Dependencies

```powershell
cd server
npm install
```

### Next.js App Dependencies

```powershell
cd nextjs-app
npm install
```

### Engine Dependencies (Python)

```powershell
cd engine

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Deactivate
deactivate
```

## 🚀 Start Services

### Option 1: Automated (Recommended)

```powershell
.\START_PROJECT.ps1
```

### Option 2: Manual Start

Open **three separate terminals**:

**Terminal 1 - Server:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Engine:**
```powershell
cd engine
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Next.js App:**
```powershell
cd nextjs-app
npm run dev
```

## 🌐 Access Applications

Once all services are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | https://goggly-casteless-torri.ngrok-free.dev | Main application UI |
| **Server API** | http://localhost:5001 | Backend REST API |
| **Engine API** | http://localhost:8000 | Document processing API |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |

## ✅ Verify Installation

### 1. Check Server Health

```powershell
curl http://localhost:5001/api/health
```

Expected response: `{"status":"ok"}`

### 2. Check Engine Health

```powershell
curl http://localhost:8000/health
```

Expected response: `{"status":"healthy"}`

### 3. Check Frontend

Open browser: https://goggly-casteless-torri.ngrok-free.dev

You should see the TimePulse login page.

### 4. Test Encryption

```powershell
cd server
node test-encryption.js
```

Expected: `✅ ALL TESTS PASSED`

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue: PostgreSQL Connection Refused

**Symptoms:**
```
❌ Unable to connect to the database: ConnectionRefusedError
```

**Solutions:**
1. Check if PostgreSQL is running:
   ```powershell
   Get-Service -Name postgresql*
   ```

2. Start PostgreSQL:
   ```powershell
   Start-Service postgresql-x64-XX
   ```

3. Verify database exists:
   ```powershell
   psql -U postgres -l | findstr timepulse_db
   ```

4. Check credentials in `server/.env`

#### Issue: Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solutions:**
1. Find process using the port:
   ```powershell
   netstat -ano | findstr :5001
   ```

2. Kill the process:
   ```powershell
   taskkill /PID <PID> /F
   ```

3. Or change the port in `.env` file

#### Issue: Module Not Found

**Symptoms:**
```
Error: Cannot find module 'express'
```

**Solutions:**
```powershell
# Reinstall dependencies
cd server
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

#### Issue: Python Virtual Environment Activation Fails

**Symptoms:**
```
cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again
cd engine
.\venv\Scripts\Activate.ps1
```

#### Issue: Database Schema Not Initialized

**Symptoms:**
```
relation "users" does not exist
```

**Solution:**
```powershell
cd server
npm run setup-db
```

## 📊 Project Structure

```
TimePulse/
├── server/                 # Node.js Backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utilities
│   ├── middleware/        # Express middleware
│   ├── .env               # Environment variables
│   ├── index.js           # Entry point
│   └── package.json       # Dependencies
│
├── engine/                # Python FastAPI Engine
│   ├── routers/          # API routers
│   ├── services/         # Processing services
│   ├── utils/            # Utilities
│   ├── venv/             # Virtual environment
│   ├── .env              # Environment variables
│   ├── main.py           # Entry point
│   └── requirements.txt  # Dependencies
│
├── nextjs-app/           # Next.js Frontend
│   ├── src/              # Source code
│   │   ├── pages/        # Pages
│   │   ├── components/   # React components
│   │   └── styles/       # Styles
│   ├── public/           # Static files
│   ├── .env.local        # Environment variables
│   └── package.json      # Dependencies
│
├── START_PROJECT.ps1     # Automated startup script
├── SETUP_GUIDE.md        # Detailed setup guide
├── QUICK_START.md        # Quick start guide
└── README_PROJECT_SETUP.md  # This file
```

## 🔐 Security Configuration

### Important Security Steps

1. **Change Default Passwords**
   - PostgreSQL password
   - JWT secret
   - Encryption key

2. **Generate Secure Keys**
   ```powershell
   # JWT Secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Encryption Key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update .env Files**
   - Never commit `.env` files to version control
   - Use different credentials for production
   - Keep backup of encryption keys securely

## 📝 Development Workflow

### Making Changes

All services support hot-reload:
- **Server**: Auto-reloads with nodemon
- **Engine**: Auto-reloads with uvicorn --reload
- **Next.js**: Auto-reloads with Next.js dev server

### Database Migrations

```powershell
cd server

# Create migration
npm run migrate:dev

# Apply migrations
npm run migrate:deploy
```

### Running Tests

```powershell
# Test encryption
cd server
node test-encryption.js

# Test server
npm test
```

## 📚 Additional Documentation

- **Server Documentation**: `server/README.md`
- **Engine Documentation**: `engine/README.md`
- **Encryption Guide**: `server/ENCRYPTION_README.md`
- **Setup Guide**: `SETUP_GUIDE.md`
- **Quick Start**: `QUICK_START.md`

## 🆘 Getting Help

If you encounter issues:

1. Check service logs in each terminal window
2. Review this documentation
3. Check the troubleshooting section
4. Verify all prerequisites are installed
5. Ensure PostgreSQL is running
6. Check port availability

## 📊 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 5 GB free space
- **OS**: Windows 10/11, macOS, Linux

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk**: 10 GB free space
- **OS**: Windows 11, macOS 12+, Ubuntu 20.04+

## 🎉 Success Checklist

- [ ] PostgreSQL installed and running
- [ ] Node.js and npm installed
- [ ] Python installed
- [ ] Database `timepulse_db` created
- [ ] All `.env` files configured
- [ ] Dependencies installed for all three components
- [ ] All three services starting without errors
- [ ] Can access https://goggly-casteless-torri.ngrok-free.dev
- [ ] Can access http://localhost:5001/api/health
- [ ] Can access http://localhost:8000/docs

## 🚀 Next Steps

Once everything is running:

1. Open https://goggly-casteless-torri.ngrok-free.dev
2. Create an admin account
3. Configure your organization
4. Start using TimePulse!

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: ✅ Ready for Development

For questions or issues, refer to the documentation files in this directory.
