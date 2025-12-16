# PowerShell script to verify Next.js migration completeness

$reactPath = "d:\selsoft\WebApp\TimePulse\frontend\src\components"
$nextjsPath = "d:\selsoft\WebApp\TimePulse\nextjs-app\src\components"

$components = @(
    "invoices/InvoiceDashboard.jsx",
    "invoices/Invoice.jsx",
    "employees/EmployeeList.jsx",
    "employees/EmployeeDetail.jsx",
    "employees/EmployeeEdit.jsx",
    "employees/EmployeeForm.jsx",
    "employees/EmployeeSettings.jsx",
    "clients/ClientsList.jsx",
    "clients/ClientDetails.jsx",
    "clients/ClientEdit.jsx",
    "clients/ClientForm.jsx",
    "vendors/VendorList.jsx",
    "vendors/VendorDetail.jsx",
    "vendors/VendorEdit.jsx",
    "vendors/VendorForm.jsx",
    "timesheets/TimesheetSummary.jsx",
    "timesheets/EmployeeTimesheet.jsx",
    "timesheets/TimesheetApproval.jsx",
    "dashboard/ModernDashboard.jsx",
    "dashboard/Dashboard.jsx",
    "dashboard/EmployeeDashboard.jsx",
    "leave/LeaveManagement.jsx",
    "leave/LeaveApprovals.jsx",
    "reports/ReportsDashboard.jsx"
)

Write-Host "`n=== Next.js Migration Verification ===`n" -ForegroundColor Cyan

$results = @()

foreach ($comp in $components) {
    $reactFile = Join-Path $reactPath $comp
    $nextjsFile = Join-Path $nextjsPath $comp
    
    if (-not (Test-Path $reactFile)) {
        Write-Host "❌ React file not found: $comp" -ForegroundColor Red
        continue
    }
    
    if (-not (Test-Path $nextjsFile)) {
        Write-Host "❌ Next.js file not found: $comp" -ForegroundColor Red
        continue
    }
    
    $reactLines = (Get-Content $reactFile).Count
    $nextjsLines = (Get-Content $nextjsFile).Count
    $lineDiff = $nextjsLines - $reactLines
    
    # Check for key migration patterns
    $nextjsContent = Get-Content $nextjsFile -Raw
    $hasUseClient = $nextjsContent -match "'use client'"
    $hasIsMounted = $nextjsContent -match "isMounted"
    $hasLoadingGuard = $nextjsContent -match "if \(!isMounted\)"
    $hasNextLink = $nextjsContent -match "import Link from 'next/link'"
    $hasNextNav = $nextjsContent -match "from 'next/navigation'"
    
    $status = "✅"
    $issues = @()
    
    if (-not $hasUseClient) { $issues += "Missing 'use client'"; $status = "⚠️" }
    if (-not $hasIsMounted) { $issues += "Missing isMounted"; $status = "⚠️" }
    if (-not $hasLoadingGuard) { $issues += "Missing loading guard"; $status = "⚠️" }
    if (-not $hasNextLink -and $nextjsContent -match "<Link") { $issues += "Not using Next.js Link"; $status = "⚠️" }
    
    $result = [PSCustomObject]@{
        Component = $comp
        Status = $status
        ReactLines = $reactLines
        NextJsLines = $nextjsLines
        LineDiff = $lineDiff
        HasUseClient = $hasUseClient
        HasIsMounted = $hasIsMounted
        HasLoadingGuard = $hasLoadingGuard
        HasNextLink = $hasNextLink
        HasNextNav = $hasNextNav
        Issues = ($issues -join ", ")
    }
    
    $results += $result
    
    $statusColor = if ($status -eq "✅") { "Green" } else { "Yellow" }
    Write-Host "$status $comp" -ForegroundColor $statusColor
    Write-Host "   Lines: React=$reactLines, Next.js=$nextjsLines (diff: $lineDiff)" -ForegroundColor Gray
    if ($issues.Count -gt 0) {
        Write-Host "   Issues: $($issues -join ', ')" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "`n=== Summary ===`n" -ForegroundColor Cyan
$totalComponents = $results.Count
$fullyMigrated = ($results | Where-Object { $_.Status -eq "✅" }).Count
$needsWork = ($results | Where-Object { $_.Status -eq "⚠️" }).Count

Write-Host "Total Components: $totalComponents" -ForegroundColor White
Write-Host "Fully Migrated: $fullyMigrated" -ForegroundColor Green
Write-Host "Needs Work: $needsWork" -ForegroundColor Yellow

# Export results to CSV
$results | Export-Csv -Path "d:\selsoft\WebApp\TimePulse\migration-verification-results.csv" -NoTypeInformation
Write-Host "`nDetailed results exported to: migration-verification-results.csv" -ForegroundColor Cyan
