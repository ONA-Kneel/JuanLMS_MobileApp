import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const { width } = Dimensions.get('window');

export default function PrincipalDashboard() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [recentLogs, setRecentLogs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [currentTerm, setCurrentTerm] = useState('Term 1');
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch audit logs
        const token = await AsyncStorage.getItem('jwtToken');
        const auditResponse = await fetch('https://juanlms-webapp-server.onrender.com/audit-logs?page=1&limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          setRecentLogs(auditData.data?.logs || []);
        }

        // Fetch academic year info
        const academicResponse = await fetch('https://juanlms-webapp-server.onrender.com/api/academic-year/active', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (academicResponse.ok) {
          const academicData = await academicResponse.json();
          if (academicData.success && academicData.academicYear) {
            setAcademicYear(academicData.academicYear.year || '2025-2026');
            setCurrentTerm(academicData.academicYear.currentTerm || 'Term 1');
            setAcademicContext(`${academicData.academicYear.year || '2025-2026'} | ${academicData.academicYear.currentTerm || 'Term 1'}`);
          }
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        
        // Fallback to mock data
        setRecentLogs([
          { timestamp: '2025-08-03T12:43:56', userName: 'Will Bianca', action: 'Login' },
          { timestamp: '2025-07-22T00:06:11', userName: 'Rochelle Borre', action: 'Login' },
          { timestamp: '2025-07-20T23:23:40', userName: 'Niel Nathan Borre', action: 'Login' },
          { timestamp: '2025-07-13T01:59:20', userName: 'Roman Cyril Panganiban', action: 'Login' },
          { timestamp: '2025-07-05T19:04:07', userName: 'hatdog asd', action: 'Login' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    generateCalendarDays();
  }, []);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks * 7 days)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch audit logs
      const token = await AsyncStorage.getItem('jwtToken');
      const auditResponse = await fetch('https://juanlms-webapp-server.onrender.com/audit-logs?page=1&limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setRecentLogs(auditData.data?.logs || []);
      }

      // Fetch academic year info
      const academicResponse = await fetch('https://juanlms-webapp-server.onrender.com/api/academic-year/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (academicResponse.ok) {
        const academicData = await academicResponse.json();
        if (academicData.success && academicData.academicYear) {
          setAcademicYear(academicData.academicYear.year || '2025-2026');
          setCurrentTerm(academicData.academicYear.currentTerm || 'Term 1');
          setAcademicContext(`${academicData.academicYear.year || '2025-2026'} | ${academicData.academicYear.currentTerm || 'Term 1'}`);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      
      // Fallback to mock data
      setRecentLogs([
        { timestamp: '2025-08-03T12:43:56', userName: 'Will Bianca', action: 'Login' },
        { timestamp: '2025-07-22T00:06:11', userName: 'Rochelle Borre', action: 'Login' },
        { timestamp: '2025-07-20T23:23:40', userName: 'Niel Nathan Borre', action: 'Login' },
        { timestamp: '2025-07-13T01:59:20', userName: 'Roman Cyril Panganiban', action: 'Login' },
        { timestamp: '2025-07-05T19:04:07', userName: 'hatdog asd', action: 'Login' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    generateCalendarDays();
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    generateCalendarDays();
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    generateCalendarDays();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
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
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontFamily: 'Poppins-Regular', color: '#666' }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Blue background */}
      <View style={styles.blueBackground} />

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>
              Hello, <Text style={styles.userName}>{user?.firstname || 'Principal'}!</Text>
            </Text>
            <Text style={styles.academicContext}>{academicContext}</Text>
            <Text style={styles.dateText}>
              {formatDateTime(currentDateTime)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateToScreen('PrincipalProfile')}>
            {user?.profilePicture ? (
              <Image 
                source={{ uri: user.profilePicture }} 
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Image 
                source={require('../../assets/profile-icon (2).png')} 
                style={styles.profileImage}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={{ backgroundColor: '#fee', padding: 12, marginHorizontal: 20, borderRadius: 8, marginBottom: 10 }}>
          <Text style={{ color: '#c33', fontFamily: 'Poppins-Regular', fontSize: 14 }}>
            {error}
          </Text>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00418b']}
            tintColor="#00418b"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Audit Preview Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Audit Preview</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Timestamp</Text>
              <Text style={styles.tableHeaderText}>User</Text>
              <Text style={styles.tableHeaderText}>Details</Text>
            </View>
            {recentLogs.length > 0 ? (
              recentLogs.map((log, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tableRow, 
                    { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }
                  ]}
                >
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {formatDate(log.timestamp)}
                  </Text>
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {log.userName}
                  </Text>
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {log.action}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No logs found</Text>
              </View>
            )}
          </View>
        </View>

        {/* Academic Calendar Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Academic Calendar</Text>
          <View style={styles.calendarCard}>
            {/* Calendar Navigation */}
            <View style={styles.calendarNavigation}>
              <TouchableOpacity style={styles.calendarNavButton} onPress={goToToday}>
                <Text style={styles.calendarNavButtonText}>today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarNavButton} onPress={goToPreviousMonth}>
                <Text style={styles.calendarNavButtonText}>{'<'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarNavButton} onPress={goToNextMonth}>
                <Text style={styles.calendarNavButtonText}>{'>'}</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <View key={index} style={styles.calendarDayHeader}>
                  <Text style={styles.calendarDayHeaderText}>{day}</Text>
                </View>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    isToday(date) && styles.calendarDayToday,
                    !isCurrentMonth(date) && styles.calendarDayOtherMonth
                  ]}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isToday(date) && styles.calendarDayTextToday,
                    !isCurrentMonth(date) && styles.calendarDayTextOtherMonth
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  blueBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: width * 0.4, // Adjust height as needed
    backgroundColor: '#00418b',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    zIndex: -1,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -50, // Adjust to position it correctly
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 20,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  academicContext: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
    marginTop: 8,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  scrollContent: {
    paddingBottom: 20, // Add some padding at the bottom
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  tableCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarNavButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  calendarNavButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayHeader: {
    width: width * 0.142, // 7 days
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarDayHeaderText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  calendarDay: {
    width: width * 0.142, // 7 days
    height: width * 0.142, // 7 days
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarDayToday: {
    backgroundColor: '#00418b',
    borderWidth: 2,
    borderColor: '#fff',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  calendarDayTextToday: {
    color: '#fff',
  },
  calendarDayTextOtherMonth: {
    color: '#ccc',
  },
});


