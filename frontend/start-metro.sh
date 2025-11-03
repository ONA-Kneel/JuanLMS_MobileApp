#!/bin/bash

# Metro Bundler Start Script for iOS
# This script ensures Metro bundler is running before launching the app

echo "🚀 Starting Metro Bundler for JuanLMS..."

# Navigate to frontend directory
cd "$(dirname "$0")"

# Kill any existing Metro processes
echo "🧹 Cleaning up existing Metro processes..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Clear Metro cache
echo "📦 Clearing Metro cache..."
npx expo start --clear

echo ""
echo "✅ Metro bundler should now be running on port 8081"
echo "📱 You can now run the iOS app"
echo ""
echo "If you still see 'No bundle URL present' error:"
echo "1. Make sure Metro is running: npx expo start"
echo "2. Check your device/simulator is on the same network"
echo "3. Try shaking device and selecting 'Configure Bundler'"
echo "4. Or manually enter: localhost:8081"

