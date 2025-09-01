# Comprehensive AndroidX Migration Fix Script
# This script resolves AndroidX conflicts by cleaning dependencies and forcing AndroidX usage

Write-Host "=== Comprehensive AndroidX Migration Fix ===" -ForegroundColor Green
Write-Host "This script will resolve AndroidX conflicts in your React Native project" -ForegroundColor Yellow

# Step 1: Clean all build artifacts and dependencies
Write-Host "`nStep 1: Cleaning build artifacts and dependencies..." -ForegroundColor Cyan

# Clean React Native cache
Write-Host "  - Cleaning React Native cache..." -ForegroundColor White
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "    ✓ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "    ✓ Removed package-lock.json" -ForegroundColor Green
}

# Clean Android build files
if (Test-Path "android") {
    Write-Host "  - Cleaning Android build files..." -ForegroundColor White
    
    # Clean Gradle cache
    if (Test-Path "android\.gradle") {
        Remove-Item -Recurse -Force "android\.gradle"
        Write-Host "    ✓ Removed Android Gradle cache" -ForegroundColor Green
    }
    
    # Clean build directories
    Get-ChildItem -Path "android" -Recurse -Directory -Name "build" | ForEach-Object {
        $buildPath = "android\$_"
        if (Test-Path $buildPath) {
            Remove-Item -Recurse -Force $buildPath
            Write-Host "    ✓ Removed build directory: $_" -ForegroundColor Green
        }
    }
}

# Clean Expo cache
Write-Host "  - Cleaning Expo cache..." -ForegroundColor White
try {
    & npx expo install --fix
    Write-Host "    ✓ Fixed Expo dependencies" -ForegroundColor Green
} catch {
    Write-Host "    ⚠ Expo fix command failed, continuing..." -ForegroundColor Yellow
}

# Step 2: Install dependencies with forced AndroidX versions
Write-Host "`nStep 2: Installing dependencies with forced AndroidX versions..." -ForegroundColor Cyan

# Install dependencies
Write-Host "  - Installing npm dependencies..." -ForegroundColor White
& npm install --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "    ❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 3: Force AndroidX versions using npm overrides
Write-Host "`nStep 3: Applying AndroidX version overrides..." -ForegroundColor Cyan

# Create a temporary package.json with overrides
$packageContent = Get-Content "package.json" -Raw
$overrides = @"
  "overrides": {
    "androidx.core:core": "1.13.1",
    "androidx.media:media": "1.0.0",
    "androidx.appcompat:appcompat": "1.6.1",
    "androidx.fragment:fragment": "1.6.2",
    "androidx.annotation:annotation": "1.7.1",
    "androidx.collection:collection": "1.4.0",
    "androidx.lifecycle:lifecycle-common": "2.7.0",
    "androidx.lifecycle:lifecycle-runtime": "2.7.0",
    "androidx.versionedparcelable:versionedparcelable": "1.1.1",
    "androidx.interpolator:interpolator": "1.0.0",
    "androidx.cursoradapter:cursoradapter": "1.0.0",
    "androidx.loader:loader": "1.1.0",
    "androidx.viewpager:viewpager": "1.0.0",
    "androidx.drawerlayout:drawerlayout": "1.2.0",
    "androidx.slidingpanelayout:slidingpanelayout": "1.2.0",
    "androidx.customview:customview": "1.1.0",
    "androidx.swiperefreshlayout:swiperefreshlayout": "1.1.0",
    "androidx.asynclayoutinflater:asynclayoutinflater": "1.0.0",
    "androidx.coordinatorlayout:coordinatorlayout": "1.2.0",
    "androidx.recyclerview:recyclerview": "1.3.2",
    "androidx.transition:transition": "1.4.1",
    "androidx.vectordrawable:vectordrawable": "1.1.0",
    "androidx.vectordrawable:vectordrawable-animated": "1.1.0",
    "androidx.arch.core:core-common": "2.2.0",
    "androidx.arch.core:core-runtime": "2.2.0",
    "androidx.documentfile:documentfile": "1.0.1",
    "androidx.localbroadcastmanager:localbroadcastmanager": "1.1.0",
    "androidx.print:print": "1.0.0",
    "androidx.annotation:annotation-experimental": "1.4.0"
  },
"@

# Add overrides if they don't exist
if ($packageContent -notmatch '"overrides"') {
    $packageContent = $packageContent -replace '(\s*"devDependencies":\s*\{)', "$overrides`n$1"
    Set-Content "package.json" $packageContent -Encoding UTF8
    Write-Host "    ✓ Added AndroidX overrides to package.json" -ForegroundColor Green
}

# Step 4: Clean and reinstall with overrides
Write-Host "`nStep 4: Reinstalling with AndroidX overrides..." -ForegroundColor Cyan

# Remove node_modules again to apply overrides
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "    ✓ Removed node_modules for override application" -ForegroundColor Green
}

# Install with overrides
& npm install --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ Dependencies installed with AndroidX overrides" -ForegroundColor Green
} else {
    Write-Host "    ❌ Failed to install dependencies with overrides" -ForegroundColor Red
    exit 1
}

# Step 5: Verify AndroidX configuration
Write-Host "`nStep 5: Verifying AndroidX configuration..." -ForegroundColor Cyan

# Check gradle.properties
if (Test-Path "android\gradle.properties") {
    $gradleProps = Get-Content "android\gradle.properties" -Raw
    if ($gradleProps -match "android\.useAndroidX=true" -and $gradleProps -match "android\.enableJetifier=true") {
        Write-Host "    ✓ AndroidX configuration verified in gradle.properties" -ForegroundColor Green
    } else {
        Write-Host "    ⚠ AndroidX configuration may need updating in gradle.properties" -ForegroundColor Yellow
    }
} else {
    Write-Host "    ⚠ No gradle.properties found in android directory" -ForegroundColor Yellow
}

# Step 6: Final cleanup and verification
Write-Host "`nStep 6: Final cleanup and verification..." -ForegroundColor Cyan

# Clean npm cache
Write-Host "  - Cleaning npm cache..." -ForegroundColor White
& npm cache clean --force
Write-Host "    ✓ NPM cache cleaned" -ForegroundColor Green

# Check for remaining support library references
Write-Host "  - Checking for remaining support library references..." -ForegroundColor White
$supportRefs = Get-ChildItem -Path "node_modules" -Recurse -Name "*.jar" | Where-Object { $_ -match "support" }
if ($supportRefs) {
    Write-Host "    ⚠ Found support library references:" -ForegroundColor Yellow
    $supportRefs | ForEach-Object { Write-Host "      - $_" -ForegroundColor Yellow }
} else {
    Write-Host "    ✓ No support library references found" -ForegroundColor Green
}

Write-Host "`n=== AndroidX Migration Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Try building your project again" -ForegroundColor White
Write-Host "2. If issues persist, check the specific error messages" -ForegroundColor White
Write-Host "3. Consider updating problematic packages to their latest versions" -ForegroundColor White
Write-Host "4. Run 'npx react-native doctor' to check for other issues" -ForegroundColor White

Write-Host "`nScript completed successfully!" -ForegroundColor Green
