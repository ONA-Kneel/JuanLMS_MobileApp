const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

<<<<<<< HEAD
// Ensure proper entry point resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];
=======
// Add support for web platform
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure proper asset handling
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Fix for web platform issues
config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx', 'web.js', 'web.ts', 'web.tsx'];
>>>>>>> main

module.exports = config;
