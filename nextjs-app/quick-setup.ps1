# Quick OAuth Setup Script - No special characters
# Simple script to set up .env.local file

Write-Host "========================================"
Write-Host "  TimePulse OAuth Quick Setup"
Write-Host "========================================"
Write-Host ""

# Check if .env.local exists
if (Test-Path .env.local) {
    Write-Host "[INFO] .env.local already exists" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "[INFO] Creating .env.local file..." -ForegroundColor Yellow
    
    if (Test-Path .env.local.example) {
        Copy-Item .env.local.example .env.local
        Write-Host "[OK] Created .env.local successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] .env.local.example not found!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Configuration Status"
Write-Host "========================================"
Write-Host ""

# Read and check .env.local
$envContent = Get-Content .env.local -Raw

# Check required variables
$required = @(
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXT_PUBLIC_API_URL"
)

$allSet = $true
foreach ($var in $required) {
    if ($envContent -match "$var=(.+)") {
        $value = $matches[1].Trim()
        if ($value -and $value -notmatch "your-.*") {
            Write-Host "[OK] $var is configured" -ForegroundColor Green
        } else {
            Write-Host "[WARN] $var needs real value" -ForegroundColor Yellow
            $allSet = $false
        }
    } else {
        Write-Host "[ERROR] $var is missing" -ForegroundColor Red
        $allSet = $false
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Next Steps"
Write-Host "========================================"
Write-Host ""

if ($allSet) {
    Write-Host "[SUCCESS] Configuration looks good!" -ForegroundColor Green
} else {
    Write-Host "[ACTION] Edit .env.local and add your credentials" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "1. Edit .env.local file with your Google OAuth credentials"
Write-Host "2. Restart Next.js server:"
Write-Host "   - Stop: Ctrl+C"
Write-Host "   - Start: npm run dev"
Write-Host "3. Test at: https://goggly-casteless-torri.ngrok-free.dev/test-oauth"
Write-Host ""

$open = Read-Host "Open .env.local in notepad? (y/n)"
if ($open -eq "y") {
    notepad .env.local
}

Write-Host ""
Write-Host "[DONE] Setup complete!" -ForegroundColor Green
Write-Host ""
