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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDate } from '../../utils/dateUtils';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

// Character limits
const TITLE_MAX_LENGTH = 100;
const BODY_MAX_LENGTH = 2000;

const AnnouncementItem = ({ announcement, onPress, onToggleStatus, onEdit, onDelete }) => (
  <TouchableOpacity style={styles.announcementItem} onPress={onPress}>
    <View style={styles.announcementHeader}>
      <View style={styles.announcementInfo}>
        <Text style={styles.announcementTitle}>{announcement.title}</Text>
        <View style={styles.announcementMeta}>
          {announcement.termName && (
            <View style={styles.termBadge}>
              <Text style={styles.termText}>{announcement.termName}</Text>
            </View>
          )}
          {announcement.schoolYear && (
            <View style={styles.schoolYearBadge}>
              <Text style={styles.schoolYearText}>{announcement.schoolYear}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(announcement)}
        >
          <Icon name="pencil" size={16} color="#00418b" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(announcement)}
        >
          <Icon name="delete" size={16} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
    
    <Text style={styles.announcementContent} numberOfLines={3}>
      {announcement.body || announcement.content}
    </Text>
    
    <View style={styles.announcementFooter}>
      <View style={styles.footerLeft}>
        <View style={styles.footerItem}>
          <Icon name="account" size={16} color="#666" />
          <Text style={styles.footerText}>
            {announcement.createdBy && announcement.createdBy.firstname && announcement.createdBy.lastname ? 
              `${announcement.createdBy.firstname} ${announcement.createdBy.lastname}` : 
              'System'
            }
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="clock" size={16} color="#666" />
          <Text style={styles.footerText}>{announcement.createdAt ? formatDate(announcement.createdAt) : 'Unknown Date'}</Text>
        </View>
        <View style={styles.footerItem}>
          <Icon name="target" size={16} color="#666" />
          <Text style={styles.footerText}>{formatRecipientRoles(announcement.recipientRoles)}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const formatRecipientRoles = (roles) => {
  if (!roles || !Array.isArray(roles)) return 'All Users';
  
  const formattedRoles = roles.map(role => {
    if (role === 'vice president of education') return 'VPE';
    if (role === 'students') return 'Student';
    return role.charAt(0).toUpperCase() + role.slice(1);
  });
  
  return formattedRoles.join(', ');
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  
  // Academic year and term state
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  
  // Form state for creating/editing announcements
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    body: '',
    recipientRoles: [],
    termName: '',
    schoolYear: '',
  });
  
  const [recipients, setRecipients] = useState({
    everyone: false,
    vpe: false,
    faculty: false,
    admin: false,
    student: false
  });
  
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [showSchoolYearDropdown, setShowSchoolYearDropdown] = useState(false);

  // Close dropdowns when clicking outside
  const closeDropdowns = () => {
    setShowPriorityDropdown(false);
    setShowCategoryDropdown(false);
    setShowFilterDropdown(false);
    setShowSchoolYearDropdown(false);
  };

  // Handle recipient checkbox changes
  const handleRecipientChange = (recipient) => {
    if (recipient === 'everyone') {
      // If "Everyone" is checked, check all others
      const newRecipients = {
        everyone: !recipients.everyone,
        vpe: !recipients.everyone,
        faculty: !recipients.everyone,
        admin: !recipients.everyone,
        student: !recipients.everyone
      };
      setRecipients(newRecipients);
    } else {
      // For other checkboxes, update individual state
      setRecipients(prev => ({
        ...prev,
        [recipient]: !prev[recipient],
        // If any individual checkbox is unchecked, uncheck "everyone"
        everyone: recipient === 'everyone' ? !prev[recipient] : false
      }));
    }
  };

  // Convert recipients object to array
  const getSelectedRecipients = () => {
    const selectedRecipients = [];
    if (recipients.everyone) {
      selectedRecipients.push('admin', 'faculty', 'students', 'vice president of education', 'principal');
    } else {
      if (recipients.admin) selectedRecipients.push('admin');
      if (recipients.faculty) selectedRecipients.push('faculty');
      if (recipients.student) selectedRecipients.push('students');
      if (recipients.vpe) selectedRecipients.push('vice president of education');
    }
    return selectedRecipients;
  };

  // Fetch academic year
  const fetchAcademicYear = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE_URL}/api/schoolyears/active`, { headers });
      if (response.data) {
        setAcademicYear(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch academic year:', error);
    }
  };

  // Fetch active term for year
  const fetchActiveTermForYear = async () => {
    if (!academicYear) return;
    
    try {
      const schoolYearName = `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE_URL}/api/terms/schoolyear/${schoolYearName}`, { headers });
      if (response.data) {
        const terms = response.data;
        const active = terms.find(term => term.status === 'active');
        setCurrentTerm(active || null);
      }
    } catch (error) {
      console.error('Failed to fetch active term:', error);
      setCurrentTerm(null);
    }
  };

  // Fetch school years
  const fetchSchoolYears = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE_URL}/api/schoolyears`, { headers });
      if (response.data) {
        setSchoolYears(response.data);
        // Set the current active school year as default
        const currentSchoolYear = response.data.find(sy => sy.status === 'active');
        if (currentSchoolYear) {
          setSelectedSchoolYear(currentSchoolYear._id);
        } else if (response.data.length > 0) {
          setSelectedSchoolYear(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  };

  // Fetch terms for selected school year
  const fetchTermsForSchoolYear = async (schoolYearId) => {
    if (!schoolYearId) return;
    
    try {
      const schoolYear = schoolYears.find(sy => sy._id === schoolYearId);
      if (schoolYear) {
        const schoolYearName = `${schoolYear.schoolYearStart}-${schoolYear.schoolYearEnd}`;
        const token = await AsyncStorage.getItem('jwtToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(`${API_BASE_URL}/api/terms/schoolyear/${schoolYearName}`, { headers });
        if (response.data) {
          setTerms(response.data);
          if (response.data.length > 0) {
            setSelectedTerm(response.data[0]._id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch general announcements
      const response = await axios.get(`${API_BASE_URL}/api/general-announcements/all`, { headers });
      
      if (response.data && Array.isArray(response.data)) {
        const allAnnouncements = response.data.map(announcement => ({
          id: announcement._id || '',
          title: announcement.title || '',
          body: announcement.body || '',
          recipientRoles: Array.isArray(announcement.recipientRoles) ? announcement.recipientRoles : [],
          author: announcement.createdBy && announcement.createdBy.firstname && announcement.createdBy.lastname ? 
            `${announcement.createdBy.firstname} ${announcement.createdBy.lastname}` : 'System',
          createdAt: announcement.createdAt ? formatDate(announcement.createdAt) : '',
          type: 'general',
          termName: announcement.termName || '',
          schoolYear: announcement.schoolYear || '',
          createdBy: announcement.createdBy || null
        }));
        
        // Sort by creation date (newest first)
        allAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setAnnouncements(allAnnouncements);
        setFilteredAnnouncements(allAnnouncements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Use mock data as fallback
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
      body: 'Due to upcoming holidays, the monthly faculty meeting has been rescheduled to next Tuesday at 2:00 PM in the main conference room. All faculty members are required to attend.',
      recipientRoles: ['faculty'],
      author: 'Dr. Michael Anderson',
      createdAt: '2 hours ago',
      type: 'general',
      termName: 'Term 1',
      schoolYear: '2025-2026',
      createdBy: { firstname: 'Dr. Michael', lastname: 'Anderson' }
    },
    {
      id: 2,
      title: 'New Academic Calendar Released',
      body: 'The academic calendar for the upcoming semester has been finalized and is now available on the student portal. Please review important dates including exam periods and holidays.',
      recipientRoles: ['admin', 'faculty', 'students', 'vice president of education', 'principal'],
      author: 'Academic Affairs Office',
      createdAt: '1 day ago',
      type: 'general',
      termName: 'Term 1',
      schoolYear: '2025-2026',
      createdBy: { firstname: 'Academic', lastname: 'Affairs' }
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      const initializeData = async () => {
        try {
          await fetchAcademicYear();
          await fetchSchoolYears();
          await fetchAnnouncements(); // Fetch announcements immediately
        } catch (error) {
          console.error('Error initializing data:', error);
        }
      };
      
      initializeData();
    }
  }, [isFocused]);

  useEffect(() => {
    if (academicYear) {
      fetchActiveTermForYear();
    }
  }, [academicYear]);

  useEffect(() => {
    if (selectedSchoolYear) {
      fetchTermsForSchoolYear(selectedSchoolYear);
    }
  }, [selectedSchoolYear]);

  useEffect(() => {
    let filtered = announcements;
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(announcement => 
        announcement.recipientRoles.some(role => 
          role.toLowerCase() === activeTab.toLowerCase() || 
          (activeTab === 'student' && role === 'students') ||
          (activeTab === 'vpe' && role === 'vice president of education')
        )
      );
    }
    
    // Filter by search query
    if (searchQuery.length > 0) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (announcement.body || announcement.content).toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by school year
    if (selectedSchoolYear) {
      const schoolYear = schoolYears.find(sy => sy._id === selectedSchoolYear);
      if (schoolYear) {
        const schoolYearName = `${schoolYear.schoolYearStart}-${schoolYear.schoolYearEnd}`;
        filtered = filtered.filter(announcement => 
          announcement.schoolYear === schoolYearName
        );
      }
    }
    
    // Filter by term
    if (selectedTerm) {
      const term = terms.find(t => t._id === selectedTerm);
      if (term) {
        filtered = filtered.filter(announcement => 
          announcement.termName === term.termName
        );
      }
    }
    
    setFilteredAnnouncements(filtered);
  }, [activeTab, searchQuery, announcements, selectedSchoolYear, selectedTerm, schoolYears, terms]);

  const createAnnouncement = async () => {
    // Validate form
    if (!newAnnouncement.title.trim() || !newAnnouncement.body.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (newAnnouncement.title.length > TITLE_MAX_LENGTH) {
      Alert.alert('Error', `Title must be ${TITLE_MAX_LENGTH} characters or less.`);
      return;
    }

    if (newAnnouncement.body.length > BODY_MAX_LENGTH) {
      Alert.alert('Error', `Body must be ${BODY_MAX_LENGTH} characters or less.`);
      return;
    }

    if (!currentTerm || !academicYear) {
      Alert.alert('Error', 'Academic year and term information is required.');
      return;
    }

    const selectedRecipients = getSelectedRecipients();
    if (selectedRecipients.length === 0) {
      Alert.alert('Error', 'Please select at least one recipient.');
      return;
    }

    try {
      // Get auth token
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const announcementData = {
        title: newAnnouncement.title.trim(),
        body: newAnnouncement.body.trim(),
        recipientRoles: selectedRecipients,
        termName: currentTerm.termName,
        schoolYear: `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/general-announcements`, announcementData, { headers });
      
      if (response.data) {
        Alert.alert('Posted', 'Announcement created.');
        setShowCreateModal(false);
        closeDropdowns();
        resetForm();
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement. Please try again.');
    }
  };

  const updateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    // Validate form
    if (!newAnnouncement.title.trim() || !newAnnouncement.body.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (newAnnouncement.title.length > TITLE_MAX_LENGTH) {
      Alert.alert('Error', `Title must be ${TITLE_MAX_LENGTH} characters or less.`);
      return;
    }

    if (newAnnouncement.body.length > BODY_MAX_LENGTH) {
      Alert.alert('Error', `Body must be ${BODY_MAX_LENGTH} characters or less.`);
      return;
    }

    try {
      // Get auth token
      const token = await AsyncStorage.getItem('jwtToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const announcementData = {
        title: newAnnouncement.title.trim(),
        body: newAnnouncement.body.trim(),
        recipientRoles: getSelectedRecipients(),
        termName: newAnnouncement.termName,
        schoolYear: newAnnouncement.schoolYear
      };
      
      const response = await axios.put(`${API_BASE_URL}/api/general-announcements/${editingAnnouncement.id}`, announcementData, { headers });
      
      if (response.data) {
        Alert.alert('Saved', 'Announcement updated.');
        setShowEditModal(false);
        closeDropdowns();
        resetForm();
        setEditingAnnouncement(null);
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      Alert.alert('Error', 'Failed to update announcement. Please try again.');
    }
  };

  const deleteAnnouncement = async (announcement) => {
    Alert.alert(
      'Confirm Delete',
      `Delete "${announcement.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              await axios.delete(`${API_BASE_URL}/api/general-announcements/${announcement.id}`, { headers });
              Alert.alert('Deleted', 'Announcement removed.');
              fetchAnnouncements();
            } catch (error) {
              console.error('Error deleting announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement.');
            }
          }
        }
      ]
    );
  };

  const editAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      body: announcement.body || announcement.content,
      recipientRoles: announcement.recipientRoles || [],
      termName: announcement.termName,
      schoolYear: announcement.schoolYear,
    });
    
    // Set recipients based on announcement data
    const newRecipients = {
      everyone: false,
      vpe: false,
      faculty: false,
      admin: false,
      student: false
    };
    
    if (announcement.recipientRoles) {
      announcement.recipientRoles.forEach(role => {
        if (role === 'admin') newRecipients.admin = true;
        if (role === 'faculty') newRecipients.faculty = true;
        if (role === 'students') newRecipients.student = true;
        if (role === 'vice president of education') newRecipients.vpe = true;
        if (role === 'principal') newRecipients.admin = true; // Principal can see admin announcements
      });
      
      // Check if all are selected
      if (newRecipients.admin && newRecipients.faculty && newRecipients.student && newRecipients.vpe) {
        newRecipients.everyone = true;
      }
    }
    
    setRecipients(newRecipients);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setNewAnnouncement({
      title: '',
      body: '',
      recipientRoles: [],
      termName: '',
      schoolYear: '',
    });
    setRecipients({
      everyone: false,
      vpe: false,
      faculty: false,
      admin: false,
      student: false
    });
  };

  const handleAnnouncementPress = (announcement) => {
    Alert.alert(
      announcement.title,
      announcement.body || announcement.content,
      [
        { text: 'Close' },
        { text: 'Edit', onPress: () => editAnnouncement(announcement) },
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
      onRequestClose={() => {
        setShowCreateModal(false);
        closeDropdowns();
      }}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => {
          setShowCreateModal(false);
          closeDropdowns();
        }}
      >
        <TouchableOpacity 
          style={styles.modalContent} 
          activeOpacity={1} 
          onPress={() => {}} // Prevent closing when clicking inside modal
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Announcement</Text>
            <TouchableOpacity onPress={() => {
              setShowCreateModal(false);
              closeDropdowns();
            }}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Announcement Title"
            value={newAnnouncement.title}
            onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, title: text })}
            placeholderTextColor="#999"
            maxLength={TITLE_MAX_LENGTH}
          />
          <Text style={styles.characterCount}>
            {newAnnouncement.title.length}/{TITLE_MAX_LENGTH}
          </Text>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Announcement Content"
            value={newAnnouncement.body}
            onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, body: text })}
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={BODY_MAX_LENGTH}
          />
          <Text style={styles.characterCount}>
            {newAnnouncement.body.length}/{BODY_MAX_LENGTH}
          </Text>
          
          {/* Recipients Section */}
          <View style={styles.recipientsSection}>
            <Text style={styles.label}>Who will receive the announcement? *</Text>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('everyone')}
              >
                <Icon 
                  name={recipients.everyone ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.everyone ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>Everyone</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('vpe')}
              >
                <Icon 
                  name={recipients.vpe ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.vpe ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>VPE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('faculty')}
              >
                <Icon 
                  name={recipients.faculty ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.faculty ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>Faculty</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('admin')}
              >
                <Icon 
                  name={recipients.admin ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.admin ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>Admin</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('student')}
              >
                <Icon 
                  name={recipients.student ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.student ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>Student</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.createButton} onPress={createAnnouncement}>
            <Icon name="plus" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.createButtonText}>Create Announcement</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowEditModal(false);
        closeDropdowns();
      }}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => {
          setShowEditModal(false);
          closeDropdowns();
        }}
      >
        <TouchableOpacity 
          style={styles.modalContent} 
          activeOpacity={1} 
          onPress={() => {}} // Prevent closing when clicking inside modal
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Announcement</Text>
            <TouchableOpacity onPress={() => {
              setShowEditModal(false);
              closeDropdowns();
            }}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Announcement Title"
            value={newAnnouncement.title}
            onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, title: text })}
            placeholderTextColor="#999"
            maxLength={TITLE_MAX_LENGTH}
          />
          <Text style={styles.characterCount}>
            {newAnnouncement.title.length}/{TITLE_MAX_LENGTH}
          </Text>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Announcement Content"
            value={newAnnouncement.body}
            onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, body: text })}
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={BODY_MAX_LENGTH}
          />
          <Text style={styles.characterCount}>
            {newAnnouncement.body.length}/{BODY_MAX_LENGTH}
          </Text>
          
          {/* Recipients Section */}
          <View style={styles.recipientsSection}>
            <Text style={styles.label}>Who will receive the announcement? *</Text>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('everyone')}
              >
                <Icon 
                  name={recipients.everyone ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.everyone ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>Everyone</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('vpe')}
              >
                <Icon 
                  name={recipients.vpe ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.vpe ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>VPE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('faculty')}
              >
                <Icon 
                  name={recipients.faculty ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.faculty ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>Faculty</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('admin')}
              >
                <Icon 
                  name={recipients.admin ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.admin ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>Admin</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleRecipientChange('student')}
              >
                <Icon 
                  name={recipients.student ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                  size={20} 
                  color={recipients.student ? '#00418b' : '#666'} 
                />
                <Text style={styles.checkboxLabel}>Student</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.createButton} onPress={updateAnnouncement}>
            <Icon name="pencil" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.createButtonText}>Update Announcement</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <Text style={styles.headerSubtitle}>
          {academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : "Loading..."} | 
          {currentTerm ? `${currentTerm.termName}` : "Loading..."} | 
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
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

      {/* Filter Dropdown */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Category</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              showFilterDropdown && styles.dropdownButtonActive
            ]}
            onPress={() => {
              setShowFilterDropdown(!showFilterDropdown);
              setShowPriorityDropdown(false);
              setShowCategoryDropdown(false);
              setShowSchoolYearDropdown(false);
            }}
          >
            <Icon name="filter-variant" size={18} color="#666" style={{ marginRight: 8 }} />
            <Text style={styles.dropdownButtonText}>
              {activeTab === 'all' ? 'All Categories' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Text>
            <Icon 
              name={showFilterDropdown ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
          
          {showFilterDropdown && (
            <>
              <TouchableOpacity
                style={styles.fullScreenOverlay}
                activeOpacity={1}
                onPress={() => setShowFilterDropdown(false)}
              />
              <View style={styles.categoryDropdownOptions}>
                {[
                  { value: 'all', label: 'All Categories' },
                  { value: 'academic', label: 'Academic' },
                  { value: 'administrative', label: 'Administrative' },
                  { value: 'faculty', label: 'Faculty' },
                  { value: 'student', label: 'Student' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      activeTab === option.value && styles.dropdownOptionSelected
                    ]}
                    onPress={() => {
                      setActiveTab(option.value);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      activeTab === option.value && styles.dropdownOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {activeTab === option.value && (
                      <Icon name="check" size={16} color="#00418b" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </View>

      {/* Combined School Year and Term Filter */}
      <View style={styles.filterRow}>
        <View style={styles.filterField}>
          <Text style={styles.filterLabel}>Academic Period</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                showSchoolYearDropdown && styles.dropdownButtonActive
              ]}
              onPress={() => {
                setShowSchoolYearDropdown(!showSchoolYearDropdown);
                setShowFilterDropdown(false);
              }}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedSchoolYear && selectedTerm && schoolYears.length > 0 && terms.length > 0 ? 
                  (() => {
                    const schoolYear = schoolYears.find(sy => sy._id === selectedSchoolYear);
                    const term = terms.find(t => t._id === selectedTerm);
                    if (schoolYear && term) {
                      const yearText = `${schoolYear.schoolYearStart || schoolYear.schoolyearstart || ''}-${schoolYear.schoolYearEnd || schoolYear.schoolyearEnd || ''}`;
                      return `${yearText} ${term.termName || ''}`;
                    }
                    return 'Select Academic Period';
                  })() : 
                  'Select Academic Period'
                }
              </Text>
              <Icon 
                name={showSchoolYearDropdown ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {showSchoolYearDropdown && (
              <>
                <TouchableOpacity
                  style={styles.fullScreenOverlay}
                  activeOpacity={1}
                  onPress={() => setShowSchoolYearDropdown(false)}
                />
                <View style={styles.combinedDropdownOptions}>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedSchoolYear('');
                      setSelectedTerm('');
                      setShowSchoolYearDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>All Academic Periods</Text>
                  </TouchableOpacity>
                  {schoolYears.map((year) => {
                    const yearTerms = terms.filter(t => t.schoolYear === `${year.schoolYearStart || year.schoolyearstart}-${year.schoolYearEnd || year.schoolyearEnd}`);
                    return yearTerms.map((term) => (
                      <TouchableOpacity
                        key={`${year._id}-${term._id}`}
                        style={[
                          styles.dropdownOption,
                          selectedSchoolYear === year._id && selectedTerm === term._id && styles.dropdownOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedSchoolYear(year._id);
                          setSelectedTerm(term._id);
                          setShowSchoolYearDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          selectedSchoolYear === year._id && selectedTerm === term._id && styles.dropdownOptionTextSelected
                        ]}>
                          {year.schoolYearStart || year.schoolyearstart}-{year.schoolYearEnd || year.schoolyearEnd} {term.termName}
                        </Text>
                        {selectedSchoolYear === year._id && selectedTerm === term._id && (
                          <Icon name="check" size={16} color="#00418b" />
                        )}
                      </TouchableOpacity>
                    ));
                  })}
                </View>
              </>
            )}
          </View>
        </View>
      </View>



      {/* Create Announcement Button */}
      <TouchableOpacity
        style={styles.createAnnouncementButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="plus" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.createAnnouncementButtonText}>Create New Announcement</Text>
      </TouchableOpacity>

      {/* Announcements List */}
      <View style={styles.content}>
        <FlatList
          data={filteredAnnouncements}
          keyExtractor={(item) => (item._id || item.id || Math.random()).toString()}
          renderItem={({ item }) => {
            try {
              return (
                <AnnouncementItem
                  announcement={item}
                  onPress={() => handleAnnouncementPress(item)}
                  onEdit={editAnnouncement}
                  onDelete={deleteAnnouncement}
                />
              );
            } catch (error) {
              console.error('Error rendering announcement item:', error, item);
              return (
                <View style={[styles.announcementItem, { padding: 16, backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }]}>
                  <Text style={{ color: '#856404' }}>Error displaying announcement</Text>
                </View>
              );
            }
          }}
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
      {renderEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    zIndex: 0,
  },
  header: {
    backgroundColor: '#00418b',
    padding: 20,
    paddingTop: 40,
    zIndex: 400,
    position: 'relative',
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
    zIndex: 500,
    position: 'relative',
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
    zIndex: 501,
    position: 'relative',
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
    zIndex: 600,
    position: 'relative',
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
    zIndex: 100,
    position: 'relative',
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
    zIndex: 101,
    position: 'relative',
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
  termBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0f2f7',
  },
  termText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  schoolYearBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f2f7',
  },
  schoolYearText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
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
    zIndex: 20000,
    elevation: 20000,
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
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: -10,
    marginBottom: 16,
    fontFamily: 'Poppins-Regular',
  },
  recipientsSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  recipientsSection: {
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#00418b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 9999999,
    elevation: 9999999,
  },
  filterField: {
    flex: 1,
    marginHorizontal: 4,
    zIndex: 999999999,
    elevation: 999999999,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 2000,
    elevation: 2000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minWidth: 200,
    zIndex: 2001,
    elevation: 2001,
  },
  dropdownButtonActive: {
    borderColor: '#00418b',
    borderWidth: 2,
    backgroundColor: '#f8f9ff',
    shadowColor: '#00418b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2002,
    zIndex: 2002,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    flex: 1,
    textAlign: 'left',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 2,
    elevation: 3000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 3000,
    maxHeight: 200,
    minWidth: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    zIndex: 3001,
    elevation: 3001,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f0f0f0',
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
    color: '#00418b',
  },
  dropdownOptionHover: {
    backgroundColor: '#f8f9ff',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 1500,
    elevation: 1500,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: -2000,
    left: -2000,
    right: -2000,
    bottom: -2000,
    zIndex: 2500,
    elevation: 2500,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 3000,
    elevation: 3000,
    position: 'relative',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1000,
    elevation: 1000,
    position: 'relative',
  },
  filterField: {
    flex: 1,
    marginHorizontal: 4,
    zIndex: 1100,
    elevation: 1100,
    position: 'relative',
  },
  // Modal-specific dropdown styles
  modalDropdownContainer: {
    position: 'relative',
    zIndex: 21000,
    elevation: 21000,
  },
  modalDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minWidth: 120,
    zIndex: 21001,
    elevation: 21001,
  },
  modalDropdownButtonActive: {
    borderColor: '#00418b',
    borderWidth: 2,
    backgroundColor: '#f8f9ff',
    shadowColor: '#00418b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 21002,
    zIndex: 21002,
  },
  modalDropdownButtonText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    flex: 1,
    textAlign: 'left',
  },
  modalDropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 2,
    elevation: 21003,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 21003,
    maxHeight: 150,
    minWidth: 120,
  },
  modalDropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    zIndex: 21004,
    elevation: 21004,
  },
  modalDropdownOptionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  modalDropdownOptionSelected: {
    backgroundColor: '#f0f0f0',
  },
  modalDropdownOptionTextSelected: {
    fontWeight: '600',
    color: '#00418b',
  },
  modalDropdownOptionHover: {
    backgroundColor: '#f8f9ff',
  },
  // Specific dropdown options styles
  categoryDropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 2,
    elevation: 5000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 5000,
    maxHeight: 250,
    minWidth: 200,
  },
  combinedDropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 2,
    elevation: 4000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 4000,
    maxHeight: 300,
    minWidth: 250,
  },
  // Enhanced filter field styles for better positioning
  filterField: {
    flex: 1,
    marginHorizontal: 8,
    zIndex: 2500,
    elevation: 2500,
    position: 'relative',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 2000,
    elevation: 2000,
    position: 'relative',
  },
});


