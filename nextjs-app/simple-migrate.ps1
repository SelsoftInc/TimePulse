# Simple PowerShell script to copy components

Write-Host "Starting component migration..." -ForegroundColor Green

# Copy all components
Write-Host "Copying components..." -ForegroundColor Cyan
xcopy /E /I /Y "d:\selsoft\WebApp\TimePulse\frontend\src\components" "d:\selsoft\WebApp\TimePulse\nextjs-app\src\components"

Write-Host "Copying public assets..." -ForegroundColor Cyan
xcopy /E /I /Y "d:\selsoft\WebApp\TimePulse\frontend\public" "d:\selsoft\WebApp\TimePulse\nextjs-app\public"

Write-Host "Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd nextjs-app" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White
