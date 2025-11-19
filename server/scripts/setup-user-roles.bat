@echo off
echo ========================================
echo User Roles Complete Setup
echo ========================================
echo.
echo This script will:
echo - Add 'approver' to database enum
echo - Create/update lookups table
echo - Seed all user roles
echo.

echo Running comprehensive migration...
node scripts/run-migration.js
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Migration failed!
    echo.
    echo Alternative: Run SQL directly in pgAdmin or psql:
    echo psql -U postgres -d timepulse_db -f server/migrations/complete-user-roles-setup.sql
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo IMPORTANT: Next steps:
echo 1. Stop your backend server (Ctrl+C)
echo 2. Start it again: npm start
echo 3. Refresh your frontend browser
echo 4. Test Settings -^> User Management -^> Edit User
echo.
pause
