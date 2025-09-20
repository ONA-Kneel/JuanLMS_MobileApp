import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Switch,
  ScrollView,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

const MeetingSettings = ({
  visible,
  onClose,
  isHost = false,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState({
    // Audio Settings
    enableNoiseCancellation: true,
    enableEchoCancellation: true,
    enableAutoGainControl: true,
    audioInputDevice: 'default',
    audioOutputDevice: 'default',
    
    // Video Settings
    enableBackgroundBlur: false,
    enableBackgroundReplacement: false,
    videoQuality: 'auto', // 'auto', 'high', 'medium', 'low'
    enableHDVideo: true,
    
    // Meeting Settings
    enableChat: true,
    enableReactions: true,
    enableRaiseHand: true,
    enableWaitingRoom: false,
    enableRecording: false,
    enableTranscription: false,
    
    // Advanced Settings
    enableBandwidthOptimization: true,
    enableAdaptiveBitrate: true,
    enableLowLatencyMode: false,
  });

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    type = 'switch',
    options = [],
    icon,
    disabled = false 
  }) => (
    <View style={[styles.settingItem, disabled && styles.disabledItem]}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          {icon && <Icon name={icon} size={20} color="#6B7280" />}
          <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      <View style={styles.settingControl}>
        {type === 'switch' ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={value ? '#fff' : '#9CA3AF'}
          />
        ) : type === 'select' ? (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {/* Handle selection */}}
            disabled={disabled}
          >
            <Text style={[styles.selectText, disabled && styles.disabledText]}>
              {options.find(opt => opt.value === value)?.label || value}
            </Text>
            <Icon name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const SettingSection = ({ title, children }) => (
    <View style={styles.settingSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Meeting Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Settings Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Audio Settings */}
            <SettingSection title="Audio">
              <SettingItem
                title="Noise Cancellation"
                subtitle="Reduce background noise"
                value={settings.enableNoiseCancellation}
                onValueChange={(value) => handleSettingChange('enableNoiseCancellation', value)}
                icon="microphone"
              />
              <SettingItem
                title="Echo Cancellation"
                subtitle="Prevent audio feedback"
                value={settings.enableEchoCancellation}
                onValueChange={(value) => handleSettingChange('enableEchoCancellation', value)}
                icon="microphone-settings"
              />
              <SettingItem
                title="Auto Gain Control"
                subtitle="Automatically adjust microphone volume"
                value={settings.enableAutoGainControl}
                onValueChange={(value) => handleSettingChange('enableAutoGainControl', value)}
                icon="volume-high"
              />
            </SettingSection>

            {/* Video Settings */}
            <SettingSection title="Video">
              <SettingItem
                title="Background Blur"
                subtitle="Blur your background"
                value={settings.enableBackgroundBlur}
                onValueChange={(value) => handleSettingChange('enableBackgroundBlur', value)}
                icon="blur"
              />
              <SettingItem
                title="HD Video"
                subtitle="Enable high definition video"
                value={settings.enableHDVideo}
                onValueChange={(value) => handleSettingChange('enableHDVideo', value)}
                icon="video-high-definition"
              />
              <SettingItem
                title="Video Quality"
                subtitle="Set video quality preference"
                value={settings.videoQuality}
                onValueChange={(value) => handleSettingChange('videoQuality', value)}
                type="select"
                options={[
                  { label: 'Auto', value: 'auto' },
                  { label: 'High', value: 'high' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Low', value: 'low' },
                ]}
                icon="video"
              />
            </SettingSection>

            {/* Meeting Settings */}
            <SettingSection title="Meeting">
              <SettingItem
                title="Enable Chat"
                subtitle="Allow participants to send messages"
                value={settings.enableChat}
                onValueChange={(value) => handleSettingChange('enableChat', value)}
                icon="chat"
              />
              <SettingItem
                title="Enable Reactions"
                subtitle="Allow participants to send reactions"
                value={settings.enableReactions}
                onValueChange={(value) => handleSettingChange('enableReactions', value)}
                icon="emoticon-happy"
              />
              <SettingItem
                title="Raise Hand"
                subtitle="Allow participants to raise their hand"
                value={settings.enableRaiseHand}
                onValueChange={(value) => handleSettingChange('enableRaiseHand', value)}
                icon="hand-back-left"
              />
            </SettingSection>

            {/* Host-only Settings */}
            {isHost && (
              <SettingSection title="Host Controls">
                <SettingItem
                  title="Waiting Room"
                  subtitle="Require approval to join"
                  value={settings.enableWaitingRoom}
                  onValueChange={(value) => handleSettingChange('enableWaitingRoom', value)}
                  icon="account-clock"
                />
                <SettingItem
                  title="Enable Recording"
                  subtitle="Record this meeting"
                  value={settings.enableRecording}
                  onValueChange={(value) => handleSettingChange('enableRecording', value)}
                  icon="record-rec"
                />
                <SettingItem
                  title="Live Transcription"
                  subtitle="Generate live captions"
                  value={settings.enableTranscription}
                  onValueChange={(value) => handleSettingChange('enableTranscription', value)}
                  icon="subtitles"
                />
              </SettingSection>
            )}

            {/* Advanced Settings */}
            <SettingSection title="Advanced">
              <SettingItem
                title="Bandwidth Optimization"
                subtitle="Optimize for slower connections"
                value={settings.enableBandwidthOptimization}
                onValueChange={(value) => handleSettingChange('enableBandwidthOptimization', value)}
                icon="wifi"
              />
              <SettingItem
                title="Adaptive Bitrate"
                subtitle="Automatically adjust quality based on connection"
                value={settings.enableAdaptiveBitrate}
                onValueChange={(value) => handleSettingChange('enableAdaptiveBitrate', value)}
                icon="chart-line"
              />
              <SettingItem
                title="Low Latency Mode"
                subtitle="Reduce delay (may affect quality)"
                value={settings.enableLowLatencyMode}
                onValueChange={(value) => handleSettingChange('enableLowLatencyMode', value)}
                icon="flash"
              />
            </SettingSection>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                // Reset to default settings
                setSettings({
                  enableNoiseCancellation: true,
                  enableEchoCancellation: true,
                  enableAutoGainControl: true,
                  audioInputDevice: 'default',
                  audioOutputDevice: 'default',
                  enableBackgroundBlur: false,
                  enableBackgroundReplacement: false,
                  videoQuality: 'auto',
                  enableHDVideo: true,
                  enableChat: true,
                  enableReactions: true,
                  enableRaiseHand: true,
                  enableWaitingRoom: false,
                  enableRecording: false,
                  enableTranscription: false,
                  enableBandwidthOptimization: true,
                  enableAdaptiveBitrate: true,
                  enableLowLatencyMode: false,
                });
              }}
            >
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={onClose}
            >
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabledItem: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 8,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 28,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    minWidth: 80,
  },
  selectText: {
    fontSize: 14,
    color: '#374151',
    marginRight: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default MeetingSettings;
