Write-Host "========================================" -ForegroundColor Cyan
Write-Host "iOS Crash Fix Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Installing updated dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Write-Host ""

Write-Host "Step 2: Clearing Metro cache..." -ForegroundColor Yellow
npx expo start --clear
Write-Host ""

Write-Host "Step 3: Rebuilding iOS app..." -ForegroundColor Yellow
npx expo run:ios --clear
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Installation completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Test the app on iOS device" -ForegroundColor White
Write-Host "2. Monitor for any remaining crashes" -ForegroundColor White
Write-Host "3. If crashes persist, check console logs" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"
