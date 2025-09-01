Write-Host "Analyzing Dependencies for AndroidX Conflicts..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Checking for Support Library packages..." -ForegroundColor Yellow
Write-Host "Running npm ls to find problematic dependencies..." -ForegroundColor Cyan

# Check for Support Library packages
Write-Host "`n=== SUPPORT LIBRARY PACKAGES ===" -ForegroundColor Red
npm ls 2>$null | Select-String -Pattern "com\.android\.support" | Select-Object -First 10

Write-Host "`n=== ANDROIDX PACKAGES ===" -ForegroundColor Green
npm ls 2>$null | Select-String -Pattern "androidx" | Select-Object -First 10

Write-Host "`nStep 2: Checking frontend dependencies..." -ForegroundColor Yellow
Set-Location "frontend"

Write-Host "`n=== FRONTEND SUPPORT LIBRARY ===" -ForegroundColor Red
npm ls 2>$null | Select-String -Pattern "com\.android\.support" | Select-Object -First 10

Write-Host "`n=== FRONTEND ANDROIDX ===" -ForegroundColor Green
npm ls 2>$null | Select-String -Pattern "androidx" | Select-Object -First 10

Set-Location ".."

Write-Host "`nStep 3: Checking for specific problematic packages..." -ForegroundColor Yellow

# Check specific packages that commonly cause issues
$problematicPackages = @(
    "react-native-vector-icons",
    "react-native-splash-screen", 
    "react-native-table-component",
    "react-native-calendar",
    "react-native-chart-kit"
)

foreach ($package in $problematicPackages) {
    Write-Host "`nChecking $package..." -ForegroundColor Cyan
    try {
        $version = npm view $package version 2>$null
        Write-Host "  Version: $version" -ForegroundColor White
        
        # Check if it has Android dependencies
        $deps = npm view $package dependencies 2>$null
        if ($deps -match "android") {
            Write-Host "  ⚠️  Has Android dependencies" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ Error checking package" -ForegroundColor Red
    }
}

Write-Host "`nStep 4: Recommendations..." -ForegroundColor Yellow
Write-Host "Based on the analysis above:" -ForegroundColor White
Write-Host "1. Look for packages with 'com.android.support' in their dependencies" -ForegroundColor White
Write-Host "2. These packages need to be updated or replaced" -ForegroundColor White
Write-Host "3. Consider using Expo managed workflow to avoid native conflicts" -ForegroundColor White

Read-Host "`nPress Enter to continue"
