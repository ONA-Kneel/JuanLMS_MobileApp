import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useContext } from 'react';
import { UserContext } from '../UserContext';

const API_BASE_URL = 'http://localhost:5000';

export default function VPESupportCenter() {
  const { user } = useContext(UserContext);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'open', 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      
      // Fetch support tickets from backend
      const response = await axios.get(`${API_BASE_URL}/api/tickets`);
      
      if (response.data && Array.isArray(response.data)) {
        setTickets(response.data);
      } else {
        // Use mock data for now
        setTickets(getMockTickets());
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Use mock data for now
      setTickets(getMockTickets());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockTickets = () => [
    {
      _id: '1',
      title: 'Faculty Development Program Request',
      description: 'Request for additional faculty development programs and training sessions.',
      status: 'open',
      priority: 'high',
      category: 'faculty',
      createdBy: 'John Smith',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      assignedTo: 'VPE Office'
    },
    {
      _id: '2',
      title: 'Academic Calendar Update',
      description: 'Need to update academic calendar for next semester.',
      status: 'in-progress',
      priority: 'medium',
      category: 'academic',
      createdBy: 'Maria Garcia',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      assignedTo: 'VPE Office'
    },
    {
      _id: '3',
      title: 'Student Support Services Enhancement',
      description: 'Proposal to enhance student support services and counseling.',
      status: 'closed',
      priority: 'low',
      category: 'student',
      createdBy: 'David Johnson',
      createdAt: new Date(Date.now() - 604800000), // 1 week ago
      assignedTo: 'VPE Office'
    }
  ];

  const createTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const ticketData = {
        ...newTicket,
        createdBy: user?.firstname + ' ' + user?.lastname,
        status: 'open',
        createdAt: new Date(),
        assignedTo: 'VPE Office'
      };

      // Create ticket via API
      const response = await axios.post(`${API_BASE_URL}/api/tickets`, ticketData);
      
      if (response.data) {
        setTickets([response.data, ...tickets]);
        setShowCreateModal(false);
        setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
        Alert.alert('Success', 'Support ticket created successfully');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', 'Failed to create support ticket');
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      // Update ticket status via API
      const response = await axios.put(`${API_BASE_URL}/api/tickets/${ticketId}`, { status: newStatus });
      
      if (response.data) {
        setTickets(tickets.map(ticket => 
          ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
        ));
        Alert.alert('Success', 'Ticket status updated successfully');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      Alert.alert('Error', 'Failed to update ticket status');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa726';
      case 'low': return '#66bb6a';
      default: return '#666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#ff6b6b';
      case 'in-progress': return '#ffa726';
      case 'closed': return '#66bb6a';
      default: return '#666';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesTab = activeTab === 'all' || ticket.status === activeTab;
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const renderTicket = (ticket) => (
    <View key={ticket._id} style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <View style={styles.ticketMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
              <Text style={styles.priorityText}>{ticket.priority}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
              <Text style={styles.statusText}>{ticket.status}</Text>
            </View>
            <Text style={styles.ticketCategory}>{ticket.category}</Text>
          </View>
        </View>
        <View style={styles.ticketActions}>
          {ticket.status === 'open' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateTicketStatus(ticket._id, 'in-progress')}
            >
              <Icon name="play" size={16} color="#00418b" />
            </TouchableOpacity>
          )}
          {ticket.status === 'in-progress' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => updateTicketStatus(ticket._id, 'closed')}
            >
              <Icon name="check" size={16} color="#00418b" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={styles.ticketDescription}>{ticket.description}</Text>
      
      <View style={styles.ticketFooter}>
        <Text style={styles.ticketCreator}>By: {ticket.createdBy}</Text>
        <Text style={styles.ticketDate}>
          {new Date(ticket.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.ticketAssigned}>Assigned to: {ticket.assignedTo}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support Center</Text>
        <Icon name="help-circle" size={28} color="#00418b" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({tickets.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'open' && styles.activeTab]}
          onPress={() => setActiveTab('open')}
        >
          <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>
            Open ({tickets.filter(t => t.status === 'open').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'closed' && styles.activeTab]}
          onPress={() => setActiveTab('closed')}
        >
          <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>
            Closed ({tickets.filter(t => t.status === 'closed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Ticket Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="plus" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create New Ticket</Text>
      </TouchableOpacity>

      {/* Tickets List */}
      <ScrollView style={styles.ticketsContainer} showsVerticalScrollIndicator={false}>
        {filteredTickets.length > 0 ? (
          filteredTickets.map(renderTicket)
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="ticket-confirmation" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No tickets found matching your search.' : 'No tickets available.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Ticket Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Support Ticket</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Ticket Title"
              value={newTicket.title}
              onChangeText={(text) => setNewTicket({...newTicket, title: text})}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={newTicket.description}
              onChangeText={(text) => setNewTicket({...newTicket, description: text})}
              multiline
              numberOfLines={4}
            />

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.pickerContainer}>
                  {['low', 'medium', 'high'].map(priority => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        newTicket.priority === priority && styles.selectedPriority
                      ]}
                      onPress={() => setNewTicket({...newTicket, priority})}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        newTicket.priority === priority && styles.selectedPriorityText
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerContainer}>
                  {['general', 'academic', 'faculty', 'student', 'technical'].map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        newTicket.category === category && styles.selectedCategory
                      ]}
                      onPress={() => setNewTicket({...newTicket, category})}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        newTicket.category === category && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                onPress={createTicket}
              >
                <Text style={styles.submitButtonText}>Create Ticket</Text>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#00418b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins-SemiBold',
  },
  activeTabText: {
    color: '#fff',
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
  ticketsContainer: {
    flex: 1,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  ticketMeta: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
  },
  ticketCategory: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    textTransform: 'capitalize',
  },
  ticketActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  ticketCreator: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  ticketDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  ticketAssigned: {
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
