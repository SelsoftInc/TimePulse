# ⚡ Quick Start Guide - TimePulse Next.js

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (2 minutes)

```bash
cd nextjs-app
npm install
```

### Step 2: Configure Environment (1 minute)

```bash
# Copy environment file
copy .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

### Step 3: Update Imports (1 minute)

```bash
node update-imports.js
```

This will automatically:
- Update all import paths to use `@/` alias
- Add `'use client'` directives where needed
- Convert React Router imports to Next.js

### Step 4: Start Backend (30 seconds)

```bash
# In a separate terminal
cd ../server
npm start
```

### Step 5: Start Next.js (30 seconds)

```bash
npm run dev
```

Open `http://localhost:3000` 🎉

## 📝 What's Different?

### Imports
```javascript
// OLD
import { useAuth } from '../../contexts/AuthContext';

// NEW
import { useAuth } from '@/contexts/AuthContext';
```

### Navigation
```javascript
// OLD
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/dashboard');

// NEW
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');
```

### Links
```javascript
// OLD
import { Link } from 'react-router-dom';
<Link to="/dashboard">Dashboard</Link>

// NEW
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>
```

## 🔧 If Something Breaks

### Error: "Module not found"
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
```

### Error: "window is not defined"
Add this to your component:
```javascript
'use client';

// At the top of your file
```

### Error: API calls failing
1. Check backend is running: `http://localhost:5001`
2. Check `.env.local` has correct API_URL
3. Restart Next.js dev server

## 📚 Full Documentation

- **README.md** - Complete project documentation
- **MIGRATION_GUIDE.md** - Detailed migration steps
- **MIGRATION_COMPLETE.md** - What's been done

## ✅ Quick Checklist

- [ ] Dependencies installed
- [ ] `.env.local` configured
- [ ] Imports updated (run `node update-imports.js`)
- [ ] Backend running on port 5001
- [ ] Next.js running on port 3000
- [ ] Can access login page
- [ ] Can login successfully

## 🆘 Need Help?

Check the console for errors:
- **Browser Console** (F12) - Frontend errors
- **Terminal** - Build/server errors

Common fixes:
```bash
# Restart dev server
Ctrl+C
npm run dev

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

**That's it!** Your Next.js app should now be running. 🎊
