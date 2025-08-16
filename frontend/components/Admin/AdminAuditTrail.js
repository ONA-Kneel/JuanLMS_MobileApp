import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDate } from '../../utils/dateUtils';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

function groupLogsByDay(logs) {
  return logs.reduce((acc, log) => {
    const day = formatDate(log.timestamp, 'YYYY-MM-DD');
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});
}

export default function AdminAuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const isFocused = useIsFocused();

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch audit logs from backend API
      const response = await axios.get(`${API_BASE_URL}/api/admin/audit-preview?limit=100`);
      
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          setLogs([]);
          setFilteredLogs([]);
          setError('No audit logs found');
        } else {
          setLogs(response.data);
          setFilteredLogs(response.data);
        }
      } else {
        setLogs([]);
        setFilteredLogs([]);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please check if backend is running.');
      } else if (error.response?.status === 404) {
        setError('Audit logs endpoint not found. Please check backend configuration.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to fetch audit logs. Please try again.');
      }
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      fetchLogs();
    }
  }, [isFocused]);

  // Filter logs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = logs.filter(log => {
      const userName = log.userName?.toLowerCase() || '';
      const userRole = log.userRole?.toLowerCase() || '';
      const action = log.action?.toLowerCase() || '';
      const details = log.details?.toLowerCase() || '';
      
      return userName.includes(query) || 
             userRole.includes(query) || 
             action.includes(query) ||
             details.includes(query);
    });
    
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const grouped = groupLogsByDay(filteredLogs);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLogs}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Audit Trail</Text>
        <Icon name="history" size={28} color="#00418b" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by user, role, or action..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Results Count */}
        {searchQuery.length > 0 && (
          <Text style={styles.resultsCount}>
            {filteredLogs.length} result{filteredLogs.length !== 1 ? 's' : ''} found
          </Text>
        )}
      </View>

      {/* Audit Trail List */}
      <FlatList
        data={days}
        keyExtractor={item => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: day }) => {
          return (
            <View style={styles.daySection}>
              <Text style={styles.dayHeader}>{formatDate(day, 'MMMM D, YYYY')}</Text>
              {[...grouped[day]]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((log, idx) => (
                  <View key={log._id || log.id || idx} style={styles.card}>
                    <View style={styles.cardRow}>
                      <Icon name="account" size={24} color="#00418b" style={{ marginRight: 8 }} />
                      <Text style={styles.userName}>
                        {log.userName} <Text style={styles.role}>({log.userRole})</Text>
                      </Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Icon name="flash" size={20} color="#888" style={{ marginRight: 4 }} />
                      <Text style={styles.action}>{log.action}</Text>
                      <Text style={styles.time}>{formatDate(log.timestamp, 'hh:mm A')}</Text>
                    </View>
                    {log.details && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.details}>{log.details}</Text>
                      </View>
                    )}
                  </View>
                ))}
            </View>
          );
        }}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <>
                <Icon name="loading" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Loading audit logs...</Text>
              </>
            ) : (
              <>
                <Icon name="file-search-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery.length > 0 ? 'No results found for your search.' : 'No logs found.'}
                </Text>
                {searchQuery.length > 0 && (
                  <Text style={styles.emptySubtext}>Try adjusting your search terms.</Text>
                )}
              </>
            )}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f7f9fa', 
    padding: 16 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#00418b', 
    fontFamily: 'Poppins-Bold' 
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  daySection: { 
    marginBottom: 18 
  },
  dayHeader: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#00418b', 
    marginBottom: 6, 
    fontFamily: 'Poppins-SemiBold' 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.04, 
    shadowRadius: 4, 
    elevation: 1 
  },
  cardRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 2 
  },
  userName: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#222',
    fontFamily: 'Poppins-SemiBold',
  },
  role: { 
    fontSize: 13, 
    color: '#888', 
    fontWeight: 'normal',
    fontFamily: 'Poppins-Regular',
  },
  action: { 
    fontSize: 14, 
    color: '#00418b',
    fontFamily: 'Poppins-Regular',
    marginRight: 8 
  },
  time: { 
    fontSize: 13, 
    color: '#888',
    fontFamily: 'Poppins-Regular',
    marginLeft: 'auto' 
  },
  detailsRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  details: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
}); 