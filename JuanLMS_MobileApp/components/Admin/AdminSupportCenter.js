import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';

const TABS = [
  { label: 'All Tickets', key: 'all' },
  { label: 'Opened Tickets', key: 'opened' },
  { label: 'Closed Tickets', key: 'closed' },
];

const MOCK_TICKETS = [
  {
    number: 'TCKT-001',
    sender: 'John Doe',
    subject: 'Login Issue',
    description: 'Cannot login to the system.',
    status: 'opened',
    user: 'John Doe',
  },
  {
    number: 'TCKT-002',
    sender: 'Jane Smith',
    subject: 'Bug Report',
    description: 'Found a bug in the calendar.',
    status: 'closed',
    user: 'Jane Smith',
  },
];

export default function AdminSupportCenter() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(MOCK_TICKETS[0]);
  const [reply, setReply] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Filter tickets by tab and search
  const filteredTickets = MOCK_TICKETS.filter(t =>
    (activeTab === 'all' || t.status === activeTab) &&
    (t.number.toLowerCase().includes(search.toLowerCase()) ||
      t.sender.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()))
  );

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
            <View>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 22, color: '#222' }}>Support Center</Text>
              <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 13, marginTop: 2 }}>{formatDateTime(currentDateTime)}</Text>
            </View>
            {/* Gray circle for profile icon */}
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#e3eefd', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="person" size={26} color="#b0b0b0" />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: 32,
          marginTop: 10,
          marginBottom: 18,
          gap: 8,
          backgroundColor: 'transparent',
        }}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                backgroundColor: activeTab === tab.key ? '#00418b' : '#e3eefd',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 12,
                minWidth: 90,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: activeTab === tab.key ? '#00418b' : '#e3eefd',
                shadowColor: '#00418b',
                shadowOpacity: 0.18,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 5,
                marginHorizontal: 2,
              }}
            >
              <Text style={{ color: activeTab === tab.key ? '#fff' : '#00418b', fontFamily: 'Poppins-Bold', fontSize: 13 }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Bar */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <TextInput
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 13,
              borderWidth: 0,
              fontSize: 15,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
            placeholder="Search."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Ticket Dropdown */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 18,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={{ color: '#1a237e', fontWeight: 'bold', fontSize: 17 }}>Ticket No.</Text>
              <Text style={{ color: '#888', fontSize: 14 }}>{selectedTicket.sender}</Text>
            </View>
            <MaterialIcons name={dropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={28} color="#00418b" />
          </TouchableOpacity>
          {dropdownOpen && (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              marginTop: 2,
              shadowColor: '#000',
              shadowOpacity: 0.10,
              shadowRadius: 8,
              elevation: 4,
            }}>
              {filteredTickets.map((ticket, idx) => (
                <TouchableOpacity
                  key={ticket.number}
                  style={{ padding: 16, borderBottomWidth: idx !== filteredTickets.length - 1 ? 1 : 0, borderBottomColor: '#eee' }}
                  onPress={() => { setSelectedTicket(ticket); setDropdownOpen(false); }}
                >
                  <Text style={{ color: '#1a237e', fontWeight: 'bold', fontSize: 16 }}>{ticket.number}</Text>
                  <Text style={{ color: '#888', fontSize: 14 }}>{ticket.sender}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Ticket Details Card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          marginHorizontal: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOpacity: 0.10,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
          marginBottom: 18,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#1a237e', fontWeight: 'bold', fontSize: 17 }}>Ticket</Text>
            <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 13 }}>User that sent the ticket</Text>
          </View>
          <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>{selectedTicket.subject}</Text>
          <Text style={{ color: '#888', fontSize: 14, marginBottom: 14 }}>{selectedTicket.description}</Text>
          {/* Reply input */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: '#00418b',
            borderRadius: 22,
            paddingHorizontal: 12,
            marginTop: 10,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}>
            <TextInput
              style={{ flex: 1, height: 38, fontSize: 15, color: '#222', backgroundColor: 'transparent' }}
              placeholder="Reply"
              placeholderTextColor="#888"
              value={reply}
              onChangeText={setReply}
            />
            <TouchableOpacity onPress={() => setReply('')}>
              <Feather name="send" size={22} color="#00418b" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}