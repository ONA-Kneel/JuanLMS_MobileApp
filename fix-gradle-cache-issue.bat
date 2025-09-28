@echo off
echo 🔧 Fixing Gradle Cache Corruption Issue...

REM Navigate to frontend directory
cd frontend

echo 📁 Current directory: %CD%

REM Clean npm cache
echo 🧹 Cleaning npm cache...
npm cache clean --force

REM Remove node_modules and package-lock.json
echo 🗑️ Removing node_modules and package-lock.json...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del /q "package-lock.json"

REM Clean Gradle cache
echo 🧹 Cleaning Gradle cache...
if exist "android\.gradle" rmdir /s /q "android\.gradle"

REM Clean Android build directories
echo 🗑️ Cleaning Android build directories...
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\build" rmdir /s /q "android\build"

REM Clean Expo cache
echo 🧹 Cleaning Expo cache...
npx expo install --fix

REM Reinstall dependencies
echo 📦 Reinstalling dependencies...
npm install

REM Clean and rebuild Android project
echo 🔨 Cleaning and rebuilding Android project...
cd android
gradlew clean
gradlew build --refresh-dependencies
cd ..

echo ✅ Gradle cache fix completed!
echo 🚀 You can now try building your project again with: npm run android
pause
