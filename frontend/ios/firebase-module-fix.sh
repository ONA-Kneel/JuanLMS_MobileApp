#!/bin/bash

# Firebase GoogleUtilities module fix
echo "🔧 Applying GoogleUtilities module fix..."

# Ensure GoogleUtilities module is properly configured
if [ -d "Pods/GoogleUtilities" ]; then
    echo "✅ GoogleUtilities pod found"
    
    # Create module map if it doesn't exist
    if [ ! -f "Pods/GoogleUtilities/GoogleUtilities.modulemap" ]; then
        echo "Creating GoogleUtilities.modulemap..."
        cat > "Pods/GoogleUtilities/GoogleUtilities.modulemap" << EOF
module GoogleUtilities {
  umbrella header "GoogleUtilities-umbrella.h"
  export *
  module * { export * }
}
EOF
    fi
    
    # Ensure umbrella header exists
    if [ ! -f "Pods/GoogleUtilities/GoogleUtilities-umbrella.h" ]; then
        echo "Creating GoogleUtilities-umbrella.h..."
        find Pods/GoogleUtilities -name "*.h" -not -name "*-umbrella.h" | head -1 | xargs -I {} basename {} | sed 's/\.h$//' | xargs -I {} echo "#import <GoogleUtilities/{}_umbrella.h>" > "Pods/GoogleUtilities/GoogleUtilities-umbrella.h"
    fi
else
    echo "⚠️ GoogleUtilities pod not found"
fi

echo "✅ GoogleUtilities module fix applied"
