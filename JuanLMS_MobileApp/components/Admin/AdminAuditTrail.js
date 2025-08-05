import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

function groupLogsByDay(logs) {
  return logs.reduce((acc, log) => {
    const day = moment(log.timestamp).format('YYYY-MM-DD');
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});
}

function getUniqueUsersByRole(logs) {
  const usersByRole = {};
  logs.forEach(log => {
    if (!usersByRole[log.userRole]) usersByRole[log.userRole] = [];
    if (!usersByRole[log.userRole].some(u => u.userId === log.userId)) {
      usersByRole[log.userRole].push({ userId: log.userId, userName: log.userName });
    }
  });
  return usersByRole;
}

export default function AdminAuditTrail() {
  const [selectedUser, setSelectedUser] = useState('all');
  const [logs, setLogs] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchLogs = async () => {
      const storedLogs = await AsyncStorage.getItem('auditLogs');
      setLogs(storedLogs ? JSON.parse(storedLogs) : []);
    };
    if (isFocused) fetchLogs();
  }, [isFocused]);

  // Prepare user dropdown options
  const usersByRole = getUniqueUsersByRole(logs);
  const pickerItems = [
    <Picker.Item key="all" label="All Users" value="all" />,
    ...Object.entries(usersByRole).flatMap(([role, users]) =>
      users.map(user => (
        <Picker.Item
          key={`${user.userId}-${role}`}
          label={`${user.userName} (${role})`}
          value={`${user.userId}-${role}`}
        />
      ))
    )
  ];

  // Filtering logic (by selected user and role)
  const filteredLogs = logs.filter(log => {
    return selectedUser === 'all' || `${log.userId}-${log.userRole}` === selectedUser;
  });

  const grouped = groupLogsByDay(filteredLogs);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <View style={styles.container}>
         {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Audit Trail</Text>
        <Icon name="history" size={28} color="#00418b" />
      </View>
      {/* User Dropdown Filter */}
      <View style={styles.filters}>
        <Picker
          selectedValue={selectedUser}
          onValueChange={setSelectedUser}
          style={styles.picker}
          dropdownIconColor="#00418b"
        >
          {pickerItems}
        </Picker>
      </View>
      {/* Audit Trail List */}
      <FlatList
        data={days}
        keyExtractor={item => item}
        renderItem={({ item: day }) => (
          <View style={styles.daySection}>
            <Text style={styles.dayHeader}>{moment(day).format('MMMM D, YYYY')}</Text>
            {[...grouped[day]]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((log, idx) => (
                <View key={log._id || log.id || idx} style={styles.card}>
                  <View style={styles.cardRow}>
                    <Icon name="account" size={24} color="#00418b" style={{ marginRight: 8 }} />
                    <Text style={styles.userName}>{log.userName} <Text style={styles.role}>({log.userRole})</Text></Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Icon name="flash" size={20} color="#888" style={{ marginRight: 4 }} />
                    <Text style={styles.action}>{log.action}</Text>
                    <Text style={styles.time}>{moment(log.timestamp).format('hh:mm A')}</Text>
                  </View>
                </View>
              ))}
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>No logs found.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#00418b', fontFamily: 'Poppins-Bold' },
  filters: { marginBottom: 10 },
  picker: { backgroundColor: '#fff', borderRadius: 8, height: 40, color: '#00418b', borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8 },
  daySection: { marginBottom: 18 },
  dayHeader: { fontSize: 16, fontWeight: 'bold', color: '#00418b', marginBottom: 6, fontFamily: 'Poppins-SemiBold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  role: { fontSize: 13, color: '#888', fontWeight: 'normal' },
  action: { fontSize: 14, color: '#00418b', marginRight: 8 },
  time: { fontSize: 13, color: '#888', marginLeft: 'auto' },
}); 