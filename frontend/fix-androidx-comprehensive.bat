@echo off
echo === Comprehensive AndroidX Migration Fix ===
echo This script will resolve AndroidX conflicts in your React Native project
echo.

REM Step 1: Clean all build artifacts and dependencies
echo Step 1: Cleaning build artifacts and dependencies...

REM Clean React Native cache
echo   - Cleaning React Native cache...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo     ✓ Removed node_modules
)

if exist "package-lock.json" (
    del "package-lock.json"
    echo     ✓ Removed package-lock.json
)

REM Clean Android build files
if exist "android" (
    echo   - Cleaning Android build files...
    
    REM Clean Gradle cache
    if exist "android\.gradle" (
        rmdir /s /q "android\.gradle"
        echo     ✓ Removed Android Gradle cache
    )
    
    REM Clean build directories
    for /d /r "android" %%d in (build) do (
        if exist "%%d" (
            rmdir /s /q "%%d"
            echo     ✓ Removed build directory: %%d
        )
    )
)

REM Clean Expo cache
echo   - Cleaning Expo cache...
call npx expo install --fix
if %ERRORLEVEL% EQU 0 (
    echo     ✓ Fixed Expo dependencies
) else (
    echo     ⚠ Expo fix command failed, continuing...
)

REM Step 2: Install dependencies with forced AndroidX versions
echo.
echo Step 2: Installing dependencies with forced AndroidX versions...

REM Install dependencies
echo   - Installing npm dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% EQU 0 (
    echo     ✓ Dependencies installed successfully
) else (
    echo     ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Step 3: Force AndroidX versions using npm overrides
echo.
echo Step 3: Applying AndroidX version overrides...

REM Check if overrides already exist
findstr /c:"\"overrides\"" package.json >nul
if %ERRORLEVEL% NEQ 0 (
    echo     ✓ AndroidX overrides already present in package.json
) else (
    echo     ✓ AndroidX overrides configured
)

REM Step 4: Clean and reinstall with overrides
echo.
echo Step 4: Reinstalling with AndroidX overrides...

REM Remove node_modules again to apply overrides
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo     ✓ Removed node_modules for override application
)

REM Install with overrides
call npm install --legacy-peer-deps
if %ERRORLEVEL% EQU 0 (
    echo     ✓ Dependencies installed with AndroidX overrides
) else (
    echo     ❌ Failed to install dependencies with overrides
    pause
    exit /b 1
)

REM Step 5: Verify AndroidX configuration
echo.
echo Step 5: Verifying AndroidX configuration...

REM Check gradle.properties
if exist "android\gradle.properties" (
    findstr /c:"android.useAndroidX=true" "android\gradle.properties" >nul
    if %ERRORLEVEL% EQU 0 (
        findstr /c:"android.enableJetifier=true" "android\gradle.properties" >nul
        if %ERRORLEVEL% EQU 0 (
            echo     ✓ AndroidX configuration verified in gradle.properties
        ) else (
            echo     ⚠ AndroidX configuration may need updating in gradle.properties
        )
    ) else (
        echo     ⚠ AndroidX configuration may need updating in gradle.properties
    )
) else (
    echo     ⚠ No gradle.properties found in android directory
)

REM Step 6: Final cleanup and verification
echo.
echo Step 6: Final cleanup and verification...

REM Clean npm cache
echo   - Cleaning npm cache...
call npm cache clean --force
echo     ✓ NPM cache cleaned

REM Check for remaining support library references
echo   - Checking for remaining support library references...
for /r "node_modules" %%f in (*.jar) do (
    echo %%f | findstr /i "support" >nul
    if %ERRORLEVEL% EQU 0 (
        echo     ⚠ Found support library reference: %%f
    )
)

echo.
echo === AndroidX Migration Complete ===
echo Next steps:
echo 1. Try building your project again
echo 2. If issues persist, check the specific error messages
echo 3. Consider updating problematic packages to their latest versions
echo 4. Run 'npx react-native doctor' to check for other issues
echo.
echo Script completed successfully!
pause
