import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrincipalSupportCenter() {
  const [view, setView] = useState('main'); // main | new | myTickets
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [newTicket, setNewTicket] = useState({
    number: generateTicketNumber(),
    subject: '',
    content: '',
  });
  const [userTickets, setUserTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserTicket, setSelectedUserTicket] = useState(null);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  // Generate ticket number function
  function generateTicketNumber() {
    let num = '';
    for (let i = 0; i < 12; i++) {
      num += Math.floor(Math.random() * 10);
    }
    return `SJDD${num}`;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    if (view === 'myTickets') {
      fetchUserTickets();
    }
  }, [view, activeFilter]);

  const fetchUserTickets = async () => {
    setTicketsLoading(true);
    setTicketsError('');
    try {
      const user = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!user._id) {
        setTicketsError('User ID not found. Please log in again.');
        return;
      }

      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tickets = await response.json();
      setUserTickets(Array.isArray(tickets) ? tickets : []);
    } catch (err) {
      console.error('Error fetching user tickets:', err);
      setUserTickets([]);
      if (err.response) {
        setTicketsError('Failed to fetch tickets');
      } else if (err.request) {
        setTicketsError('Network error. Please check your connection and try again.');
      } else {
        setTicketsError('Failed to fetch tickets. Please try again.');
      }
    } finally {
      setTicketsLoading(false);
    }
  };

  const filteredTickets = userTickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || ticket.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  const mostRecentTicket = sortedTickets[0];

  const getStatusInfo = (status) => {
    switch (status) {
      case 'new':
        return {
          icon: 'schedule',
          bgColor: '#e3f2fd',
          color: '#1976d2',
          label: 'New'
        };
      case 'opened':
        return {
          icon: 'chat',
          bgColor: '#fff3e0',
          color: '#f57c00',
          label: 'Opened'
        };
      case 'closed':
        return {
          icon: 'check-circle',
          color: '#388e3c',
          label: 'Closed'
        };
      default:
        return {
          icon: 'description',
          bgColor: '#f5f5f5',
          color: '#666',
          label: status
        };
    }
  };

  const getTicketCounts = () => {
    const counts = { all: userTickets.length, new: 0, opened: 0, closed: 0 };
    userTickets.forEach(ticket => {
      if (counts[ticket.status] !== undefined) {
        counts[ticket.status]++;
      }
    });
    return counts;
  };

  const ticketCounts = getTicketCounts();

  const handleSubmit = async () => {
    if (!newTicket.subject.trim() || !newTicket.content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = await AsyncStorage.getItem('jwtToken');
      const user = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      
      if (!user._id) {
        setError('User ID not found. Please log in again.');
        return;
      }
      
      const response = await fetch('https://juanlms-webapp-server.onrender.com/api/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newTicket.subject,
          description: newTicket.content,
          userId: user._id,
          number: newTicket.number,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ticket: ${response.status}`);
      }

      // Reset form and show success
      setNewTicket({ number: generateTicketNumber(), subject: '', content: '' });
      setView('main');
      Alert.alert('Success', 'Ticket submitted successfully!');
      
    } catch (error) {
      console.error('Submit error:', error);
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleWelcomeMessage = () => {
    return `Hello, ${user?.firstname || 'Principal'}!`;
  };

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
            <TouchableOpacity onPress={() => navigation.navigate('PrincipalProfile')}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="person" size={24} color="#00418b" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main view: two buttons */}
        {view === 'main' && (
          <View style={{ marginHorizontal: 24 }}>
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8, fontFamily: 'Poppins-Bold' }}>
                {getRoleWelcomeMessage()}
              </Text>
              <Text style={{ fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
                How can we help you today?
              </Text>
            </View>
            
            <View style={{ gap: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                  paddingVertical: 20,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                }}
                onPress={() => setView('myTickets')}
              >
                <MaterialIcons name="list-alt" size={32} color="#9575cd" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', fontFamily: 'Poppins-Medium' }}>
                  View My Tickets
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                  paddingVertical: 20,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                }}
                onPress={() => setView('new')}
              >
                <MaterialIcons name="add-circle" size={32} color="#9575cd" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', fontFamily: 'Poppins-Medium' }}>
                  New Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My Tickets view */}
        {view === 'myTickets' && (
          <View style={{ marginHorizontal: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <View>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', fontFamily: 'Poppins-Bold' }}>
                  {getRoleWelcomeMessage()}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#666', fontFamily: 'Poppins-Medium' }}>
                  My Tickets
                </Text>
                <Text style={{ fontSize: 16, color: '#888', marginTop: 4, fontFamily: 'Poppins-Regular' }}>
                  {!showAllTickets ? 'View all your tickets' : 'All your tickets'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setView('main')}>
                <MaterialIcons name="arrow-back" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Filter Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 4, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
              {[
                { key: 'all', label: `All (${ticketCounts.all})` },
                { key: 'new', label: `New (${ticketCounts.new})` },
                { key: 'opened', label: `Opened (${ticketCounts.opened})` },
                { key: 'closed', label: `Closed (${ticketCounts.closed})` }
              ].map(filter => (
                <TouchableOpacity
                  key={filter.key}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: activeFilter === filter.key ? '#9575cd' : 'transparent',
                    alignItems: 'center',
                  }}
                  onPress={() => setActiveFilter(filter.key)}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeFilter === filter.key ? '#fff' : '#666',
                    fontFamily: 'Poppins-Medium',
                  }}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Bar */}
            <View style={{ marginBottom: 20 }}>
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
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>
            </View>

            {/* Sort Controls - Only show when viewing all tickets */}
            {showAllTickets && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 14, color: '#666', fontFamily: 'Poppins-Regular' }}>Sort by:</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }}>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: sortOrder === 'newest' ? '#9575cd' : 'transparent',
                        borderRadius: 8,
                      }}
                      onPress={() => setSortOrder('newest')}
                    >
                      <Text style={{
                        fontSize: 12,
                        color: sortOrder === 'newest' ? '#fff' : '#666',
                        fontFamily: 'Poppins-Medium',
                      }}>
                        Newest First
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }}>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: sortOrder === 'oldest' ? '#9575cd' : 'transparent',
                        borderRadius: 8,
                      }}
                      onPress={() => setSortOrder('oldest')}
                    >
                      <Text style={{
                        fontSize: 12,
                        color: sortOrder === 'oldest' ? '#fff' : '#666',
                        fontFamily: 'Poppins-Medium',
                      }}>
                        Oldest First
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                  onPress={() => setShowAllTickets(false)}
                >
                  <Text style={{ fontSize: 14, color: '#9575cd', textDecorationLine: 'underline', fontFamily: 'Poppins-Medium' }}>
                    Show Summary
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tickets List */}
            <View style={{ flex: 1 }}>
              {ticketsLoading ? (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <ActivityIndicator size="large" color="#9575cd" />
                  <Text style={{ marginTop: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
                    Loading your tickets...
                  </Text>
                </View>
              ) : ticketsError ? (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Text style={{ color: '#e74c3c', fontFamily: 'Poppins-Regular' }}>{ticketsError}</Text>
                </View>
              ) : !showAllTickets && mostRecentTicket ? (
                // Show most recent ticket with option to view all
                <View style={{ gap: 16 }}>
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
                      Your most recent ticket:
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 20,
                      borderWidth: 2,
                      borderColor: selectedUserTicket === mostRecentTicket._id ? '#9575cd' : 'transparent',
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      elevation: 3,
                    }}
                    onPress={() => setSelectedUserTicket(selectedUserTicket === mostRecentTicket._id ? null : mostRecentTicket._id)}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, fontFamily: 'Poppins-Bold' }}>
                        {mostRecentTicket.subject}
                      </Text>
                      <View style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: getStatusInfo(mostRecentTicket.status).bgColor || '#f5f5f5',
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: getStatusInfo(mostRecentTicket.status).color,
                          fontFamily: 'Poppins-Medium',
                          textTransform: 'capitalize',
                        }}>
                          {mostRecentTicket.status}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 8, fontFamily: 'Poppins-Regular' }}>
                      #{mostRecentTicket.number}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#888', fontFamily: 'Poppins-Regular' }}>
                      {new Date(mostRecentTicket.createdAt).toLocaleDateString()}
                    </Text>
                    
                    {/* Expanded ticket details */}
                    {selectedUserTicket === mostRecentTicket._id && (
                      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' }}>
                        <Text style={{ fontSize: 16, color: '#333', marginBottom: 12, lineHeight: 24, fontFamily: 'Poppins-Regular' }}>
                          {mostRecentTicket.description}
                        </Text>
                        {mostRecentTicket.messages && mostRecentTicket.messages.length > 1 && (
                          <Text style={{ fontSize: 14, color: '#666', fontFamily: 'Poppins-Regular' }}>
                            {mostRecentTicket.messages.length - 1} response{mostRecentTicket.messages.length > 2 ? 's' : ''} from support
                          </Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {/* View All Tickets Button */}
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: '#e0e0e0',
                    }}
                    onPress={() => setShowAllTickets(true)}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', fontFamily: 'Poppins-Medium' }}>
                      View All Tickets ({userTickets.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Show all tickets
                <View style={{ gap: 16 }}>
                  {sortedTickets.map(ticket => {
                    const statusInfo = getStatusInfo(ticket.status);
                    return (
                      <TouchableOpacity
                        key={ticket._id}
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: 16,
                          padding: 20,
                          borderWidth: 2,
                          borderColor: selectedUserTicket === ticket._id ? '#9575cd' : 'transparent',
                          shadowColor: '#000',
                          shadowOpacity: 0.05,
                          shadowRadius: 10,
                          elevation: 3,
                        }}
                        onPress={() => setSelectedUserTicket(selectedUserTicket === ticket._id ? null : ticket._id)}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, fontFamily: 'Poppins-Bold' }}>
                            {ticket.subject}
                          </Text>
                          <View style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            backgroundColor: statusInfo.bgColor || '#f5f5f5',
                          }}>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: statusInfo.color,
                              fontFamily: 'Poppins-Medium',
                              textTransform: 'capitalize',
                            }}>
                              {ticket.status}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8, fontFamily: 'Poppins-Regular' }}>
                          #{ticket.number}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#888', fontFamily: 'Poppins-Regular' }}>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </Text>
                        
                        {/* Expanded ticket details */}
                        {selectedUserTicket === ticket._id && (
                          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' }}>
                            <Text style={{ fontSize: 16, color: '#333', marginBottom: 12, lineHeight: 24, fontFamily: 'Poppins-Regular' }}>
                              {ticket.description}
                            </Text>
                            {ticket.messages && ticket.messages.length > 1 && (
                              <Text style={{ fontSize: 14, color: '#666', fontFamily: 'Poppins-Regular' }}>
                                {ticket.messages.length - 1} response{ticket.messages.length > 2 ? 's' : ''} from support
                              </Text>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* New Ticket view */}
        {view === 'new' && (
          <View style={{ marginHorizontal: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', fontFamily: 'Poppins-Bold' }}>
                New Support Request
              </Text>
              <TouchableOpacity onPress={() => setView('main')}>
                <MaterialIcons name="arrow-back" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, fontFamily: 'Poppins-Medium' }}>
                Ticket Number: {newTicket.number}
              </Text>
              
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 20, fontFamily: 'Poppins-Medium' }}>
                Subject:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  fontFamily: 'Poppins-Regular',
                  marginBottom: 20,
                }}
                placeholder="Enter subject..."
                value={newTicket.subject}
                onChangeText={(text) => setNewTicket({ ...newTicket, subject: text })}
              />
              
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, fontFamily: 'Poppins-Medium' }}>
                Description:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  fontFamily: 'Poppins-Regular',
                  minHeight: 120,
                  textAlignVertical: 'top',
                  marginBottom: 24,
                }}
                placeholder="Describe your issue or request..."
                value={newTicket.content}
                onChangeText={(text) => setNewTicket({ ...newTicket, content: text })}
                multiline
              />
              
              {error ? (
                <Text style={{ color: '#e74c3c', marginBottom: 16, fontFamily: 'Poppins-Regular' }}>
                  {error}
                </Text>
              ) : null}
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#9575cd',
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: loading ? 0.7 : 1,
                }}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', fontFamily: 'Poppins-Medium' }}>
                    Submit Ticket
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


