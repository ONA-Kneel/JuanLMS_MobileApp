#!/usr/bin/env pwsh

Write-Host "🔧 Fixing Gradle Cache Corruption Issue..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location "frontend"

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Clean npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Cyan
npm cache clean --force

# Remove node_modules and package-lock.json
Write-Host "🗑️ Removing node_modules and package-lock.json..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

# Clean Gradle cache
Write-Host "🧹 Cleaning Gradle cache..." -ForegroundColor Cyan
if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle"
}

# Clean Android build directories
Write-Host "🗑️ Cleaning Android build directories..." -ForegroundColor Cyan
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
}
if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build"
}

# Clean Expo cache
Write-Host "🧹 Cleaning Expo cache..." -ForegroundColor Cyan
npx expo install --fix

# Reinstall dependencies
Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Cyan
npm install

# Clean and rebuild Android project
Write-Host "🔨 Cleaning and rebuilding Android project..." -ForegroundColor Cyan
Set-Location "android"
.\gradlew clean
.\gradlew build --refresh-dependencies
Set-Location ".."

Write-Host "✅ Gradle cache fix completed!" -ForegroundColor Green
Write-Host "🚀 You can now try building your project again with: npm run android" -ForegroundColor Yellow
