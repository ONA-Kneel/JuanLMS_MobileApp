@echo off
REM Fix Gradle Metadata Error Script
REM This script resolves the "Could not read workspace metadata" error

echo Starting Gradle metadata error fix...

REM Navigate to frontend directory
cd frontend

echo Clearing Gradle cache...

REM Clear Gradle cache
if exist "android\.gradle" (
    rmdir /s /q "android\.gradle"
    echo Removed android\.gradle directory
)

REM Clear build directories
if exist "android\app\build" (
    rmdir /s /q "android\app\build"
    echo Removed android\app\build directory
)

if exist "android\build" (
    rmdir /s /q "android\build"
    echo Removed android\build directory
)

REM Clear node_modules and reinstall
echo Clearing node_modules...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo Removed node_modules directory
)

REM Clear npm cache
echo Clearing npm cache...
npm cache clean --force

REM Reinstall dependencies
echo Reinstalling dependencies...
npm install

REM Clean and rebuild Android project
echo Cleaning Android project...
cd android
gradlew clean
cd ..

echo Gradle metadata error fix completed!
echo You can now try building your project again.

REM Return to root directory
cd ..
