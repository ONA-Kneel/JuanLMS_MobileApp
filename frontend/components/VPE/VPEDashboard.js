import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../UserContext';
import axios from 'axios';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

export default function VPEDashboard() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalAnnouncements: 0,
    recentLogins: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  useEffect(() => {
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
      setAcademicContext(`${activeYear} | ${activeTerm}`);
    } catch (error) {
      console.error('Error fetching academic year:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch data from multiple endpoints like the web app does
      const [userCounts, recentLogins] = await Promise.all([
        axios.get(`${API_BASE_URL}/user-counts`),
        axios.get(`${API_BASE_URL}/audit-logs/last-logins`)
      ]);
      
      if (userCounts.data && recentLogins.data) {
        const totalUsers = (userCounts.data.admin || 0) + (userCounts.data.faculty || 0) + (userCounts.data.student || 0);
        setStats({
          totalUsers,
          totalClasses: 0, // Will be implemented when class API is available
          totalAnnouncements: 0, // Will be implemented when announcement API is available
          recentLogins: recentLogins.data.lastLogins || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

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

  const QuickActionCard = ({ title, description, icon, onPress }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <Icon name={icon} size={24} color="#00418b" />
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionDescription}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.roleText}>{user?.firstname || 'VPE'} {user?.lastname || ''}</Text>
          <Text style={styles.subRoleText}>Vice President in Education</Text>
          <Text style={styles.academicContext}>{academicContext}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('VPEProfile')}>
          {user?.profilePicture ? (
            <Image 
              source={{ uri: user.profilePicture }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Icon name="school" size={40} color="#00418b" />
          )}
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="account-group"
            color="#4CAF50"
            onPress={() => navigateToScreen('VPEUsers')}
          />
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon="book-open-variant"
            color="#2196F3"
            onPress={() => navigateToScreen('VPEClasses')}
          />
          <StatCard
            title="Announcements"
            value={stats.totalAnnouncements}
            icon="bullhorn"
            color="#FF9800"
            onPress={() => navigateToScreen('VPEAnnouncements')}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            title="View Calendar"
            description="Check academic calendar and events"
            icon="calendar"
            onPress={() => navigateToScreen('VPECalendar')}
          />
          <QuickActionCard
            title="Support Center"
            description="Manage support tickets and issues"
            icon="help-circle"
            onPress={() => navigateToScreen('VPESupportCenter')}
          />
          <QuickActionCard
            title="Audit Trail"
            description="View system activity logs"
            icon="history"
            onPress={() => navigateToScreen('VPEAuditTrail')}
          />
          <QuickActionCard
            title="Chats"
            description="Communicate with staff and faculty"
            icon="chat"
            onPress={() => navigateToScreen('VPEChats')}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Logins</Text>
        <View style={styles.recentActivityCard}>
          {stats.recentLogins.length > 0 ? (
            stats.recentLogins.slice(0, 5).map((login, index) => (
              <View key={index} style={styles.activityRow}>
                <Icon name="account-circle" size={20} color="#00418b" />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityUser}>{login.userName}</Text>
                  <Text style={styles.activityRole}>{login.role}</Text>
                </View>
                <Text style={styles.activityTime}>
                  {new Date(login.lastLogin).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noActivityText}>No recent activity</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  roleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  subRoleText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  academicContext: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statContent: {
    alignItems: 'center',
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
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginBottom: 24,
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
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  recentActivityContainer: {
    marginBottom: 24,
  },
  recentActivityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  activityRole: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  noActivityText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Poppins-Regular',
  },
});



    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  activityRole: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  noActivityText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Poppins-Regular',
  },
});


