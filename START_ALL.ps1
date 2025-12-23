# TimePulse - Start All Services
# This script starts the Server (Node.js), Engine (Python FastAPI), and Next.js App

Write-Host "🚀 Starting TimePulse Application Stack" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "📊 Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -ne 'Running') {
        Write-Host "⚠️  PostgreSQL service found but not running. Please start PostgreSQL manually." -ForegroundColor Red
        Write-Host "   Run: Start-Service $($pgService.Name)" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  PostgreSQL service not found. Please ensure PostgreSQL is installed and running." -ForegroundColor Red
    Write-Host "   Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
}

Write-Host ""

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return -not $connection
}

# Check if ports are available
Write-Host "🔍 Checking port availability..." -ForegroundColor Yellow
$portsToCheck = @{
    "5001" = "Server (Node.js)"
    "3000" = "Next.js App"
    "8000" = "Engine (FastAPI)"
}

$allPortsAvailable = $true
foreach ($port in $portsToCheck.Keys) {
    if (Test-Port -Port $port) {
        Write-Host "✅ Port $port is available for $($portsToCheck[$port])" -ForegroundColor Green
    } else {
        Write-Host "❌ Port $port is already in use (needed for $($portsToCheck[$port]))" -ForegroundColor Red
        $allPortsAvailable = $false
    }
}

if (-not $allPortsAvailable) {
    Write-Host ""
    Write-Host "⚠️  Some ports are already in use. Please free them before continuing." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create .env files if they don't exist
Write-Host "📝 Checking environment files..." -ForegroundColor Yellow

# Server .env
if (-not (Test-Path "server\.env")) {
    Write-Host "   Creating server\.env from .env.example..." -ForegroundColor Cyan
    Copy-Item "server\.env.example" "server\.env"
    Write-Host "   ⚠️  Please update server\.env with your actual configuration" -ForegroundColor Yellow
}

# Engine .env
if (-not (Test-Path "engine\.env")) {
    Write-Host "   Creating engine\.env from .env.example..." -ForegroundColor Cyan
    Copy-Item "engine\.env.example" "engine\.env"
    Write-Host "   ⚠️  Please update engine\.env with your actual configuration" -ForegroundColor Yellow
}

# Next.js .env.local
if (-not (Test-Path "nextjs-app\.env.local")) {
    Write-Host "   Creating nextjs-app\.env.local..." -ForegroundColor Cyan
    @"
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_ENGINE_URL=http://localhost:8000
"@ | Out-File -FilePath "nextjs-app\.env.local" -Encoding UTF8
}

Write-Host "✅ Environment files ready" -ForegroundColor Green
Write-Host ""

# Check if node_modules exist
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "server\node_modules")) {
    Write-Host "   Installing server dependencies..." -ForegroundColor Cyan
    Set-Location server
    npm install
    Set-Location ..
}

if (-not (Test-Path "nextjs-app\node_modules")) {
    Write-Host "   Installing Next.js app dependencies..." -ForegroundColor Cyan
    Set-Location nextjs-app
    npm install
    Set-Location ..
}

# Check Python virtual environment for engine
if (-not (Test-Path "engine\venv")) {
    Write-Host "   Creating Python virtual environment for engine..." -ForegroundColor Cyan
    Set-Location engine
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    deactivate
    Set-Location ..
}

Write-Host "✅ Dependencies ready" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start Server (Node.js) in new window
Write-Host "1️⃣  Starting Server (Node.js) on port 5001..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; Write-Host '🟢 TimePulse Server' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 3

# Start Engine (Python FastAPI) in new window
Write-Host "2️⃣  Starting Engine (Python FastAPI) on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\engine'; Write-Host '🟢 TimePulse Engine' -ForegroundColor Green; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Start Next.js App in new window
Write-Host "3️⃣  Starting Next.js App on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\nextjs-app'; Write-Host '🟢 TimePulse Next.js App' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Service URLs:" -ForegroundColor Cyan
Write-Host "   🌐 Next.js App:  https://goggly-casteless-torri.ngrok-free.dev" -ForegroundColor White
Write-Host "   🔧 Server API:   http://localhost:5001" -ForegroundColor White
Write-Host "   ⚙️  Engine API:   http://localhost:8000" -ForegroundColor White
Write-Host "   📚 Engine Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Each service is running in a separate PowerShell window" -ForegroundColor Yellow
Write-Host "   Close the windows or press Ctrl+C in each to stop services" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
