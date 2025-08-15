import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useNavigation } from '@react-navigation/native';

const TABS = [
  { key: 'new', label: 'New Tickets' },
  { key: 'opened', label: 'Opened Tickets' },
  { key: 'closed', label: 'Closed Tickets' },
];

export default function AdminSupportCenter() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('new');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [tickets, setTickets] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const s = io('https://juanlms-webapp-server.onrender.com');
    setSocket(s);
    s.on('new_ticket', (ticket) => fetchTickets());
    s.on('ticket_reply', (ticket) => fetchTickets());
    s.on('ticket_status', (ticket) => fetchTickets());
    fetchTickets();
    return () => s.disconnect();
  }, [activeTab]);

  const fetchTickets = async () => {
    const res = await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets?status=${activeTab}`);
    const data = await res.json();
    setTickets(data);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicket) {
      setSelectedTicket(tickets[0]);
    }
    if (tickets.length === 0) {
      setSelectedTicket(null);
    }
  }, [tickets]);

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
            <View>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 22, color: '#222' }}>Support Center</Text>
              <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 13, marginTop: 2 }}>{formatDateTime(currentDateTime)}</Text>
            </View>
            {/* Touchable profile icon */}
            <TouchableOpacity
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#e3eefd', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => navigation.navigate('AProfile')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="person" size={26} color="#b0b0b0" />
            </TouchableOpacity>
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

        {/* Ticket Dropdown (make dropdown scrollable) */}
        {tickets.length > 0 ? (
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
                <Text style={{ color: '#1a237e', fontWeight: 'bold', fontSize: 17 }}>Ticket No.: {selectedTicket?.number || selectedTicket?._id}</Text>
                <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 16 }}>{selectedTicket?.subject}</Text>
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
                maxHeight: 250,
              }}>
                <ScrollView style={{ maxHeight: 250 }}>
                  {tickets.map((ticket, idx) => (
                    <TouchableOpacity
                      key={ticket._id}
                      style={{ padding: 16, borderBottomWidth: idx !== tickets.length - 1 ? 1 : 0, borderBottomColor: '#eee' }}
                      onPress={() => { setSelectedTicket(ticket); setDropdownOpen(false); }}
                    >
                      <Text style={{ color: '#1a237e', fontWeight: 'bold', fontSize: 16 }}>Ticket No.: {ticket.number || ticket._id}</Text>
                      <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 15 }}>{ticket.subject}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ textAlign: 'center', color: '#888', marginVertical: 24 }}>No tickets found for this tab.</Text>
        )}

        {/* Ticket Details Card */}
        {selectedTicket && dropdownOpen === false && (
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
              <Text style={{ color: '#1a237e', fontWeight: 'bold', fontSize: 17 }}>Ticket No.: {selectedTicket?.number || selectedTicket?._id}</Text>
            </View>
            <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>{selectedTicket?.subject}</Text>
            <Text style={{ color: '#888', fontSize: 14, marginBottom: 14 }}>{selectedTicket?.description}</Text>
            {/* Status Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
              {activeTab === 'opened' && (
                <>
                  <TouchableOpacity
                    style={{ backgroundColor: '#00418b', borderRadius: 8, padding: 10, marginRight: 8 }}
                    onPress={async () => {
                      await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/${selectedTicket._id}/close`, { method: 'POST' });
                      setSelectedTicket(null);
                      fetchTickets();
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Problem Solved</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 2, borderColor: '#00418b' }}
                    onPress={async () => {
                      await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/${selectedTicket._id}/open`, { method: 'POST' });
                      setSelectedTicket(null);
                      fetchTickets();
                    }}
                  >
                    <Text style={{ color: '#00418b', fontWeight: 'bold' }}>In Progress</Text>
                  </TouchableOpacity>
                </>
              )}
              {/* In closed tab, show only In Progress and Delete */}
              {activeTab === 'closed' && (
                <>
                  <TouchableOpacity
                    style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 2, borderColor: '#00418b' }}
                    onPress={async () => {
                      await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/${selectedTicket._id}/open`, { method: 'POST' });
                      setSelectedTicket(null);
                      fetchTickets();
                    }}
                  >
                    <Text style={{ color: '#00418b', fontWeight: 'bold' }}>In Progress</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#d32f2f', borderRadius: 8, padding: 10, marginLeft: 8 }}
                    onPress={async () => {
                      const confirmed = window.confirm('Are you sure you want to delete this ticket?');
                      if (confirmed) {
                        await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/${selectedTicket._id}`, { method: 'DELETE' });
                        setSelectedTicket(null);
                        fetchTickets();
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            {/* 30-day retention message for closed tickets */}
            {activeTab === 'closed' && (
              <Text style={{ color: '#d32f2f', fontSize: 13, marginBottom: 8 }}>
                This ticket will be permanently deleted after 30 days in closed status.
              </Text>
            )}
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
              <TouchableOpacity onPress={async () => {
                if (!reply.trim()) return;
                await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/${selectedTicket._id}/reply`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sender: 'admin', senderId: 'ADMIN_ID', message: reply })
                });
                setReply('');
                fetchTickets();
              }}>
                <Feather name="send" size={22} color="#00418b" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}