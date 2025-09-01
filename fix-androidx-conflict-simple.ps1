Write-Host "Fixing AndroidX Duplicate Class Conflicts (Simple Version)..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Cleaning up node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "frontend\node_modules") { Remove-Item -Recurse -Force "frontend\node_modules" }
if (Test-Path "backend\node_modules") { Remove-Item -Recurse -Force "backend\node_modules" }

Write-Host ""
Write-Host "Step 2: Removing package-lock.json files..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" }
if (Test-Path "frontend\package-lock.json") { Remove-Item "frontend\package-lock.json" }
if (Test-Path "backend\package-lock.json") { Remove-Item "backend\package-lock.json" }

Write-Host ""
Write-Host "Step 3: Reinstalling all dependencies with correct versions..." -ForegroundColor Yellow
npm run install-all

Write-Host ""
Write-Host "Step 4: Clearing Expo cache..." -ForegroundColor Yellow
npx expo start --clear

Write-Host ""
Write-Host "Done! The AndroidX conflicts should now be resolved." -ForegroundColor Green
Write-Host "You can now try building your project again." -ForegroundColor Green
Write-Host ""
Write-Host "Note: This script uses the package versions already specified in package.json" -ForegroundColor Cyan
Write-Host "which have been updated to use AndroidX-compatible versions." -ForegroundColor Cyan
Read-Host "Press Enter to continue"
