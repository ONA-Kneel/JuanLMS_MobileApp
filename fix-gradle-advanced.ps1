# Advanced Gradle Fix for React Native Settings Error
# This script addresses the specific "com.facebook.react.settings" plugin error

Write-Host "Starting advanced Gradle fix for React Native settings..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location "frontend"

Write-Host "Step 1: Clearing all Gradle-related caches..." -ForegroundColor Yellow

# Clear all Gradle caches
$gradleCachePaths = @(
    "android\.gradle",
    "android\app\build",
    "android\build",
    "android\gradle\wrapper\gradle-wrapper.jar"
)

foreach ($path in $gradleCachePaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
        Write-Host "Removed $path" -ForegroundColor Green
    }
}

Write-Host "Step 2: Clearing npm and yarn caches..." -ForegroundColor Yellow

# Clear npm cache
npm cache clean --force

# Clear yarn cache if yarn is available
if (Get-Command yarn -ErrorAction SilentlyContinue) {
    yarn cache clean
}

Write-Host "Step 3: Removing node_modules and package-lock..." -ForegroundColor Yellow

# Remove node_modules and package-lock.json
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "Removed package-lock.json" -ForegroundColor Green
}

Write-Host "Step 4: Reinstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Step 5: Verifying React Native Gradle plugin..." -ForegroundColor Yellow

# Check if React Native Gradle plugin is properly installed
$reactNativePath = "node_modules\react-native"
if (Test-Path $reactNativePath) {
    Write-Host "React Native found at: $reactNativePath" -ForegroundColor Green
} else {
    Write-Host "Warning: React Native not found in node_modules" -ForegroundColor Red
}

Write-Host "Step 6: Cleaning Android project..." -ForegroundColor Yellow
cd android
.\gradlew clean
cd ..

Write-Host "Step 7: Running Expo prebuild..." -ForegroundColor Yellow
npx expo prebuild --clean

Write-Host "Advanced Gradle fix completed!" -ForegroundColor Green
Write-Host "You can now try building your project with: npm run android" -ForegroundColor Cyan

# Return to root directory
Set-Location ".."
