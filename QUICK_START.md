# TimePulse - Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Install Prerequisites

Ensure you have:
- ✅ Node.js (v18+)
- ✅ Python (v3.9+)
- ✅ PostgreSQL (v12+)

### Step 2: Setup Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE timepulse_db;

# Exit
\q
```

### Step 3: Configure Environment

```powershell
# Copy environment files
copy server\.env.example server\.env
copy engine\.env.example engine\.env

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add the generated key to server\.env as ENCRYPTION_KEY
```

### Step 4: Install Dependencies

```powershell
# Server
cd server
npm install
cd ..

# Next.js App
cd nextjs-app
npm install
cd ..

# Engine (Python)
cd engine
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate
cd ..
```

### Step 5: Initialize Database

```powershell
cd server
npm run setup-db
cd ..
```

### Step 6: Start All Services

```powershell
.\START_ALL.ps1
```

## 🌐 Access Your Application

- **Frontend**: https://goggly-casteless-torri.ngrok-free.dev
- **Server API**: http://44.222.217.57:5001
- **Engine API**: http://44.222.217.57:8000/docs

## ✅ Verify Everything Works

Open https://goggly-casteless-torri.ngrok-free.dev in your browser. You should see the TimePulse login page!

## 🆘 Need Help?

See the full [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions and troubleshooting.

---

**That's it! You're ready to use TimePulse! 🎉**
