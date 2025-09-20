import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const CustomCallControls = ({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isRecording,
  isHost,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onStartRecording,
  onStopRecording,
  onLeave,
  onEndForAll,
  style,
  landscape,
}) => {
  const controlButtonStyle = [
    styles.controlButton,
    landscape && styles.controlButtonLandscape,
  ];

  const controlTextStyle = [
    styles.controlText,
    landscape && styles.controlTextLandscape,
  ];

  return (
    <View style={[styles.container, landscape && styles.containerLandscape, style]}>
      {/* Left side controls */}
      <View style={styles.leftControls}>
        {/* Microphone Toggle */}
        <TouchableOpacity
          style={[
            controlButtonStyle,
            isMuted && styles.controlButtonMuted,
          ]}
          onPress={onToggleMic}
          activeOpacity={0.7}
        >
          <Icon
            name={isMuted ? 'microphone-off' : 'microphone'}
            size={24}
            color={isMuted ? '#fff' : '#1F2937'}
          />
          <Text style={[controlTextStyle, isMuted && styles.controlTextMuted]}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        {/* Camera Toggle */}
        <TouchableOpacity
          style={[
            controlButtonStyle,
            !isVideoOn && styles.controlButtonMuted,
          ]}
          onPress={onToggleCamera}
          activeOpacity={0.7}
        >
          <Icon
            name={isVideoOn ? 'video' : 'video-off'}
            size={24}
            color={isVideoOn ? '#1F2937' : '#fff'}
          />
          <Text style={[controlTextStyle, !isVideoOn && styles.controlTextMuted]}>
            {isVideoOn ? 'Camera Off' : 'Camera On'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Center controls */}
      <View style={styles.centerControls}>
        {/* Screen Share Toggle */}
        <TouchableOpacity
          style={[
            controlButtonStyle,
            isScreenSharing && styles.controlButtonActive,
          ]}
          onPress={onToggleScreenShare}
          activeOpacity={0.7}
        >
          <Icon
            name="monitor-share"
            size={24}
            color={isScreenSharing ? '#fff' : '#1F2937'}
          />
          <Text style={[controlTextStyle, isScreenSharing && styles.controlTextActive]}>
            {isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </Text>
        </TouchableOpacity>

        {/* Recording Toggle (Host only) */}
        {isHost && (
          <TouchableOpacity
            style={[
              controlButtonStyle,
              isRecording && styles.controlButtonDanger,
            ]}
            onPress={isRecording ? onStopRecording : onStartRecording}
            activeOpacity={0.7}
          >
            <Icon
              name={isRecording ? 'stop' : 'record-rec'}
              size={24}
              color={isRecording ? '#fff' : '#DC2626'}
            />
            <Text style={[controlTextStyle, isRecording && styles.controlTextDanger]}>
              {isRecording ? 'Stop Recording' : 'Record'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Settings Button */}
        <TouchableOpacity
          style={controlButtonStyle}
          onPress={() => {/* Settings will be handled by parent */}}
          activeOpacity={0.7}
        >
          <Icon
            name="cog"
            size={24}
            color="#1F2937"
          />
          <Text style={controlTextStyle}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Right side controls */}
      <View style={styles.rightControls}>
        {/* End for All (Host only) */}
        {isHost && (
          <TouchableOpacity
            style={[controlButtonStyle, styles.controlButtonDanger]}
            onPress={onEndForAll}
            activeOpacity={0.7}
          >
            <Icon
              name="phone-hangup"
              size={24}
              color="#fff"
            />
            <Text style={[controlTextStyle, styles.controlTextDanger]}>
              End for All
            </Text>
          </TouchableOpacity>
        )}

        {/* Leave Meeting */}
        <TouchableOpacity
          style={[controlButtonStyle, styles.controlButtonLeave]}
          onPress={onLeave}
          activeOpacity={0.7}
        >
          <Icon
            name="phone-hangup"
            size={24}
            color="#fff"
          />
          <Text style={[controlTextStyle, styles.controlTextLeave]}>
            Leave
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  containerLandscape: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    minWidth: 60,
  },
  controlButtonLandscape: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 80,
  },
  controlButtonMuted: {
    backgroundColor: '#DC2626',
  },
  controlButtonActive: {
    backgroundColor: '#3B82F6',
  },
  controlButtonDanger: {
    backgroundColor: '#DC2626',
  },
  controlButtonLeave: {
    backgroundColor: '#EF4444',
  },
  controlText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    marginTop: 2,
    textAlign: 'center',
  },
  controlTextLandscape: {
    fontSize: 12,
    marginTop: 0,
    marginLeft: 4,
  },
  controlTextMuted: {
    color: '#fff',
  },
  controlTextActive: {
    color: '#fff',
  },
  controlTextDanger: {
    color: '#fff',
  },
  controlTextLeave: {
    color: '#fff',
  },
});

export default CustomCallControls;
