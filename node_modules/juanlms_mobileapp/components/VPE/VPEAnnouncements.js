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
  ScrollView,
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
  switch (priority?.toLowerCase()) {
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
  switch (category?.toLowerCase()) {
    case 'academic':
      return '#2196F3';
    case 'administrative':
      return '#9C27B0';
    case 'faculty':
      return '#FF9800';
    case 'student':
      return '#4CAF50';
    case 'general':
      return '#607D8B';
    default:
      return '#666';
  }
};

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'academic':
      return 'school';
    case 'administrative':
      return 'office-building';
    case 'faculty':
      return 'account-tie';
    case 'student':
      return 'account-group';
    case 'general':
      return 'bullhorn';
    default:
      return 'information';
  }
};

const getTargetAudienceText = (targetAudience) => {
  if (!targetAudience || targetAudience.length === 0) return 'All Users';
  if (targetAudience.includes('everyone')) return 'All Users';
  return targetAudience.join(', ');
};

export default function VPEAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: 'general',
    targetAudience: ['everyone']
  });

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchAnnouncements();
    }
  }, [isFocused]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/announcements`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      Alert.alert('Error', 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  const handleAnnouncementPress = (announcement) => {
    setSelectedAnnouncement(announcement);
    setModalVisible(true);
  };

  const handleToggleStatus = async (announcement) => {
    try {
      const updatedAnnouncement = { ...announcement, isActive: !announcement.isActive };
      await axios.put(`${API_BASE_URL}/api/announcements/${announcement._id}`, updatedAnnouncement);
      
      setAnnouncements(prev => 
        prev.map(ann => 
          ann._id === announcement._id ? updatedAnnouncement : ann
        )
      );
    } catch (error) {
      console.error('Error updating announcement status:', error);
      Alert.alert('Error', 'Failed to update announcement status');
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/api/announcements`, {
        ...newAnnouncement,
        createdBy: 'VPE', // This should come from user context
        createdAt: new Date().toISOString()
      });

      setAnnouncements(prev => [response.data, ...prev]);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'medium',
        category: 'general',
        targetAudience: ['everyone']
      });
      setShowCreateForm(false);
      Alert.alert('Success', 'Announcement created successfully');
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || announcement.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const renderAnnouncementItem = ({ item }) => (
    <AnnouncementItem
      announcement={item}
      onPress={() => handleAnnouncementPress(item)}
      onToggleStatus={handleToggleStatus}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading announcements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'academic' && styles.filterChipActive]}
            onPress={() => setFilterCategory('academic')}
          >
            <Text style={[styles.filterChipText, filterCategory === 'academic' && styles.filterChipTextActive]}>
              Academic
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'administrative' && styles.filterChipActive]}
            onPress={() => setFilterCategory('administrative')}
          >
            <Text style={[styles.filterChipText, filterCategory === 'administrative' && styles.filterChipTextActive]}>
              Administrative
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'faculty' && styles.filterChipActive]}
            onPress={() => setFilterCategory('faculty')}
          >
            <Text style={[styles.filterChipText, filterCategory === 'faculty' && styles.filterChipTextActive]}>
              Faculty
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Announcements List */}
      <FlatList
        data={filteredAnnouncements}
        renderItem={renderAnnouncementItem}
        keyExtractor={(item) => item._id}
        style={styles.announcementsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bullhorn-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No announcements found</Text>
            <Text style={styles.emptySubtext}>Create your first announcement to get started</Text>
          </View>
        }
      />

      {/* Create Announcement Modal */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Announcement</Text>
              <TouchableOpacity onPress={() => setShowCreateForm(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Announcement Title"
              value={newAnnouncement.title}
              onChangeText={(text) => setNewAnnouncement(prev => ({ ...prev, title: text }))}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Announcement Content"
              value={newAnnouncement.content}
              onChangeText={(text) => setNewAnnouncement(prev => ({ ...prev, content: text }))}
              multiline
              numberOfLines={4}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Priority:</Text>
              <View style={styles.pickerRow}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newAnnouncement.priority === priority && styles.priorityOptionActive
                    ]}
                    onPress={() => setNewAnnouncement(prev => ({ ...prev, priority }))}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newAnnouncement.priority === priority && styles.priorityOptionTextActive
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category:</Text>
              <View style={styles.pickerRow}>
                {['general', 'academic', 'administrative', 'faculty', 'student'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      newAnnouncement.category === category && styles.categoryOptionActive
                    ]}
                    onPress={() => setNewAnnouncement(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newAnnouncement.category === category && styles.categoryOptionTextActive
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateAnnouncement}
            >
              <Text style={styles.submitButtonText}>Create Announcement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Announcement Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Announcement Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedAnnouncement && (
              <View>
                <Text style={styles.detailTitle}>{selectedAnnouncement.title}</Text>
                <View style={styles.detailMeta}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedAnnouncement.priority) }]}>
                    <Text style={styles.priorityText}>{selectedAnnouncement.priority}</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedAnnouncement.category) }]}>
                    <Icon name={getCategoryIcon(selectedAnnouncement.category)} size={16} color="#fff" />
                    <Text style={styles.categoryText}>{selectedAnnouncement.category}</Text>
                  </View>
                </View>
                <Text style={styles.detailContent}>{selectedAnnouncement.content}</Text>
                <View style={styles.detailFooter}>
                  <Text style={styles.detailAuthor}>By: {selectedAnnouncement.author || 'Unknown'}</Text>
                  <Text style={styles.detailDate}>{selectedAnnouncement.createdAt}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#00418b',
    padding: 12,
    borderRadius: 8,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: {
    backgroundColor: '#00418b',
  },
  filterChipText: {
    color: '#666',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  announcementsList: {
    flex: 1,
  },
  announcementItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusToggle: {
    marginLeft: 12,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleInactive: {
    backgroundColor: '#f0f0f0',
  },
  announcementContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
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
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    color: '#00418b',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  priorityOptionActive: {
    backgroundColor: '#00418b',
  },
  priorityOptionText: {
    color: '#666',
    fontSize: 14,
  },
  priorityOptionTextActive: {
    color: '#fff',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryOptionActive: {
    backgroundColor: '#00418b',
  },
  categoryOptionText: {
    color: '#666',
    fontSize: 14,
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#00418b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  detailContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  detailAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 12,
    color: '#999',
  },
});
