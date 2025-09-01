# Remove Duplicate Android Support Library Files
# This script directly removes the conflicting .jar and .aar files causing duplicate class errors

Write-Host "=== Removing Duplicate Android Support Library Files ===" -ForegroundColor Green
Write-Host "This will remove the conflicting files causing your build to fail" -ForegroundColor Yellow

# Step 1: Find and remove all Android Support Library files
Write-Host "`nStep 1: Finding and removing Android Support Library files..." -ForegroundColor Cyan

$supportFiles = @()

# Search for support library JAR files
Write-Host "  - Searching for support library JAR files..." -ForegroundColor White
$jarFiles = Get-ChildItem -Path "node_modules" -Recurse -Name "*.jar" | Where-Object { $_ -match "support" }
if ($jarFiles) {
    Write-Host "    Found support library JAR files:" -ForegroundColor Yellow
    $jarFiles | ForEach-Object { 
        Write-Host "      - $_" -ForegroundColor Yellow
        $supportFiles += $_
    }
}

# Search for support library AAR files
Write-Host "  - Searching for support library AAR files..." -ForegroundColor White
$aarFiles = Get-ChildItem -Path "node_modules" -Recurse -Name "*.aar" | Where-Object { $_ -match "support" }
if ($aarFiles) {
    Write-Host "    Found support library AAR files:" -ForegroundColor Yellow
    $aarFiles | ForEach-Object { 
        Write-Host "      - $_" -ForegroundColor Yellow
        $supportFiles += $_
    }
}

# Step 2: Remove the conflicting files
if ($supportFiles.Count -gt 0) {
    Write-Host "`nStep 2: Removing conflicting support library files..." -ForegroundColor Cyan
    
    foreach ($file in $supportFiles) {
        $fullPath = Get-ChildItem -Path "node_modules" -Recurse -Name $file | Select-Object -First 1
        if ($fullPath) {
            $filePath = Join-Path "node_modules" $fullPath
            try {
                Remove-Item -Path $filePath -Force
                Write-Host "    ✓ Removed: $file" -ForegroundColor Green
            } catch {
                Write-Host "    ❌ Failed to remove: $file" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "    ✓ No support library files found" -ForegroundColor Green
}

# Step 3: Clean specific problematic packages
Write-Host "`nStep 3: Cleaning problematic package directories..." -ForegroundColor Cyan

# Remove specific packages that commonly cause conflicts
$problemPackages = @(
    "support-compat",
    "support-media-compat", 
    "support-v4",
    "appcompat-v7"
)

foreach ($pkg in $problemPackages) {
    $pkgDirs = Get-ChildItem -Path "node_modules" -Recurse -Directory | Where-Object { $_.Name -match $pkg }
    foreach ($dir in $pkgDirs) {
        try {
            Remove-Item -Path $dir.FullName -Recurse -Force
            Write-Host "    ✓ Removed package directory: $($dir.Name)" -ForegroundColor Green
        } catch {
            Write-Host "    ⚠ Could not remove: $($dir.Name)" -ForegroundColor Yellow
        }
    }
}

# Step 4: Clean Android build cache
Write-Host "`nStep 4: Cleaning Android build cache..." -ForegroundColor Cyan

if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle"
    Write-Host "    ✓ Removed Android Gradle cache" -ForegroundColor Green
}

if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "    ✓ Removed Android app build directory" -ForegroundColor Green
}

# Step 5: Verify no support library files remain
Write-Host "`nStep 5: Verifying cleanup..." -ForegroundColor Cyan

$remainingSupport = Get-ChildItem -Path "node_modules" -Recurse -Name "*.jar" | Where-Object { $_ -match "support" }
if ($remainingSupport) {
    Write-Host "    ⚠ Still found support library files:" -ForegroundColor Yellow
    $remainingSupport | ForEach-Object { Write-Host "      - $_" -ForegroundColor Yellow }
} else {
    Write-Host "    ✓ All support library files removed successfully" -ForegroundColor Green
}

Write-Host "`n=== Cleanup Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Try building your project again" -ForegroundColor White
Write-Host "2. If successful, the duplicate class errors should be resolved" -ForegroundColor White
Write-Host "3. If issues persist, run 'npx react-native doctor' to check for other problems" -ForegroundColor White

Write-Host "`nScript completed successfully!" -ForegroundColor Green
