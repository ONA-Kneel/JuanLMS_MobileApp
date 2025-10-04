Pod::Spec.new do |s|
  s.name             = 'GoogleUtilities'
  s.version          = '8.1.0'
  s.summary          = 'Google Utilities for iOS'
  s.description      = 'Google Utilities for iOS'
  s.homepage         = 'https://github.com/google/GoogleUtilities'
  s.license          = { :type => 'Apache', :file => 'LICENSE' }
  s.author           = { 'Google Inc.' => 'google@google.com' }
  s.source           = { :git => 'https://github.com/google/GoogleUtilities.git', :tag => s.version.to_s }
  s.ios.deployment_target = '11.0'
  s.source_files = 'Sources/GoogleUtilities/**/*.{h,m,mm}'
  s.public_header_files = 'Sources/GoogleUtilities/Public/GoogleUtilities/*.h'
  s.frameworks = 'Foundation'
  s.requires_arc = true
  
  # Force modular headers
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'CLANG_ENABLE_MODULES' => 'YES',
    'SWIFT_VERSION' => '5.0',
    'BUILD_LIBRARY_FOR_DISTRIBUTION' => 'YES',
    'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES' => 'YES'
  }
end
