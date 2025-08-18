import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { formatDate } from '../../utils/dateUtils';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

const AnnouncementItem = ({ announcement, onPress, onToggleStatus }) => (
  <TouchableOpacity style={styles.announcementItem} onPress={onPress}>
    <View style={styles.announcementHeader}>
      <View style={styles.announcementInfo}>
        <Text style={styles.announcementTitle}>{announcement.title}</Text>
        <View style={styles.announcementMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) }]}>
            <Text style={styles.priorityText}>{announcement.priority}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(announcement.category) }]}>
            <Icon name={getCategoryIcon(announcement.category)} size={16} color="#fff" />
            <Text style={styles.categoryText}>{announcement.category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.statusToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            announcement.isActive ? styles.toggleActive : styles.toggleInactive,
          ]}
          onPress={() => onToggleStatus(announcement)}
        >
          <Icon
            name={announcement.isActive ? 'eye' : 'eye-off'}
            size={16}
            color={announcement.isActive ? '#fff' : '#666'}
          />
        </TouchableOpacity>
      </View>
    </View>
    
    <Text style={styles.announcementContent} numberOfLines={3}>
      {announcement.content}
    </Text>
    
    <View style={styles.announcementFooter}>
      <View style={styles.footerLeft}>
        <View style={styles.footerItem}>
          <Icon name="account" size={16} color="#666" />
          <Text style={styles.footerText}>{announcement.author}</Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="clock" size={16} color="#666" />
          <Text style={styles.footerText}>{announcement.createdAt}</Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="target" size={16} color="#666" />
          <Text style={styles.footerText}>{getTargetAudienceText(announcement.targetAudience)}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.editButton}>
        <Icon name="pencil" size={16} color="#00418b" />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const getPriorityColor = (priority) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return '#F44336';
    case 'medium':
      return '#FF9800';
    case 'low':
      return '#4CAF50';
    default:
      return '#666';
  }
};

const getCategoryColor = (category) => {
  switch (category.toLowerCase()) {
    case 'academic':
      return '#2196F3';
    case 'administrative':
      return '#9C27B0';
    case 'faculty':
      return '#FF9800';
    case 'student':
      return '#4CAF50';
    default:
      return '#666';
  }
};

const getCategoryIcon = (category) => {
  switch (category.toLowerCase()) {
    case 'academic':
      return 'school';
    case 'administrative':
      return 'office-building';
    case 'faculty':
      return 'account-tie';
    case 'student':
      return 'account-group';
    default:
      return 'bullhorn';
  }
};

const getTargetAudienceText = (audience) => {
  if (Array.isArray(audience)) {
    return audience.join(', ');
  }
  return audience || 'All Users';
};

export default function PrincipalAnnouncements() {
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state for creating announcements
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: 'academic',
    targetAudience: ['all'],
  });

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/announcements`);
      
      if (response.data && Array.isArray(response.data)) {
        setAnnouncements(response.data);
        setFilteredAnnouncements(response.data);
      } else {
        // Use mock data as fallback
        setAnnouncements(getMockAnnouncements());
        setFilteredAnnouncements(getMockAnnouncements());
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements(getMockAnnouncements());
      setFilteredAnnouncements(getMockAnnouncements());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAnnouncements = () => [
    {
      id: 1,
      title: 'Faculty Meeting Schedule Update',
      content: 'Due to upcoming holidays, the monthly faculty meeting has been rescheduled to next Tuesday at 2:00 PM in the main conference room. All faculty members are required to attend.',
      priority: 'High',
      category: 'Faculty',
      targetAudience: ['faculty'],
      author: 'Dr. Michael Anderson',
      createdAt: '2 hours ago',
      isActive: true,
    },
    {
      id: 2,
      title: 'New Academic Calendar Released',
      content: 'The academic calendar for the upcoming semester has been finalized and is now available on the student portal. Please review important dates including exam periods and holidays.',
      priority: 'Medium',
      category: 'Academic',
      targetAudience: ['all'],
      author: 'Academic Affairs Office',
      createdAt: '1 day ago',
      isActive: true,
    },
    {
      id: 3,
      title: 'Library Extended Hours',
      content: 'Starting next week, the library will extend its operating hours until 10:00 PM on weekdays to accommodate students preparing for final exams.',
      priority: 'Low',
      category: 'Student',
      targetAudience: ['students'],
      author: 'Library Staff',
      createdAt: '3 days ago',
      isActive: true,
    },
    {
      id: 4,
      title: 'IT Maintenance Notice',
      content: 'Scheduled maintenance will be performed on the student portal this weekend. The system will be unavailable from Saturday 10:00 PM to Sunday 6:00 AM.',
      priority: 'Medium',
      category: 'Administrative',
      targetAudience: ['all'],
      author: 'IT Department',
      createdAt: '1 week ago',
      isActive: false,
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      fetchAnnouncements();
    }
  }, [isFocused]);

  useEffect(() => {
    let filtered = announcements;
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(announcement => 
        announcement.category.toLowerCase() === activeTab.toLowerCase()
      );
    }
    
    // Filter by search query
    if (searchQuery.length > 0) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredAnnouncements(filtered);
  }, [activeTab, searchQuery, announcements]);

  const createAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/announcements`, newAnnouncement);
      
      if (response.data) {
        Alert.alert('Success', 'Announcement created successfully!');
        setShowCreateModal(false);
        setNewAnnouncement({
          title: '',
          content: '',
          priority: 'medium',
          category: 'academic',
          targetAudience: ['all'],
        });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement. Please try again.');
    }
  };

  const toggleAnnouncementStatus = async (announcement) => {
    try {
      const annId = announcement._id || announcement.id;
      const response = await axios.patch(`${API_BASE_URL}/api/announcements/${annId}`, {
        isActive: !announcement.isActive,
      });
      
      if (response.data) {
        Alert.alert(
          'Success',
          `Announcement ${announcement.isActive ? 'deactivated' : 'activated'} successfully!`
        );
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error updating announcement status:', error);
      Alert.alert('Error', 'Failed to update announcement status. Please try again.');
    }
  };

  const handleAnnouncementPress = (announcement) => {
    Alert.alert(
      announcement.title,
      announcement.content,
      [
        { text: 'Close' },
        { text: 'Edit', onPress: () => Alert.alert('Edit', 'Edit feature coming soon!') },
      ]
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Announcement</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Announcement Title"
            value={newAnnouncement.title}
            onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, title: text })}
            placeholderTextColor="#999"
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Announcement Content"
            value={newAnnouncement.content}
            onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, content: text })}
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.pickerContainer}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.pickerOption,
                      newAnnouncement.priority === priority && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setNewAnnouncement({ ...newAnnouncement, priority })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      newAnnouncement.priority === priority && styles.pickerOptionTextSelected,
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                {['academic', 'administrative', 'faculty', 'student'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.pickerOption,
                      newAnnouncement.category === category && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setNewAnnouncement({ ...newAnnouncement, category })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      newAnnouncement.category === category && styles.pickerOptionTextSelected,
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.createButton} onPress={createAnnouncement}>
            <Text style={styles.createButtonText}>Create Announcement</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <Text style={styles.headerSubtitle}>Manage institutional communications</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['all', 'academic', 'administrative', 'faculty', 'student'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create Announcement Button */}
      <TouchableOpacity
        style={styles.createAnnouncementButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="plus" size={20} color="#fff" />
        <Text style={styles.createAnnouncementButtonText}>Create New Announcement</Text>
      </TouchableOpacity>

      {/* Announcements List */}
      <View style={styles.content}>
        <FlatList
          data={filteredAnnouncements}
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={({ item }) => (
            <AnnouncementItem
              announcement={item}
              onPress={() => handleAnnouncementPress(item)}
              onToggleStatus={toggleAnnouncementStatus}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bullhorn" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery.length > 0 ? 'No announcements found for your search.' : 'No announcements available.'}
              </Text>
              {searchQuery.length > 0 && (
                <Text style={styles.emptySubtext}>Try adjusting your search terms.</Text>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {renderCreateModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
    fontFamily: 'Poppins-Regular',
  },
  clearButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00418b',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  activeTabText: {
    color: '#00418b',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  createAnnouncementButton: {
    backgroundColor: '#00418b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createAnnouncementButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  announcementItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  announcementInfo: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  announcementMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  statusToggle: {
    marginLeft: 12,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleInactive: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  announcementContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Poppins-Regular',
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'Poppins-Regular',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#00418b',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: '#00418b',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'Poppins-Regular',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  formField: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  pickerContainer: {
    flexDirection: 'row',
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 6,
  },
  pickerOptionSelected: {
    backgroundColor: '#00418b',
    borderColor: '#00418b',
  },
  pickerOptionText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  createButton: {
    backgroundColor: '#00418b',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});
