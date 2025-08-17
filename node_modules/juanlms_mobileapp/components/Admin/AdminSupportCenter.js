import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'opened', label: 'Opened' },
  { key: 'closed', label: 'Closed' },
];

export default function AdminSupportCenter() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [tickets, setTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');
  const [userDetails, setUserDetails] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await AsyncStorage.getItem('jwtToken');
      const endpoint = activeTab === 'all' ? '/api/tickets' : `/api/tickets?status=${activeTab}`;
      
      const response = await fetch(`https://juanlms-webapp-server.onrender.com${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const ticketsData = Array.isArray(data) ? data : [];
      setTickets(ticketsData);
      
      // Fetch all tickets for accurate counts
      if (activeTab === 'all') {
        setAllTickets(ticketsData);
      } else {
        const allResponse = await fetch('https://juanlms-webapp-server.onrender.com/api/tickets', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (allResponse.ok) {
          const allData = await allResponse.json();
          setAllTickets(Array.isArray(allData) ? allData : []);
        }
      }
      
      // Fetch user details for tickets
      await fetchUserDetails(ticketsData);
      
      // Auto-select first ticket if available
      if (ticketsData.length > 0 && !selectedTicket) {
        setSelectedTicket(ticketsData[0]);
      }
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to fetch tickets. Please try again.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (tickets) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch('https://juanlms-webapp-server.onrender.com/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const allUsers = await response.json();
        const users = Array.isArray(allUsers) ? allUsers : [];
        
        // Create user map
        const userMap = {};
        users.forEach(user => {
          if (user._id) {
            userMap[user._id] = {
              name: `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Unknown User',
              role: user.role || 'Unknown'
            };
          }
        });
        
        // Map user details to tickets
        const userDetailsMap = {};
        tickets.forEach(ticket => {
          if (ticket.userId && userMap[ticket.userId]) {
            userDetailsMap[ticket._id] = userMap[ticket.userId];
          } else {
            userDetailsMap[ticket._id] = {
              name: 'Unknown User',
              role: 'Unknown'
            };
          }
        });
        
        setUserDetails(userDetailsMap);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Set default values
      const userDetailsMap = {};
      tickets.forEach(ticket => {
        userDetailsMap[ticket._id] = {
          name: 'Error Loading User',
          role: 'Unknown'
        };
      });
      setUserDetails(userDetailsMap);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    
    try {
      setReplyLoading(true);
      setReplyError('');
      
      const token = await AsyncStorage.getItem('jwtToken');
      const user = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      const adminId = user._id || await AsyncStorage.getItem('userID');
      
      if (!adminId) {
        setReplyError('Admin ID not found. Please log in again.');
        return;
      }
      
      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/${selectedTicket._id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: 'admin',
          senderId: adminId,
          message: reply
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send reply: ${response.status}`);
      }
      
      setReply('');
      setReplySuccess('Reply sent successfully');
      
      // Refetch tickets
      await fetchTickets();
      
      // Clear success message after 3 seconds
      setTimeout(() => setReplySuccess(''), 3000);
      
    } catch (error) {
      console.error('Reply error:', error);
      setReplyError('Failed to send reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const endpoint = newStatus === 'opened' ? 'open' : 'close';
      
      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/${ticketId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update ticket status: ${response.status}`);
      }
      
      // Refetch tickets
      await fetchTickets();
      
    } catch (error) {
      console.error('Status change error:', error);
      Alert.alert('Error', 'Failed to update ticket status. Please try again.');
    }
  };

  const handleOpenTicket = async (ticketId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/${ticketId}/open`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to open ticket: ${response.status}`);
      }
      
      // Refetch tickets
      await fetchTickets();
      
    } catch (error) {
      console.error('Open ticket error:', error);
      Alert.alert('Error', 'Failed to open ticket. Please try again.');
    }
  };

  const getTicketCounts = () => {
    const counts = { all: allTickets.length, new: 0, opened: 0, closed: 0 };
    allTickets.forEach(ticket => {
      if (counts[ticket.status] !== undefined) {
        counts[ticket.status]++;
      }
    });
    return counts;
  };

  const ticketCounts = getTicketCounts();

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(search.toLowerCase()) ||
                         ticket.number?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      {/* Blue background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* White card header */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 32,
          marginTop: 48,
          marginBottom: 32,
          marginHorizontal: 24,
          paddingVertical: 28,
          paddingHorizontal: 28,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
          zIndex: 1,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#00418b', marginBottom: 8 }}>
                Support Center
              </Text>
              <Text style={{ fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
                {formatDateTime(currentDateTime)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AProfile')}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="person" size={24} color="#00418b" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: activeTab === tab.key ? '#9575cd' : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: activeTab === tab.key ? '#fff' : '#666',
                  fontFamily: 'Poppins-Medium',
                }}>
                  {tab.label} ({ticketCounts[tab.key] || 0})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
          <View style={{ position: 'relative' }}>
            <Feather name="search" size={20} color="#999" style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 48,
                fontSize: 16,
                fontFamily: 'Poppins-Regular',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 2,
              }}
              placeholder="Search tickets by title or number..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Main Content */}
        <View style={{ marginHorizontal: 24 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
            <View style={{ flexDirection: 'row', height: 500 }}>
              {/* Left Panel - Ticket List */}
              <View style={{ width: '40%', borderRightWidth: 1, borderRightColor: '#f0f0f0' }}>
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Poppins-Bold' }}>
                    Tickets
                  </Text>
                </View>
                
                <ScrollView style={{ flex: 1 }}>
                  {loading ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <ActivityIndicator size="large" color="#9575cd" />
                      <Text style={{ marginTop: 10, color: '#666', fontFamily: 'Poppins-Regular' }}>Loading...</Text>
                    </View>
                  ) : error ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#e74c3c', fontFamily: 'Poppins-Regular' }}>{error}</Text>
                    </View>
                  ) : filteredTickets.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#666', fontFamily: 'Poppins-Regular' }}>No tickets found</Text>
                    </View>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TouchableOpacity
                        key={ticket._id}
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f0f0f0',
                          backgroundColor: selectedTicket?._id === ticket._id ? '#ede7f6' : '#fff',
                          borderLeftWidth: 4,
                          borderLeftColor: selectedTicket?._id === ticket._id ? '#9575cd' : 'transparent',
                        }}
                        onPress={() => {
                          setSelectedTicket(ticket);
                          // Auto-open new tickets
                          if (ticket.status === 'new') {
                            handleOpenTicket(ticket._id);
                          }
                        }}
                      >
                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 4, fontFamily: 'Poppins-Regular' }}>
                          {userDetails[ticket._id]?.name || 'Loading...'} ({userDetails[ticket._id]?.role || 'Unknown'})
                        </Text>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4, fontFamily: 'Poppins-Bold' }}>
                          {ticket.subject}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 2, fontFamily: 'Poppins-Regular' }}>
                          {ticket.number}
                        </Text>
                        <View style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor: ticket.status === 'new' ? '#e3f2fd' : 
                                           ticket.status === 'opened' ? '#fff3e0' : '#e8f5e8',
                        }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: ticket.status === 'new' ? '#1976d2' : 
                                   ticket.status === 'opened' ? '#f57c00' : '#388e3c',
                            fontFamily: 'Poppins-Medium',
                            textTransform: 'capitalize',
                          }}>
                            {ticket.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>

              {/* Right Panel - Ticket Details */}
              <View style={{ flex: 1, padding: 20 }}>
                {selectedTicket ? (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, fontFamily: 'Poppins-Bold' }}>
                      {selectedTicket.subject}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, color: '#9575cd', fontWeight: '600', fontFamily: 'Poppins-Medium' }}>
                        Ticket No: {selectedTicket.number} | Status: {selectedTicket.status}
                      </Text>
                    </View>

                    <View style={{ backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#2196f3' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, fontFamily: 'Poppins-Medium' }}>
                        Submitted by: {userDetails[selectedTicket._id]?.name || 'Loading...'}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular' }}>
                        Role: {userDetails[selectedTicket._id]?.role || 'Unknown'}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 16, color: '#333', marginBottom: 16, lineHeight: 24, fontFamily: 'Poppins-Regular' }}>
                      {selectedTicket.description}
                    </Text>

                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'Poppins-Bold' }}>
                        Messages:
                      </Text>
                      
                      {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                        <View style={{ gap: 12 }}>
                          {selectedTicket.messages.map((msg, idx) => (
                            <View key={idx} style={{ backgroundColor: '#f1f3f4', padding: 12, borderRadius: 8 }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, fontFamily: 'Poppins-Medium' }}>
                                {msg.sender}:
                              </Text>
                              <Text style={{ fontSize: 14, color: '#333', marginBottom: 4, fontFamily: 'Poppins-Regular' }}>
                                {msg.message}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular' }}>
                                {new Date(msg.timestamp).toLocaleString()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={{ color: '#666', fontStyle: 'italic', fontFamily: 'Poppins-Regular' }}>
                          No messages yet
                        </Text>
                      )}
                    </View>

                    {/* Reply Section */}
                    <View style={{ marginTop: 20 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'Poppins-Bold' }}>
                        Reply:
                      </Text>
                      
                      {replyError ? (
                        <Text style={{ color: '#e74c3c', marginBottom: 12, fontFamily: 'Poppins-Regular' }}>
                          {replyError}
                        </Text>
                      ) : null}
                      
                      {replySuccess ? (
                        <Text style={{ color: '#27ae60', marginBottom: 12, fontFamily: 'Poppins-Regular' }}>
                          {replySuccess}
                        </Text>
                      ) : null}
                      
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#ddd',
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 14,
                          fontFamily: 'Poppins-Regular',
                          minHeight: 80,
                          textAlignVertical: 'top',
                        }}
                        placeholder="Type your reply..."
                        value={reply}
                        onChangeText={setReply}
                        multiline
                      />
                      
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#9575cd',
                            paddingVertical: 12,
                            paddingHorizontal: 24,
                            borderRadius: 8,
                            flex: 1,
                            alignItems: 'center',
                          }}
                          onPress={handleReply}
                          disabled={replyLoading || !reply.trim()}
                        >
                          {replyLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={{ color: '#fff', fontWeight: '600', fontFamily: 'Poppins-Medium' }}>
                              Send Reply
                            </Text>
                          )}
                        </TouchableOpacity>
                        
                        {selectedTicket.status === 'new' && (
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#ff9800',
                              paddingVertical: 12,
                              paddingHorizontal: 24,
                              borderRadius: 8,
                              alignItems: 'center',
                            }}
                            onPress={() => handleOpenTicket(selectedTicket._id)}
                          >
                            <Text style={{ color: '#fff', fontWeight: '600', fontFamily: 'Poppins-Medium' }}>
                              Open Ticket
                            </Text>
                          </TouchableOpacity>
                        )}
                        
                        {selectedTicket.status === 'opened' && (
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#4caf50',
                              paddingVertical: 12,
                              paddingHorizontal: 24,
                              borderRadius: 8,
                              alignItems: 'center',
                            }}
                            onPress={() => handleStatusChange(selectedTicket._id, 'closed')}
                          >
                            <Text style={{ color: '#fff', fontWeight: '600', fontFamily: 'Poppins-Medium' }}>
                              Close Ticket
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </ScrollView>
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="support-agent" size={64} color="#ddd" />
                    <Text style={{ fontSize: 18, color: '#999', marginTop: 16, fontFamily: 'Poppins-Regular' }}>
                      Select a ticket to view details
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}