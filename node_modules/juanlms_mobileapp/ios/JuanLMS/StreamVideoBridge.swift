import Foundation
import React
import StreamVideo
import StreamVideoSwiftUI

@objc(StreamVideoBridge)
class StreamVideoBridge: RCTEventEmitter {
    
    private var streamVideo: StreamVideo?
    private var currentCall: Call?
    
    override func supportedEvents() -> [String]! {
        return ["onCallStateChanged", "onParticipantJoined", "onParticipantLeft", "onCallEnded"]
    }
    
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    func initializeStreamVideo(_ config: NSDictionary,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        DispatchQueue.main.async {
            do {
                guard let apiKey = config["apiKey"] as? String,
                      let userId = config["userId"] as? String,
                      let token = config["token"] as? String else {
                    reject("INVALID_CONFIG", "Missing required configuration parameters", nil)
                    return
                }
                
                let userName = config["userName"] as? String ?? "User"
                
                // Initialize StreamVideo
                self.streamVideo = StreamVideo.shared
                self.streamVideo?.configure(
                    apiKey: apiKey,
                    user: User(
                        id: userId,
                        name: userName,
                        imageURL: nil,
                        customData: [:]
                    ),
                    token: token
                )
                
                resolve(["success": true, "message": "StreamVideo initialized successfully"])
            } catch {
                reject("INIT_ERROR", error.localizedDescription, nil)
            }
        }
    }
    
    @objc
    func joinCall(_ callConfig: NSDictionary,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        DispatchQueue.main.async {
            guard let streamVideo = self.streamVideo else {
                reject("NOT_INITIALIZED", "StreamVideo not initialized", nil)
                return
            }
            
            guard let callId = callConfig["callId"] as? String else {
                reject("INVALID_CALL_CONFIG", "Missing callId", nil)
                return
            }
            
            let callType = callConfig["callType"] as? String ?? "default"
            
            do {
                // Create call
                let call = streamVideo.call(callType: callType, callId: callId)
                self.currentCall = call
                
                // Join call
                call.join { result in
                    switch result {
                    case .success:
                        resolve(["success": true, "callId": callId])
                        self.sendEvent(withName: "onCallStateChanged", body: ["state": "joined", "callId": callId])
                    case .failure(let error):
                        reject("JOIN_ERROR", error.localizedDescription, nil)
                    }
                }
            } catch {
                reject("JOIN_ERROR", error.localizedDescription, nil)
            }
        }
    }
    
    @objc
    func leaveCall(_ callId: String,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        DispatchQueue.main.async {
            guard let call = self.currentCall else {
                reject("NO_ACTIVE_CALL", "No active call to leave", nil)
                return
            }
            
            call.leave { result in
                switch result {
                case .success:
                    self.currentCall = nil
                    resolve(["success": true])
                    self.sendEvent(withName: "onCallEnded", body: ["callId": callId])
                case .failure(let error):
                    reject("LEAVE_ERROR", error.localizedDescription, nil)
                }
            }
        }
    }
    
    @objc
    func toggleMicrophone(_ enabled: Bool,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        DispatchQueue.main.async {
            guard let call = self.currentCall else {
                reject("NO_ACTIVE_CALL", "No active call", nil)
                return
            }
            
            do {
                if enabled {
                    try call.microphone.enable()
                } else {
                    try call.microphone.disable()
                }
                resolve(["success": true, "microphoneEnabled": enabled])
            } catch {
                reject("MICROPHONE_ERROR", error.localizedDescription, nil)
            }
        }
    }
    
    @objc
    func toggleCamera(_ enabled: Bool,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        DispatchQueue.main.async {
            guard let call = self.currentCall else {
                reject("NO_ACTIVE_CALL", "No active call", nil)
                return
            }
            
            do {
                if enabled {
                    try call.camera.enable()
                } else {
                    try call.camera.disable()
                }
                resolve(["success": true, "cameraEnabled": enabled])
            } catch {
                reject("CAMERA_ERROR", error.localizedDescription, nil)
            }
        }
    }
}
