@echo off
echo === Removing Duplicate Android Support Library Files ===
echo This will remove the conflicting files causing your build to fail
echo.

REM Step 1: Find and remove all Android Support Library files
echo Step 1: Finding and removing Android Support Library files...

REM Search for support library JAR files
echo   - Searching for support library JAR files...
for /r "node_modules" %%f in (*.jar) do (
    echo %%f | findstr /i "support" >nul
    if !ERRORLEVEL! EQU 0 (
        echo     Found support library JAR: %%f
        del "%%f" /f /q
        if !ERRORLEVEL! EQU 0 (
            echo       ✓ Removed: %%~nxf
        ) else (
            echo       ❌ Failed to remove: %%~nxf
        )
    )
)

REM Search for support library AAR files
echo   - Searching for support library AAR files...
for /r "node_modules" %%f in (*.aar) do (
    echo %%f | findstr /i "support" >nul
    if !ERRORLEVEL! EQU 0 (
        echo     Found support library AAR: %%f
        del "%%f" /f /q
        if !ERRORLEVEL! EQU 0 (
            echo       ✓ Removed: %%~nxf
        ) else (
            echo       ❌ Failed to remove: %%~nxf
        )
    )
)

REM Step 2: Clean specific problematic packages
echo.
echo Step 2: Cleaning problematic package directories...

REM Remove specific packages that commonly cause conflicts
for /r "node_modules" %%d in (support-compat) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
        echo     ✓ Removed package directory: support-compat
    )
)

for /r "node_modules" %%d in (support-media-compat) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
        echo     ✓ Removed package directory: support-media-compat
    )
)

for /r "node_modules" %%d in (support-v4) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
        echo     ✓ Removed package directory: support-v4
    )
)

for /r "node_modules" %%d in (appcompat-v7) do (
    if exist "%%d" (
        rmdir /s /q "%%d"
        echo     ✓ Removed package directory: appcompat-v7
    )
)

REM Step 3: Clean Android build cache
echo.
echo Step 3: Cleaning Android build cache...

if exist "android\.gradle" (
    rmdir /s /q "android\.gradle"
    echo     ✓ Removed Android Gradle cache
)

if exist "android\app\build" (
    rmdir /s /q "android\app\build"
    echo     ✓ Removed Android app build directory
)

REM Step 4: Verify cleanup
echo.
echo Step 4: Verifying cleanup...

set "foundSupport=0"
for /r "node_modules" %%f in (*.jar) do (
    echo %%f | findstr /i "support" >nul
    if !ERRORLEVEL! EQU 0 (
        if !foundSupport! EQU 0 (
            echo     ⚠ Still found support library files:
            set "foundSupport=1"
        )
        echo       - %%~nxf
    )
)

if !foundSupport! EQU 0 (
    echo     ✓ All support library files removed successfully
)

echo.
echo === Cleanup Complete ===
echo Next steps:
echo 1. Try building your project again
echo 2. If successful, the duplicate class errors should be resolved
echo 3. If issues persist, run 'npx react-native doctor' to check for other problems
echo.
echo Script completed successfully!
pause
