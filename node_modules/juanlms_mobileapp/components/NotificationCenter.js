import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAnnouncements } from '../AnnouncementContext';
import { useNotifications } from '../NotificationContext';
import { useNavigation } from '@react-navigation/native';

export default function NotificationCenter({ visible, onClose }) {
  const navigation = useNavigation();
  const { announcements, acknowledgedAnnouncements, loading: loadingAnnouncements, acknowledgeAnnouncement, refreshAnnouncements } = useAnnouncements();
  const { notifications, loading: loadingNotifications, markAsRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('updates'); // 'updates' or 'announcements'

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



  const handleAnnouncementPress = (announcement) => {
    // Acknowledge the announcement
    acknowledgeAnnouncement(announcement._id);
    // Navigate to student support center for announcements
    navigation.navigate('SReq');
    onClose();
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === 'updates') {
      return notifications;
    } else {
      return announcements; // Fixed: Show announcements instead of acknowledgedAnnouncements
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
                </View>
              ) : (
                filteredItems.map((notification) => (
                  <TouchableOpacity
                    key={notification._id}
                    style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
                    onPress={() => markAsRead(notification._id)}
                  >
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle} numberOfLines={2}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {formatNotificationDate(notification.timestamp)}
                      </Text>
                      <Text style={styles.notificationType}>
                        📋 {notification.type} • {notification.faculty}
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
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
