# Simple Android Support Library Removal Script
# This script removes conflicting Android Support Library files

Write-Host "=== Removing Android Support Library Files ===" -ForegroundColor Green

# Step 1: Find and remove support library JAR files
Write-Host "`nStep 1: Removing support library JAR files..." -ForegroundColor Cyan

$jarFiles = Get-ChildItem -Path "node_modules" -Recurse -Name "*.jar" | Where-Object { $_ -match "support" }
if ($jarFiles) {
    foreach ($file in $jarFiles) {
        $fullPath = Get-ChildItem -Path "node_modules" -Recurse -Name $file | Select-Object -First 1
        if ($fullPath) {
            $filePath = Join-Path "node_modules" $fullPath
            try {
                Remove-Item -Path $filePath -Force
                Write-Host "  ✓ Removed: $file" -ForegroundColor Green
            } catch {
                Write-Host "  ❌ Failed to remove: $file" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "  ✓ No support library JAR files found" -ForegroundColor Green
}

# Step 2: Find and remove support library AAR files
Write-Host "`nStep 2: Removing support library AAR files..." -ForegroundColor Cyan

$aarFiles = Get-ChildItem -Path "node_modules" -Recurse -Name "*.aar" | Where-Object { $_ -match "support" }
if ($aarFiles) {
    foreach ($file in $aarFiles) {
        $fullPath = Get-ChildItem -Path "node_modules" -Recurse -Name $file | Select-Object -First 1
        if ($fullPath) {
            $filePath = Join-Path "node_modules" $fullPath
            try {
                Remove-Item -Path $filePath -Force
                Write-Host "  ✓ Removed: $file" -ForegroundColor Green
            } catch {
                Write-Host "  ❌ Failed to remove: $file" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "  ✓ No support library AAR files found" -ForegroundColor Green
}

# Step 3: Clean Android build cache
Write-Host "`nStep 3: Cleaning Android build cache..." -ForegroundColor Cyan

if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle"
    Write-Host "  ✓ Removed Android Gradle cache" -ForegroundColor Green
}

if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "  ✓ Removed Android app build directory" -ForegroundColor Green
}

# Step 4: Verify cleanup
Write-Host "`nStep 4: Verifying cleanup..." -ForegroundColor Cyan

$remainingSupport = Get-ChildItem -Path "node_modules" -Recurse -Name "*.jar" | Where-Object { $_ -match "support" }
if ($remainingSupport) {
    Write-Host "  ⚠ Still found support library files:" -ForegroundColor Yellow
    $remainingSupport | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
} else {
    Write-Host "  ✓ All support library files removed successfully" -ForegroundColor Green
}

Write-Host "`n=== Cleanup Complete ===" -ForegroundColor Green
Write-Host "Now try building your project again!" -ForegroundColor Yellow
