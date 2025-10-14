# Firebase Swift pods fix for EAS Build
# This script ensures Firebase pods use dynamic frameworks

def fix_firebase_pods(installer)
  installer.pods_project.targets.each do |target|
    if target.name.include?('Firebase') || target.name.include?('Google')
      target.build_configurations.each do |config|
        # Force dynamic framework settings
        config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        config.build_settings['DEFINES_MODULE'] = 'YES'
        config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
        config.build_settings['SWIFT_COMPILATION_MODE'] = 'wholemodule'
        config.build_settings['SWIFT_VERSION'] = '5.0'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        config.build_settings['MODULEMAP_FILE'] = ''
        
        # Specific fixes for GoogleUtilities
        if target.name == 'GoogleUtilities'
          config.build_settings['DEFINES_MODULE'] = 'YES'
          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
          config.build_settings['MODULEMAP_FILE'] = ''
          config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        end
      end
    end
  end
end
