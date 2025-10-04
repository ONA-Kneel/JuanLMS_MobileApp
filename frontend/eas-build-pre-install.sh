#!/bin/bash

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