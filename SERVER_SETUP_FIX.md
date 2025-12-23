# 🔧 SERVER CONNECTION FIX - CRITICAL

## ⚠️ ROOT CAUSE: PORT MISMATCH

**Problem Identified:**
- Server runs on port `5000` (default)
- Next.js app connects to port `5001`
- **Result:** Data cannot be fetched from database

---

## ✅ SOLUTION: Configure Server Port

### Step 1: Create Server .env File

Create a file: `server/.env` with this content:

```env
# Server Configuration
PORT=5001

# Database Configuration (if not already set)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timepulse
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# CORS Configuration
CORS_ORIGIN=https://goggly-casteless-torri.ngrok-free.dev

# Node Environment
NODE_ENV=development
```

### Step 2: Verify Next.js Configuration

Ensure `nextjs-app/.env.local` exists with:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://44.222.217.57:5001
NEXT_PUBLIC_SOCKET_URL=http://44.222.217.57:5001

# Application Configuration
NEXT_PUBLIC_APP_NAME=TimePulse
NEXT_PUBLIC_APP_URL=https://goggly-casteless-torri.ngrok-free.dev
```

### Step 3: Start Both Servers

**Terminal 1 - Start Backend Server:**
```bash
cd server
npm start
```

**Terminal 2 - Start Next.js App:**
```bash
cd nextjs-app
npm run dev
```

---

## 🎯 VERIFICATION

After starting both servers, you should see:

**Server Terminal:**
```
🚀 TimePulse Server running on port 5001
📖 Health check: http://44.222.217.57:5001/health
🔧 Environment: development
🗄️  Database: Connected
🔌 WebSocket: Enabled
```

**Next.js Terminal:**
```
▲ Next.js 14.2.33
- Local:        https://goggly-casteless-torri.ngrok-free.dev
✓ Ready in 2.6s
```

---

## 🧪 TEST THE CONNECTION

Open browser console and check:
1. No "Failed to fetch" errors
2. API calls show `200 OK` status
3. Data displays in all modules

---

## 📋 CURRENT STATUS

✅ **Service Layer**: All components using services
✅ **API Client**: Configured correctly
✅ **Services**: All methods implemented
⚠️ **Port Configuration**: NEEDS FIX (see above)

---

## 🚀 AFTER FIX

Once the port is configured correctly:
- ✅ Timesheet data will display
- ✅ Invoice data will display
- ✅ All modules will work
- ✅ Database connection established

---

## 💡 ALTERNATIVE: Change Next.js to Use Port 5000

If you prefer to keep server on port 5000, update `nextjs-app/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Then restart Next.js app.
