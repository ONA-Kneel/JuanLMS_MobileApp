import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Animated, Easing, Platform, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import StudentSupportStyle from '../styles/Stud/StudentSupportStyle';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../UserContext';

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

const QA_HEIGHT = 90;

export default function FacultySupportCenter() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
  const [ticket, setTicket] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [overlayIndex, setOverlayIndex] = useState(null);
  const timerRef = useRef();
  const resumeTimeout = useRef();
  const [activeTicketInput, setActiveTicketInput] = useState('');
  const [ticketLookupModal, setTicketLookupModal] = useState({ visible: false, found: false, ticket: null });

  const handleSendTicket = () => {
    const newTicketNumber = generateTicketNumber();
    setTicketNumber(newTicketNumber);
    setModalVisible(true);
    setTicket('');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
  };

  useEffect(() => {
    if (overlayIndex !== null) return;
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

  const handleSelectQuestion = (idx) => {
    setOverlayIndex(idx);
    setIsPaused(true);
    setShowDropdown(false);
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      setOverlayIndex(null);
      setIsPaused(false);
    }, 30000);
  };

  const handleCloseOverlay = () => {
    setOverlayIndex(null);
    setIsPaused(false);
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  };

  const handlePause = () => setIsPaused(true);
  const handleResume = () => { if (overlayIndex === null) setIsPaused(false); };
  const answerBoxProps = Platform.OS === 'web'
    ? { onMouseEnter: handlePause, onMouseLeave: handleResume }
    : { onPressIn: handlePause, onPressOut: handleResume };

  function handleCheckTicket() {
    const mockTickets = [
      { number: 'SJDD1234567890', status: 'Active', content: 'Your ticket is being processed.' },
      { number: 'SJDD0987654321', status: 'Closed', content: 'Your ticket has been resolved.' },
    ];
    const found = mockTickets.find(t => t.number === activeTicketInput.trim());
    if (found) {
      setTicketLookupModal({ visible: true, found: true, ticket: found });
    } else {
      setTicketLookupModal({ visible: true, found: false });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Blue background */}
      <View style={styles.blueHeaderBackground} />
      {/* White card header */}
      <View style={styles.whiteHeaderCard}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={28} color="#00418b" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>
              Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Faculty'}!</Text>
            </Text>
            <Text style={styles.headerSubtitle}>{academicContext}</Text>
            <Text style={styles.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
              {resolveProfileUri() ? (
                <Image 
                  source={{ uri: resolveProfileUri() }} 
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  resizeMode="cover"
                />
              ) : (
                <Image 
                  source={require('../../assets/profile-icon (2).png')} 
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Header with Logo and Return Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 10 }}>
        <Image
          source={require('../../assets/Logo3.svg')}
          style={{ width: 150, height: 50 }}
          resizeMode="contain"
        />
      </View>

      {/* Card with plus button */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
        <TouchableOpacity
          style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#00418b', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}
          onPress={() => navigation.navigate('FacultySupportCenter')}
        >
          <Text style={{ fontSize: 32, color: '#fff', fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, color: '#00418b', fontFamily: 'Poppins-Bold' }}>Submit a Ticket</Text>
      </View>
      {/* Active Requests/Problems List */}
      <Text style={{ fontSize: 18, fontFamily: 'Poppins-Bold', color: '#222', marginHorizontal: 16, marginBottom: 10 }}>Active Request/Problem</Text>

      <TouchableOpacity style={{ backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 10, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="mail" size={24} color="#00418b" style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', color: '#222' }}>Problem title</Text>
        </View>
        <Text style={{ fontSize: 20, color: '#00418b' }}>✔✔</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 10, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="mail" size={24} color="#00418b" style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 16, fontFamily: 'Poppins-Bold', color: '#222' }}>Request Title</Text>
        </View>
        <Text style={{ fontSize: 20, color: '#00418b' }}>✔</Text>
      </TouchableOpacity>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Unified header styles
  blueHeaderBackground: {
    backgroundColor: '#00418b',
    height: 90,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  whiteHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -40,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: '#222',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  headerSubtitle2: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
