import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNotifications } from '../NotificationContext';

export default function NotificationBadge({ onPress, size = 'medium', style }) {
  const { unreadCount } = useNotifications();

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16, fontSize: 10 };
      case 'medium':
        return { width: 20, height: 20, fontSize: 12 };
      case 'large':
        return { width: 24, height: 24, fontSize: 14 };
      default:
        return { width: 20, height: 20, fontSize: 12 };
    }
  };

  const badgeSize = getBadgeSize();

  if (unreadCount === 0) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.iconContainer, style]}>
        <Icon name="bell-outline" size={24} color="#666" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={[styles.iconContainer, style]}>
      <Icon name="bell" size={24} color="#00418b" />
      <View style={[styles.badge, { width: badgeSize.width, height: badgeSize.height }]}>
        <Text style={[styles.badgeText, { fontSize: badgeSize.fontSize }]}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 16,
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    lineHeight: 16,
  },
});
