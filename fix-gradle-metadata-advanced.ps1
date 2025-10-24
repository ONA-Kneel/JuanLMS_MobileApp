# Advanced Gradle Metadata Corruption Fix
# This script addresses React Native 0.76.9 + Expo SDK 52 compatibility issues

Write-Host "Starting Advanced Gradle metadata corruption fix..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location "frontend"

Write-Host "Step 1: Stopping all Gradle daemons..." -ForegroundColor Yellow
# Stop all Gradle daemons
cd android
./gradlew --stop
cd ..

Write-Host "Step 2: Cleaning all build artifacts and caches..." -ForegroundColor Yellow

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

Write-Host "Step 3: Cleaning global Gradle cache..." -ForegroundColor Yellow
# Clean global Gradle cache more aggressively
$gradleHome = "$env:USERPROFILE\.gradle"
if (Test-Path $gradleHome) {
    Remove-Item -Recurse -Force "$gradleHome\caches" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$gradleHome\daemon" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$gradleHome\wrapper" -ErrorAction SilentlyContinue
    Write-Host "Cleaned global Gradle cache" -ForegroundColor Green
}

Write-Host "Step 4: Reinstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Step 5: Testing Gradle wrapper..." -ForegroundColor Yellow
Set-Location "android"

# Test Gradle wrapper
Write-Host "Testing Gradle wrapper..." -ForegroundColor Cyan
./gradlew --version

Write-Host "Step 6: Attempting clean build with verbose output..." -ForegroundColor Yellow
# Try a clean build with more verbose output
./gradlew clean --info

Write-Host "Step 7: Building release APK..." -ForegroundColor Yellow
# Build release APK
./gradlew :app:assembleRelease --info

Write-Host "Advanced Gradle metadata corruption fix completed!" -ForegroundColor Green
