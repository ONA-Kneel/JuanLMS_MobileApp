# Fix Gradle Metadata Corruption Script
# This script addresses the "Could not read workspace metadata" error

Write-Host "Starting Gradle metadata corruption fix..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location "frontend"

Write-Host "Step 1: Cleaning all build artifacts and caches..." -ForegroundColor Yellow

# Clean Android build directories
if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle"
    Write-Host "Removed android\.gradle directory" -ForegroundColor Green
}

if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build"
    Write-Host "Removed android\build directory" -ForegroundColor Green
}

if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "Removed android\app\build directory" -ForegroundColor Green
}

# Clean node_modules and reinstall
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "Removed node_modules directory" -ForegroundColor Green
}

Write-Host "Step 2: Reinstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Step 3: Cleaning global Gradle cache..." -ForegroundColor Yellow
# Clean global Gradle cache
$gradleHome = "$env:USERPROFILE\.gradle"
if (Test-Path $gradleHome) {
    Remove-Item -Recurse -Force "$gradleHome\caches" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$gradleHome\daemon" -ErrorAction SilentlyContinue
    Write-Host "Cleaned global Gradle cache" -ForegroundColor Green
}

Write-Host "Step 4: Testing Gradle build..." -ForegroundColor Yellow
Set-Location "android"

# Test Gradle version first
Write-Host "Testing Gradle version..." -ForegroundColor Cyan
./gradlew --version

Write-Host "Step 5: Attempting clean build..." -ForegroundColor Yellow
# Try a clean build
./gradlew clean

Write-Host "Step 6: Building release APK..." -ForegroundColor Yellow
# Build release APK
./gradlew :app:assembleRelease

Write-Host "Gradle metadata corruption fix completed!" -ForegroundColor Green
