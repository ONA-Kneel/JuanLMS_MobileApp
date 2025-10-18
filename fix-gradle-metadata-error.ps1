# Fix Gradle Metadata Error Script
# This script resolves the "Could not read workspace metadata" error

Write-Host "Starting Gradle metadata error fix..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location "frontend"

Write-Host "Clearing Gradle cache..." -ForegroundColor Yellow

# Clear Gradle cache
if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle"
    Write-Host "Removed android\.gradle directory" -ForegroundColor Green
}

# Clear build directories
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "Removed android\app\build directory" -ForegroundColor Green
}

if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build"
    Write-Host "Removed android\build directory" -ForegroundColor Green
}

# Clear node_modules and reinstall
Write-Host "Clearing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "Removed node_modules directory" -ForegroundColor Green
}

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Reinstall dependencies
Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
npm install

# Clean and rebuild Android project
Write-Host "Cleaning Android project..." -ForegroundColor Yellow
cd android
.\gradlew clean
cd ..

Write-Host "Gradle metadata error fix completed!" -ForegroundColor Green
Write-Host "You can now try building your project again." -ForegroundColor Cyan

# Return to root directory
Set-Location ".."
