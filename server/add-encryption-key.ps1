# PowerShell script to add ENCRYPTION_KEY to .env file
# Run this script to automatically add the encryption key

$envFile = ".\.env"
$encryptionKey = "fc9e7f980be3381a0fd4395aa195104ceb33bcc369fa2c764de9a8fbe1e9f636"

Write-Host "🔐 Adding ENCRYPTION_KEY to .env file..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".\.env.example") {
        Copy-Item ".\.env.example" $envFile
        Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found! Please create .env file manually." -ForegroundColor Red
        exit 1
    }
}

# Read the .env file
$content = Get-Content $envFile -Raw

# Check if ENCRYPTION_KEY already exists
if ($content -match "ENCRYPTION_KEY=") {
    Write-Host "⚠️  ENCRYPTION_KEY already exists in .env file" -ForegroundColor Yellow
    Write-Host "Updating ENCRYPTION_KEY..." -ForegroundColor Yellow
    
    # Replace existing ENCRYPTION_KEY
    $content = $content -replace "ENCRYPTION_KEY=.*", "ENCRYPTION_KEY=$encryptionKey"
    $content | Set-Content $envFile -NoNewline
    
    Write-Host "✅ ENCRYPTION_KEY updated successfully!" -ForegroundColor Green
} else {
    Write-Host "Adding ENCRYPTION_KEY to .env file..." -ForegroundColor Yellow
    
    # Add ENCRYPTION_KEY at the end
    $content += "`n`n# Encryption key for sensitive data`nENCRYPTION_KEY=$encryptionKey"
    $content | Set-Content $envFile -NoNewline
    
    Write-Host "✅ ENCRYPTION_KEY added successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Encryption Key Details:" -ForegroundColor Cyan
Write-Host "   Key: $encryptionKey" -ForegroundColor Gray
Write-Host "   Length: $($encryptionKey.Length) characters" -ForegroundColor Gray
Write-Host "   Algorithm: AES-256-GCM" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Done! Please restart your server for changes to take effect." -ForegroundColor Green
Write-Host ""
Write-Host "To restart the server:" -ForegroundColor Cyan
Write-Host "   1. Press CTRL+C to stop the current server" -ForegroundColor Gray
Write-Host "   2. Run: npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "To verify encryption is working:" -ForegroundColor Cyan
Write-Host "   Run: node test-encryption.js" -ForegroundColor Gray
Write-Host ""
