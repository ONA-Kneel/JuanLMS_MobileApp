import { Text, TouchableOpacity, View, ScrollView, Image, Dimensions, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../UserContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useNotifications } from '../../NotificationContext';
import NotificationCenter from '../NotificationCenter';
import { useAnnouncements } from '../../AnnouncementContext';

const { width } = Dimensions.get('window');

export default function VPEDashboard() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const { announcements, loading: loadingAnnouncements } = useAnnouncements();
  
  // Debug logging
  console.log('VPEDashboard - Announcements:', announcements?.length || 0, 'announcements loaded');
  console.log('VPEDashboard - Loading announcements:', loadingAnnouncements);
  console.log('VPEDashboard - Announcements data:', announcements);
  
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [currentTerm, setCurrentTerm] = useState('Term 1');
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
  };

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

        // Fetch academic year info
        const token = await AsyncStorage.getItem('jwtToken');
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
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDateTime = (date) => {
    return moment(date).format('dddd, MMMM D, YYYY | h:mm A');
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
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
      
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>
              Hello, <Text style={styles.userName}>{user?.firstname || 'VPE'}!</Text>
            </Text>
            <Text style={styles.academicContext}>
              {academicContext}
            </Text>
            <Text style={styles.dateText}>
              {formatDateTime(currentDateTime)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => {
                try {
                  console.log('[VPEDashboard] Notification button pressed');
                  setShowNotificationCenter(true);
                } catch (error) {
                  console.error('[VPEDashboard] Error opening notification center:', error);
                  Alert.alert('Notifications', 'Unable to open notifications. Please try again.');
                }
              }}
              style={{ marginRight: 12, position: 'relative' }}
              activeOpacity={0.7}
            >
              <Icon name="bell" size={24} color="#00418b" />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#ff4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontFamily: 'Poppins-Bold',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateToScreen('VPEProfile')}>
              {resolveProfileUri() ? (
                <Image 
                  source={{ uri: resolveProfileUri() }} 
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
        {/* Announcements Preview Section */}
        {loadingAnnouncements ? (
          <View style={{ marginBottom: 20, marginHorizontal: 20, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 12 }}>
            <ActivityIndicator size="small" color="#00418b" />
            <Text style={{ fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>
              Loading announcements...
            </Text>
          </View>
        ) : announcements && announcements.length > 0 ? (
          <View style={{ marginBottom: 20, marginHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'Poppins-Bold', color: '#333' }}>Announcements</Text>
              <TouchableOpacity
                onPress={() => setShowNotificationCenter(true)}
                style={{
                  backgroundColor: '#00418b',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8
                }}>
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Bold' }}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {/* Show latest announcement */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              borderLeftWidth: 4,
              borderLeftColor: '#ff6b6b'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="bell" size={16} color="#ff6b6b" />
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#333', 
                  fontFamily: 'Poppins-Bold',
                  marginLeft: 8,
                  flex: 1
                }}>
                  {announcements[0].title}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowNotificationCenter(true)}
                  style={{ padding: 4 }}
                >
                  <Icon name="close" size={16} color="#999" />
                </TouchableOpacity>
              </View>
              
              <Text style={{ 
                fontSize: 12, 
                color: '#666', 
                fontFamily: 'Poppins-Regular',
                marginBottom: 8
              }}>
                {academicContext}
              </Text>
              
              <Text style={{ 
                fontSize: 14, 
                color: '#555', 
                fontFamily: 'Poppins-Regular',
                lineHeight: 20
              }} numberOfLines={3}>
                {announcements[0].body || announcements[0].content}
              </Text>
              
              {announcements[0].createdBy && (
                <Text style={{ 
                  fontSize: 12, 
                  color: '#888', 
                  fontFamily: 'Poppins-Regular',
                  marginTop: 8,
                  fontStyle: 'italic'
                }}>
                  - {announcements[0].createdBy && typeof announcements[0].createdBy === 'object' 
                    ? `${announcements[0].createdBy.firstname || ''} ${announcements[0].createdBy.lastname || ''}`
                    : announcements[0].createdBy
                  }
                </Text>
              )}
            </View>
          </View>
        ) : null}

        {/* Debug: Show announcement count */}
        {__DEV__ && (
          <View style={{ backgroundColor: '#f0f0f0', padding: 10, marginBottom: 10, marginHorizontal: 20, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Debug: Announcements count: {announcements?.length || 0}
            </Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Loading: {loadingAnnouncements ? 'Yes' : 'No'}
            </Text>
            {announcements && announcements.length > 0 && (
              <Text style={{ fontSize: 12, color: '#666' }}>
                First announcement: {announcements[0]?.title || 'No title'}
              </Text>
            )}
          </View>
        )}

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
      
      {/* Notification Center Modal */}
      <NotificationCenter 
        visible={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  
  // Blue background
  blueBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 160,
    backgroundColor: '#00418b',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },

  // Header styles
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#00418b',
  },
  userName: {
    fontWeight: 'bold',
  },
  dateText: {
    fontFamily: 'Poppins-Regular',
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  academicContext: {
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontSize: 14,
    marginTop: 6,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  // Scroll content
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Section container
  sectionContainer: {
    marginBottom: 24,
  },

  // Section title
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 16,
    marginLeft: 4,
  },

  // Calendar section
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  calendarNavButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calendarNavButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  calendarMonthText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayHeader: {
    width: (width - 80) / 7,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarDayHeaderText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#666',
  },
  calendarDay: {
    width: (width - 80) / 7,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  calendarDayToday: {
    backgroundColor: '#fff3cd',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayTextToday: {
    color: '#856404',
    fontFamily: 'Poppins-SemiBold',
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayTextOtherMonth: {
    color: '#999',
  },
};


