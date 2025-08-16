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

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

const TicketItem = ({ ticket, onPress, onStatusUpdate }) => (
  <TouchableOpacity style={styles.ticketItem} onPress={onPress}>
    <View style={styles.ticketHeader}>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketTitle}>{ticket.title}</Text>
        <Text style={styles.ticketId}>#{ticket.id}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
        <Text style={styles.statusText}>{ticket.status}</Text>
      </View>
    </View>
    
    <Text style={styles.ticketDescription} numberOfLines={2}>
      {ticket.description}
    </Text>
    
    <View style={styles.ticketFooter}>
      <View style={styles.ticketMeta}>
        <View style={styles.metaItem}>
          <Icon name="account" size={16} color="#666" />
          <Text style={styles.metaText}>{ticket.submittedBy}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="clock" size={16} color="#666" />
          <Text style={styles.metaText}>{ticket.submittedAt}</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="flag" size={16} color="#666" />
          <Text style={styles.metaText}>{ticket.priority}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.statusButton}
        onPress={() => onStatusUpdate(ticket)}
      >
        <Icon name="pencil" size={16} color="#00418b" />
        <Text style={styles.statusButtonText}>Update</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'open':
      return '#4CAF50';
    case 'in progress':
      return '#FF9800';
    case 'closed':
      return '#666';
    case 'urgent':
      return '#F44336';
    default:
      return '#666';
  }
};

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

export default function PrincipalSupportCenter() {
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Form state for creating tickets
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'academic',
    targetAudience: 'all',
  });

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/tickets`);
      
      if (response.data && Array.isArray(response.data)) {
        setTickets(response.data);
        setFilteredTickets(response.data);
      } else {
        // Use mock data as fallback
        setTickets(getMockTickets());
        setFilteredTickets(getMockTickets());
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets(getMockTickets());
      setFilteredTickets(getMockTickets());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockTickets = () => [
    {
      id: 1,
      title: 'Faculty Meeting Room Booking Issue',
      description: 'Unable to book the main conference room for next week\'s faculty meeting. System shows room as available but booking fails.',
      status: 'Open',
      priority: 'High',
      category: 'Facility',
      submittedBy: 'Dr. Sarah Johnson',
      submittedAt: '2 hours ago',
      assignedTo: 'Facilities Manager',
    },
    {
      id: 2,
      title: 'Student Portal Access Problem',
      description: 'Several students reported they cannot access their grades and assignments through the student portal.',
      status: 'In Progress',
      priority: 'High',
      category: 'Technical',
      submittedBy: 'IT Support',
      submittedAt: '1 day ago',
      assignedTo: 'IT Team',
    },
    {
      id: 3,
      title: 'Library Resource Request',
      description: 'Request for additional academic journals and research materials for the Computer Science department.',
      status: 'Open',
      priority: 'Medium',
      category: 'Academic',
      submittedBy: 'Prof. Michael Chen',
      submittedAt: '3 days ago',
      assignedTo: 'Library Staff',
    },
    {
      id: 4,
      title: 'Parking Lot Maintenance',
      description: 'Several parking spots in the faculty lot are damaged and need immediate repair.',
      status: 'Closed',
      priority: 'Medium',
      category: 'Facility',
      submittedBy: 'Security Staff',
      submittedAt: '1 week ago',
      assignedTo: 'Maintenance Team',
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      fetchTickets();
    }
  }, [isFocused]);

  useEffect(() => {
    let filtered = tickets;
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.status.toLowerCase() === activeTab.toLowerCase()
      );
    }
    
    // Filter by search query
    if (searchQuery.length > 0) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTickets(filtered);
  }, [activeTab, searchQuery, tickets]);

  const createTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/tickets`, newTicket);
      
      if (response.data) {
        Alert.alert('Success', 'Ticket created successfully!');
        setShowCreateModal(false);
        setNewTicket({
          title: '',
          description: '',
          priority: 'medium',
          category: 'academic',
          targetAudience: 'all',
        });
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', 'Failed to create ticket. Please try again.');
    }
  };

  const updateTicketStatus = async (ticket, newStatus) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/tickets/${ticket.id}`, {
        status: newStatus,
      });
      
      if (response.data) {
        Alert.alert('Success', 'Ticket status updated successfully!');
        setShowStatusModal(false);
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      Alert.alert('Error', 'Failed to update ticket status. Please try again.');
    }
  };

  const handleStatusUpdate = (ticket) => {
    setSelectedTicket(ticket);
    setShowStatusModal(true);
  };

  const handleTicketPress = (ticket) => {
    Alert.alert(
      ticket.title,
      `Description: ${ticket.description}\n\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nCategory: ${ticket.category}\nSubmitted by: ${ticket.submittedBy}\nAssigned to: ${ticket.assignedTo || 'Unassigned'}`,
      [
        { text: 'Close' },
        { text: 'Update Status', onPress: () => handleStatusUpdate(ticket) },
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
            <Text style={styles.modalTitle}>Create New Ticket</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Ticket Title"
            value={newTicket.title}
            onChangeText={(text) => setNewTicket({ ...newTicket, title: text })}
            placeholderTextColor="#999"
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={newTicket.description}
            onChangeText={(text) => setNewTicket({ ...newTicket, description: text })}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
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
                      newTicket.priority === priority && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setNewTicket({ ...newTicket, priority })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      newTicket.priority === priority && styles.pickerOptionTextSelected,
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
                {['academic', 'technical', 'facility', 'administrative'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.pickerOption,
                      newTicket.category === category && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setNewTicket({ ...newTicket, category })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      newTicket.category === category && styles.pickerOptionTextSelected,
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.createButton} onPress={createTicket}>
            <Text style={styles.createButtonText}>Create Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Ticket Status</Text>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.statusUpdateText}>
            Update status for ticket: {selectedTicket?.title}
          </Text>
          
          <View style={styles.statusOptions}>
            {['Open', 'In Progress', 'Closed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedTicket?.status === status && styles.statusOptionSelected,
                ]}
                onPress={() => updateTicketStatus(selectedTicket, status)}
              >
                <Text style={[
                  styles.statusOptionText,
                  selectedTicket?.status === status && styles.statusOptionTextSelected,
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support Center</Text>
        <Text style={styles.headerSubtitle}>Manage support tickets and issues</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
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
        {['all', 'open', 'in progress', 'closed'].map((tab) => (
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

      {/* Create Ticket Button */}
      <TouchableOpacity
        style={styles.createTicketButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="plus" size={20} color="#fff" />
        <Text style={styles.createTicketButtonText}>Create New Ticket</Text>
      </TouchableOpacity>

      {/* Tickets List */}
      <View style={styles.content}>
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TicketItem
              ticket={item}
              onPress={() => handleTicketPress(item)}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="ticket-confirmation" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery.length > 0 ? 'No tickets found for your search.' : 'No tickets available.'}
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
      {renderStatusModal()}
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
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  activeTabText: {
    color: '#00418b',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  createTicketButton: {
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
  createTicketButtonText: {
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
  ticketItem: {
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
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  ticketId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMeta: {
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'Poppins-Regular',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#00418b',
    borderRadius: 6,
  },
  statusButtonText: {
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
  statusUpdateText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  statusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  statusOptionSelected: {
    backgroundColor: '#00418b',
    borderColor: '#00418b',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  statusOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});


