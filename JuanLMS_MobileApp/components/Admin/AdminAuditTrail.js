import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const roles = ['all', 'admin', 'student', 'faculty', 'parent', 'director'];
const actions = ['all', 'Login', 'Logout', 'Update', 'Create Account', 'Archive Account'];

function groupLogsByDay(logs) {
  return logs.reduce((acc, log) => {
    const day = moment(log.timestamp).format('YYYY-MM-DD');
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});
}

export default function AdminAuditTrail() {
  const [userFilter, setUserFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchLogs = async () => {
      const storedLogs = await AsyncStorage.getItem('auditLogs');
      setLogs(storedLogs ? JSON.parse(storedLogs) : []);
    };
    if (isFocused) fetchLogs();
  }, [isFocused]);

  // Filtering logic
  const filteredLogs = logs.filter(log => {
    const userMatch = userFilter === '' || log.userName.toLowerCase().includes(userFilter.toLowerCase());
    const roleMatch = roleFilter === 'all' || log.userRole === roleFilter;
    const actionMatch = actionFilter === 'all' || log.action === actionFilter;
    return userMatch && roleMatch && actionMatch;
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
      {/* Filters */}
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Search by user name..."
          value={userFilter}
          onChangeText={setUserFilter}
        />
        <View style={styles.pickerRow}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={roleFilter}
              onValueChange={setRoleFilter}
              style={styles.picker}
              dropdownIconColor="#00418b"
            >
              {roles.map(role => (
                <Picker.Item key={role} label={role.charAt(0).toUpperCase() + role.slice(1)} value={role} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={actionFilter}
              onValueChange={setActionFilter}
              style={styles.picker}
              dropdownIconColor="#00418b"
            >
              {actions.map(action => (
                <Picker.Item key={action} label={action} value={action} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      {/* Audit Trail List */}
      <FlatList
        data={days}
        keyExtractor={item => item}
        renderItem={({ item: day }) => (
          <View style={styles.daySection}>
            <Text style={styles.dayHeader}>{moment(day).format('MMMM D, YYYY')}</Text>
            {grouped[day].map(log => (
              <View key={log._id || log.id} style={styles.card}>
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
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  pickerContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginRight: 8 },
  picker: { height: 40, color: '#00418b' },
  daySection: { marginBottom: 18 },
  dayHeader: { fontSize: 16, fontWeight: 'bold', color: '#00418b', marginBottom: 6, fontFamily: 'Poppins-SemiBold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  role: { fontSize: 13, color: '#888', fontWeight: 'normal' },
  action: { fontSize: 14, color: '#00418b', marginRight: 8 },
  time: { fontSize: 13, color: '#888', marginLeft: 'auto' },
}); 