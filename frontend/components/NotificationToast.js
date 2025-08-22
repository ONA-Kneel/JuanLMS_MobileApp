import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNotifications } from '../NotificationContext';

export default function NotificationToast() {
  const { notifications } = useNotifications();
  const [currentToast, setCurrentToast] = useState(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (notifications.length > 0) {
      const latestUnread = notifications.find(n => !n.read);
      if (latestUnread && latestUnread !== currentToast) {
        showToast(latestUnread);
      }
    }
  }, [notifications]);

  const showToast = (notification) => {
    setCurrentToast(notification);
    
    // Slide in from top
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideToast();
    }, 5000);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement':
        return 'bullhorn';
      case 'assignment':
        return 'file-document';
      case 'quiz':
        return 'help-circle';
      case 'activity':
        return 'calendar-check';
      case 'message':
        return 'message';
      default:
        return 'bell';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'normal':
        return '#17a2b8';
      case 'low':
        return '#6c757d';
      default:
        return '#17a2b8';
    }
  };

  if (!currentToast) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY: slideAnim }], 
          opacity: opacityAnim 
        }
      ]}
    >
      <View style={styles.toast}>
        <View style={styles.toastHeader}>
          <View style={styles.iconContainer}>
            <Icon 
              name={getNotificationIcon(currentToast.type)} 
              size={20} 
              color={getPriorityColor(currentToast.priority)} 
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentToast.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {currentToast.message}
            </Text>
            <View style={styles.metaContainer}>
              <Text style={styles.faculty}>
                {currentToast.faculty}
              </Text>
              {currentToast.className && currentToast.className !== 'Direct Message' && (
                <Text style={styles.classInfo}>
                  {currentToast.className}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
            <Icon name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#00418b',
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  message: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 6,
    lineHeight: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faculty: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: '#00418b',
  },
  classInfo: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 4,
  },
});
