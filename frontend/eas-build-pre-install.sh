#!/bin/bash

# Clean stale local Xcode env that can break EAS macOS builds
echo "Cleaning ios/.xcode.env.local (if present) to avoid EAS build failures..."
if [ -f "./ios/.xcode.env.local" ]; then
  rm -f ./ios/.xcode.env.local
  echo "Removed ./ios/.xcode.env.local"
else
  echo "No ./ios/.xcode.env.local found"
fi

# Normalize line endings in Xcode env files to avoid CRLF-related failures on macOS builders
echo "Normalizing line endings for ios/.xcode.env (if present)..."
normalize_file_to_lf() {
  local target="$1"
  if [ -f "$target" ]; then
    if command -v dos2unix >/dev/null 2>&1; then
      dos2unix "$target" 2>/dev/null || true
    elif command -v perl >/dev/null 2>&1; then
      perl -pi -e 's/\r$//' "$target" || true
    else
      # macOS-compatible sed inline edit
      sed -i '' $'s/\r$//' "$target" || true
    fi
    echo "Normalized LF endings: $target"
  fi
}

# Primary env file used by Expo scripts
normalize_file_to_lf "./ios/.xcode.env"
# Safety: if Pods moved the file, ensure normalization as well
normalize_file_to_lf "./ios/Pods/../.xcode.env"

# Add use_modular_headers! to the generated Podfile
echo "Modifying Podfile to fix Firebase Swift pods integration..."

# Find the Podfile in the ios directory
PODFILE_PATH="./ios/Podfile"

if [ -f "$PODFILE_PATH" ]; then
    # Add use_modular_headers! after the platform declaration
    sed -i '' '/platform :ios/a\
\
# Enable modular headers globally to fix Firebase Swift pods integration\
use_modular_headers!' "$PODFILE_PATH"
    
    echo "Successfully modified Podfile"
else
    echo "Podfile not found at $PODFILE_PATH"
fi