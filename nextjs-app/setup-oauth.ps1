# OAuth Setup Script for TimePulse
# This script helps set up the .env.local file for Google OAuth

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TimePulse OAuth Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path .env.local) {
    Write-Host "[OK] .env.local file already exists" -ForegroundColor Green
    Write-Host ""
    $overwrite = Read-Host "Do you want to check/update it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit
    }
} else {
    Write-Host "[INFO] Creating .env.local file..." -ForegroundColor Yellow
    if (Test-Path .env.local.example) {
        Copy-Item .env.local.example .env.local
        Write-Host "[OK] Created .env.local from example" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] .env.local.example not found!" -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read current .env.local
$envContent = Get-Content .env.local -Raw

# Check each required variable
$checks = @{
    "NEXTAUTH_URL" = "https://goggly-casteless-torri.ngrok-free.dev"
    "NEXTAUTH_SECRET" = $null
    "GOOGLE_CLIENT_ID" = $null
    "GOOGLE_CLIENT_SECRET" = $null
    "NEXT_PUBLIC_API_URL" = "http://44.222.217.57:5001"
    "NEXT_PUBLIC_APP_URL" = "https://goggly-casteless-torri.ngrok-free.dev"
}

foreach ($key in $checks.Keys) {
    if ($envContent -match "$key=(.+)") {
        $value = $matches[1].Trim()
        if ($value -and $value -ne "your-google-client-id.apps.googleusercontent.com" -and $value -ne "your-google-client-secret" -and $value -ne "your-secret-key") {
            Write-Host "[OK] $key is set" -ForegroundColor Green
        } else {
            Write-Host "[WARN] $key needs to be configured" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] $key is missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Generate NEXTAUTH_SECRET" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$generateSecret = Read-Host "Do you want to generate a new NEXTAUTH_SECRET? (y/n)"
if ($generateSecret -eq "y") {
    # Generate random secret
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    
    Write-Host "Generated NEXTAUTH_SECRET:" -ForegroundColor Green
    Write-Host $secret -ForegroundColor White
    Write-Host ""
    
    # Update .env.local
    $envContent = $envContent -replace "NEXTAUTH_SECRET=.*", "NEXTAUTH_SECRET=$secret"
    $envContent | Set-Content .env.local -NoNewline
    Write-Host "[OK] Updated .env.local with new secret" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Google OAuth Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To get Google OAuth credentials:" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.cloud.google.com/" -ForegroundColor White
Write-Host "2. Create OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "3. Add redirect URI: https://goggly-casteless-torri.ngrok-free.dev/api/auth/callback/google" -ForegroundColor White
Write-Host "4. Copy Client ID and Secret" -ForegroundColor White
Write-Host ""

$updateGoogle = Read-Host "Do you want to update Google credentials now? (y/n)"
if ($updateGoogle -eq "y") {
    Write-Host ""
    $clientId = Read-Host "Enter GOOGLE_CLIENT_ID"
    $clientSecret = Read-Host "Enter GOOGLE_CLIENT_SECRET"
    
    if ($clientId -and $clientSecret) {
        $envContent = Get-Content .env.local -Raw
        $envContent = $envContent -replace "GOOGLE_CLIENT_ID=.*", "GOOGLE_CLIENT_ID=$clientId"
        $envContent = $envContent -replace "GOOGLE_CLIENT_SECRET=.*", "GOOGLE_CLIENT_SECRET=$clientSecret"
        $envContent | Set-Content .env.local -NoNewline
        Write-Host "[OK] Updated Google OAuth credentials" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. [OK] .env.local file is configured" -ForegroundColor Green
Write-Host "2. [ACTION] Restart Next.js server:" -ForegroundColor Yellow
Write-Host "   - Stop current server (Ctrl+C)" -ForegroundColor White
Write-Host "   - Run: npm run dev" -ForegroundColor White
Write-Host "3. [TEST] Test OAuth at: https://goggly-casteless-torri.ngrok-free.dev/test-oauth" -ForegroundColor Yellow
Write-Host ""

$openTest = Read-Host "Do you want to open the test page in browser? (y/n)"
if ($openTest -eq "y") {
    Start-Process "https://goggly-casteless-torri.ngrok-free.dev/test-oauth"
}

Write-Host ""
Write-Host "[SUCCESS] Setup script completed!" -ForegroundColor Green
Write-Host ""
