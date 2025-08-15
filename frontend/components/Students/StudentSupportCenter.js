import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Animated, Easing, Platform, Dimensions, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import StudentSupportStyle from '../styles/Stud/StudentSupportStyle';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const commonQuestions = [
  { question: 'How do I reset my password?', answer: 'Go to settings and select "Reset Password".' },
  { question: 'How do I contact support?', answer: 'You can submit a ticket here or email support@juanlms.com.' },
  { question: 'Where can I find my grades?', answer: 'Grades are available in the Grades section of your dashboard.' },
  { question: 'How do I update my profile?', answer: 'Go to your profile and tap the edit button.' },
  { question: 'How do I join a class?', answer: 'Ask your instructor for a class code and enter it in the Join Class section.' },
  { question: "Why can't I see my modules?", answer: 'Modules are visible only after your instructor publishes them.' },
  { question: 'How do I submit assignments?', answer: 'Go to the Activities tab, select the assignment, and upload your file.' },
];

function generateTicketNumber() {
  const randomNum = Math.floor(1000000000 + Math.random() * 9000000000); // 10 digits
  return `SJDD${randomNum}`;
}

const QA_HEIGHT = 90; // Height of each Q&A item in the scroll view

const TABS = [
  { key: 'opened', label: 'Opened Tickets' },
  { key: 'closed', label: 'Closed Tickets' },
];

export default function StudentSupportCenter() {
  const navigation = useNavigation();
  const [ticket, setTicket] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [overlayIndex, setOverlayIndex] = useState(null); // For overlay Q&A
  const timerRef = useRef();
  const resumeTimeout = useRef();
  const [activeTicketInput, setActiveTicketInput] = useState('');
  const [ticketLookupModal, setTicketLookupModal] = useState({ visible: false, found: false, ticket: null });
  const [subject, setSubject] = useState('');
  const [activeTab, setActiveTab] = useState('opened');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSendTicket = () => {
    const newTicketNumber = generateTicketNumber();
    setTicketNumber(newTicketNumber);
    setModalVisible(true);
    setTicket('');
  };

  // Auto-scroll animation
  useEffect(() => {
    if (overlayIndex !== null) return; // Pause if overlay is open
    let isMounted = true;
    function scrollToNext() {
      if (!isMounted || isPaused) return;
      const nextIndex = (currentIndex + 1) % commonQuestions.length;
      Animated.timing(scrollY, {
        toValue: nextIndex * QA_HEIGHT,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(nextIndex);
        if (!isPaused && isMounted) {
          timerRef.current = setTimeout(scrollToNext, 2000);
        }
      });
    }
    timerRef.current = setTimeout(scrollToNext, 2000);
    return () => {
      isMounted = false;
      clearTimeout(timerRef.current);
    };
  }, [isPaused, overlayIndex, currentIndex]);

  // When a question is pressed from dropdown
  const handleSelectQuestion = (idx) => {
    setOverlayIndex(idx);
    setIsPaused(true);
    setShowDropdown(false);
    // Start 30s timer to resume
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      setOverlayIndex(null);
      setIsPaused(false);
    }, 30000);
  };

  // Resume animation if user closes the overlay
  const handleCloseOverlay = () => {
    setOverlayIndex(null);
    setIsPaused(false);
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  };

  // Handlers for hover/touch (pause/resume auto-scroll)
  const handlePause = () => setIsPaused(true);
  const handleResume = () => { if (overlayIndex === null) setIsPaused(false); };

  // Web: onMouseEnter/onMouseLeave, Mobile: onPressIn/onPressOut
  const answerBoxProps = Platform.OS === 'web'
    ? { onMouseEnter: handlePause, onMouseLeave: handleResume }
    : { onPressIn: handlePause, onPressOut: handleResume };

  const handleCheckTicket = async () => {
    setSearching(true);
    const ticketNumber = activeTicketInput.trim();
    if (!ticketNumber) return;
    const token = await AsyncStorage.getItem('jwtToken');
    const res = await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/number/${ticketNumber}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const ticket = await res.json();
      setTicketLookupModal({ visible: true, found: true, ticket });
    } else {
      setTicketLookupModal({ visible: true, found: false });
    }
    setSearching(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    if (!user || !user._id) return;
    const token = await AsyncStorage.getItem('jwtToken');
    const res = await fetch(`https://juanlms-webapp-server.onrender.com/api/tickets/user/${user._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setTickets(data.filter(t => t.status === activeTab));
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: '#f2f2f2' }}>
      {/* Header */}
      <View style={StudentSupportStyle.topBackground}>
        <TouchableOpacity style={StudentSupportStyle.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={StudentSupportStyle.headerTitle}>Support Center</Text>
      </View>
      {/* Submit a Ticket */}
      <View style={[StudentSupportStyle.ticketCard, { position: 'relative' }]}> 
        <Text style={StudentSupportStyle.ticketTitle}>How can we help you today?</Text>
        <Text style={StudentSupportStyle.ticketSubtitle}>Submit a Ticket</Text>
        <TextInput
          style={StudentSupportStyle.ticketInput}
          placeholder="Subject"
          placeholderTextColor="#666"
          value={subject}
          onChangeText={setSubject}
        />
        <TextInput
          style={StudentSupportStyle.ticketInput}
          placeholder="Type your concern here"
          placeholderTextColor="#666"
          value={ticket}
          onChangeText={setTicket}
          multiline
        />
        {/* Paperclip button at bottom left of card */}
        <TouchableOpacity
          style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 2 }}
          onPress={() => {}} // No upload, just a button
        >
          <MaterialIcons name="attach-file" size={24} color="#1976d2" />
        </TouchableOpacity>
        <TouchableOpacity style={StudentSupportStyle.sendBtn} onPress={async () => {
          if (!subject.trim() || !ticket.trim() || !user || !user._id) return;
          const res = await fetch('https://juanlms-webapp-server.onrender.com/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id, subject, description: ticket })
          });
          const data = await res.json();
          setSubject('');
          setTicket('');
          setTicketNumber(data.number || data._id || '');
          setModalVisible(true);
          fetchTickets();
        }}>
          <MaterialIcons name="send" size={24} color="#00418b" />
        </TouchableOpacity>
      </View>

      {/* Active Ticket Lookup Section */}
      <View style={[StudentSupportStyle.ticketCard, { marginTop: 10, marginBottom: 18 }]}> 
        <Text style={{ fontWeight: 'bold', color: '#222', fontSize: 16, textAlign: 'center', marginBottom: 2 }}>
          Have an active ticket?
        </Text>
        <Text style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 10 }}>
          Enter ticket number here
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#1976d2',
              borderRadius: 8,
              padding: 10,
              backgroundColor: '#fff',
              marginRight: 8,
              fontSize: 15,
            }}
            placeholder="SJDDxxxxxxxxxx"
            placeholderTextColor="#aaa"
            value={activeTicketInput}
            onChangeText={setActiveTicketInput}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={{ backgroundColor: '#00418b', borderRadius: 8, padding: 10 }}
            onPress={handleCheckTicket}
          >
            <MaterialIcons name="search" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal for ticket lookup result */}
      <Modal
        visible={ticketLookupModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setTicketLookupModal({ visible: false })}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', minWidth: 260 }}>
            {ticketLookupModal.found ? (
              <>
                <MaterialIcons name="confirmation-number" size={40} color="#1976d2" style={{ marginBottom: 10 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Ticket Found</Text>
                <Text style={{ fontSize: 16, marginBottom: 4 }}>Ticket Number:</Text>
                <Text style={{ fontSize: 16, color: '#1976d2', fontWeight: 'bold', marginBottom: 8 }}>{ticketLookupModal.ticket?.number}</Text>
                <Text style={{ fontSize: 15, marginBottom: 4 }}>Status: <Text style={{ fontWeight: 'bold', color: ticketLookupModal.ticket?.status === 'Active' ? '#388e3c' : '#888' }}>{ticketLookupModal.ticket?.status}</Text></Text>
                <Text style={{ fontSize: 15, marginBottom: 8, textAlign: 'center' }}>{ticketLookupModal.ticket?.content}</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="error-outline" size={40} color="#d32f2f" style={{ marginBottom: 10 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Ticket is not found</Text>
              </>
            )}
            <TouchableOpacity onPress={() => setTicketLookupModal({ visible: false })} style={{ backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 24, marginTop: 10 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal for ticket submission */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', minWidth: 260 }}>
            <MaterialIcons name="check-circle" size={48} color="#1976d2" style={{ marginBottom: 10 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Ticket has been submitted</Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Ticket number:</Text>
            <Text style={{ fontSize: 18, color: '#1976d2', fontWeight: 'bold', marginBottom: 16 }}>{ticketNumber}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 24 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Common Questions */}
      <Text style={StudentSupportStyle.commonTitle}>Common Questions</Text>
      {/* Auto-scroll Q&A animation box at the top */}
      <View style={{ height: QA_HEIGHT, overflow: 'hidden', marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1976d2', borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', position: 'relative' }} {...answerBoxProps}>
        <Animated.View style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', transform: [{ translateY: 0 }] }}>
          <Text style={{ fontWeight: 'bold', color: '#00418b', marginBottom: 4, fontSize: 16, textAlign: 'center' }}>
            {commonQuestions[currentIndex].question}
          </Text>
          <Text style={{ color: '#666', fontSize: 15, textAlign: 'center' }}>
            {commonQuestions[currentIndex].answer}
          </Text>
        </Animated.View>
      </View>
      {/* Dropdown and static Q&A below the animation box */}
      <View style={{ marginHorizontal: 16, marginBottom: 30 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: '#1976d2',
            borderRadius: 10,
            backgroundColor: '#fff',
            marginBottom: 8,
          }}
          onPress={() => setShowDropdown(!showDropdown)}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#666', fontWeight: 'bold', fontSize: 15 }}>
            {overlayIndex !== null ? commonQuestions[overlayIndex].question : 'Select a Question'}
          </Text>
          <MaterialIcons name={showDropdown ? 'arrow-drop-up' : 'arrow-drop-down'} size={24} color="#00418b" />
        </TouchableOpacity>
        {showDropdown && (
          <View style={{
            position: 'absolute',
            top: 48,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#1976d2',
            zIndex: 10,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
            maxHeight: QA_HEIGHT * 3,
            overflow: 'scroll',
          }}>
            {commonQuestions.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={{ padding: 12, borderBottomWidth: idx !== commonQuestions.length - 1 ? 1 : 0, borderBottomColor: '#eee' }}
                onPress={() => { setOverlayIndex(idx); setShowDropdown(false); }}
              >
                <Text style={{ color: '#222', fontSize: 15 }}>{q.question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Show answer card below dropdown if a question is selected */}
        {overlayIndex !== null && (
          <View style={{
            marginTop: 8,
            backgroundColor: '#fff',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#1976d2',
            padding: 16,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{ fontWeight: 'bold', color: '#00418b', marginBottom: 4, fontSize: 16, textAlign: 'center' }}>{commonQuestions[overlayIndex].question}</Text>
            <Text style={{ color: '#666', fontSize: 15, textAlign: 'center' }}>{commonQuestions[overlayIndex].answer}</Text>
            <TouchableOpacity
              onPress={() => setOverlayIndex(null)}
              style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#00418b', borderRadius: 12, padding: 4, zIndex: 30 }}
            >
              <MaterialIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
