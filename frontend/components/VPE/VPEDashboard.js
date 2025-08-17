import { Text, TouchableOpacity, View, ScrollView, Image, Dimensions, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    fetchAcademicYear();
  }, []);

  const fetchAcademicYear = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const academicResponse = await fetch(`${API_BASE_URL}/api/academic-year/active`, {
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
      setAcademicContext(`${activeYear} | ${activeTerm}`);
    } catch (error) {
      console.error('Error fetching academic year:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data from multiple endpoints
      const [userCounts, recentLogins] = await Promise.all([
        axios.get(`${API_BASE_URL}/user-counts`),
        axios.get(`${API_BASE_URL}/audit-logs/last-logins`)
      ]);
      
      if (userCounts.data && recentLogins.data) {
        const totalUsers = (userCounts.data.admin || 0) + (userCounts.data.faculty || 0) + (userCounts.data.student || 0);
        setUserStats({
          admin: userCounts.data.admin || 0,
          faculty: userCounts.data.faculty || 0,
          student: userCounts.data.student || 0,
          vpe: userCounts.data.vpe || 0,
          principal: userCounts.data.principal || 0
        });
        setLastLogins(recentLogins.data.lastLogins || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      
      // Fallback to mock data if all else fails
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
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

  const formatDateTime = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

        {/* Audit Trail Preview */}
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>User</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Action</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Time</Text>
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
                    {log.userName}
                  </Text>
                  <Text style={[styles.tableCellText, { flex: 1 }]} numberOfLines={1}>
                    {log.action}
                  </Text>
                  <Text style={[styles.tableCellText, { flex: 2 }]} numberOfLines={1}>
                    {formatDate(log.timestamp)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recent activities found</Text>
              </View>
            )}
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
              onPress={() => navigateToScreen('VPEProfile')}
            >
              <Icon name="account" size={32} color="#00418b" />
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 16,
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
    marginBottom: 12,
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
    fontFamily: 'Poppins-Bold',
    color: '#333',
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
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    fontStyle: 'italic',
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
    width: (width - 60) / 2, // 2 cards per row with margins
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});


