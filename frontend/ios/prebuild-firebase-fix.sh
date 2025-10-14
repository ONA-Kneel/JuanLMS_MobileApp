#!/bin/bash

# Prebuild Firebase GoogleUtilities module fix
echo "🔧 Applying prebuild Firebase GoogleUtilities fix..."

# Create a custom GoogleUtilities module map
mkdir -p ios/GoogleUtilities
cat > ios/GoogleUtilities/GoogleUtilities.modulemap << 'EOF'
module GoogleUtilities {
  umbrella header "GoogleUtilities-umbrella.h"
  export *
  module * { export * }
}
EOF

# Create umbrella header
cat > ios/GoogleUtilities/GoogleUtilities-umbrella.h << 'EOF'
#import <Foundation/Foundation.h>
#import <GoogleUtilities/GULAppDelegateSwizzler.h>
#import <GoogleUtilities/GULApplication.h>
#import <GoogleUtilities/GULKeychainStorage.h>
#import <GoogleUtilities/GULKeychainUtils.h>
#import <GoogleUtilities/GULLogger.h>
#import <GoogleUtilities/GULNetwork.h>
#import <GoogleUtilities/GULReachabilityChecker.h>
#import <GoogleUtilities/GULUserDefaults.h>
#import <GoogleUtilities/GULUtils.h>
#import <GoogleUtilities/GoogleUtilities.h>
EOF

echo "✅ Prebuild Firebase GoogleUtilities fix applied"
