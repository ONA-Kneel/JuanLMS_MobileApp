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
    // Prefer Metro's provider first (works when packager running and device can reach it)
    RCTBundleURLProvider *settings = [RCTBundleURLProvider sharedSettings];
    NSURL *url = [settings jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
    if (url) {
      NSLog(@"✅ Metro bundle URL resolved: %@", url);
      return url;
    }

    // If Metro didn't provide a URL, construct one depending on simulator/device
    NSLog(@"⚠️ Metro not detected, constructing bundle URL manually...");

    // Default values
    NSString *host = @"localhost"; // good for Simulator
    NSString *port = @"8081";     // default Metro port

    // Allow overriding via Info.plist keys (RN_DEV_SERVER, RCT_METRO_PORT)
    NSString *plistHost = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RN_DEV_SERVER"];
    NSString *plistPort = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCT_METRO_PORT"];

    // If running on device (not simulator) and plistHost is defined, use it
    #if !(TARGET_IPHONE_SIMULATOR)
      if (plistHost && plistHost.length > 0) {
        host = plistHost; // e.g., 192.168.1.10
      }
    #endif

    if (plistPort && plistPort.length > 0) {
      port = plistPort;
    }

    NSString *bundlePath = @".expo/.virtual-metro-entry.bundle?platform=ios&dev=true";
    NSString *urlString = [NSString stringWithFormat:@"http://%@:%@/%@", host, port, bundlePath];
    url = [NSURL URLWithString:urlString];
    NSLog(@"📡 Using constructed bundle URL: %@", urlString);

    // Final fallback: bundled jsbundle
    if (!url) {
      NSLog(@"⚠️ Constructed URL invalid, trying bundled jsbundle...");
      url = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
      if (url) {
        NSLog(@"✅ Using bundled jsbundle as fallback");
      } else {
        NSLog(@"❌ No bundled jsbundle available");
      }
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
