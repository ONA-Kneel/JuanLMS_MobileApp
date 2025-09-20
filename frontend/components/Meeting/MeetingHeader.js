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

const MeetingHeader = ({
  meetingTitle,
  participantCount,
  meetingStats,
  isHost,
  onSettingsPress,
  onLeavePress,
}) => {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Left side - Meeting info */}
      <View style={styles.leftSection}>
        <View style={styles.meetingInfo}>
          <Text style={styles.meetingTitle} numberOfLines={1}>
            {meetingTitle}
          </Text>
          <View style={styles.meetingMeta}>
            <View style={styles.metaItem}>
              <Icon name="account-group" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{participantCount} participants</Text>
            </View>
            {meetingStats && (
              <View style={styles.metaItem}>
                <Icon name="clock-outline" size={14} color="#6B7280" />
                <Text style={styles.metaText}>
                  {formatDuration(meetingStats.meetingDuration)}
                </Text>
              </View>
            )}
            {isHost && (
              <View style={styles.hostBadge}>
                <Icon name="crown" size={12} color="#F59E0B" />
                <Text style={styles.hostText}>Host</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Right side - Controls */}
      <View style={styles.rightSection}>
        {/* Settings Button */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Icon name="cog" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* More Options Button */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {/* More options */}}
          activeOpacity={0.7}
        >
          <Icon name="dots-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Leave Button */}
        <TouchableOpacity
          style={[styles.headerButton, styles.leaveButton]}
          onPress={onLeavePress}
          activeOpacity={0.7}
        >
          <Icon name="phone-hangup" size={20} color="#DC2626" />
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  leftSection: {
    flex: 1,
    marginRight: 16,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  meetingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  hostText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#D97706',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: '#FEE2E2',
  },
});

export default MeetingHeader;
