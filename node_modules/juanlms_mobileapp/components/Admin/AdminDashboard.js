import { Text, TouchableOpacity, View, ScrollView, Image, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AdminDashStyle from '../styles/administrator/AdminDashStyle';
import { useUser } from '../UserContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import adminService from '../../services/adminService';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const changeScreen = useNavigation();
  const { user } = useUser();
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
        
        // Fetch from admin service
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
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        
                 // Fallback to mock data if all else fails
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
        setSchoolYearProgress(18);
        setTermProgress(100);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchAcademicYear();
  }, []);

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
      second: '2-digit',
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
      <View style={[AdminDashStyle.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontFamily: 'Poppins-Regular', color: '#666' }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={AdminDashStyle.container}>
      {/* Blue background */}
      <View style={AdminDashStyle.blueBackground} />
      
      {/* Header */}
      <View style={AdminDashStyle.headerCard}>
        <View style={AdminDashStyle.headerContent}>
          <View>
            <Text style={AdminDashStyle.greetingText}>
              Hello, <Text style={AdminDashStyle.userName}>{user?.firstname || 'Admin'}!</Text>
            </Text>
            <Text style={AdminDashStyle.academicContext}>
              {academicContext}
            </Text>
            <Text style={AdminDashStyle.dateText}>
              {formatDateTime(currentDateTime)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateToScreen('AProfile')}>
            {user?.profilePicture ? (
              <Image 
                source={{ uri: user.profilePicture }} 
                style={AdminDashStyle.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Image 
                source={require('../../assets/profile-icon (2).png')} 
                style={AdminDashStyle.profileImage}
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
                 {/* Summary Cards */}
         <View style={AdminDashStyle.summaryCardsContainer}>
           {/* First Row - 3 cards */}
           <View style={AdminDashStyle.summaryCard}>
             <Icon name="account-cog" size={24} color="#00418b" />
             <Text style={AdminDashStyle.summaryNumber}>{userStats.admin}</Text>
             <Text style={AdminDashStyle.summaryLabel}>Admins</Text>
           </View>
           <View style={AdminDashStyle.summaryCard}>
             <Icon name="account-tie" size={24} color="#00418b" />
             <Text style={AdminDashStyle.summaryNumber}>{userStats.faculty}</Text>
             <Text style={AdminDashStyle.summaryLabel}>Faculty</Text>
           </View>
           <View style={AdminDashStyle.summaryCard}>
             <Icon name="school" size={24} color="#00418b" />
             <Text style={AdminDashStyle.summaryNumber}>{userStats.student}</Text>
             <Text style={AdminDashStyle.summaryLabel}>Students</Text>
           </View>
         </View>

         {/* Debug Info - Temporary */}
         <View style={{ backgroundColor: '#f0f8ff', padding: 16, borderRadius: 12, marginBottom: 20 }}>
           <Text style={{ fontFamily: 'Poppins-Bold', color: '#00418b', marginBottom: 8 }}>Debug Info</Text>
           <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 12 }}>
             Admin: {userStats.admin} | Faculty: {userStats.faculty} | Student: {userStats.student}
           </Text>
           <TouchableOpacity 
             style={{ 
               backgroundColor: '#00418b', 
               padding: 8, 
               borderRadius: 6, 
               marginTop: 8,
               alignSelf: 'center'
             }}
             onPress={async () => {
               try {
                 const data = await adminService.getUserStats();
                 console.log('Manual refresh user stats:', data);
                 setUserStats(data);
               } catch (error) {
                 console.error('Manual refresh failed:', error);
               }
             }}
           >
             <Text style={{ color: '#fff', fontFamily: 'Poppins-Regular', fontSize: 12 }}>
               Refresh User Stats
             </Text>
           </TouchableOpacity>
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

        {/* Audit Trail Preview */}
        <View style={AdminDashStyle.tableSection}>
          <Text style={AdminDashStyle.sectionTitle}>Recent Activities</Text>
          <View style={AdminDashStyle.tableCard}>
            <View style={AdminDashStyle.tableHeader}>
              <Text style={[AdminDashStyle.tableHeaderText, { flex: 2 }]}>User</Text>
              <Text style={[AdminDashStyle.tableHeaderText, { flex: 1 }]}>Action</Text>
              <Text style={[AdminDashStyle.tableHeaderText, { flex: 2 }]}>Time</Text>
            </View>
            {recentLogs.length > 0 ? (
              recentLogs.map((log, index) => (
                <View 
                  key={index} 
                  style={[
                    AdminDashStyle.tableRow, 
                    { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }
                  ]}
                >
                  <Text style={[AdminDashStyle.tableCellText, { flex: 2 }]} numberOfLines={1}>
                    {log.userName}
                  </Text>
                  <Text style={[AdminDashStyle.tableCellText, { flex: 1 }]} numberOfLines={1}>
                    {log.action}
                  </Text>
                  <Text style={[AdminDashStyle.tableCellText, { flex: 2 }]} numberOfLines={1}>
                    {formatDate(log.timestamp)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={AdminDashStyle.emptyState}>
                <Text style={AdminDashStyle.emptyStateText}>No recent activities found</Text>
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
              <Icon name="calendar" size={32} color="#00418b" />
              <Text style={AdminDashStyle.quickActionText}>Calendar</Text>
                </TouchableOpacity>
            
            <TouchableOpacity 
              style={AdminDashStyle.quickActionCard}
              onPress={() => navigateToScreen('AChat')}
            >
              <Icon name="chat" size={32} color="#00418b" />
              <Text style={AdminDashStyle.quickActionText}>Chats</Text>
                </TouchableOpacity>
            
            <TouchableOpacity 
              style={AdminDashStyle.quickActionCard}
              onPress={() => navigateToScreen('AAuditTrail')}
            >
              <Icon name="history" size={32} color="#00418b" />
              <Text style={AdminDashStyle.quickActionText}>Audit Trail</Text>
                </TouchableOpacity>
            
            <TouchableOpacity 
              style={AdminDashStyle.quickActionCard}
              onPress={() => navigateToScreen('ASupportCenter')}
            >
              <Icon name="help-circle" size={32} color="#00418b" />
              <Text style={AdminDashStyle.quickActionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}