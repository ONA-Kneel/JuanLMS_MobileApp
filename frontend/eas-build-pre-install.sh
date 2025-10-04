#!/bin/bash

# EAS Build pre-install hook to restore GoogleService-Info.plist
echo "🔧 Restoring GoogleService-Info.plist for Firebase..."

# Create the iOS directory structure
mkdir -p ios/JuanLMS

# Copy the GoogleService-Info.plist file from the root to the iOS directory
cp ios/JuanLMS/GoogleService-Info.plist ios/JuanLMS/GoogleService-Info.plist

echo "✅ GoogleService-Info.plist restored successfully"
