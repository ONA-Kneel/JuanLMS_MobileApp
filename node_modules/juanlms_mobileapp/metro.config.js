const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper entry point resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;
