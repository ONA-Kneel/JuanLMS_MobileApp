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
  const [userStats, setUserStats] = useState({ admins: 0, faculty: 0, students: 0 });
  const [schoolYearProgress, setSchoolYearProgress] = useState(0);
  const [termProgress, setTermProgress] = useState(0);
  const [lastLogins, setLastLogins] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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
        
        const data = await adminService.getDashboardSummary();
        
        setUserStats(data.userStats);
        setLastLogins(data.recentLogins);
        setRecentLogs(data.auditPreview);
        setSchoolYearProgress(data.academicProgress.schoolYear);
        setTermProgress(data.academicProgress.term);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        
        // Fallback to mock data if API fails
        setUserStats({ admins: 1, faculty: 8, students: 17 });
        setLastLogins([
          { userName: 'Rochelle Borre', role: 'students', lastLogin: '2025-07-22T00:06:11' },
          { userName: 'Niel Nathan Borre', role: 'faculty', lastLogin: '2025-07-20T23:23:40' },
          { userName: 'Roman Cyril Panganiban', role: 'principal', lastLogin: '2025-07-13T01:59:20' },
          { userName: 'hatdog asd', role: 'students', lastLogin: '2025-07-05T19:04:07' },
        ]);
        setRecentLogs([
          { timestamp: '2025-08-03T12:43:56', userName: 'Will Bianca', action: 'Login' },
          { timestamp: '2025-08-03T12:29:16', userName: 'Hillary Jade Alimurong', action: 'Login' },
          { timestamp: '2025-08-03T12:14:32', userName: 'Will Bianca', action: 'Login' },
          { timestamp: '2025-08-03T12:11:23', userName: 'Hillary Jade Alimurong', action: 'Login' },
          { timestamp: '2025-08-03T11:33:31', userName: 'Nicolette Borre', action: 'Login' },
        ]);
        setSchoolYearProgress(18);
        setTermProgress(100);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      setUserStats(data.userStats);
      setLastLogins(data.recentLogins);
      setRecentLogs(data.auditPreview);
      setSchoolYearProgress(data.academicProgress.schoolYear);
      setTermProgress(data.academicProgress.term);
      setError(null);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      setError('Failed to refresh dashboard data');
    } finally {
      setRefreshing(false);
    }
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
            <Text style={AdminDashStyle.dateText}>
              2025-2026 | Term 1 | {formatDateTime(currentDateTime)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigateToScreen('AProfile')}>
            <Image 
              source={require('../../assets/profile-icon (2).png')} 
              style={AdminDashStyle.profileImage}
            />
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
          <View style={AdminDashStyle.summaryCard}>
            <Icon name="account-cog" size={24} color="#00418b" />
            <Text style={AdminDashStyle.summaryNumber}>{userStats.admins}</Text>
            <Text style={AdminDashStyle.summaryLabel}>Admins</Text>
          </View>
          <View style={AdminDashStyle.summaryCard}>
            <Icon name="account-tie" size={24} color="#00418b" />
            <Text style={AdminDashStyle.summaryNumber}>{userStats.faculty}</Text>
            <Text style={AdminDashStyle.summaryLabel}>Faculty</Text>
          </View>
          <View style={AdminDashStyle.summaryCard}>
            <Icon name="account-school" size={24} color="#00418b" />
            <Text style={AdminDashStyle.summaryNumber}>{userStats.students}</Text>
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
              From 8/2/2025 to 8/3/2025
            </Text>
          </View>
        </View>

        {/* Active Users Today */}
        <View style={AdminDashStyle.activeUsersSection}>
          <Text style={AdminDashStyle.sectionTitle}>Active Users Today</Text>
          <View style={AdminDashStyle.comingSoonCard}>
            <Text style={AdminDashStyle.comingSoonText}>(Coming soon)</Text>
          </View>

        </View>

        {/* Last Logins Preview */}
        <View style={AdminDashStyle.lastLoginsSection}>
          <View style={AdminDashStyle.sectionHeader}>
            <Text style={AdminDashStyle.sectionTitle}>Last Logins Preview</Text>
            <TouchableOpacity onPress={() => navigateToScreen('AAuditTrail')}>
              <Text style={AdminDashStyle.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={AdminDashStyle.tableContainer}>
            <View style={AdminDashStyle.tableHeader}>
              <Text style={AdminDashStyle.tableHeaderText}>User</Text>
              <Text style={AdminDashStyle.tableHeaderText}>Role</Text>
              <Text style={AdminDashStyle.tableHeaderText}>Last Login</Text>
            </View>
            
            {lastLogins.map((login, index) => (
              <View key={index} style={[
                AdminDashStyle.tableRow,
                index % 2 === 0 && AdminDashStyle.tableRowAlternate
              ]}>
                <Text style={AdminDashStyle.tableCellText}>{login.userName}</Text>
                <Text style={AdminDashStyle.tableCellText}>{login.role}</Text>
                <Text style={AdminDashStyle.tableCellText}>
                  {moment(login.lastLogin).format('MMM D, YYYY [at] hh:mm:ss A')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Audit Preview Section */}
        <View style={AdminDashStyle.auditPreviewSection}>
          <Text style={AdminDashStyle.sectionTitle}>Audit Preview</Text>
          <View style={AdminDashStyle.auditPreviewCard}>
            <ScrollView style={AdminDashStyle.auditScrollView}>
              {recentLogs.map((log, index) => (
                <View key={index} style={AdminDashStyle.auditRow}>
                  <Text style={AdminDashStyle.auditTime}>
                    {moment(log.timestamp).format('hh:mm:ss A')}
                  </Text>
                  <Text style={AdminDashStyle.auditUser}>{log.userName}</Text>
                  <Text style={AdminDashStyle.auditAction}>{log.action}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Academic Calendar Section */}
        <View style={AdminDashStyle.calendarSection}>
          <Text style={AdminDashStyle.sectionTitle}>Academic Calendar</Text>
          <View style={AdminDashStyle.calendarCard}>
            <View style={AdminDashStyle.calendarHeader}>
              <Text style={AdminDashStyle.calendarMonth}>
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              <View style={AdminDashStyle.calendarControls}>
                <TouchableOpacity onPress={goToToday} style={AdminDashStyle.calendarButton}>
                  <Text style={AdminDashStyle.calendarButtonText}>today</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeMonth('prev')} style={AdminDashStyle.calendarButton}>
                  <Text style={AdminDashStyle.calendarButtonText}>&lt;</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeMonth('next')} style={AdminDashStyle.calendarButton}>
                  <Text style={AdminDashStyle.calendarButtonText}>&gt;</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={AdminDashStyle.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={AdminDashStyle.calendarDayHeader}>{day}</Text>
              ))}
              
              {calendarDays.map((day, index) => (
                <View key={index} style={[
                  AdminDashStyle.calendarDay,
                  day.isToday && AdminDashStyle.calendarToday,
                  day.isHoliday && AdminDashStyle.calendarHoliday
                ]}>
                  <Text style={[
                    AdminDashStyle.calendarDayText,
                    day.isToday && AdminDashStyle.calendarTodayText,
                    day.isHoliday && AdminDashStyle.calendarHolidayText
                  ]}>
                    {day.day}
                  </Text>
                  {day.isHoliday && (
                    <Text style={AdminDashStyle.holidayText}>Holid</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}