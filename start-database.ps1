# Start PostgreSQL Database for TimePulse
# This script provides multiple options to start the database

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     🗄️  TimePulse - Database Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerAvailable = $false
try {
    $null = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
    }
} catch {
    $dockerAvailable = $false
}

# Check if PostgreSQL is installed
$pgInstalled = $false
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    $pgInstalled = $true
}

Write-Host "Available Options:" -ForegroundColor Yellow
Write-Host ""

if ($dockerAvailable) {
    Write-Host "1. Start PostgreSQL with Docker (Recommended - Quick & Clean)" -ForegroundColor Green
}

if ($pgInstalled) {
    Write-Host "2. Start Installed PostgreSQL Service" -ForegroundColor Green
}

if (-not $dockerAvailable -and -not $pgInstalled) {
    Write-Host "❌ No database solution found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please choose one of the following:" -ForegroundColor Yellow
    Write-Host "  A. Install Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "  B. Install PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Enter your choice (1 or 2): " -NoNewline -ForegroundColor Cyan
$choice = Read-Host

Write-Host ""

switch ($choice) {
    "1" {
        if (-not $dockerAvailable) {
            Write-Host "❌ Docker is not available" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "🐳 Starting PostgreSQL with Docker..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if container already exists
        $containerExists = docker ps -a --filter "name=timepulse-postgres" --format "{{.Names}}" 2>$null
        
        if ($containerExists -eq "timepulse-postgres") {
            Write-Host "📦 Container already exists. Checking status..." -ForegroundColor Yellow
            
            $containerRunning = docker ps --filter "name=timepulse-postgres" --format "{{.Names}}" 2>$null
            
            if ($containerRunning -eq "timepulse-postgres") {
                Write-Host "✅ PostgreSQL container is already running!" -ForegroundColor Green
            } else {
                Write-Host "🔄 Starting existing container..." -ForegroundColor Cyan
                docker start timepulse-postgres
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ PostgreSQL container started successfully!" -ForegroundColor Green
                } else {
                    Write-Host "❌ Failed to start container" -ForegroundColor Red
                    exit 1
                }
            }
        } else {
            Write-Host "🆕 Creating new PostgreSQL container..." -ForegroundColor Cyan
            
            # Use docker-compose if available
            if (Test-Path "docker-compose.yml") {
                docker-compose up -d postgres
            } else {
                # Fallback to docker run
                docker run --name timepulse-postgres `
                    -e POSTGRES_PASSWORD=postgres `
                    -e POSTGRES_DB=timepulse_db `
                    -p 5432:5432 `
                    -d postgres:15-alpine
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ PostgreSQL container created and started!" -ForegroundColor Green
                Write-Host ""
                Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
                Start-Sleep -Seconds 5
            } else {
                Write-Host "❌ Failed to create container" -ForegroundColor Red
                exit 1
            }
        }
        
        Write-Host ""
        Write-Host "📊 Database Configuration:" -ForegroundColor Cyan
        Write-Host "   Host: localhost" -ForegroundColor White
        Write-Host "   Port: 5432" -ForegroundColor White
        Write-Host "   Database: timepulse_db" -ForegroundColor White
        Write-Host "   Username: postgres" -ForegroundColor White
        Write-Host "   Password: postgres" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Useful Commands:" -ForegroundColor Yellow
        Write-Host "   Stop:    docker stop timepulse-postgres" -ForegroundColor White
        Write-Host "   Start:   docker start timepulse-postgres" -ForegroundColor White
        Write-Host "   Remove:  docker rm -f timepulse-postgres" -ForegroundColor White
        Write-Host "   Logs:    docker logs timepulse-postgres" -ForegroundColor White
    }
    
    "2" {
        if (-not $pgInstalled) {
            Write-Host "❌ PostgreSQL service not found" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "🔄 Starting PostgreSQL Service..." -ForegroundColor Cyan
        Write-Host ""
        
        $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
        
        if ($pgService.Status -eq 'Running') {
            Write-Host "✅ PostgreSQL service is already running!" -ForegroundColor Green
        } else {
            try {
                Start-Service $pgService.Name -ErrorAction Stop
                Write-Host "✅ PostgreSQL service started successfully!" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to start PostgreSQL service" -ForegroundColor Red
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host ""
                Write-Host "   Try running as Administrator" -ForegroundColor Yellow
                exit 1
            }
        }
        
        Write-Host ""
        Write-Host "📊 Database Configuration:" -ForegroundColor Cyan
        Write-Host "   Host: localhost" -ForegroundColor White
        Write-Host "   Port: 5432" -ForegroundColor White
        Write-Host "   Database: timepulse_db" -ForegroundColor White
        Write-Host "   Username: postgres" -ForegroundColor White
        Write-Host "   Password: (your PostgreSQL password)" -ForegroundColor White
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Check if database needs initialization
Write-Host ""
Write-Host "🔍 Checking if database schema needs initialization..." -ForegroundColor Yellow

$needsInit = $true
# You can add logic here to check if tables exist

if ($needsInit) {
    Write-Host ""
    Write-Host "Would you like to initialize the database schema now? (y/N): " -NoNewline -ForegroundColor Yellow
    $initResponse = Read-Host
    
    if ($initResponse -eq 'y' -or $initResponse -eq 'Y') {
        Write-Host ""
        Write-Host "🔄 Initializing database schema..." -ForegroundColor Cyan
        
        Push-Location server
        npm run setup-db
        Pop-Location
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database schema initialized successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Database initialization may have failed. Check the output above." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "✅ Database is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update server\.env with database credentials" -ForegroundColor White
Write-Host "  2. Run: cd server && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
