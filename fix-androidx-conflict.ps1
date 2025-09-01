Write-Host "Fixing AndroidX Duplicate Class Conflicts..." -ForegroundColor Green
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
Write-Host "Step 3: Updating problematic packages to AndroidX-compatible versions..." -ForegroundColor Yellow
Set-Location "frontend"

# Update problematic packages
Write-Host "Updating react-native-vector-icons..." -ForegroundColor Cyan
npm install react-native-vector-icons@^10.3.0 --save

Write-Host "Updating react-native-splash-screen..." -ForegroundColor Cyan
npm install react-native-splash-screen@^3.3.0 --save

Write-Host "Updating react-native-table-component..." -ForegroundColor Cyan
npm install react-native-table-component@^1.2.2 --save

Set-Location ".."

Write-Host ""
Write-Host "Step 4: Reinstalling all dependencies..." -ForegroundColor Yellow
npm run install-all

Write-Host ""
Write-Host "Step 5: Clearing Expo cache..." -ForegroundColor Yellow
npx expo start --clear

Write-Host ""
Write-Host "Done! The AndroidX conflicts should now be resolved." -ForegroundColor Green
Write-Host "You can now try building your project again." -ForegroundColor Green
Write-Host ""
Write-Host "If issues persist, you may need to:" -ForegroundColor Yellow
Write-Host "1. Check that all packages are using AndroidX" -ForegroundColor Yellow
Write-Host "2. Update Expo to the latest version" -ForegroundColor Yellow
Write-Host "3. Consider using Expo's managed workflow instead of bare workflow" -ForegroundColor Yellow
Read-Host "Press Enter to continue"
