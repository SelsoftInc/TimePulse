# 🔧 Next.js Cache & Hot Reload Fix Guide

## Problem
UI changes in Invoice module (and other components) not updating without manual reload/restart.

## ✅ Solutions Implemented

### 1. **Updated `next.config.js`**
Added the following cache-busting configurations:

- ✅ **Disabled webpack cache in development** - `config.cache = false`
- ✅ **Dynamic build IDs** - Prevents stale builds
- ✅ **On-demand entries optimization** - Faster page updates
- ✅ **Disabled CSS optimization in dev** - Instant CSS updates
- ✅ **Disabled SWC minification in dev** - Faster rebuilds

### 2. **New NPM Scripts**
Added convenient cache-clearing commands:

```bash
# Clean cache and start dev server
npm run fresh

# Clean cache only
npm run clean

# Start dev with clean cache
npm run dev:clean
```

### 3. **PowerShell Cache Clear Script**
Created `clear-cache.ps1` for Windows users:

```powershell
# Run this to clear all caches
.\clear-cache.ps1
```

## 🚀 How to Use

### **Method 1: Fresh Start (Recommended)**
```bash
# Stop current server (Ctrl+C)
npm run fresh
```

### **Method 2: Manual Cache Clear**
```bash
# Clear cache
npm run clean

# Then start server
npm run dev
```

### **Method 3: PowerShell Script**
```powershell
# Clear cache using script
.\clear-cache.ps1

# Then start server
npm run dev
```

### **Method 4: Manual Steps**
```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Delete cache folders
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path "node_modules/.cache" -Recurse -Force

# 3. Restart dev server
npm run dev
```

## 🔥 Browser Cache Clearing

Even with server fixes, browser caching can cause issues:

### **Hard Refresh (Recommended)**
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### **Clear Browser Cache**
1. Open DevTools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### **Use Incognito Mode**
- Test changes in incognito/private browsing to bypass cache

## 📋 Development Workflow

### **Best Practices:**

1. **Start Fresh Each Day**
   ```bash
   npm run fresh
   ```

2. **After Major Changes**
   - Clear cache if changes don't appear
   - Hard refresh browser

3. **CSS/Style Changes**
   - Should update automatically now
   - If not, hard refresh browser (`Ctrl + Shift + R`)

4. **Component Changes**
   - Should hot reload automatically
   - If stuck, use `npm run fresh`

## 🛠️ Troubleshooting

### **Changes Still Not Appearing?**

1. **Check if server is running**
   ```bash
   # Should see: "ready - started server on 0.0.0.0:3000"
   ```

2. **Clear everything**
   ```bash
   npm run fresh
   ```

3. **Hard refresh browser**
   - `Ctrl + Shift + R`

4. **Check browser console**
   - Look for errors
   - Check if files are loading

5. **Restart VS Code**
   - Sometimes IDE caching causes issues

### **Port Already in Use?**

```powershell
# Find process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess -Unique

# Kill the process (replace PID with actual process ID)
Stop-Process -Id PID -Force

# Or use the clear-cache script which does this automatically
.\clear-cache.ps1
```

## 📝 What Changed in Configuration

### **next.config.js**
```javascript
// Added these configurations:
- onDemandEntries: Faster page updates
- webpack cache: false in dev
- generateBuildId: Dynamic IDs
- experimental.optimizeCss: false
- experimental.swcMinify: false in dev
```

### **package.json**
```json
{
  "scripts": {
    "fresh": "rimraf .next node_modules/.cache && next dev -p 3000",
    "clean": "rimraf .next node_modules/.cache",
    "dev:clean": "rimraf .next && next dev -p 3000"
  }
}
```

## ✨ Expected Behavior Now

- ✅ CSS changes update instantly
- ✅ Component changes hot reload
- ✅ No need to manually restart for most changes
- ✅ Faster development experience
- ✅ Consistent UI updates

## 📌 Quick Reference

| Issue | Solution |
|-------|----------|
| CSS not updating | Hard refresh browser (`Ctrl + Shift + R`) |
| Component not updating | `npm run fresh` |
| Port in use | Run `.\clear-cache.ps1` |
| Stale data | Clear browser cache |
| Everything broken | `npm run fresh` + Hard refresh |

## 🎯 Installation

Install the new dependency:
```bash
npm install --save-dev rimraf
```

Then you can use all the new scripts!

---

**Note**: These changes only affect development. Production builds are not impacted.
