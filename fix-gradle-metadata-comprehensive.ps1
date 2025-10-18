# Comprehensive Gradle Metadata Corruption Fix
# This script addresses the specific error: "Could not read workspace metadata from metadata.bin"

Write-Host "Starting Comprehensive Gradle Metadata Corruption Fix..." -ForegroundColor Green
Write-Host "This fix addresses: Could not read workspace metadata from metadata.bin" -ForegroundColor Yellow

# Navigate to frontend directory
Set-Location "frontend"

Write-Host "Step 1: Stopping all Gradle daemons..." -ForegroundColor Yellow
# Stop all Gradle daemons first
cd android
./gradlew --stop
cd ..

Write-Host "Step 2: Cleaning all build artifacts and caches..." -ForegroundColor Yellow

# Clean Android build directories
$directoriesToClean = @(
    "android\.gradle",
    "android\build", 
    "android\app\build",
    "node_modules"
)

foreach ($dir in $directoriesToClean) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir
        Write-Host "Removed $dir directory" -ForegroundColor Green
    }
}

Write-Host "Step 3: Cleaning global Gradle cache..." -ForegroundColor Yellow
# Clean global Gradle cache more aggressively
$gradleHome = "$env:USERPROFILE\.gradle"
if (Test-Path $gradleHome) {
    $gradleCacheDirs = @(
        "$gradleHome\caches",
        "$gradleHome\daemon", 
        "$gradleHome\wrapper",
        "$gradleHome\dependencies-accessors"
    )
    
    foreach ($cacheDir in $gradleCacheDirs) {
        if (Test-Path $cacheDir) {
            Remove-Item -Recurse -Force $cacheDir -ErrorAction SilentlyContinue
            Write-Host "Cleaned $cacheDir" -ForegroundColor Green
        }
    }
}

Write-Host "Step 4: Reinstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Step 5: Testing Gradle wrapper..." -ForegroundColor Yellow
Set-Location "android"

# Test Gradle wrapper
Write-Host "Testing Gradle wrapper..." -ForegroundColor Cyan
./gradlew --version

Write-Host "Step 6: Attempting clean build..." -ForegroundColor Yellow
# Try a clean build
./gradlew clean

Write-Host "Step 7: Building release APK..." -ForegroundColor Yellow
# Build release APK
./gradlew :app:assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Build completed successfully!" -ForegroundColor Green
    Write-Host "APK should be located at: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
} else {
    Write-Host "Build failed. Trying alternative approach..." -ForegroundColor Red
    
    Write-Host "Step 8: Trying debug build..." -ForegroundColor Yellow
    ./gradlew :app:assembleDebug
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Debug build completed!" -ForegroundColor Green
        Write-Host "Debug APK should be located at: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
    } else {
        Write-Host "Both builds failed. Please check the error messages above." -ForegroundColor Red
    }
}

Write-Host "Comprehensive Gradle metadata corruption fix completed!" -ForegroundColor Green
