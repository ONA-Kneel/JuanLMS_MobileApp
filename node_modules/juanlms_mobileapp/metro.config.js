const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper entry point resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Hermes engine configuration for stability
config.transformer = {
  ...config.transformer,
  hermesParser: true,
  unstable_disableES6Transforms: false,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Add Hermes-specific optimizations
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    require.resolve('react-native/Libraries/Core/InitializeCore'),
  ],
};

module.exports = config;
