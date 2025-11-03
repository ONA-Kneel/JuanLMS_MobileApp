#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  NSURL *url = [self bundleURL];
  if (!url) {
    // Fallback: try to load bundled jsbundle
    url = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    if (url) {
      NSLog(@"⚠️ Using fallback bundled jsbundle");
    } else {
      NSLog(@"❌ CRITICAL: No bundle URL found and no fallback available");
    }
  }
  return url;
}

- (NSURL *)bundleURL
{
#if DEBUG
  @try {
    // Try to get bundle URL from Metro bundler
    RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
    NSURL *url = [settings jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
    
    if (url) {
      NSLog(@"✅ Metro bundle URL resolved: %@", url);
      return url;
    }
    
    // Metro bundler not available - try alternative methods
    NSLog(@"⚠️ Metro bundler not available, trying fallback methods...");
    
    // Try localhost fallback with default Metro port
    NSString *ipAddress = @"localhost";
    NSString *port = @"8081"; // Default Metro port
    
    // Check for custom port in environment
    NSDictionary *env = [[NSProcessInfo processInfo] environment];
    NSString *customPort = env[@"RCT_METRO_PORT"];
    if (!customPort) {
      customPort = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCT_METRO_PORT"];
    }
    if (customPort && customPort.length > 0) {
      port = customPort;
      NSLog(@"📡 Using custom Metro port: %@", port);
    }
    
    // Construct bundle URL manually
    NSString *bundlePath = @".expo/.virtual-metro-entry.bundle?platform=ios&dev=true";
    NSString *urlString = [NSString stringWithFormat:@"http://%@:%@/%@", ipAddress, port, bundlePath];
    url = [NSURL URLWithString:urlString];
    
    if (url) {
      NSLog(@"✅ Using localhost bundle URL: %@", urlString);
      return url;
    }
    
    // Final fallback: try bundled jsbundle even in DEBUG mode
    NSLog(@"⚠️ Trying bundled jsbundle as final fallback...");
    url = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    if (url) {
      NSLog(@"✅ Using bundled jsbundle as fallback");
    } else {
      NSLog(@"❌ No bundled jsbundle available");
    }
    
    return url;
  } @catch (NSException *exception) {
    NSLog(@"❌ Exception getting bundle URL: %@", exception);
    // Fallback to bundled jsbundle
    NSURL *fallbackURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    if (fallbackURL) {
      NSLog(@"✅ Using bundled jsbundle after exception");
    }
    return fallbackURL;
  }
#else
  // Release mode: use bundled jsbundle
  NSURL *url = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  if (!url) {
    NSLog(@"❌ CRITICAL: No bundled jsbundle found in Release mode");
  } else {
    NSLog(@"✅ Using bundled jsbundle for Release");
  }
  return url;
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
