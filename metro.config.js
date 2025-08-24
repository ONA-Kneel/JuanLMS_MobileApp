const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add the frontend directory to the project root
config.projectRoot = path.resolve(__dirname, 'frontend');
config.watchFolders = [
  path.resolve(__dirname, 'frontend'),
  path.resolve(__dirname, 'node_modules'),
];

// Ensure proper platform resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Handle monorepo node_modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'frontend/node_modules'),
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
