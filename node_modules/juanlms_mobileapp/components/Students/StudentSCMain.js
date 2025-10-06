import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StudentSCMainStyle from '../styles/Stud/StudentSCMainStyle';
import StudentDashboardStyle from '../styles/Stud/StudentDashStyle';
import { useUser } from '../UserContext';
import { useNotifications } from '../../NotificationContext';
import NotificationCenter from '../NotificationCenter';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


export default function StudentSCMain() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
  };

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

  const academicContext = user?.academicYear ? `${user.academicYear} | ${user.term || 'Term 1'}` : '2025-2026 | Term 1';
  const currentDateTime = new Date();

  return (
    <View style={StudentSCMainStyle.container}>
      <View style={
      {
        paddingBottom: 80,
        // paddingHorizontal: 20,
        // paddingTop: 120, // Space for fixed header
      }
      }/>
      {/* Blue background */}
      <View style={StudentDashboardStyle.blueHeaderBackground} />
      
      {/* White card header */}
      <View style={StudentDashboardStyle.whiteHeaderCard}>
        <TouchableOpacity
          style={StudentSCMainStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={StudentSCMainStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={StudentDashboardStyle.headerTitle}>
              Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Student'}!</Text>
            </Text>
              <Text style={StudentDashboardStyle.headerSubtitle}>{academicContext}</Text>
             <Text style={StudentDashboardStyle.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => setShowNotificationCenter(true)}
              style={{ marginRight: 12, position: 'relative', opacity: 0 }}
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
            <TouchableOpacity onPress={() => navigation.navigate('SProfile')}>
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
      <View style={StudentSCMainStyle.header}>
        <TouchableOpacity
          style={StudentSCMainStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={StudentSCMainStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/Logo3.svg')}
          style={StudentSCMainStyle.logo}
          resizeMode="contain"
        />
      </View>

      {/* Card with plus button */}
      <View style={StudentSCMainStyle.card}>
        <TouchableOpacity
          style={StudentSCMainStyle.crossButton}
          onPress={() => navigation.navigate('DSupCent')}
        >
          <Text style={StudentSCMainStyle.crossText}>+</Text>
        </TouchableOpacity>

        <View style={StudentSCMainStyle.iconContainer}>
          <Image
            //source={require('../../assets/support-icon.png')}
            style={StudentSCMainStyle.icon}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Active Requests/Problems List */}
      <Text style={StudentSCMainStyle.sectionTitle}>Active Request/Problem</Text>

      <TouchableOpacity style={StudentSCMainStyle.problemBox}>
        <View style={StudentSCMainStyle.messageRow}>
          <Image
            //source={require('../../assets/mail-icon.png')}
            style={StudentSCMainStyle.mailIcon}
            resizeMode="contain"
          />
          <Text style={StudentSCMainStyle.messageTextBold}>Problem title</Text>
        </View>
        <Text style={StudentSCMainStyle.checkMark}>✔✔</Text>
      </TouchableOpacity>

      <TouchableOpacity style={StudentSCMainStyle.requestBox}>
        <View style={StudentSCMainStyle.messageRow}>
          <Image
            //source={require('../../assets/mail-icon.png')}
            style={StudentSCMainStyle.mailIcon}
            resizeMode="contain"
          />
          <Text style={StudentSCMainStyle.messageTextBold}>Request Title</Text>
        </View>
        <Text style={StudentSCMainStyle.checkMark}>✔</Text>
      </TouchableOpacity>
      
      {/* Notification Center */}
      <NotificationCenter 
        visible={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />
    </View>
  );
}
