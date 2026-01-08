# Detailed check for specific components

$components = @(
    "dashboard/ModernDashboard.jsx",
    "dashboard/Dashboard.jsx",
    "dashboard/EmployeeDashboard.jsx",
    "leave/LeaveManagement.jsx",
    "leave/LeaveApprovals.jsx",
    "reports/ReportsDashboard.jsx"
)

$nextjsPath = "d:\selsoft\WebApp\TimePulse\nextjs-app\src\components"

foreach ($comp in $components) {
    $file = Join-Path $nextjsPath $comp
    Write-Host "`n=== $comp ===" -ForegroundColor Cyan
    
    if (-not (Test-Path $file)) {
        Write-Host "File not found!" -ForegroundColor Red
        continue
    }
    
    $content = Get-Content $file -Raw
    
    # Check for patterns
    $hasUseClient = $content -match "'use client'"
    $hasIsMountedState = $content -match "\[isMounted, setIsMounted\] = useState\(false\)"
    $hasSetMountedEffect = $content -match "useEffect\(\(\) => \{\s*setIsMounted\(true\)"
    $hasLoadingGuardSimple = $content -match "if \(!isMounted\)"
    $hasLoadingGuardComplex = $content -match "if \(!isMounted \|\|"
    
    Write-Host "✓ 'use client': $hasUseClient" -ForegroundColor $(if ($hasUseClient) { "Green" } else { "Red" })
    Write-Host "✓ isMounted state: $hasIsMountedState" -ForegroundColor $(if ($hasIsMountedState) { "Green" } else { "Red" })
    Write-Host "✓ setIsMounted effect: $hasSetMountedEffect" -ForegroundColor $(if ($hasSetMountedEffect) { "Green" } else { "Red" })
    Write-Host "✓ Loading guard (simple): $hasLoadingGuardSimple" -ForegroundColor $(if ($hasLoadingGuardSimple) { "Green" } else { "Red" })
    Write-Host "✓ Loading guard (complex): $hasLoadingGuardComplex" -ForegroundColor $(if ($hasLoadingGuardComplex) { "Green" } else { "Red" })
    
    # Show the actual loading guard if it exists
    if ($hasLoadingGuardSimple -or $hasLoadingGuardComplex) {
        $lines = Get-Content $file
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "if \(!isMounted") {
                Write-Host ""
                $lineNum = $i + 1
                Write-Host "Loading guard found at line $lineNum" -ForegroundColor Yellow
                Write-Host $lines[$i] -ForegroundColor Gray
                if ($i+1 -lt $lines.Count) { Write-Host $lines[$i+1] -ForegroundColor Gray }
                if ($i+2 -lt $lines.Count) { Write-Host $lines[$i+2] -ForegroundColor Gray }
                break
            }
        }
    }
}
