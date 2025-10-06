import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
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
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
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
  const [view, setView] = useState('list'); // 'list' or 'detail'
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

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicket) {
      setSelectedTicket(tickets[0]);
    }
    if (tickets.length === 0) {
      setSelectedTicket(null);
    }
  }, [tickets]);

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
      
      // Debug: Log the ticket data structure
      console.log('Tickets fetched:', ticketsData);
      if (ticketsData.length > 0) {
        console.log('Sample ticket structure:', ticketsData[0]);
        console.log('Sample ticket keys:', Object.keys(ticketsData[0]));
      }
      
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
      
      // Debug: Log the tickets to see their structure
      console.log('Tickets to fetch user details for:', tickets);
      
      // Try multiple possible user ID fields and API endpoints
      const userDetailsMap = {};
      
      for (const ticket of tickets) {
        console.log('Processing ticket:', ticket._id, 'with fields:', Object.keys(ticket));
        
        // Check multiple possible user ID fields
        const possibleUserIdFields = ['userId', 'userID', 'user_id', 'createdBy', 'author'];
        let userId = null;
        
        for (const field of possibleUserIdFields) {
          if (ticket[field]) {
            userId = ticket[field];
            console.log(`Found userId in field '${field}':`, userId);
            break;
          }
        }
        
        // Also check if user details are already embedded in the ticket
        if (ticket.user && ticket.user.firstname && ticket.user.lastname) {
          console.log('User details found embedded in ticket:', ticket.user);
          userDetailsMap[ticket._id] = {
            name: `${ticket.user.firstname || ''} ${ticket.user.lastname || ''}`.trim() || 'Unknown User',
            role: ticket.user.role || 'Unknown'
          };
          continue;
        }
        
        if (ticket.userDetails && ticket.userDetails.firstname && ticket.userDetails.lastname) {
          console.log('User details found in userDetails field:', ticket.userDetails);
          userDetailsMap[ticket._id] = {
            name: `${ticket.userDetails.firstname || ''} ${ticket.userDetails.lastname || ''}`.trim() || 'Unknown User',
            role: ticket.userDetails.role || 'Unknown'
          };
          continue;
        }
        
        if (!userId) {
          console.log('No userId found in ticket:', ticket);
          userDetailsMap[ticket._id] = {
            name: 'No User ID Found',
            role: 'Unknown'
          };
          continue;
        }
        
        // Use the same approach as the web version
        try {
          const response = await fetch('https://juanlms-webapp-server.onrender.com/users', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const allUsers = await response.json();
            // Handle the same data structure as web version
            const users = Array.isArray(allUsers) ? allUsers : allUsers.users || [];
            console.log('Users from /users endpoint:', users.length);
            
            // Create a map for quick lookup - map by both _id and userID like web version
            const userMap = {};
            users.forEach(user => {
              if (user._id) {
                userMap[user._id] = {
                  name: `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Unknown User',
                  role: user.role || 'Unknown'
                };
              }
              // Also map by userID (string identifier) as fallback - this is key!
              if (user.userID) {
                userMap[user.userID] = {
                  name: `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Unknown User',
                  role: user.role || 'Unknown'
                };
              }
            });
            
            console.log('User map created:', userMap);
            console.log('Looking for userId:', userId);
            console.log('Available keys in userMap:', Object.keys(userMap));
            
            // Try to find user by userId (MongoDB ObjectId) first
            let userDetails = userMap[userId];
            console.log('User found by userId:', userDetails);
            
            // If not found by ObjectId, try by userID (string identifier)
            if (!userDetails) {
              userDetails = userMap[userId];
              console.log('User found by userID fallback:', userDetails);
            }
            
            if (userDetails) {
              console.log('Found user in /users:', userDetails);
              userDetailsMap[ticket._id] = userDetails;
            } else {
              console.log('User not found for ID:', userId);
              userDetailsMap[ticket._id] = {
                name: 'User Not Found',
                role: 'Unknown'
              };
            }
          } else {
            console.log('Failed to fetch users, status:', response.status);
            userDetailsMap[ticket._id] = {
              name: 'Failed to Load Users',
              role: 'Unknown'
            };
          }
        } catch (error) {
          console.log('Error fetching users:', error);
          userDetailsMap[ticket._id] = {
            name: 'Error Loading Users',
            role: 'Unknown'
          };
        }
      }
      
      console.log('Final userDetailsMap:', userDetailsMap);
      setUserDetails(userDetailsMap);
      
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
      
      // Refetch tickets and go back to list view
      await fetchTickets();
      setView('list');
      
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
      
      // Refetch tickets and go back to list view
      await fetchTickets();
      setView('list');
      
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

  // Sort and filter tickets
  const sortedTickets = [...tickets].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return sortOrder === 'newest' ? (dateB - dateA) : (dateA - dateB);
  });

  const filteredTickets = sortedTickets.filter(ticket => {
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

  // Ticket List View
  if (view === 'list') {
  return (
    <View style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      {/* Blue background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
        
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 32 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchTickets}
              colors={['#9575cd']}
              tintColor="#9575cd"
            />
          }
        >
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
                <Text style={{ fontSize: 14, color: '#666', fontFamily: 'Poppins-Regular' }}>
                  {ticketCounts.all} total tickets
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

        {/* Sort Controls + Search Bar */}
          <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
            {/* Sort controls */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setSortOrder('newest')}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderTopLeftRadius: 8,
                  borderBottomLeftRadius: 8,
                  backgroundColor: sortOrder === 'newest' ? '#9575cd' : '#fff',
                  borderWidth: 1,
                  borderColor: '#ddd'
                }}
              >
                <Text style={{ color: sortOrder === 'newest' ? '#fff' : '#333', fontFamily: 'Poppins-Medium' }}>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSortOrder('oldest')}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                  backgroundColor: sortOrder === 'oldest' ? '#9575cd' : '#fff',
                  borderWidth: 1,
                  borderLeftWidth: 0,
                  borderColor: '#ddd'
                }}
              >
                <Text style={{ color: sortOrder === 'oldest' ? '#fff' : '#333', fontFamily: 'Poppins-Medium' }}>Oldest</Text>
              </TouchableOpacity>
            </View>

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

          {/* Tickets List */}
          <View style={{ marginHorizontal: 24 }}>
            {loading ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color="#9575cd" />
                <Text style={{ marginTop: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
                  Loading tickets...
                </Text>
              </View>
            ) : error ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ color: '#e74c3c', fontFamily: 'Poppins-Regular' }}>{error}</Text>
              </View>
            ) : filteredTickets.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <MaterialIcons name="support-agent" size={64} color="#ddd" />
                <Text style={{ fontSize: 18, color: '#999', marginTop: 16, fontFamily: 'Poppins-Regular' }}>
                  {search ? 'No tickets match your search' : 'No tickets found'}
                </Text>
                {search && (
                    <TouchableOpacity
                    onPress={() => setSearch('')}
                    style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#9575cd', borderRadius: 8 }}
                    >
                    <Text style={{ color: '#fff', fontFamily: 'Poppins-Medium' }}>Clear Search</Text>
                    </TouchableOpacity>
            )}
          </View>
        ) : (
              <View style={{ gap: 16 }}>
                {filteredTickets.map((ticket) => (
                  <TouchableOpacity
                    key={ticket._id}
                    style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
                      shadowOpacity: 0.05,
            shadowRadius: 10,
                      elevation: 3,
                      borderWidth: 2,
                      borderColor: 'transparent',
                    }}
                    onPress={() => {
                      setSelectedTicket(ticket);
                      setView('detail');
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4, fontFamily: 'Poppins-Bold' }}>
                          {ticket.subject}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 4, fontFamily: 'Poppins-Regular' }}>
                          {userDetails[ticket._id]?.name || 'Loading...'} ({userDetails[ticket._id]?.role || 'Unknown'})
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular' }}>
                          #{ticket.number}
                        </Text>

                      </View>
                      <View style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
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
                    </View>
                    
                    <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, fontFamily: 'Poppins-Regular' }} numberOfLines={2}>
                      {ticket.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Floating Action Button for Future Use */}
                  <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#9575cd',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
          onPress={() => {
            // Future: Add new ticket functionality
            Alert.alert('Info', 'New ticket creation coming soon!');
          }}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Ticket Detail View
  if (view === 'detail' && selectedTicket) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
        {/* Header with back button */}
        <View style={{ 
          backgroundColor: '#00418b', 
          paddingTop: 48, 
          paddingBottom: 20, 
          paddingHorizontal: 24,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setView('list')} style={{ marginRight: 16 }}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', fontFamily: 'Poppins-Bold' }}>
              Ticket Details
            </Text>
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1, padding: 24 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchTickets}
              colors={['#9575cd']}
              tintColor="#9575cd"
            />
          }
        >
          {/* Ticket Info Card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'Poppins-Bold' }}>
              {selectedTicket.subject}
            </Text>
            
            <View style={{ marginBottom: 16 }}>
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

            <Text style={{ fontSize: 16, color: '#333', lineHeight: 24, fontFamily: 'Poppins-Regular' }}>
              {selectedTicket.description}
            </Text>
          </View>



          {/* Messages Section */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16, fontFamily: 'Poppins-Bold' }}>
              Messages
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
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'Poppins-Bold' }}>
              Reply
            </Text>
            
            {selectedTicket.status === 'closed' && (
              <View style={{ backgroundColor: '#fff3e0', borderColor: '#ffcc80', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ color: '#f57c00', fontFamily: 'Poppins-Regular' }}>
                  This ticket is closed. Replies are disabled.
                </Text>
              </View>
            )}
            
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
                marginBottom: 16,
                backgroundColor: selectedTicket.status === 'closed' ? '#f5f5f5' : '#fff'
              }}
              placeholder="Type your reply..."
                value={reply}
                onChangeText={setReply}
              multiline
              editable={selectedTicket.status !== 'closed'}
            />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#9575cd',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                  opacity: selectedTicket.status === 'closed' ? 0.5 : 1
                }}
                onPress={handleReply}
                disabled={replyLoading || !reply.trim() || selectedTicket.status === 'closed'}
              >
                {replyLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600', fontFamily: 'Poppins-Medium' }}>
                    Send Reply
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16, fontFamily: 'Poppins-Bold' }}>
              Actions
            </Text>
            
            <View style={{ gap: 12 }}>
              {selectedTicket.status === 'new' && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#ff9800',
                    paddingVertical: 16,
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
                    paddingVertical: 16,
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
        
        {/* Floating Action Button to go back to list */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#9575cd',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
          onPress={() => setView('list')}
        >
          <MaterialIcons name="list" size={24} color="#fff" />
        </TouchableOpacity>
    </View>
  );
  }

  return null;
}