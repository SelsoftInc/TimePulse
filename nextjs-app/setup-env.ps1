# Setup .env.local for OAuth
Write-Host "=== TimePulse OAuth Setup ===" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env.local"

# Check if .env.local exists
if (Test-Path $envPath) {
    Write-Host "✅ .env.local file found" -ForegroundColor Green
    Write-Host ""
    
    # Read current content
    $content = Get-Content $envPath -Raw
    
    # Check if NEXTAUTH_SECRET exists
    if ($content -match "NEXTAUTH_SECRET=.+") {
        Write-Host "✅ NEXTAUTH_SECRET already set" -ForegroundColor Green
    } else {
        Write-Host "⚠️  NEXTAUTH_SECRET is missing!" -ForegroundColor Yellow
        Write-Host "Adding NEXTAUTH_SECRET to .env.local..." -ForegroundColor Yellow
        
        # Add NEXTAUTH_SECRET
        $newContent = $content.TrimEnd() + "`n`n# NextAuth Configuration (REQUIRED)`nNEXTAUTH_SECRET=timepulse-nextauth-secret-key-2024-production-change-this`nNEXTAUTH_URL=https://goggly-casteless-torri.ngrok-free.dev`n"
        Set-Content -Path $envPath -Value $newContent -NoNewline
        
        Write-Host "✅ NEXTAUTH_SECRET added!" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env.local file NOT found!" -ForegroundColor Red
    Write-Host "Creating .env.local from template..." -ForegroundColor Yellow
    
    $templateContent = @"
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001

# Application Configuration
NEXT_PUBLIC_APP_NAME=TimePulse
NEXT_PUBLIC_APP_URL=https://goggly-casteless-torri.ngrok-free.dev

# Google OAuth Configuration (REQUIRED for OAuth login)
GOOGLE_CLIENT_ID=1012443421048-sg42k7t4i6vcdaj0r14mac2ndn8b6ilp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# NextAuth Configuration (REQUIRED)
NEXTAUTH_SECRET=timepulse-nextauth-secret-key-2024-production-change-this
NEXTAUTH_URL=https://goggly-casteless-torri.ngrok-free.dev
"@
    
    Set-Content -Path $envPath -Value $templateContent -NoNewline
    Write-Host "✅ .env.local created!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Stop the Next.js server (Ctrl+C in the terminal)" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Clear browser cache or use incognito mode" -ForegroundColor White
Write-Host "4. Try OAuth login again" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Server restart is REQUIRED for changes to take effect!" -ForegroundColor Yellow
