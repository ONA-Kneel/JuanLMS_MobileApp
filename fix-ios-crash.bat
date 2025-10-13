@echo off
echo ========================================
echo iOS Crash Fix Installation Script
echo ========================================
echo.

echo Step 1: Installing updated dependencies...
cd frontend
call npm install
echo.

echo Step 2: Clearing Metro cache...
call npx expo start --clear
echo.

echo Step 3: Rebuilding iOS app...
call npx expo run:ios --clear
echo.

echo ========================================
echo Installation completed!
echo ========================================
echo.
echo Next steps:
echo 1. Test the app on iOS device
echo 2. Monitor for any remaining crashes
echo 3. If crashes persist, check console logs
echo.
pause
