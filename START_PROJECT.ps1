# TimePulse - Complete Project Startup Script
# This script checks prerequisites and starts all services

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     🚀 TimePulse - Complete Project Startup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    } catch {
        return $false
    }
}

# Function to check if port is in use
function Test-PortInUse {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet 2>$null
    return $connection
}

# Check Prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

$allPrereqsMet = $true

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    $allPrereqsMet = $false
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    $allPrereqsMet = $false
}

# Check Python
if (Test-Command "python") {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found" -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    $allPrereqsMet = $false
}

# Check PostgreSQL
$pgInstalled = $false
if (Test-Command "psql") {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL: $pgVersion" -ForegroundColor Green
    $pgInstalled = $true
} else {
    Write-Host "⚠️  PostgreSQL command-line tools not found" -ForegroundColor Yellow
    Write-Host "   Checking for PostgreSQL service..." -ForegroundColor Yellow
    
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService) {
        Write-Host "✅ PostgreSQL service found: $($pgService.Name)" -ForegroundColor Green
        $pgInstalled = $true
    } else {
        Write-Host "❌ PostgreSQL not found" -ForegroundColor Red
        Write-Host "   Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
        $allPrereqsMet = $false
    }
}

Write-Host ""

if (-not $allPrereqsMet) {
    Write-Host "❌ Missing prerequisites. Please install the required software." -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check PostgreSQL Status
if ($pgInstalled) {
    Write-Host "🗄️  Checking PostgreSQL Status..." -ForegroundColor Yellow
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    
    if ($pgService) {
        if ($pgService.Status -eq 'Running') {
            Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  PostgreSQL service exists but is not running" -ForegroundColor Yellow
            Write-Host "   Attempting to start PostgreSQL..." -ForegroundColor Cyan
            
            try {
                Start-Service $pgService.Name -ErrorAction Stop
                Write-Host "✅ PostgreSQL started successfully" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to start PostgreSQL automatically" -ForegroundColor Red
                Write-Host "   Please start it manually:" -ForegroundColor Yellow
                Write-Host "   Start-Service $($pgService.Name)" -ForegroundColor White
                Write-Host ""
                Write-Host "Press any key to exit..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                exit 1
            }
        }
    } else {
        Write-Host "⚠️  PostgreSQL service not found, but psql is available" -ForegroundColor Yellow
        Write-Host "   Assuming PostgreSQL is running..." -ForegroundColor Yellow
    }
    Write-Host ""
}

# Check Database Exists
Write-Host "🗄️  Checking Database..." -ForegroundColor Yellow
try {
    $dbCheck = psql -U postgres -lqt 2>&1 | Select-String -Pattern "timepulse_db"
    if ($dbCheck) {
        Write-Host "✅ Database 'timepulse_db' exists" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database 'timepulse_db' not found" -ForegroundColor Yellow
        Write-Host "   Creating database..." -ForegroundColor Cyan
        
        $null = "CREATE DATABASE timepulse_db;" | psql -U postgres 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database created successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create database" -ForegroundColor Red
            Write-Host "   Please create it manually:" -ForegroundColor Yellow
            Write-Host "   psql -U postgres -c 'CREATE DATABASE timepulse_db;'" -ForegroundColor White
        }
    }
} catch {
    Write-Host "⚠️  Could not verify database (this may be okay)" -ForegroundColor Yellow
}
Write-Host ""

# Check Port Availability
Write-Host "🔍 Checking Port Availability..." -ForegroundColor Yellow
$ports = @{
    5001 = "Server (Node.js)"
    3000 = "Next.js App"
    8000 = "Engine (FastAPI)"
}

$portsAvailable = $true
foreach ($port in $ports.Keys) {
    if (Test-PortInUse -Port $port) {
        Write-Host "❌ Port $port is in use (needed for $($ports[$port]))" -ForegroundColor Red
        $portsAvailable = $false
    } else {
        Write-Host "✅ Port $port is available" -ForegroundColor Green
    }
}

if (-not $portsAvailable) {
    Write-Host ""
    Write-Host "⚠️  Some ports are in use. Free them or stop conflicting services." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continue anyway? (y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne 'y' -and $response -ne 'Y') {
        exit 1
    }
}
Write-Host ""

# Check Environment Files
Write-Host "📝 Checking Environment Files..." -ForegroundColor Yellow

if (-not (Test-Path "server\.env")) {
    Write-Host "   Creating server\.env..." -ForegroundColor Cyan
    Copy-Item "server\.env.example" "server\.env"
    Write-Host "✅ Created server\.env" -ForegroundColor Green
} else {
    Write-Host "✅ server\.env exists" -ForegroundColor Green
}

if (-not (Test-Path "engine\.env")) {
    Write-Host "   Creating engine\.env..." -ForegroundColor Cyan
    Copy-Item "engine\.env.example" "engine\.env"
    Write-Host "✅ Created engine\.env" -ForegroundColor Green
} else {
    Write-Host "✅ engine\.env exists" -ForegroundColor Green
}

if (-not (Test-Path "nextjs-app\.env.local")) {
    Write-Host "   Creating nextjs-app\.env.local..." -ForegroundColor Cyan
    @"
NEXT_PUBLIC_API_URL=http://44.222.217.57:5001
NEXT_PUBLIC_ENGINE_URL=http://44.222.217.57:8000
"@ | Out-File -FilePath "nextjs-app\.env.local" -Encoding UTF8
    Write-Host "✅ Created nextjs-app\.env.local" -ForegroundColor Green
} else {
    Write-Host "✅ nextjs-app\.env.local exists" -ForegroundColor Green
}
Write-Host ""

# Check Dependencies
Write-Host "📦 Checking Dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "server\node_modules")) {
    Write-Host "   Installing server dependencies..." -ForegroundColor Cyan
    Push-Location server
    npm install --silent
    Pop-Location
    Write-Host "✅ Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Server dependencies installed" -ForegroundColor Green
}

if (-not (Test-Path "nextjs-app\node_modules")) {
    Write-Host "   Installing Next.js app dependencies..." -ForegroundColor Cyan
    Push-Location nextjs-app
    npm install --silent
    Pop-Location
    Write-Host "✅ Next.js app dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Next.js app dependencies installed" -ForegroundColor Green
}

if (-not (Test-Path "engine\venv")) {
    Write-Host "   Creating Python virtual environment..." -ForegroundColor Cyan
    Push-Location engine
    python -m venv venv
    Write-Host "   Installing Python dependencies..." -ForegroundColor Cyan
    .\venv\Scripts\Activate.ps1
    pip install -q -r requirements.txt
    deactivate
    Pop-Location
    Write-Host "✅ Engine dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Engine virtual environment exists" -ForegroundColor Green
}
Write-Host ""

# Start Services
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     🚀 Starting Services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting services in separate windows..." -ForegroundColor Yellow
Write-Host ""

# Start Server
Write-Host "1️⃣  Starting Server (Node.js) on port 5001..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$Host.UI.RawUI.WindowTitle = 'TimePulse Server (Port 5001)'
Write-Host ''
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '     🟢 TimePulse Server (Node.js)' -ForegroundColor Green
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''
Write-Host '📍 Port: 5001' -ForegroundColor Yellow
Write-Host '📍 API: http://44.222.217.57:5001' -ForegroundColor Yellow
Write-Host ''
cd '$PWD\server'
npm run dev
"@

Start-Sleep -Seconds 3

# Start Engine
Write-Host "2️⃣  Starting Engine (Python FastAPI) on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$Host.UI.RawUI.WindowTitle = 'TimePulse Engine (Port 8000)'
Write-Host ''
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '     🟢 TimePulse Engine (FastAPI)' -ForegroundColor Green
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''
Write-Host '📍 Port: 8000' -ForegroundColor Yellow
Write-Host '📍 API: http://44.222.217.57:8000' -ForegroundColor Yellow
Write-Host '📍 Docs: http://44.222.217.57:8000/docs' -ForegroundColor Yellow
Write-Host ''
cd '$PWD\engine'
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
"@

Start-Sleep -Seconds 3

# Start Next.js App
Write-Host "3️⃣  Starting Next.js App on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$Host.UI.RawUI.WindowTitle = 'TimePulse Next.js App (Port 3000)'
Write-Host ''
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '     🟢 TimePulse Next.js App' -ForegroundColor Green
Write-Host '═══════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''
Write-Host '📍 Port: 3000' -ForegroundColor Yellow
Write-Host '📍 URL: https://goggly-casteless-torri.ngrok-free.dev' -ForegroundColor Yellow
Write-Host ''
cd '$PWD\nextjs-app'
npm run dev
"@

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     ✅ All Services Started!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Access Your Application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🌐 Frontend:    https://goggly-casteless-torri.ngrok-free.dev" -ForegroundColor White
Write-Host "   🔧 Server API:  http://44.222.217.57:5001" -ForegroundColor White
Write-Host "   ⚙️  Engine API:  http://44.222.217.57:8000" -ForegroundColor White
Write-Host "   📚 API Docs:    http://44.222.217.57:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Each service runs in a separate window" -ForegroundColor White
Write-Host "   • Close windows or press Ctrl+C to stop services" -ForegroundColor White
Write-Host "   • Check each window for logs and errors" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
