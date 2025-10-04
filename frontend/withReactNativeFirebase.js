const fs = require('fs');
const path = require('path');
const generateCode = require('@expo/config-plugins/build/utils/generateCode');
const configPlugins = require('@expo/config-plugins');

const code = `  # Firebase Swift pods fix
  pod 'Firebase', :modular_headers => true
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'FirebaseMessaging', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
  pod 'GoogleDataTransport', :modular_headers => true
  pod 'PromisesObjC', :modular_headers => true
  $RNFirebaseAsStaticFramework = true`;

const withReactNativeFirebase = (config) => {
  return configPlugins.withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );
      
      if (!fs.existsSync(filePath)) {
        console.log('Podfile not found, skipping Firebase fix');
        return config;
      }
      
      const contents = fs.readFileSync(filePath, 'utf-8');

      const addCode = generateCode.mergeContents({
        tag: 'withReactNativeFirebase',
        src: contents,
        newSrc: code,
        anchor: /\s*get_default_flags\(\)/i,
        offset: 2,
        comment: '#',
      });

      if (!addCode.didMerge) {
        console.error(
          "ERROR: Cannot add withReactNativeFirebase to the project's ios/Podfile because it's malformed."
        );
        return config;
      }

      fs.writeFileSync(filePath, addCode.contents);
      console.log('✅ Applied Firebase Swift pods fix to Podfile');

      return config;
    },
  ]);
};

module.exports = withReactNativeFirebase;
