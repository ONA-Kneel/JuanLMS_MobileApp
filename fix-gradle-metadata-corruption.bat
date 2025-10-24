@echo off
echo Starting Gradle metadata corruption fix...

cd frontend

echo Step 1: Cleaning all build artifacts and caches...
if exist "android\.gradle" rmdir /s /q "android\.gradle"
if exist "android\build" rmdir /s /q "android\build"
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "node_modules" rmdir /s /q "node_modules"

echo Step 2: Reinstalling dependencies...
npm install

echo Step 3: Cleaning global Gradle cache...
if exist "%USERPROFILE%\.gradle\caches" rmdir /s /q "%USERPROFILE%\.gradle\caches"
if exist "%USERPROFILE%\.gradle\daemon" rmdir /s /q "%USERPROFILE%\.gradle\daemon"

echo Step 4: Testing Gradle build...
cd android
gradlew --version

echo Step 5: Attempting clean build...
gradlew clean

echo Step 6: Building release APK...
gradlew :app:assembleRelease

echo Gradle metadata corruption fix completed!
pause
