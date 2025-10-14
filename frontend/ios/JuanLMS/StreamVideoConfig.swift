import Foundation
import StreamVideo

struct StreamVideoConfig {
    static let shared = StreamVideoConfig()
    
    // Stream Video Configuration
    let apiKey = "mmhfdzb5evj2"
    let baseURL = "https://pronto.getstream.io"
    
    // Audio/Video Settings
    let audioSettings = AudioSettings(
        speaker: .automatic,
        microphone: .automatic
    )
    
    let videoSettings = VideoSettings(
        camera: .automatic,
        audio: .automatic
    )
    
    // Call Settings
    let callSettings = CallSettings(
        audioOn: false,
        videoOn: false,
        microphone: .automatic,
        speaker: .automatic,
        camera: .automatic
    )
    
    private init() {}
    
    func configureStreamVideo() {
        // Configure global Stream Video settings
        StreamVideo.shared.logger.level = .debug
        
        // Configure audio session
        configureAudioSession()
    }
    
    private func configureAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .videoChat, options: [.allowBluetooth, .allowBluetoothA2DP])
            try audioSession.setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
        }
    }
}

import AVFoundation
