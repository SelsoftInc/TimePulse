$body = @{
    firstName = "Test"
    lastName = "User"
    email = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    phone = "1234567890"
    countryCode = "+1"
    password = "Test@123"
    requestedRole = "employee"
    requestedApproverId = $null
    companyName = "Test Company"
    department = "IT"
} | ConvertTo-Json

Write-Host "Testing API endpoint..." -ForegroundColor Cyan
Write-Host "Request body:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/account-request/create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 30

    Write-Host "`nResponse Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "`nError occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" -ForegroundColor Red
        Write-Host $responseBody
    }
}
