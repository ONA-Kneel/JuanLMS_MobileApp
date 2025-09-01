@echo off
echo Fixing AndroidX Duplicate Class Conflicts (Simple Version)...
echo.

echo Step 1: Cleaning up node_modules...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"

echo.
echo Step 2: Removing package-lock.json files...
if exist "package-lock.json" del "package-lock.json"
if exist "frontend\package-lock.json" del "frontend\package-lock.json"
if exist "backend\package-lock.json" del "backend\package-lock.json"

echo.
echo Step 3: Reinstalling all dependencies with correct versions...
npm run install-all

echo.
echo Step 4: Clearing Expo cache...
npx expo start --clear

echo.
echo Done! The AndroidX conflicts should now be resolved.
echo You can now try building your project again.
echo.
echo Note: This script uses the package versions already specified in package.json
echo which have been updated to use AndroidX-compatible versions.
pause
