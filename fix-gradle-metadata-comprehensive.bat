@echo off
echo Starting Comprehensive Gradle Metadata Corruption Fix...
echo This fix addresses: Could not read workspace metadata from metadata.bin

cd frontend

echo Step 1: Stopping all Gradle daemons...
cd android
gradlew --stop
cd ..

echo Step 2: Cleaning all build artifacts and caches...
if exist "android\.gradle" rmdir /s /q "android\.gradle"
if exist "android\build" rmdir /s /q "android\build"
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "node_modules" rmdir /s /q "node_modules"

echo Step 3: Cleaning global Gradle cache...
if exist "%USERPROFILE%\.gradle\caches" rmdir /s /q "%USERPROFILE%\.gradle\caches"
if exist "%USERPROFILE%\.gradle\daemon" rmdir /s /q "%USERPROFILE%\.gradle\daemon"
if exist "%USERPROFILE%\.gradle\wrapper" rmdir /s /q "%USERPROFILE%\.gradle\wrapper"
if exist "%USERPROFILE%\.gradle\dependencies-accessors" rmdir /s /q "%USERPROFILE%\.gradle\dependencies-accessors"

echo Step 4: Reinstalling dependencies...
npm install

echo Step 5: Testing Gradle wrapper...
cd android
gradlew --version

echo Step 6: Attempting clean build...
gradlew clean

echo Step 7: Building release APK...
gradlew :app:assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Build completed successfully!
    echo APK should be located at: android\app\build\outputs\apk\release\app-release.apk
) else (
    echo Build failed. Trying alternative approach...
    echo Step 8: Trying debug build...
    gradlew :app:assembleDebug
    
    if %ERRORLEVEL% EQU 0 (
        echo SUCCESS: Debug build completed!
        echo Debug APK should be located at: android\app\build\outputs\apk\debug\app-debug.apk
    ) else (
        echo Both builds failed. Please check the error messages above.
    )
)

echo Comprehensive Gradle metadata corruption fix completed!
pause
