import { Text, TouchableOpacity, View, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AdminDashStyle from '../styles/administrator/AdminDashStyle';
import { useUser } from '../UserContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

export default function AdminDashboard() {
  const changeScreen = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Audit Logs preview
  useEffect(() => {
    const fetchRecentLogs = async () => {
      const storedLogs = await AsyncStorage.getItem('auditLogs');
      if (storedLogs) {
        const logs = JSON.parse(storedLogs);
        // Get the 2 most recent logs
        const recent = logs
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 2);
        setRecentLogs(recent);
      }
    };
    fetchRecentLogs();
  }, []);

  // 
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

  const Schedules = () => {
    changeScreen.navigate("GSched")
  }
  const Progressive = () => {
    changeScreen.navigate("AProg")
  }
  const AdminFact = () => {
    changeScreen.navigate("AFaculty")
  }

  return (
    <View style={AdminDashStyle.container}>
      {/* Blue background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
      {/* White card header */}
      <View style={{ backgroundColor: '#fff', borderRadius: 18, marginTop: 20, marginBottom: 10, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, zIndex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 20, color: '#00418b' }}>Hello, <Text style={{ fontWeight: 'bold' }}>{user?.firstname || 'Admin'}!</Text></Text>
            <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 13 }}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('AProfile')}>
            <Image 
              source={require('../../assets/profile-icon.png')} 
              style={{ width: 36, height: 36, borderRadius: 18 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 2, paddingTop: 10 }}>
        {/* Recent Activity Section */}
        <View style={{ marginTop: 30, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'Poppins-Bold', color: '#00418b' }}>Recent Activity</Text>
            <TouchableOpacity onPress={() => changeScreen.navigate('AAuditTrail')}>
              <Text style={{ color: '#00418b', fontFamily: 'Poppins-Regular' }}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentLogs.map((log, index) => (
            <View key={index} style={{ 
              backgroundColor: '#fff', 
              borderRadius: 12, 
              padding: 12, 
              marginBottom: 8,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Icon name="account" size={20} color="#00418b" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#222' }}>
                  {log.userName} <Text style={{ color: '#888', fontWeight: 'normal' }}>({log.userRole})</Text>
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="flash" size={16} color="#888" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 13, color: '#00418b', fontFamily: 'Poppins-Regular' }}>{log.action}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Poppins-Regular' }}>
                  {moment(log.timestamp).format('MMM D, hh:mm A')}
                </Text>
              </View>
            </View>
          ))}
          
          {recentLogs.length === 0 && (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#888', fontFamily: 'Poppins-Regular' }}>
              No recent activity found
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}