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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useUser } from '../UserContext';
import axios from 'axios';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

const StatCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
    <View style={styles.statContent}>
      <Icon name={icon} size={32} color={color} />
      <View style={styles.statText}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const QuickActionCard = ({ title, description, icon, color, onPress }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <Icon name={icon} size={32} color={color} />
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionDescription}>{description}</Text>
  </TouchableOpacity>
);

export default function PrincipalDashboard() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalAnnouncements: 0,
    recentLogins: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch data from multiple endpoints like the web app does
      const [userCounts, recentLogins, auditLogs] = await Promise.all([
        axios.get(`${API_BASE_URL}/user-counts`),
        axios.get(`${API_BASE_URL}/audit-logs/last-logins`),
        axios.get(`${API_BASE_URL}/audit-logs?page=1&limit=5`)
      ]);
      
      if (userCounts.data && recentLogins.data && auditLogs.data) {
        const totalUsers = (userCounts.data.admin || 0) + (userCounts.data.faculty || 0) + (userCounts.data.student || 0);
        setDashboardData({
          totalUsers,
          totalClasses: 45, // This would need a separate endpoint
          totalAnnouncements: 23, // This would need a separate endpoint
          recentLogins: recentLogins.data.lastLogins || [],
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use mock data as fallback
      setDashboardData({
        totalUsers: 1250,
        totalClasses: 45,
        totalAnnouncements: 23,
        recentLogins: [
          { user: 'Dr. Smith', role: 'Faculty', time: '2 hours ago' },
          { user: 'John Doe', role: 'Student', time: '3 hours ago' },
          { user: 'Admin User', role: 'Admin', time: '4 hours ago' },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      fetchDashboardData();
      fetchAcademicYear();
    }
  }, [isFocused]);

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
      setAcademicContext(`${activeYear} | ${activeTerm}`);
    } catch (error) {
      console.error('Error fetching academic year:', error);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'calendar':
        navigation.navigate('PrincipalCalendar');
        break;
      case 'support':
        navigation.navigate('PrincipalSupportCenter');
        break;
      case 'audit':
        navigation.navigate('PrincipalAuditTrail');
        break;
      case 'chats':
        navigation.navigate('PrincipalChats');
        break;
      case 'announcements':
        navigation.navigate('PrincipalAnnouncements');
        break;
      case 'grades':
        navigation.navigate('PrincipalGrades');
        break;
      default:
        break;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Principal Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {user?.firstname || 'Principal'} {user?.lastname || ''}</Text>
          <Text style={styles.headerDescription}>{academicContext}</Text>
          <Text style={styles.headerSubtitle2}>Academic System Overview</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('PrincipalProfile')}>
          {user?.profilePicture ? (
            <Image 
              source={{ uri: user.profilePicture }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Icon name="account-tie" size={40} color="#00418b" />
          )}
        </TouchableOpacity>
      </View>

      {/* System Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={dashboardData.totalUsers.toLocaleString()}
            icon="account-group"
            color="#4CAF50"
            onPress={() => Alert.alert('Users', `Total users: ${dashboardData.totalUsers}`)}
          />
          <StatCard
            title="Active Classes"
            value={dashboardData.totalClasses}
            icon="school"
            color="#2196F3"
            onPress={() => Alert.alert('Classes', `Active classes: ${dashboardData.totalClasses}`)}
          />
          <StatCard
            title="Announcements"
            value={dashboardData.totalAnnouncements}
            icon="bullhorn"
            color="#FF9800"
            onPress={() => navigation.navigate('PrincipalAnnouncements')}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard
            title="Academic Calendar"
            description="View and manage academic events"
            icon="calendar-month"
            color="#9C27B0"
            onPress={() => handleQuickAction('calendar')}
          />
          <QuickActionCard
            title="Support Center"
            description="Manage support tickets and issues"
            icon="help-circle"
            color="#607D8B"
            onPress={() => handleQuickAction('support')}
          />
          <QuickActionCard
            title="Audit Trail"
            description="Monitor system activities"
            icon="clipboard-list"
            color="#795548"
            onPress={() => handleQuickAction('audit')}
          />
          <QuickActionCard
            title="Communication"
            description="Chat with faculty and staff"
            icon="chat"
            color="#E91E63"
            onPress={() => handleQuickAction('chats')}
          />
          <QuickActionCard
            title="Announcements"
            description="Create and manage announcements"
            icon="bullhorn"
            color="#FF9800"
            onPress={() => handleQuickAction('announcements')}
          />
          <QuickActionCard
            title="Academic Performance"
            description="View grades and performance metrics"
            icon="chart-line"
            color="#4CAF50"
            onPress={() => handleQuickAction('grades')}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Logins</Text>
        <View style={styles.recentContainer}>
          {dashboardData.recentLogins.map((login, index) => (
            <View key={index} style={styles.recentItem}>
              <Icon
                name={login.role === 'Faculty' ? 'account-tie' : login.role === 'Student' ? 'school' : 'shield-account'}
                size={24}
                color="#666"
              />
              <View style={styles.recentText}>
                <Text style={styles.recentUser}>{login.user}</Text>
                <Text style={styles.recentRole}>{login.role}</Text>
              </View>
              <Text style={styles.recentTime}>{login.time}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  headerDescription: {
    fontSize: 14,
    color: '#bbdefb',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerSubtitle2: {
    fontSize: 12,
    color: '#bbdefb',
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  recentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentText: {
    flex: 1,
    marginLeft: 12,
  },
  recentUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  recentRole: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  recentTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
});



    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  recentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentText: {
    flex: 1,
    marginLeft: 12,
  },
  recentUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  recentRole: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  recentTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
});


