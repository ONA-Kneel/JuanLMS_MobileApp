Write-Host "Fixing AndroidX Duplicate Class Conflicts (Aggressive Version)..." -ForegroundColor Green
Write-Host "This script will force AndroidX usage and remove Support Library conflicts." -ForegroundColor Yellow
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
Write-Host "Step 3: Installing dependencies with forced AndroidX versions..." -ForegroundColor Yellow
Set-Location "frontend"

# Install with forced AndroidX versions
Write-Host "Installing dependencies with AndroidX overrides..." -ForegroundColor Cyan
npm install --legacy-peer-deps

Set-Location ".."

Write-Host ""
Write-Host "Step 4: Installing root dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

Write-Host ""
Write-Host "Step 5: Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "backend"
npm install --legacy-peer-deps
Set-Location ".."

Write-Host ""
Write-Host "Step 6: Clearing Expo cache..." -ForegroundColor Yellow
npx expo start --clear

Write-Host ""
Write-Host "Step 7: Checking for Support Library conflicts..." -ForegroundColor Yellow
Write-Host "Running dependency check..." -ForegroundColor Cyan
npm ls | Select-String -Pattern "(support|androidx)" | Select-Object -First 20

Write-Host ""
Write-Host "Done! The AndroidX conflicts should now be resolved." -ForegroundColor Green
Write-Host "You can now try building your project again." -ForegroundColor Green
Write-Host ""
Write-Host "If you still see Support Library packages, you may need to:" -ForegroundColor Yellow
Write-Host "1. Update problematic packages to their latest versions" -ForegroundColor Yellow
Write-Host "2. Replace packages that don't support AndroidX" -ForegroundColor Yellow
Write-Host "3. Use Expo managed workflow instead of bare workflow" -ForegroundColor Yellow
Read-Host "Press Enter to continue"
