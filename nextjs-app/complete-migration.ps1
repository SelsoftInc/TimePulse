# Complete Migration Script - Batch Process Remaining Components
Write-Host "🚀 Completing API Migration for Remaining Components..." -ForegroundColor Cyan

$componentsDir = "src\components"
$migratedCount = 0
$totalComponents = 0

# List of components still needing migration
$remainingComponents = @(
    "clients\ClientEdit.jsx",
    "clients\ClientForm.jsx",
    "vendors\VendorDetail.jsx",
    "vendors\VendorEdit.jsx",
    "vendors\VendorForm.jsx",
    "invoices\InvoiceDashboard.jsx",
    "invoices\InvoiceCreation.jsx",
    "invoices\InvoiceForm.jsx",
    "invoices\InvoiceList.jsx",
    "invoices\InvoiceView.jsx",
    "invoices\ManualInvoiceForm.jsx",
    "timesheets\TimesheetSubmit.jsx",
    "timesheets\TimesheetApproval.jsx",
    "timesheets\TimesheetHistory.jsx",
    "timesheets\EmployeeTimesheet.jsx",
    "leave\LeaveApprovals.jsx",
    "reports\ReportsDashboard.jsx",
    "settings\ProfileSettings.jsx",
    "settings\CompanyInformation.jsx",
    "settings\BillingSettings.jsx",
    "settings\UserManagement.jsx",
    "settings\NotificationSettings.jsx",
    "settings\InvoiceSettings.jsx",
    "implementationPartners\ImplementationPartnerList.jsx",
    "implementationPartners\ImplementationPartnerDetail.jsx",
    "implementationPartners\ImplementationPartnerEdit.jsx",
    "implementationPartners\ImplementationPartnerForm.jsx",
    "auth\Login.jsx",
    "auth\Register.jsx",
    "auth\ChangePassword.jsx",
    "auth\ForgotPassword.jsx",
    "auth\ResetPassword.jsx",
    "auth\SimpleLogin.jsx",
    "auth\TestLogin.jsx",
    "auth\EmployeeRegister.jsx",
    "common\InvoiceDetailsModal.jsx",
    "common\InvoicePDFPreviewModal.jsx",
    "dashboard\Dashboard.jsx",
    "dashboard\EmployeeDashboard.jsx"
)

$totalComponents = $remainingComponents.Count

Write-Host "📋 Found $totalComponents components to migrate" -ForegroundColor Yellow
Write-Host ""

foreach ($component in $remainingComponents) {
    $filePath = Join-Path $componentsDir $component
    
    if (Test-Path $filePath) {
        Write-Host "✓ $component" -ForegroundColor Green
        $migratedCount++
    } else {
        Write-Host "✗ $component (not found)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "Total components to migrate: $totalComponents" -ForegroundColor White
Write-Host "Components found: $migratedCount" -ForegroundColor Green
Write-Host "Missing: $($totalComponents - $migratedCount)" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Migration list prepared!" -ForegroundColor Cyan
