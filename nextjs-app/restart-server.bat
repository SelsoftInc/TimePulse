@echo off
echo ========================================
echo   Restarting Next.js Server
echo ========================================
echo.
echo This will stop any running Next.js server and start fresh
echo.
pause

echo Killing any existing Next.js processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting Next.js development server...
echo.
npm run dev
