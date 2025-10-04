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
  
  # Set environment variables for Firebase
  $RNFirebaseAsStaticFramework = false
  $FirebaseSDKVersion = '12.2.0'`;

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
      target.build_configurations.each do |config|
        # Force modular headers for all targets
        config.build_settings['DEFINES_MODULE'] = 'YES'
        config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
        
        # Firebase and Google specific fixes
        if target.name.include?('Firebase') || target.name.include?('Google')
          config.build_settings['DEFINES_MODULE'] = 'YES'
          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
          config.build_settings['SWIFT_VERSION'] = '5.0'
          config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          config.build_settings['MODULEMAP_FILE'] = ''
        end
        
        # Specific fix for GoogleUtilities module issue
        if target.name == 'GoogleUtilities'
          config.build_settings['DEFINES_MODULE'] = 'YES'
          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
          config.build_settings['MODULEMAP_FILE'] = ''
          config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
          config.build_settings['SWIFT_INCLUDE_PATHS'] = '$(PODS_ROOT)/GoogleUtilities'
          config.build_settings['HEADER_SEARCH_PATHS'] = '$(PODS_ROOT)/GoogleUtilities'
        end
        
        # Fix for FirebaseCoreInternal
        if target.name == 'FirebaseCoreInternal'
          config.build_settings['DEFINES_MODULE'] = 'YES'
          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
          config.build_settings['SWIFT_VERSION'] = '5.0'
          config.build_settings['MODULEMAP_FILE'] = ''
          config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
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

      // Also run the module fix script if it exists
      const moduleFixScript = path.join(config.modRequest.platformProjectRoot, 'firebase-module-fix.sh');
      if (fs.existsSync(moduleFixScript)) {
        try {
          const { execSync } = require('child_process');
          execSync(`chmod +x "${moduleFixScript}" && "${moduleFixScript}"`, { cwd: config.modRequest.platformProjectRoot });
          console.log('✅ Applied Firebase module fix script');
        } catch (error) {
          console.log('⚠️ Firebase module fix script failed:', error.message);
        }
      }

      return config;
    },
  ]);
};

module.exports = withReactNativeFirebase;
