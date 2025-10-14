#import "StreamVideoBridge.h"

@implementation StreamVideoBridge

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"onCallStateChanged", @"onParticipantJoined", @"onParticipantLeft", @"onCallEnded"];
}

RCT_EXPORT_METHOD(initializeStreamVideo:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // This will be implemented in the Swift file
    resolve(@{@"success": @YES, @"message": @"StreamVideo bridge initialized"});
}

RCT_EXPORT_METHOD(joinCall:(NSDictionary *)callConfig
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // This will be implemented in the Swift file
    resolve(@{@"success": @YES, @"message": @"Call join initiated"});
}

RCT_EXPORT_METHOD(leaveCall:(NSString *)callId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // This will be implemented in the Swift file
    resolve(@{@"success": @YES, @"message": @"Call leave initiated"});
}

RCT_EXPORT_METHOD(toggleMicrophone:(BOOL)enabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // This will be implemented in the Swift file
    resolve(@{@"success": @YES, @"microphoneEnabled": @(enabled)});
}

RCT_EXPORT_METHOD(toggleCamera:(BOOL)enabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    // This will be implemented in the Swift file
    resolve(@{@"success": @YES, @"cameraEnabled": @(enabled)});
}

@end
