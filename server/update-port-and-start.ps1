# Update .env file to use port 5000
$envPath = ".\.env"
if (Test-Path $envPath) {
    $content = Get-Content $envPath
    $newContent = $content -replace 'PORT=5001', 'PORT=5000'
    $newContent | Set-Content $envPath
    Write-Host "✅ Updated .env file to use port 5000"
} else {
    Write-Host "⚠️ .env file not found, creating from .env.example"
    Copy-Item ".\.env.example" $envPath
    $content = Get-Content $envPath
    $newContent = $content -replace 'PORT=5001', 'PORT=5000'
    $newContent | Set-Content $envPath
    Write-Host "✅ Created .env file with port 5000"
}

Write-Host "`n🚀 Starting server on port 5000...`n"
npm start
