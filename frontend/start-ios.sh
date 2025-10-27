#!/bin/bash

# iOS Development Start Script
# This script helps fix the "No bundle URL present" error

echo "🧹 Cleaning build cache..."
cd "$(dirname "$0")"

# Clean Metro bundler cache
echo "📦 Starting Metro bundler with cache clean..."
npx expo start --clear --ios

