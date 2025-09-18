import { useEffect, useRef } from 'react';
import { Alert, Vibration } from 'react-native';

export const useNotification = () => {
  const notificationTimeoutRef = useRef(null);

  const showNotification = (title, message, options = {}) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Vibrate device if supported
    if (options.vibrate !== false) {
      Vibration.vibrate(100);
    }

    // Show alert notification
    if (options.showAlert !== false) {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'OK',
            onPress: options.onPress,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const showMessageNotification = (senderName, messageText, isGroup = false) => {
    const title = isGroup ? `New message in group` : `New message from ${senderName}`;
    const message = messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText;
    
    showNotification(title, message, {
      vibrate: true,
      showAlert: false, // Don't show alert for messages, just vibrate
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  return {
    showNotification,
    showMessageNotification,
  };
};
