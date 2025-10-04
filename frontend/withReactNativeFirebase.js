const fs = require('fs');
const path = require('path');
const generateCode = require('@expo/config-plugins/build/utils/generateCode');
const configPlugins = require('@expo/config-plugins');

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

      // Add Firebase Swift pods fix after the target declaration
      const firebaseFix = `
  # Firebase Swift pods fix
  use_modular_headers!
  use_frameworks! :linkage => :dynamic
  
  # Force Firebase pods to use modular headers
  pod 'Firebase', :modular_headers => true
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'FirebaseMessaging', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
  pod 'GoogleDataTransport', :modular_headers => true
  pod 'PromisesObjC', :modular_headers => true
  $RNFirebaseAsStaticFramework = true`;

      const addCode = generateCode.mergeContents({
        tag: 'withReactNativeFirebase',
        src: contents,
        newSrc: firebaseFix,
        anchor: /target 'JuanLMS' do/,
        offset: 1,
        comment: '#',
      });

      if (!addCode.didMerge) {
        console.error(
          "ERROR: Cannot add withReactNativeFirebase to the project's ios/Podfile because it's malformed."
        );
        return config;
      }

      // Also add post_install hook for Firebase pods
      const postInstallFix = `
    # Firebase Swift pods post_install fix
    installer.pods_project.targets.each do |target|
      if target.name.include?('Firebase') || target.name.include?('Google')
        target.build_configurations.each do |config|
          config.build_settings['DEFINES_MODULE'] = 'YES'
          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
          config.build_settings['SWIFT_VERSION'] = '5.0'
          config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          config.build_settings['MODULEMAP_FILE'] = ''
        end
      end
    end`;

      const addPostInstall = generateCode.mergeContents({
        tag: 'withReactNativeFirebasePostInstall',
        src: addCode.contents,
        newSrc: postInstallFix,
        anchor: /post_install do \|installer\|/,
        offset: 1,
        comment: '#',
      });

      if (addPostInstall.didMerge) {
        fs.writeFileSync(filePath, addPostInstall.contents);
        console.log('✅ Applied Firebase Swift pods post_install fix to Podfile');
      } else {
        fs.writeFileSync(filePath, addCode.contents);
        console.log('✅ Applied Firebase Swift pods fix to Podfile (post_install skipped)');
      }

      return config;
    },
  ]);
};

module.exports = withReactNativeFirebase;
