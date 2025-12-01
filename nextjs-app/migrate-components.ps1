# PowerShell script to migrate React components to Next.js

Write-Host "🚀 Starting TimePulse Component Migration to Next.js..." -ForegroundColor Green
Write-Host ""

# Define source and destination paths
$sourcePath = "d:\selsoft\WebApp\TimePulse\frontend\src\components"
$destPath = "d:\selsoft\WebApp\TimePulse\nextjs-app\src\components"

# Step 1: Copy all components
Write-Host "📁 Step 1: Copying all components..." -ForegroundColor Cyan
xcopy /E /I /Y "$sourcePath" "$destPath"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Components copied successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Error copying components" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Update imports in all JavaScript/JSX files
Write-Host "🔄 Step 2: Updating import paths..." -ForegroundColor Cyan

$files = Get-ChildItem -Path $destPath -Include *.js,*.jsx -Recurse

$importReplacements = @{
    "from ['""]\.\.\/\.\.\/contexts\/" = "from '@/contexts/"
    "from ['""]\.\.\/\.\.\/\.\.\/contexts\/" = "from '@/contexts/"
    "from ['""]\.\.\/\.\.\/utils\/" = "from '@/utils/"
    "from ['""]\.\.\/\.\.\/\.\.\/utils\/" = "from '@/utils/"
    "from ['""]\.\.\/\.\.\/services\/" = "from '@/services/"
    "from ['""]\.\.\/\.\.\/\.\.\/services\/" = "from '@/services/"
    "from ['""]\.\.\/\.\.\/hooks\/" = "from '@/hooks/"
    "from ['""]\.\.\/\.\.\/\.\.\/hooks\/" = "from '@/hooks/"
    "from ['""]\.\.\/\.\.\/constants\/" = "from '@/constants/"
    "from ['""]\.\.\/\.\.\/\.\.\/constants\/" = "from '@/constants/"
}

$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Update import paths
    foreach ($pattern in $importReplacements.Keys) {
        $replacement = $importReplacements[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    # Check if file uses hooks or browser APIs and needs 'use client'
    $needsUseClient = $false
    
    if ($content -match "useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef") {
        $needsUseClient = $true
    }
    
    if ($content -match "onClick|onChange|onSubmit|onKeyDown|onKeyUp|onFocus|onBlur") {
        $needsUseClient = $true
    }
    
    if ($content -match "window\.|document\.|localStorage|sessionStorage") {
        $needsUseClient = $true
    }
    
    # Add 'use client' if needed and not already present
    if ($needsUseClient -and $content -notmatch "^['""]use client['""];") {
        $useClientDirective = "'use client';"
        $content = $useClientDirective + "`n`n" + $content
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedCount++
    }
}

Write-Host "✅ Updated $updatedCount component files!" -ForegroundColor Green
Write-Host ""

# Step 3: Create page routes for main modules
Write-Host "📄 Step 3: Creating Next.js page routes..." -ForegroundColor Cyan

$routes = @(
    @{Path="[subdomain]\timesheets"; Component="TimesheetSummary"; Permission="VIEW_TIMESHEET"},
    @{Path="[subdomain]\timesheets\submit"; Component="TimesheetSubmit"; Permission=$null},
    @{Path="[subdomain]\timesheets\approval"; Component="TimesheetApproval"; Permission="APPROVE_TIMESHEETS"},
    @{Path="[subdomain]\timesheets\history"; Component="TimesheetHistory"; Permission=$null},
    @{Path="[subdomain]\clients"; Component="ClientsList"; Permission="VIEW_CLIENT"},
    @{Path="[subdomain]\clients\new"; Component="ClientForm"; Permission="CREATE_CLIENT"},
    @{Path="[subdomain]\employees"; Component="EmployeeList"; Permission="VIEW_EMPLOYEE"},
    @{Path="[subdomain]\employees\new"; Component="EmployeeForm"; Permission="CREATE_EMPLOYEE"},
    @{Path="[subdomain]\invoices"; Component="Invoice"; Permission="VIEW_INVOICE"},
    @{Path="[subdomain]\invoices\new"; Component="InvoiceCreation"; Permission="CREATE_INVOICE"},
    @{Path="[subdomain]\invoices\dashboard"; Component="InvoiceDashboard"; Permission="VIEW_INVOICE"},
    @{Path="[subdomain]\reports"; Component="ReportsDashboard"; Permission="VIEW_REPORTS"},
    @{Path="[subdomain]\settings"; Component="EmployerSettings"; Permission="VIEW_SETTINGS"},
    @{Path="[subdomain]\leave"; Component="LeaveManagement"; Permission=$null},
    @{Path="[subdomain]\vendors"; Component="VendorList"; Permission="VIEW_VENDOR"}
)

$pagesCreated = 0

foreach ($route in $routes) {
    $pagePath = "d:\selsoft\WebApp\TimePulse\nextjs-app\src\app\$($route.Path)\page.js"
    $pageDir = Split-Path $pagePath -Parent
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $pageDir)) {
        New-Item -ItemType Directory -Path $pageDir -Force | Out-Null
    }
    
    # Determine component path
    $componentPath = switch -Wildcard ($route.Component) {
        "Timesheet*" { "timesheets" }
        "Client*" { "clients" }
        "Employee*" { "employees" }
        "Invoice*" { "invoices" }
        "Reports*" { "reports" }
        "Employer*" { "settings" }
        "Leave*" { "leave" }
        "Vendor*" { "vendors" }
        default { "common" }
    }
    
    # Create page content
    $pageContent = "'use client';`n`n"
    
    if ($route.Permission) {
        $pageContent += "import ProtectedRoute from '@/components/common/ProtectedRoute';`n"
        $pageContent += "import $($route.Component) from '@/components/$componentPath/$($route.Component)';`n"
        $pageContent += "import { PERMISSIONS } from '@/utils/roles';`n`n"
        $pageContent += "export default function Page() {`n"
        $pageContent += "  return (`n"
        $pageContent += "    <ProtectedRoute requiredPermission={PERMISSIONS.$($route.Permission)}>`n"
        $pageContent += "      <$($route.Component) />`n"
        $pageContent += "    </ProtectedRoute>`n"
        $pageContent += "  );`n"
        $pageContent += "}`n"
    } else {
        $pageContent += "import $($route.Component) from '@/components/$componentPath/$($route.Component)';`n`n"
        $pageContent += "export default function Page() {`n"
        $pageContent += "  return <$($route.Component) />;`n"
        $pageContent += "}`n"
    }
    
    # Write page file
    Set-Content -Path $pagePath -Value $pageContent
    $pagesCreated++
}

Write-Host "✅ Created $pagesCreated page routes!" -ForegroundColor Green
Write-Host ""

# Step 4: Copy public assets
Write-Host "📦 Step 4: Copying public assets..." -ForegroundColor Cyan

$publicSource = "d:\selsoft\WebApp\TimePulse\frontend\public"
$publicDest = "d:\selsoft\WebApp\TimePulse\nextjs-app\public"

if (Test-Path $publicSource) {
    xcopy /E /I /Y "$publicSource" "$publicDest"
    Write-Host "✅ Public assets copied!" -ForegroundColor Green
} else {
    Write-Host "⚠️  No public assets found" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "🎉 Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Components copied and updated: $updatedCount files" -ForegroundColor White
Write-Host "  ✅ Page routes created: $pagesCreated routes" -ForegroundColor White
Write-Host "  ✅ Public assets copied" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. cd nextjs-app" -ForegroundColor White
Write-Host "  2. npm install" -ForegroundColor White
Write-Host "  3. Copy .env.example to .env.local and configure" -ForegroundColor White
Write-Host "  4. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 See MIGRATION_GUIDE.md for detailed information" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Important: Review and test all components thoroughly!" -ForegroundColor Yellow
