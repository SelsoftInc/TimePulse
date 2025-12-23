@echo off
REM OAuth Setup Script for TimePulse
REM Simple batch file to set up .env.local

echo ========================================
echo   TimePulse OAuth Setup
echo ========================================
echo.

REM Check if .env.local exists
if exist .env.local (
    echo [INFO] .env.local already exists
    echo.
) else (
    echo [INFO] Creating .env.local file...
    if exist .env.local.example (
        copy .env.local.example .env.local >nul
        echo [OK] Created .env.local successfully
    ) else (
        echo [ERROR] .env.local.example not found!
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   Next Steps
echo ========================================
echo.
echo 1. Edit .env.local file with your credentials
echo 2. Restart Next.js server:
echo    - Stop: Ctrl+C
echo    - Start: npm run dev
echo 3. Test at: https://goggly-casteless-torri.ngrok-free.dev/test-oauth
echo.

set /p OPEN="Open .env.local in notepad? (y/n): "
if /i "%OPEN%"=="y" (
    notepad .env.local
)

echo.
echo [DONE] Setup complete!
echo.
pause
