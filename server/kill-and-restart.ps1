# Kill any process on port 5001
$port5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if ($port5001) {
    $processId = $port5001.OwningProcess
    Write-Host "Killing process $processId on port 5001..."
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
}

# Kill any process on port 5000
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    $processId = $port5000.OwningProcess
    Write-Host "Killing process $processId on port 5000..."
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 2
}

Write-Host "Starting server on port 5000..."
npm start
