@echo off
echo Fixing React Native Picker Issue...
echo.

echo Cleaning up node_modules...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"

echo.
echo Removing package-lock.json files...
if exist "package-lock.json" del "package-lock.json"
if exist "frontend\package-lock.json" del "frontend\package-lock.json"
if exist "backend\package-lock.json" del "backend\package-lock.json"

echo.
echo Reinstalling dependencies...
npm run install-all

echo.
echo Done! The picker issue should now be resolved.
echo You can now try building your project again.
pause
