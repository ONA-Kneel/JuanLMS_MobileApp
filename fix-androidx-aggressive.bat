@echo off
echo Fixing AndroidX Duplicate Class Conflicts (Aggressive Version)...
echo This script will force AndroidX usage and remove Support Library conflicts.
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
echo Step 3: Installing dependencies with forced AndroidX versions...
cd frontend

echo Installing dependencies with AndroidX overrides...
npm install --legacy-peer-deps

cd ..

echo.
echo Step 4: Installing root dependencies...
npm install --legacy-peer-deps

echo.
echo Step 5: Installing backend dependencies...
cd backend
npm install --legacy-peer-deps
cd ..

echo.
echo Step 6: Clearing Expo cache...
npx expo start --clear

echo.
echo Step 7: Checking for Support Library conflicts...
echo Running dependency check...
npm ls | findstr /i "support androidx"

echo.
echo Done! The AndroidX conflicts should now be resolved.
echo You can now try building your project again.
echo.
echo If you still see Support Library packages, you may need to:
echo 1. Update problematic packages to their latest versions
echo 2. Replace packages that don't support AndroidX
echo 3. Use Expo managed workflow instead of bare workflow
pause
