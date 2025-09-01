@echo off
echo Fixing AndroidX Duplicate Class Conflicts...
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
echo Step 3: Updating problematic packages to AndroidX-compatible versions...
cd frontend

echo Updating react-native-vector-icons...
npm install react-native-vector-icons@^10.3.0 --save

echo Updating react-native-splash-screen...
npm install react-native-splash-screen@^3.3.0 --save

echo Updating react-native-table-component...
npm install react-native-table-component@^1.2.2 --save

cd ..

echo.
echo Step 4: Reinstalling all dependencies...
npm run install-all

echo.
echo Step 5: Clearing Expo cache...
npx expo start --clear

echo.
echo Done! The AndroidX conflicts should now be resolved.
echo You can now try building your project again.
echo.
echo If issues persist, you may need to:
echo 1. Check that all packages are using AndroidX
echo 2. Update Expo to the latest version
echo 3. Consider using Expo's managed workflow instead of bare workflow
pause
