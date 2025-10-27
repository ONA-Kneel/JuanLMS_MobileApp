import { Text, TouchableOpacity, View, ScrollView, Image, Dimensions, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AdminDashStyle from '../styles/administrator/AdminDashStyle';
import { useUser } from '../../UserContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import adminService from '../../services/adminService';
import { useNotifications } from '../../NotificationContext';
import NotificationCenter from '../NotificationCenter';
import { useAnnouncements } from '../../AnnouncementContext';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const changeScreen = useNavigation();
  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
  };
  const { user, loading: userLoading } = useUser();
  const { unreadCount } = useNotifications();
  const { announcements, loading: loadingAnnouncements } = useAnnouncements();
  
  // Debug logging
  console.log('AdminDashboard - Announcements:', announcements?.length || 0, 'announcements loaded');
  console.log('AdminDashboard - Loading announcements:', loadingAnnouncements);
  console.log('AdminDashboard - Announcements data:', announcements);
  
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [recentLogs, setRecentLogs] = useState([]);
     const [userStats, setUserStats] = useState({ admin: 0, faculty: 0, student: 0 });
  const [schoolYearProgress, setSchoolYearProgress] = useState(0);
  const [termProgress, setTermProgress] = useState(0);
  const [lastLogins, setLastLogins] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [currentTerm, setCurrentTerm] = useState('Term 1');
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  // Add safety check to prevent white screen when user is null (during logout)
  // This must be placed AFTER all hooks to avoid "Rendered fewer hooks than expected" error
  if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fa' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
          Loading user data...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fa' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
          Redirecting to login...
        </Text>
      </View>
    );
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Test function to debug admin access
  const testAdminAccess = async () => {
    try {
      console.log('DEBUG: Testing admin access...');
      const token = await AsyncStorage.getItem('jwtToken');
      const userData = await AsyncStorage.getItem('user');
      
      console.log('DEBUG: Stored token:', token ? 'Present' : 'Missing');
      console.log('DEBUG: Stored user data:', userData ? JSON.parse(userData) : 'Missing');
      
      if (token) {
        // Test API call
        const response = await fetch('https://juanlms-webapp-server.onrender.com/api/admin/user-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('DEBUG: API test response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('DEBUG: API test response data:', data);
        } else {
          console.log('DEBUG: API test failed:', response.statusText);
        }
      }
    } catch (error) {
      console.error('DEBUG: Admin access test failed:', error);
    }
  };

  // Call test function on mount in development
  useEffect(() => {
    if (__DEV__) {
      testAdminAccess();
    }
  }, []);

  // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
      
      console.log('DEBUG: Fetching admin dashboard data...');
        
        // Fetch from admin service
        const data = await adminService.getDashboardSummary();
      console.log('DEBUG: Dashboard data received:', data);
        
        if (data && data.userStats) {
        console.log('DEBUG: Setting user stats:', data.userStats);
          setUserStats(data.userStats);
        }
        if (data && data.recentLogins) {
        console.log('DEBUG: Setting recent logins:', data.recentLogins);
          setLastLogins(data.recentLogins);
        }
        if (data && data.auditPreview) {
        console.log('DEBUG: Setting audit preview:', data.auditPreview);
          setRecentLogs(data.auditPreview);
        }
        if (data && data.academicProgress) {
        console.log('DEBUG: Setting academic progress:', data.academicProgress);
          setSchoolYearProgress(data.academicProgress.schoolYear || 0);
          setTermProgress(data.academicProgress.term || 0);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        
                 // Fallback to mock data if all else fails
      console.log('DEBUG: Using fallback data due to API error');
         setUserStats({ admin: 1, faculty: 8, student: 17 });
         setLastLogins([
           { userName: 'Rochelle Borre', role: 'students' },
           { userName: 'Niel Nathan Borre', role: 'faculty' },
           { userName: 'Roman Cyril Panganiban', role: 'faculty' },
           { userName: 'hatdog asd', role: 'students' },
         ]);
      setRecentLogs([
          { timestamp: '2025-08-03T12:43:56', userName: 'Will Bianca', action: 'Login' },
          { timestamp: '2025-07-22T00:06:11', userName: 'Rochelle Borre', action: 'Login' },
          { timestamp: '2025-07-20T23:23:40', userName: 'Niel Nathan Borre', action: 'Login' },
          { timestamp: '2025-07-13T01:59:20', userName: 'Roman Cyril Panganiban', action: 'Login' },
          { timestamp: '2025-07-05T19:04:07', userName: 'hatdog asd', action: 'Login' },
        ]);
        
        // Calculate fallback progress using the same logic as web app
        const now = new Date();
        const schoolYearStart = new Date('2025-06-01');
        const schoolYearEnd = new Date('2026-04-30');
        const termStart = new Date('2025-08-01');
        const termEnd = new Date('2025-12-15');
        
        // Calculate school year progress like web app
        let schoolYearPercent = 0;
        if (now < schoolYearStart) {
            schoolYearPercent = 0;
        } else if (now > schoolYearEnd) {
            schoolYearPercent = 100;
        } else {
            const schoolYearTotal = schoolYearEnd - schoolYearStart;
            const schoolYearElapsed = now - schoolYearStart;
            schoolYearPercent = Math.floor((schoolYearElapsed / schoolYearTotal) * 100);
        }
        
        // Calculate term progress like web app
        let termPercent = 0;
        if (now < termStart) {
            termPercent = 0;
        } else if (now > termEnd) {
            termPercent = 100;
        } else {
            const termTotal = termEnd - termStart;
            const termElapsed = now - termStart;
            termPercent = Math.floor((termElapsed / termTotal) * 100);
        }
        
        setSchoolYearProgress(schoolYearPercent);
        setTermProgress(termPercent);
      } finally {
        setLoading(false);
      }
    };

  const fetchAcademicYear = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const academicResponse = await fetch(`https://juanlms-webapp-server.onrender.com/api/academic-year/active`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      let activeYear = '2025-2026';
      let activeTerm = 'Term 1';
      
      if (academicResponse.ok) {
        const academicData = await academicResponse.json();
        console.log('Academic year API response:', academicData);
        if (academicData.success && academicData.academicYear) {
          activeYear = academicData.academicYear.year;
          activeTerm = academicData.academicYear.currentTerm;
          console.log('Using academic year data:', activeYear, activeTerm);
        } else {
          console.log('Academic year data not in expected format:', academicData);
        }
      } else {
        console.log('Academic year API not available, using default values');
        console.log('Response status:', academicResponse.status);
      }

      console.log('Active Academic Year:', activeYear, 'Term:', activeTerm);
      setAcademicYear(activeYear);
      setCurrentTerm(activeTerm);
      setAcademicContext(`${activeYear} | ${activeTerm}`);
    } catch (error) {
      console.error('Error fetching academic year:', error);
    }
  };

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
    fetchAcademicYear();
  }, []);

  // Generate calendar days
  useEffect(() => {
    const generateCalendar = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDay = firstDay.getDay();

      const days = [];
      
      // Add empty days for padding
      for (let i = 0; i < startDay; i++) {
        days.push({ day: '', isEmpty: true });
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
        const isHoliday = day === 21 || day === 25; // Mock holidays
        days.push({ 
          day, 
          isToday, 
          isHoliday,
          isEmpty: false 
        });
      }

      setCalendarDays(days);
    };

    generateCalendar();
  }, [currentMonth]);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const navigateToScreen = (screenName) => {
    changeScreen.navigate(screenName);
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'next') {
        newMonth.setMonth(newMonth.getMonth() + 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() - 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await adminService.getDashboardSummary();
      
      if (data && data.userStats) {
        setUserStats(data.userStats);
      }
      if (data && data.recentLogins) {
        setLastLogins(data.recentLogins);
      }
      if (data && data.auditPreview) {
        setRecentLogs(data.auditPreview);
      }
      if (data && data.academicProgress) {
        setSchoolYearProgress(data.academicProgress.schoolYear || 0);
        setTermProgress(data.academicProgress.term || 0);
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={AdminDashStyle.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={AdminDashStyle.loadingText}>Loading Admin Dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={AdminDashStyle.errorContainer}>
        <MaterialIcons name="error" size={64} color="#f44336" />
        <Text style={AdminDashStyle.errorTitle}>Dashboard Error</Text>
        <Text style={AdminDashStyle.errorText}>{error}</Text>
        <TouchableOpacity style={AdminDashStyle.retryButton} onPress={() => {
          setError(null);
          setLoading(true);
          // Trigger a refresh by calling the data fetching functions
          fetchDashboardData();
          fetchAcademicYear();
        }}>
          <Text style={AdminDashStyle.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  //

  return (
    <View style={AdminDashStyle.container}>
      {/* Blue background */}
      <View style={AdminDashStyle.blueHeaderBackground} />
      
      {/* White card header */}
      <View style={AdminDashStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={AdminDashStyle.headerTitle}>
              Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Admin'}!</Text>
            </Text>
            <Text style={AdminDashStyle.headerSubtitle}>{academicContext}</Text>
            <Text style={AdminDashStyle.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => {
                try {
                  setShowNotificationCenter(true);
                } catch (error) {
                  console.error('Error opening notification center:', error);
                  Alert.alert('Notifications', 'Unable to open notifications. Please try again.');
                }
              }}
              style={{ marginRight: 12, position: 'relative' }}
            >
              <MaterialIcons name="notifications" size={24} color="#00418b" />
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
            <TouchableOpacity onPress={() => navigateToScreen('AProfile')}>
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

      

      {error && (
        <View style={{ backgroundColor: '#fee', padding: 12, marginHorizontal: 20, borderRadius: 8, marginBottom: 10 }}>
          <Text style={{ color: '#c33', fontFamily: 'Poppins-Regular', fontSize: 14 }}>
            {error}
          </Text>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={AdminDashStyle.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00418b']}
            tintColor="#00418b"
          />
        }
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
                <MaterialIcons name="notifications" size={16} color="#ff6b6b" />
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
                  <MaterialIcons name="close" size={16} color="#999" />
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

                 {/* Summary Cards */}
         <View style={AdminDashStyle.summaryCardsContainer}>
           {/* First Row - 3 cards */}
           <View style={AdminDashStyle.summaryCard}>
            <MaterialIcons name="admin-panel-settings" size={24} color="#00418b" />
             <Text style={AdminDashStyle.summaryNumber}>{userStats.admin}</Text>
             <Text style={AdminDashStyle.summaryLabel}>Admins</Text>
           </View>
           <View style={AdminDashStyle.summaryCard}>
            <MaterialIcons name="person" size={24} color="#00418b" />
             <Text style={AdminDashStyle.summaryNumber}>{userStats.faculty}</Text>
             <Text style={AdminDashStyle.summaryLabel}>Faculty</Text>
           </View>
           <View style={AdminDashStyle.summaryCard}>
            <MaterialIcons name="school" size={24} color="#00418b" />
             <Text style={AdminDashStyle.summaryNumber}>{userStats.student}</Text>
             <Text style={AdminDashStyle.summaryLabel}>Students</Text>
           </View>
         </View>

         

        {/* Progress Bars */}
        <View style={AdminDashStyle.progressSection}>
          <Text style={AdminDashStyle.sectionTitle}>Progress Tracking</Text>
          
          <View style={AdminDashStyle.progressCard}>
            <Text style={AdminDashStyle.progressTitle}>School Year Progress</Text>
            <View style={AdminDashStyle.progressBarContainer}>
              <View style={[AdminDashStyle.progressBar, { backgroundColor: '#e0e0e0' }]}>
                <View style={[AdminDashStyle.progressFill, { width: `${schoolYearProgress}%`, backgroundColor: '#8B5CF6' }]} />
              </View>
              <Text style={AdminDashStyle.progressText}>{schoolYearProgress}%</Text>
            </View>
            <Text style={AdminDashStyle.progressSubtext}>
              Estimating from June 1, 2025 to April 30, 2026
            </Text>
          </View>

          <View style={AdminDashStyle.progressCard}>
            <Text style={AdminDashStyle.progressTitle}>Term Progress</Text>
            <View style={AdminDashStyle.progressBarContainer}>
              <View style={[AdminDashStyle.progressBar, { backgroundColor: '#e0e0e0' }]}>
                <View style={[AdminDashStyle.progressFill, { width: `${termProgress}%`, backgroundColor: '#10B981' }]} />
              </View>
              <Text style={AdminDashStyle.progressText}>{termProgress}%</Text>
            </View>
            <Text style={AdminDashStyle.progressSubtext}>
              Current term progress
            </Text>
          </View>
        </View>

                 {/* Recent Logins Table */}
         <View style={AdminDashStyle.tableSection}>
           <Text style={AdminDashStyle.sectionTitle}>Recent Logins</Text>
           <View style={AdminDashStyle.tableCard}>
             <View style={AdminDashStyle.tableHeader}>
               <Text style={[AdminDashStyle.tableHeaderText, { flex: 3 }]}>User</Text>
               <Text style={[AdminDashStyle.tableHeaderText, { flex: 2 }]}>Role</Text>
             </View>
             {lastLogins.length > 0 ? (
               lastLogins.map((login, index) => (
                 <View 
                   key={index} 
                   style={[
                     AdminDashStyle.tableRow,
                     { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }
                   ]}
                 >
                   <Text style={[AdminDashStyle.tableCellText, { flex: 3 }]} numberOfLines={1}>
                     {login.userName}
                   </Text>
                   <Text style={[AdminDashStyle.tableCellText, { flex: 2 }]} numberOfLines={1}>
                     {login.role}
                   </Text>
                 </View>
               ))
             ) : (
               <View style={AdminDashStyle.emptyState}>
                 <Text style={AdminDashStyle.emptyStateText}>No recent logins found</Text>
               </View>
             )}
           </View>
         </View>

        

        {/* Quick Actions */}
        <View style={AdminDashStyle.quickActionsSection}>
          <Text style={AdminDashStyle.sectionTitle}>Quick Actions</Text>
          <View style={AdminDashStyle.quickActionsGrid}>
            <TouchableOpacity 
              style={AdminDashStyle.quickActionCard}
              onPress={() => navigateToScreen('ACalendar')}
            >
              <MaterialIcons name="calendar-today" size={32} color="#00418b" />
              <Text style={AdminDashStyle.quickActionText}>Calendar</Text>
                </TouchableOpacity>
            
            <TouchableOpacity 
              style={AdminDashStyle.quickActionCard}
              onPress={() => navigateToScreen('AChat')}
            >
              <MaterialIcons name="chat" size={32} color="#00418b" />
              <Text style={AdminDashStyle.quickActionText}>Chats</Text>
                </TouchableOpacity>
            
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