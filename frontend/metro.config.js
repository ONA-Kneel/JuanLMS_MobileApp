const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper entry point resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Fix dependency graph issues
config.resolver.unstable_enableSymlinks = false;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

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

// Fix Metro bundler cache issues
config.resetCache = true;

module.exports = config;
