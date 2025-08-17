import { Text, TouchableOpacity, View, ScrollView, Image, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const { width } = Dimensions.get('window');

export default function VPEDashboard() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [recentLogs, setRecentLogs] = useState([]);
  const [userStats, setUserStats] = useState({ admin: 0, faculty: 0, student: 0, vpe: 0, principal: 0 });
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
        
        // Fetch user stats
        const token = await AsyncStorage.getItem('jwtToken');
        const userStatsResponse = await fetch('https://juanlms-webapp-server.onrender.com/api/users/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (userStatsResponse.ok) {
          const userStatsData = await userStatsResponse.json();
          setUserStats(userStatsData);
        }

        // Fetch recent logins
        const recentLoginsResponse = await fetch('https://juanlms-webapp-server.onrender.com/audit-logs/last-10', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (recentLoginsResponse.ok) {
          const recentLoginsData = await recentLoginsResponse.json();
          setLastLogins(recentLoginsData.data.lastLogins || []);
        }

        // Fetch audit logs
        const auditResponse = await fetch('https://juanlms-webapp-server.onrender.com/audit-logs?page=1&limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          setRecentLogs(auditData.data.logs || []);
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
          setAcademicYear(academicData.data.academicYear || '2025-2026');
          setCurrentTerm(academicData.data.currentTerm || 'Term 1');
          setAcademicContext(`${academicData.data.academicYear || '2025-2026'} | ${academicData.data.currentTerm || 'Term 1'}`);
        }

        // Calculate progress (mock data for now)
        setSchoolYearProgress(18);
        setTermProgress(100);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        
        // Fallback to mock data
        setUserStats({ admin: 1, faculty: 8, student: 17, vpe: 1, principal: 1 });
        setLastLogins([
          { userName: 'Rochelle Borre', role: 'students' },
          { userName: 'Niel Nathan Borre', role: 'faculty' },
          { userName: 'Roman Cyril Panganiban', role: 'principal' },
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
    return moment(date).format('dddd, MMMM D, YYYY | h:mm:ss A');
  };

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
          <TouchableOpacity onPress={() => navigateToScreen('VPEProfile')}>
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
      >
        {/* Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          {/* First Row - 3 cards */}
          <View style={styles.summaryCard}>
            <Icon name="account-cog" size={24} color="#00418b" />
            <Text style={styles.summaryNumber}>{userStats.admin}</Text>
            <Text style={styles.summaryLabel}>Admins</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="account-tie" size={24} color="#00418b" />
            <Text style={styles.summaryNumber}>{userStats.faculty}</Text>
            <Text style={styles.summaryLabel}>Faculty</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="school" size={24} color="#00418b" />
            <Text style={styles.summaryNumber}>{userStats.student}</Text>
            <Text style={styles.summaryLabel}>Students</Text>
          </View>
          {/* Second Row - 2 cards */}
          <View style={styles.summaryCard}>
            <Icon name="account-star" size={24} color="#00418b" />
            <Text style={styles.summaryNumber}>{userStats.vpe || 0}</Text>
            <Text style={styles.summaryLabel}>VPE</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="account-tie" size={24} color="#00418b" />
            <Text style={styles.summaryNumber}>{userStats.principal || 0}</Text>
            <Text style={styles.summaryLabel}>Principal</Text>
          </View>
        </View>

        {/* Progress Bars */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress Tracking</Text>
          
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>School Year Progress</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: '#e0e0e0' }]}>
                <View style={[styles.progressFill, { width: `${schoolYearProgress}%`, backgroundColor: '#8B5CF6' }]} />
              </View>
              <Text style={styles.progressText}>{schoolYearProgress}%</Text>
            </View>
            <Text style={styles.progressSubtext}>
              Estimating from June 1, 2025 to April 30, 2026
            </Text>
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Term Progress</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: '#e0e0e0' }]}>
                <View style={[styles.progressFill, { width: `${termProgress}%`, backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.progressText}>{termProgress}%</Text>
            </View>
            <Text style={styles.progressSubtext}>
              Current term progress
            </Text>
          </View>
        </View>

        {/* Recent Logins Table */}
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>Recent Logins</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>User</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Role</Text>
            </View>
            {lastLogins.length > 0 ? (
              lastLogins.map((login, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tableRow,
                    { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }
                  ]}
                >
                  <Text style={[styles.tableCellText, { flex: 3 }]} numberOfLines={1}>
                    {login.userName}
                  </Text>
                  <Text style={[styles.tableCellText, { flex: 2 }]} numberOfLines={1}>
                    {login.role}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recent logins found</Text>
              </View>
            )}
          </View>
        </View>

        {/* Main Content Area - Two Column Layout */}
        <View style={styles.mainContentContainer}>
          {/* Left Column - Audit Trail Preview */}
          <View style={styles.leftColumn}>
            <View style={styles.tableSection}>
              <Text style={styles.sectionTitle}>Audit Preview</Text>
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Timestamp</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>User</Text>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Details</Text>
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
                      <Text style={[styles.tableCellText, { flex: 2 }]} numberOfLines={1}>
                        {formatDate(log.timestamp)}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 1 }]} numberOfLines={1}>
                        {log.userName}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 2 }]} numberOfLines={1}>
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
          </View>

          {/* Right Column - Mini Academic Calendar */}
          <View style={styles.rightColumn}>
            <View style={styles.calendarSection}>
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
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigateToScreen('VPECalendar')}
            >
              <Icon name="calendar" size={32} color="#00418b" />
              <Text style={styles.quickActionText}>Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigateToScreen('VPEChats')}
            >
              <Icon name="chat" size={32} color="#00418b" />
              <Text style={styles.quickActionText}>Chats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigateToScreen('VPEAuditTrail')}
            >
              <Icon name="history" size={32} color="#00418b" />
              <Text style={styles.quickActionText}>Audit Trail</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigateToScreen('VPESupportCenter')}
            >
              <Icon name="help-circle" size={32} color="#00418b" />
              <Text style={styles.quickActionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    marginTop: 2,
  },
  academicContext: {
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  // Scroll content
  scrollContent: {
    paddingBottom: 80,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Summary cards
  summaryCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: (width - 60) / 3, // 3 cards per row with margins
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#00418b',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
  },

  // Progress section
  progressSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#00418b',
    minWidth: 40,
  },
  progressSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },

  // Table section
  tableSection: {
    marginBottom: 20,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tableHeaderText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#495057',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },

  // Main content container - Two column layout
  mainContentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  leftColumn: {
    flex: 2,
  },
  rightColumn: {
    flex: 1,
  },

  // Calendar section
  calendarSection: {
    marginBottom: 20,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  calendarNavButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  calendarNavButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  calendarMonthText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginLeft: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHeader: {
    width: '14.28%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  calendarDayHeaderText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#666',
  },
  calendarDay: {
    width: '14.28%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  calendarDayToday: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    width: 24,
    height: 24,
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

  // Quick actions
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 4, // 4 cards per row
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#00418b',
    marginTop: 8,
    textAlign: 'center',
  },
};


