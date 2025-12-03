#!/usr/bin/env pwsh
# Clear Next.js Cache Script
# This script clears all Next.js caches and restarts the dev server

Write-Host "🧹 Clearing Next.js Cache..." -ForegroundColor Cyan

# Stop any running Next.js processes on port 3000
Write-Host "Stopping processes on port 3000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($proc in $processes) {
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Stopped process $proc" -ForegroundColor Green
    }
} else {
    Write-Host "  ℹ No processes found on port 3000" -ForegroundColor Gray
}

# Clear .next directory
Write-Host "Clearing .next directory..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "  ✓ Cleared .next" -ForegroundColor Green
} else {
    Write-Host "  ℹ .next directory not found" -ForegroundColor Gray
}

# Clear node_modules cache
Write-Host "Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Path "node_modules/.cache" -Recurse -Force
    Write-Host "  ✓ Cleared node_modules/.cache" -ForegroundColor Green
} else {
    Write-Host "  ℹ node_modules/.cache not found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Cache cleared successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Cyan
Write-Host "Run: npm run dev" -ForegroundColor Yellow
Write-Host ""
