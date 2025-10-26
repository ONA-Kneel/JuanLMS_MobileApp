import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');

export default function PopupNotification({ 
  visible, 
  title, 
  message, 
  type = 'notification',
  onClose,
  onPress,
  autoHide = true,
  duration = 5000 
}) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      if (autoHide) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, duration, autoHide]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose && onClose();
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    handleClose();
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'assignment':
        return {
          icon: 'assignment',
          color: '#ff6b35',
          bgColor: '#fff5f2',
        };
      case 'quiz':
        return {
          icon: 'quiz',
          color: '#4caf50',
          bgColor: '#f1f8e9',
        };
      case 'announcement':
        return {
          icon: 'bullhorn',
          color: '#2196f3',
          bgColor: '#e3f2fd',
        };
      case 'activity':
        return {
          icon: 'activity',
          color: '#9c27b0',
          bgColor: '#f3e5f5',
        };
      default:
        return {
          icon: 'bell',
          color: '#666',
          bgColor: '#f5f5f5',
        };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.notificationCard, { backgroundColor: bgColor }]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
              <Icon name={icon} size={24} color="white" />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {message}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Poppins-Bold',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  closeButton: {
    padding: 4,
  },
});

