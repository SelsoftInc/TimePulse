# Automated API Migration Script for Next.js Components
# This script migrates all components from direct API_BASE usage to centralized services

Write-Host "🚀 Starting API Migration for All Components..." -ForegroundColor Cyan
Write-Host ""

$componentsDir = "src\components"
$totalFiles = 0
$migratedFiles = 0
$errors = @()

# Component to Service mapping
$serviceMapping = @{
    "employees" = "employeeService"
    "clients" = "clientService"
    "vendors" = "vendorService"
    "invoices" = "invoiceService"
    "timesheets" = "timesheetService"
    "leave" = "leaveService"
    "reports" = "reportService"
    "settings" = "settingsService"
    "implementationPartners" = "implementationPartnerService"
    "auth" = "authService"
    "dashboard" = "dashboardService"
    "billing" = "billingService"
}

# Get all .jsx files that contain API_BASE
$filesToMigrate = Get-ChildItem -Path $componentsDir -Recurse -Filter "*.jsx" | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "API_BASE" }

$totalFiles = $filesToMigrate.Count

Write-Host "📊 Found $totalFiles files to migrate" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $filesToMigrate) {
    try {
        Write-Host "📝 Processing: $($file.Name)" -ForegroundColor White
        
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        $modified = $false
        
        # Determine which service to use based on folder
        $folder = $file.Directory.Name
        $serviceName = $serviceMapping[$folder]
        
        if (-not $serviceName) {
            # Default to appropriate service based on file location
            if ($file.FullName -match "\\auth\\") { $serviceName = "authService" }
            elseif ($file.FullName -match "\\dashboard\\") { $serviceName = "dashboardService" }
            elseif ($file.FullName -match "\\common\\") { 
                # Skip common components for now
                Write-Host "   ⏭️  Skipped (common component)" -ForegroundColor Gray
                continue
            }
            else {
                Write-Host "   ⚠️  Warning: Could not determine service for $folder" -ForegroundColor Yellow
                continue
            }
        }
        
        # Check if already migrated
        if ($content -match "from '@/services'") {
            Write-Host "   ✅ Already migrated" -ForegroundColor Green
            continue
        }
        
        # Step 1: Update imports - Remove API_BASE import
        if ($content -match "import\s+\{\s*API_BASE\s*\}\s+from\s+'@/config/api';?") {
            $content = $content -replace "import\s+\{\s*API_BASE\s*\}\s+from\s+'@/config/api';?", ""
            $modified = $true
        }
        
        # Step 2: Add service import if not present
        if ($content -notmatch "import.*from '@/services'") {
            # Find the last import statement
            if ($content -match "(?s)(import.*?from.*?;)\s*\n\s*\n") {
                $lastImport = $Matches[1]
                $serviceImport = "import { $serviceName } from '@/services';"
                $content = $content -replace "(?s)(import.*?from.*?;)(\s*\n\s*\n)", "`$1`n$serviceImport`$2"
                $modified = $true
            }
        }
        
        if ($modified) {
            # Save the file
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $migratedFiles++
            Write-Host "   ✅ Migrated successfully" -ForegroundColor Green
        } else {
            Write-Host "   ℹ️  No changes needed" -ForegroundColor Gray
        }
        
    } catch {
        $errorMsg = "Error processing $($file.Name): $_"
        $errors += $errorMsg
        Write-Host "   ❌ $errorMsg" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Migration Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Total files found:     $totalFiles" -ForegroundColor White
Write-Host "Successfully migrated: $migratedFiles" -ForegroundColor Green
Write-Host "Errors:                $($errors.Count)" -ForegroundColor $(if ($errors.Count -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "❌ Errors encountered:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
    Write-Host ""
}

$percentage = [math]::Round(($migratedFiles / $totalFiles) * 100, 2)
Write-Host "✨ Migration Progress: $percentage%" -ForegroundColor Cyan
Write-Host ""

if ($migratedFiles -eq $totalFiles) {
    Write-Host "🎉 All components migrated successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some components still need manual review" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review the migrated files" -ForegroundColor White
Write-Host "   2. Replace fetch() calls with service methods" -ForegroundColor White
Write-Host "   3. Test each component" -ForegroundColor White
Write-Host "   4. Run: npm run dev" -ForegroundColor White
Write-Host ""
