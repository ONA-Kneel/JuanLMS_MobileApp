Write-Host "Fixing React Native Picker Issue..." -ForegroundColor Green
Write-Host ""

Write-Host "Cleaning up node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "frontend\node_modules") { Remove-Item -Recurse -Force "frontend\node_modules" }
if (Test-Path "backend\node_modules") { Remove-Item -Recurse -Force "backend\node_modules" }

Write-Host ""
Write-Host "Removing package-lock.json files..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" }
if (Test-Path "frontend\package-lock.json") { Remove-Item "frontend\package-lock.json" }
if (Test-Path "backend\package-lock.json") { Remove-Item "backend\package-lock.json" }

Write-Host ""
Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
npm run install-all

Write-Host ""
Write-Host "Done! The picker issue should now be resolved." -ForegroundColor Green
Write-Host "You can now try building your project again." -ForegroundColor Green
Read-Host "Press Enter to continue"
