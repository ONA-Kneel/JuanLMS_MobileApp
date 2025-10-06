#!/bin/bash

echo "🧹 Cleaning iOS build artifacts..."

# Clean iOS build artifacts
cd ios
rm -rf build/
rm -rf Pods/
rm -rf Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*

echo "🧹 Cleaning node_modules and reinstalling..."
cd ..
rm -rf node_modules/
npm install

echo "📦 Reinstalling pods..."
cd ios
pod install --repo-update

echo "✅ Clean complete! You can now run:"
echo "   eas build --platform ios"
