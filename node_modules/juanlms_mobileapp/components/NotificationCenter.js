import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNotifications } from '../NotificationContext';
import { useAnnouncements } from '../AnnouncementContext';
import { useNavigation } from '@react-navigation/native';

export default function NotificationCenter({ visible, onClose }) {
  const navigation = useNavigation();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const { announcements, acknowledgedAnnouncements, loading: loadingAnnouncements, acknowledgeAnnouncement, refreshAnnouncements } = useAnnouncements();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('announcements');

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'announcements') {
      await refreshAnnouncements();
    } else {
      await refreshNotifications();
    }
    setRefreshing(false);
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const formatAnnouncementDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const handleNotificationPress = (notification) => {
    // Mark as read first
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'announcement':
        // Navigate to announcements
        navigation.navigate('Announcements');
        break;
      case 'assignment':
        // Navigate to assignments
        navigation.navigate('Assignments');
        break;
      case 'quiz':
        // Navigate to quizzes
        navigation.navigate('Quizzes');
        break;
      case 'activity':
        // Navigate to activities
        navigation.navigate('Activities');
        break;
      case 'message':
        // Navigate to messages
        navigation.navigate('Messages');
        break;
      default:
        break;
    }
    
    onClose();
  };

  const handleAnnouncementPress = (announcement) => {
    // Acknowledge the announcement
    acknowledgeAnnouncement(announcement._id);
    // Navigate to announcements
    navigation.navigate('Announcements');
    onClose();
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === 'announcements') {
      // Show acknowledged announcements from Principal/VPE
      return acknowledgedAnnouncements.filter(announcement => 
        announcement.createdBy?.role?.toLowerCase() === 'principal' || 
        announcement.createdBy?.role?.toLowerCase() === 'vice president of education'
      );
    } else {
      // Show all other notifications (messages, activities, etc.)
      return notifications.filter(n => 
        n.type !== 'announcement' || 
        (!n.faculty?.toLowerCase().includes('principal') && 
         !n.faculty?.toLowerCase().includes('vpe') &&
         !n.faculty?.toLowerCase().includes('vice president'))
      );
    }
  };

  const filteredItems = getFilteredNotifications();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerActions}>
              {activeTab === 'updates' && unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllReadButton}>
                  <Text style={styles.markAllReadText}>Mark All Read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
              onPress={() => setActiveTab('announcements')}
            >
              <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>
                Announcements
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'updates' && styles.activeTab]}
              onPress={() => setActiveTab('updates')}
            >
              <Text style={[styles.tabText, activeTab === 'updates' && styles.activeTabText]}>
                Updates
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.contentContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {activeTab === 'announcements' ? (
              // Announcements Tab Content
              loadingAnnouncements ? (
                <View style={styles.loadingContainer}>
                  <Icon name="loading" size={48} color="#ccc" />
                  <Text style={styles.loadingText}>Loading announcements...</Text>
                </View>
              ) : filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="bullhorn-off" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No acknowledged announcements yet</Text>
                </View>
              ) : (
                filteredItems.map((announcement) => (
                  <TouchableOpacity
                    key={announcement._id}
                    style={styles.announcementItem}
                    onPress={() => handleAnnouncementPress(announcement)}
                  >
                    <View style={styles.announcementContent}>
                      <Text style={styles.announcementTitle} numberOfLines={2}>
                        {announcement.title}
                      </Text>
                      <Text style={styles.announcementDate}>
                        {formatAnnouncementDate(announcement.createdAt)}
                      </Text>
                      <Text style={styles.announcementCreator}>
                        👤 {announcement.createdBy?.firstname} {announcement.createdBy?.lastname} ({announcement.createdBy?.role})
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )
            ) : (
              // Updates Tab Content
              filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="bell-off" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No updates yet</Text>
                </View>
              ) : (
                filteredItems.map((notification) => (
                  <TouchableOpacity
                    key={notification._id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationIcon}>
                      <Icon 
                        name={getNotificationIcon(notification.type)} 
                        size={24} 
                        color={getPriorityColor(notification.priority)} 
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle} numberOfLines={2}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage} numberOfLines={3}>
                        {notification.message}
                      </Text>
                      <View style={styles.notificationMeta}>
                        <Text style={styles.notificationFaculty}>
                          {notification.faculty}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatTimestamp(notification.timestamp)}
                        </Text>
                      </View>
                      {notification.className && notification.className !== 'Direct Message' && (
                        <Text style={styles.notificationClass}>
                          {notification.className} ({notification.classCode})
                        </Text>
                      )}
                    </View>
                    {!notification.read && (
                      <View style={styles.unreadIndicator} />
                    )}
                  </TouchableOpacity>
                ))
              )
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.8,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllReadButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  markAllReadText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  closeButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#00418b',
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginTop: 16,
  },
  announcementItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementContent: {
    paddingHorizontal: 10,
  },
  announcementTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 22,
  },
  announcementDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginBottom: 4,
  },
  announcementCreator: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#00418b',
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#e9ecef',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#00418b',
  },
  notificationIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 22,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationFaculty: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#00418b',
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
  },
  notificationClass: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontStyle: 'italic',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00418b',
    marginLeft: 12,
    marginTop: 8,
  },
});
