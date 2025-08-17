import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useContext } from 'react';
import { UserContext } from '../UserContext';
import { formatDate } from '../../utils/dateUtils';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

export default function VPEAnnouncements() {
  const { user } = useContext(UserContext);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'academic', 'faculty', 'student'
  
  // New announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'academic',
    priority: 'normal',
    targetAudience: 'all'
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      
      // Fetch announcements from backend
      const response = await axios.get(`${API_BASE_URL}/api/announcements`);
      
      if (response.data && Array.isArray(response.data)) {
        setAnnouncements(response.data);
      } else {
        // Use mock data for now
        setAnnouncements(getMockAnnouncements());
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Use mock data for now
      setAnnouncements(getMockAnnouncements());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAnnouncements = () => [
    {
      _id: '1',
      title: 'Academic Calendar Update for Next Semester',
      content: 'Important updates to the academic calendar for the upcoming semester. Please review the changes and update your schedules accordingly.',
      category: 'academic',
      priority: 'high',
      targetAudience: 'all',
      createdBy: 'VPE Office',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      isActive: true
    },
    {
      _id: '2',
      title: 'Faculty Development Workshop Series',
      content: 'We are pleased to announce a series of faculty development workshops focusing on modern teaching methodologies and technology integration.',
      category: 'faculty',
      priority: 'medium',
      targetAudience: 'faculty',
      createdBy: 'VPE Office',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      isActive: true
    },
    {
      _id: '3',
      title: 'Student Support Services Enhancement',
      content: 'New student support services are now available including enhanced counseling, academic advising, and career guidance.',
      category: 'student',
      priority: 'normal',
      targetAudience: 'students',
      createdBy: 'VPE Office',
      createdAt: new Date(Date.now() - 604800000), // 1 week ago
      isActive: true
    }
  ];

  const createAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const announcementData = {
        ...newAnnouncement,
        createdBy: user?.firstname + ' ' + user?.lastname,
        createdAt: new Date(),
        isActive: true
      };

      // Create announcement via API
      const response = await axios.post(`${API_BASE_URL}/api/announcements`, announcementData);
      
      if (response.data) {
        setAnnouncements([response.data, ...announcements]);
        setShowCreateModal(false);
        setNewAnnouncement({ title: '', content: '', category: 'academic', priority: 'normal', targetAudience: 'all' });
        Alert.alert('Success', 'Announcement created successfully');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    }
  };

  const toggleAnnouncementStatus = async (announcementId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Update announcement status via API
      const response = await axios.put(`${API_BASE_URL}/api/announcements/${announcementId}`, { isActive: newStatus });
      
      if (response.data) {
        setAnnouncements(announcements.map(announcement => 
          announcement._id === announcementId ? { ...announcement, isActive: newStatus } : announcement
        ));
        Alert.alert('Success', `Announcement ${newStatus ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Error updating announcement status:', error);
      Alert.alert('Error', 'Failed to update announcement status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa726';
      case 'normal': return '#66bb6a';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'academic': return 'school';
      case 'faculty': return 'account-tie';
      case 'student': return 'account-group';
      default: return 'bullhorn';
    }
  };

  const getTargetAudienceText = (targetAudience) => {
    switch (targetAudience) {
      case 'all': return 'All Users';
      case 'faculty': return 'Faculty Only';
      case 'students': return 'Students Only';
      case 'admin': return 'Administrators Only';
      default: return 'All Users';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesFilter = activeFilter === 'all' || announcement.category === activeFilter;
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderAnnouncement = (announcement) => (
    <View key={announcement._id} style={styles.announcementCard}>
      <View style={styles.announcementHeader}>
        <View style={styles.announcementInfo}>
          <View style={styles.titleRow}>
            <Icon 
              name={getCategoryIcon(announcement.category)} 
              size={20} 
              color="#00418b" 
              style={{ marginRight: 8 }}
            />
            <Text style={styles.announcementTitle}>{announcement.title}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) }]}>
              <Text style={styles.priorityText}>{announcement.priority}</Text>
            </View>
            <Text style={styles.categoryText}>{announcement.category}</Text>
            <Text style={styles.targetAudienceText}>{getTargetAudienceText(announcement.targetAudience)}</Text>
          </View>
        </View>
        <View style={styles.statusToggle}>
          <TouchableOpacity 
            style={[
              styles.statusButton,
              { backgroundColor: announcement.isActive ? '#66bb6a' : '#ff6b6b' }
            ]}
            onPress={() => toggleAnnouncementStatus(announcement._id, announcement.isActive)}
          >
            <Icon 
              name={announcement.isActive ? 'eye' : 'eye-off'} 
              size={16} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.announcementContent}>{announcement.content}</Text>
      
      <View style={styles.announcementFooter}>
        <Text style={styles.announcementCreator}>By: {announcement.createdBy}</Text>
        <Text style={styles.announcementDate}>
                          {formatDate(announcement.createdAt, 'MMM D, YYYY')}
        </Text>
        <Text style={styles.announcementStatus}>
          {announcement.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <Icon name="bullhorn" size={28} color="#00418b" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, { color: activeFilter === 'all' ? '#fff' : '#666' }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'academic' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('academic')}
          >
            <Text style={[styles.filterText, { color: activeFilter === 'academic' ? '#fff' : '#666' }]}>Academic</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'faculty' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('faculty')}
          >
            <Text style={[styles.filterText, { color: activeFilter === 'faculty' ? '#fff' : '#666' }]}>Faculty</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'student' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('student')}
          >
            <Text style={[styles.filterText, { color: activeFilter === 'student' ? '#fff' : '#666' }]}>Student</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Create Announcement Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="plus" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create New Announcement</Text>
      </TouchableOpacity>

      {/* Announcements List */}
      <FlatList
        data={filteredAnnouncements}
        keyExtractor={item => item._id}
        renderItem={({ item }) => renderAnnouncement(item)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bullhorn-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery || activeFilter !== 'all' ? 'No announcements found matching your search/filter.' : 'No announcements available.'}
            </Text>
          </View>
        }
      />

      {/* Create Announcement Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Announcement</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Announcement Title"
              value={newAnnouncement.title}
              onChangeText={(text) => setNewAnnouncement({...newAnnouncement, title: text})}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Announcement Content"
              value={newAnnouncement.content}
              onChangeText={(text) => setNewAnnouncement({...newAnnouncement, content: text})}
              multiline
              numberOfLines={4}
            />

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerContainer}>
                  {['academic', 'faculty', 'student'].map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        newAnnouncement.category === category && styles.selectedCategory
                      ]}
                      onPress={() => setNewAnnouncement({...newAnnouncement, category})}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        newAnnouncement.category === category && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.pickerContainer}>
                  {['normal', 'medium', 'high'].map(priority => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        newAnnouncement.priority === priority && styles.selectedPriority
                      ]}
                      onPress={() => setNewAnnouncement({...newAnnouncement, priority})}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        newAnnouncement.priority === priority && styles.selectedPriorityText
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Target Audience</Text>
              <View style={styles.pickerContainer}>
                {['all', 'faculty', 'students', 'admin'].map(audience => (
                  <TouchableOpacity
                    key={audience}
                    style={[
                      styles.audienceOption,
                      newAnnouncement.targetAudience === audience && styles.selectedAudience
                    ]}
                    onPress={() => setNewAnnouncement({...newAnnouncement, targetAudience: audience})}
                  >
                    <Text style={[
                      styles.audienceOptionText,
                      newAnnouncement.targetAudience === audience && styles.selectedAudienceText
                    ]}>
                      {audience}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={createAnnouncement}
              >
                <Text style={styles.submitButtonText}>Create Announcement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    paddingVertical: 8,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterTab: {
    backgroundColor: '#00418b',
    borderColor: '#00418b',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00418b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    fontFamily: 'Poppins-Regular',
    textTransform: 'capitalize',
  },
  targetAudienceText: {
    fontSize: 12,
    color: '#00418b',
    fontFamily: 'Poppins-Medium',
  },
  statusToggle: {
    marginLeft: 8,
  },
  statusButton: {
    padding: 8,
    borderRadius: 8,
  },
  announcementContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  announcementCreator: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  announcementStatus: {
    fontSize: 12,
    color: '#00418b',
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  textArea: {
    height: 100,
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
    marginBottom: 16,
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
    flexWrap: 'wrap',
  },
  categoryOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#00418b',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    textTransform: 'capitalize',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  priorityOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#f0f0f0',
  },
  selectedPriority: {
    backgroundColor: '#00418b',
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    textTransform: 'capitalize',
  },
  selectedPriorityText: {
    color: '#fff',
  },
  audienceOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: '#f0f0f0',
  },
  selectedAudience: {
    backgroundColor: '#00418b',
  },
  audienceOptionText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    textTransform: 'capitalize',
  },
  selectedAudienceText: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#00418b',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});
