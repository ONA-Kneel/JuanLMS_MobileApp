import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnnouncements } from '../AnnouncementContext';
import { useNotifications } from '../NotificationContext';
import { useNavigation } from '@react-navigation/native';

export default function NotificationCenter({ visible, onClose }) {
  const navigation = useNavigation();
  const { announcements, acknowledgedAnnouncements, loading: loadingAnnouncements, acknowledgeAnnouncement, refreshAnnouncements } = useAnnouncements();
  const { notifications, loading: loadingNotifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('updates'); // 'updates' or 'announcements'

  React.useEffect(() => {
    if (visible) {
      // Ensure latest data when opening
      refreshAnnouncements();
      refreshNotifications();
    }
  }, [visible]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'announcements') {
      await refreshAnnouncements();
    }
    // Notifications refresh automatically via context
    setRefreshing(false);
  };





  const formatAnnouncementDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatNotificationDate = (timestamp) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffInHours = Math.floor((now - notificationDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return notificationDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
    }
  };



  const handleNotificationPress = async (notification) => {
    try {
      if (!notification) return;
      if (notification._id) {
        await markAsRead(notification._id);
      }
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const token = await AsyncStorage.getItem('jwtToken');
      // If not authenticated, send to Login
      if (!token || !user) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        onClose && onClose();
        return;
      }
      const role = (user?.role || '').toLowerCase();
      const type = (notification.type || '').toLowerCase();
      // Navigate based on notification type
      switch (type) {
        case 'message':
          // Route to the Chats tab inside the proper tab navigator
          if (role.includes('faculty') || role.includes('teacher')) {
            navigation.navigate('FDash', { screen: 'FChat' });
          } else if (role.includes('principal')) {
            navigation.navigate('PrincipalDash', { screen: 'PrincipalChats' });
          } else if (role.includes('vice president') || role === 'vpe') {
            navigation.navigate('VPEDash', { screen: 'VPEChats' });
          } else {
            // default student
            navigation.navigate('SDash', { screen: 'SChat' });
          }
          break;
        case 'activity':
        case 'assignment':
        case 'quiz':
          // Go to Activities in the student tab navigator by default
          if (role.includes('faculty') || role.includes('teacher')) {
            navigation.navigate('FDash', { screen: 'FActs' });
          } else {
            navigation.navigate('SDash', { screen: 'SActs' });
          }
          break;
        case 'announcement':
          // For students, previously announcements are shown via SReq or appropriate tab
          if (role.includes('principal')) {
            navigation.navigate('PrincipalDash', { screen: 'PrincipalAnnouncements' });
          } else if (role.includes('vice president') || role === 'vpe') {
            navigation.navigate('VPEDash', { screen: 'VPEAnnouncements' });
          } else {
            // Keep existing student behavior
            navigation.navigate('SReq');
          }
          break;
        default:
          // Fallback to dashboard
          if (role.includes('faculty') || role.includes('teacher')) {
            navigation.navigate('FDash');
          } else if (role.includes('principal')) {
            navigation.navigate('PrincipalDash');
          } else if (role.includes('vice president') || role === 'vpe') {
            navigation.navigate('VPEDash');
          } else {
            navigation.navigate('SDash');
          }
      }
      onClose && onClose();
    } catch (e) {
      console.log('handleNotificationPress error:', e);
    }
  };

  const handleAnnouncementPress = (announcement) => {
    // Acknowledge the announcement
    acknowledgeAnnouncement(announcement._id);
    // Navigate to student support center for announcements
    navigation.navigate('SReq');
    onClose();
  };

  // Choose items for the active tab - improved filtering logic
  const getFilteredNotifications = () => {
    if (activeTab === 'announcements') {
      // Show acknowledged announcements from Principal/VPE
      console.log('Filtering announcements - Total acknowledged:', acknowledgedAnnouncements.length);
      console.log('Acknowledged announcements data:', acknowledgedAnnouncements);
      
      const filtered = acknowledgedAnnouncements.filter(announcement => {
        const role = announcement.createdBy?.role?.toLowerCase();
        console.log('Checking announcement role:', role, 'for announcement:', announcement.title);
        
        return role === 'principal' || 
               role === 'vice president of education' ||
               role === 'vpe';
      });
      
      console.log('Filtered announcements count:', filtered.length);
      return filtered;
    } else {
      // Show all notifications in the Updates tab
      console.log('Total notifications available:', notifications.length);
      console.log('Notification types:', notifications.map(n => n.type));
      return notifications;
    }
  };

  const filteredItems = getFilteredNotifications();

  // Enhanced debug logging
  console.log('=== NotificationCenter Debug ===');
  console.log('- Active tab:', activeTab);
  console.log('- Total notifications:', notifications.length);
  console.log('- Total announcements:', announcements.length);
  console.log('- Total acknowledged announcements:', acknowledgedAnnouncements.length);
  console.log('- Filtered items:', filteredItems.length);
  console.log('- Loading notifications:', loadingNotifications);
  console.log('- Loading announcements:', loadingAnnouncements);
  console.log('- Notifications data:', notifications);
  console.log('- Announcements data:', announcements);
  console.log('- Acknowledged announcements data:', acknowledgedAnnouncements);
  console.log('- Filtered items data:', filteredItems);
  console.log('================================');

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerActions}>
              {activeTab === 'updates' && filteredItems.length > 0 && (
                <TouchableOpacity 
                  onPress={async () => {
                    const user = await AsyncStorage.getItem('user');
                    if (user) {
                      const userData = JSON.parse(user);
                      if (userData._id) {
                        await markAllAsRead(userData._id);
                      }
                    }
                  }} 
                  style={styles.markAllButton}
                >
                  <Text style={styles.markAllText}>Mark All Read</Text>
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
              style={[styles.tab, activeTab === 'updates' && styles.activeTab]} 
              onPress={() => setActiveTab('updates')}
            >
              <Text style={[styles.tabText, activeTab === 'updates' && styles.activeTabText]}>
                Updates
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'announcements' && styles.activeTab]} 
              onPress={() => setActiveTab('announcements')}
            >
              <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>
                Announcements
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
            {/* Content based on active tab */}
            {activeTab === 'updates' ? (
              // Updates tab content
              loadingNotifications ? (
                <View style={styles.loadingContainer}>
                  <Icon name="loading" size={48} color="#ccc" />
                  <Text style={styles.loadingText}>Loading updates...</Text>
                </View>
              ) : filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="bell-off" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No updates yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Check your connection or try refreshing
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Debug: {notifications.length} total notifications, {filteredItems.length} filtered
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Announcements: {acknowledgedAnnouncements.length} acknowledged
                  </Text>
                </View>
              ) : (
                filteredItems.map((notification, index) => (
                  <TouchableOpacity
                    key={notification._id || `notification-${index}`}
                    style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle} numberOfLines={2}>
                        {notification.title || 'Notification'}
                      </Text>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message || 'No message available'}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {notification.timestamp ? formatNotificationDate(notification.timestamp) : 'Unknown time'}
                      </Text>
                      <Text style={styles.notificationType}>
                        📋 {notification.type || 'notification'} • {notification.faculty || 'System'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )
            ) : (
              // Announcements tab content
              loadingAnnouncements ? (
                <View style={styles.loadingContainer}>
                  <Icon name="loading" size={48} color="#ccc" />
                  <Text style={styles.loadingText}>Loading announcements...</Text>
                </View>
              ) : filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="bullhorn-off" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No announcements yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Debug: {acknowledgedAnnouncements.length} total acknowledged, {filteredItems.length} filtered
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Only Principal and VPE announcements are shown
                  </Text>
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
                      <Text style={styles.announcementBody} numberOfLines={3}>
                        {announcement.body}
                      </Text>
                      <Text style={styles.announcementDate}>
                        {formatAnnouncementDate(announcement.createdAt)}
                      </Text>
                      <Text style={styles.announcementCreator}>
                        👤 {announcement.createdBy?.firstname} {announcement.createdBy?.lastname} ({announcement.createdBy?.role})
                      </Text>
                      <Text style={styles.announcementTerm}>
                        📅 {announcement.termName} - {announcement.schoolYear}
                      </Text>
                    </View>
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '95%',
    maxWidth: 500,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 5,
  },
  markAllButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  markAllText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  activeTabText: {
    color: '#00418b',
    fontFamily: 'Poppins-SemiBold',
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
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
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
    marginBottom: 4,
  },
  announcementBody: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  announcementTerm: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#999',
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#00418b',
  },
  notificationContent: {
    paddingHorizontal: 10,
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
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#00418b',
  },
});
