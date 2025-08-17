import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VPESupportCenter() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [view, setView] = useState('main'); // 'main', 'new', 'myTickets'
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (view === 'myTickets') {
      fetchMyTickets();
    }
  }, [view, activeTab, sortBy]);

  const generateTicketNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SJDD${timestamp}${random}`;
  };

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await AsyncStorage.getItem('jwtToken');
      const user = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      const userId = user._id || await AsyncStorage.getItem('userID');
      
      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }

      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/user/${userId}`, {
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
      
      // Filter by status
      let filteredTickets = ticketsData;
      if (activeTab !== 'all') {
        filteredTickets = ticketsData.filter(ticket => ticket.status === activeTab);
      }
      
      // Sort tickets
      filteredTickets.sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp);
      } else {
          return new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp);
      }
      });
      
      setTickets(filteredTickets);
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to fetch tickets. Please try again.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in both subject and content fields.');
      return;
    }

    try {
      setSubmitting(true);
      
      const token = await AsyncStorage.getItem('jwtToken');
      const user = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      const userId = user._id || await AsyncStorage.getItem('userID');
      
      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        return;
      }

      const ticketData = {
        subject: subject.trim(),
        description: content.trim(),
        userId: userId,
        number: generateTicketNumber(),
        status: 'new'
      };

      const response = await fetch('https://juanlms-webapp-server.onrender.com/api/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit ticket: ${response.status}`);
      }

      // Clear form and redirect to My Tickets immediately
      setSubject('');
      setContent('');
      setView('myTickets');
      
    } catch (error) {
      console.error('Submit ticket error:', error);
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#1976d2';
      case 'opened': return '#f57c00';
      case 'closed': return '#388e3c';
      default: return '#666';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'new': return '#e3f2fd';
      case 'opened': return '#fff3e0';
      case 'closed': return '#e8f5e8';
      default: return '#f5f5f5';
    }
  };

  // Main View
  if (view === 'main') {
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="arrow-back" size={24} color="#00418b" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('VPEProfile')}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="person" size={24} color="#00418b" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
      </View>
      
          {/* Welcome Section */}
          <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, fontFamily: 'Poppins-Bold' }}>
                Hello, VPE!
              </Text>
              <Text style={{ fontSize: 16, color: '#666', lineHeight: 24, fontFamily: 'Poppins-Regular' }}>
                Need assistance with academic matters or technical support? We're here to help you excel.
        </Text>
        </View>
      </View>

          {/* Quick Actions */}
          <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
        <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#9575cd',
                  borderRadius: 16,
                  paddingVertical: 20,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                onPress={() => setView('new')}
              >
                <MaterialIcons name="add-circle" size={32} color="#fff" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Poppins-Medium' }}>
                  New Ticket
          </Text>
        </TouchableOpacity>
              
        <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  paddingVertical: 20,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#9575cd',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={() => setView('myTickets')}
              >
                <MaterialIcons name="list-alt" size={32} color="#9575cd" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#9575cd', fontFamily: 'Poppins-Medium' }}>
                  My Tickets
          </Text>
        </TouchableOpacity>
            </View>
          </View>

          {/* Recent Ticket Summary */}
          <View style={{ marginHorizontal: 24 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Poppins-Bold' }}>
                  Recent Activity
                </Text>
                <TouchableOpacity onPress={() => setView('myTickets')}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#9575cd', marginRight: 4, fontFamily: 'Poppins-Medium' }}>
                      View All
          </Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#9575cd" />
                  </View>
        </TouchableOpacity>
      </View>

              <Text style={{ fontSize: 14, color: '#666', fontFamily: 'Poppins-Regular' }}>
                Check your ticket status and get updates on ongoing support requests.
            </Text>
          </View>
          </View>
      </ScrollView>
      </View>
    );
  }

  // New Ticket View
  if (view === 'new') {
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
            <TouchableOpacity onPress={() => setView('main')} style={{ marginRight: 16 }}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', fontFamily: 'Poppins-Bold' }}>
              Submit New Ticket
            </Text>
          </View>
            </View>

        <ScrollView style={{ flex: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'Poppins-Bold' }}>
              Subject
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                fontFamily: 'Poppins-Regular',
                backgroundColor: '#fafafa',
              }}
              placeholder="Brief description of your issue..."
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
            <Text style={{ fontSize: 12, color: '#999', marginTop: 8, textAlign: 'right', fontFamily: 'Poppins-Regular' }}>
              {subject.length}/100
            </Text>
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'Poppins-Bold' }}>
              Description
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                fontFamily: 'Poppins-Regular',
                minHeight: 120,
                textAlignVertical: 'top',
                backgroundColor: '#fafafa',
              }}
              placeholder="Please provide detailed information about your issue..."
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
            />
            <Text style={{ fontSize: 12, color: '#999', marginTop: 8, textAlign: 'right', fontFamily: 'Poppins-Regular' }}>
              {content.length}/500
            </Text>
          </View>

                    <TouchableOpacity
            style={{
              backgroundColor: submitting ? '#ccc' : '#9575cd',
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
            onPress={handleSubmitTicket}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff', fontFamily: 'Poppins-Medium' }}>
                Submit Ticket
                      </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // My Tickets View
  if (view === 'myTickets') {
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
            <TouchableOpacity onPress={() => setView('main')} style={{ marginRight: 16 }}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', fontFamily: 'Poppins-Bold' }}>
              My Tickets
            </Text>
                </View>
              </View>

        <ScrollView style={{ flex: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
          {/* Filter Tabs */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
              {['all', 'new', 'opened', 'closed'].map((tab) => (
                    <TouchableOpacity
                  key={tab}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: activeTab === tab ? '#9575cd' : 'transparent',
                    alignItems: 'center',
                  }}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeTab === tab ? '#fff' : '#666',
                    fontFamily: 'Poppins-Medium',
                    textTransform: 'capitalize',
                  }}>
                    {tab}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

          {/* Sort Options */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, fontFamily: 'Poppins-Bold' }}>
                Sort By
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    backgroundColor: sortBy === 'newest' ? '#9575cd' : '#f0f0f0',
                  }}
                  onPress={() => setSortBy('newest')}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: sortBy === 'newest' ? '#fff' : '#666',
                    fontFamily: 'Poppins-Medium',
                  }}>
                    Newest First
                  </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    backgroundColor: sortBy === 'oldest' ? '#9575cd' : '#f0f0f0',
                  }}
                  onPress={() => setSortBy('oldest')}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: sortBy === 'oldest' ? '#fff' : '#666',
                    fontFamily: 'Poppins-Medium',
                  }}>
                    Oldest First
                  </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

          {/* Search Bar */}
          <View style={{ marginBottom: 24 }}>
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
                placeholder="Search tickets by subject or number..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {/* Tickets List */}
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
          ) : tickets.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <MaterialIcons name="support-agent" size={64} color="#ddd" />
              <Text style={{ fontSize: 18, color: '#999', marginTop: 16, fontFamily: 'Poppins-Regular' }}>
                No tickets found
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {tickets
                .filter(ticket => 
                  ticket.subject?.toLowerCase().includes(search.toLowerCase()) ||
                  ticket.number?.toLowerCase().includes(search.toLowerCase())
                )
                .map((ticket) => (
                  <View
                    key={ticket._id}
                    style={{
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      elevation: 3,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4, fontFamily: 'Poppins-Bold' }}>
                          {ticket.subject}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 4, fontFamily: 'Poppins-Regular' }}>
                          #{ticket.number}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular' }}>
                          {new Date(ticket.createdAt || ticket.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: getStatusBgColor(ticket.status),
                      }}>
                        <Text style={{
                          fontSize: 12,
    fontWeight: '600',
                          color: getStatusColor(ticket.status),
                          fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
                        }}>
                          {ticket.status}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, fontFamily: 'Poppins-Regular' }} numberOfLines={3}>
                      {ticket.description}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return null;
}
