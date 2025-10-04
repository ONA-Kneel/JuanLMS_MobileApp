#!/bin/bash

# Firebase Swift pods patch for EAS Build
echo "🔧 Applying Firebase Swift pods patch..."

# Ensure we're using dynamic frameworks
if [ -f "Podfile" ]; then
    # Add use_frameworks! if not present
    if ! grep -q "use_frameworks!" Podfile; then
        echo "Adding use_frameworks! to Podfile"
        sed -i '' '/use_modular_headers!/a\
# Use dynamic frameworks for Firebase compatibility\
use_frameworks! :linkage => :dynamic
' Podfile
    fi
fi

echo "✅ Firebase patch applied"
