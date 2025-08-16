import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDate } from '../../utils/dateUtils';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

function groupLogsByDay(logs) {
  return logs.reduce((acc, log) => {
    const day = formatDate(log.timestamp, 'YYYY-MM-DD');
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});
}

export default function VPEAuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'academic', 'faculty', 'admin'
  const isFocused = useIsFocused();

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/audit-logs?page=1&limit=100`);

      if (response.data && response.data.logs && Array.isArray(response.data.logs)) {
        setLogs(response.data.logs);
        setFilteredLogs(response.data.logs);
      } else {
        setLogs([]);
        setFilteredLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to fetch audit logs. Please try again.');
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

  useEffect(() => {
    let filtered = logs;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(log => {
        const userRole = log.userRole?.toLowerCase() || '';
        return userRole.includes(activeFilter);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(log => {
        const userName = log.userName?.toLowerCase() || '';
        const userRole = log.userRole?.toLowerCase() || '';
        const action = log.action?.toLowerCase() || '';
        const details = log.details?.toLowerCase() || '';

        return (
          userName.includes(query) ||
          userRole.includes(query) ||
          action.includes(query) ||
          details.includes(query)
        );
      });
    }

    setFilteredLogs(filtered);
  }, [searchQuery, logs, activeFilter]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getFilterColor = (filter) => {
    return activeFilter === filter ? '#00418b' : '#666';
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

        {searchQuery.length > 0 && (
          <Text style={styles.resultsCount}>
            {filteredLogs.length} result{filteredLogs.length !== 1 ? 's' : ''} found
          </Text>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, { color: getFilterColor('all') }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'academic' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('academic')}
          >
            <Text style={[styles.filterText, { color: getFilterColor('academic') }]}>Academic</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'faculty' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('faculty')}
          >
            <Text style={[styles.filterText, { color: getFilterColor('faculty') }]}>Faculty</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'admin' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('admin')}
          >
            <Text style={[styles.filterText, { color: getFilterColor('admin') }]}>Admin</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Audit Trail List */}
      <FlatList
        data={days}
        keyExtractor={item => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: day }) => (
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
        )}
        ListEmptyComponent={
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
                  {searchQuery || activeFilter !== 'all'
                    ? 'No results found for your search/filter.'
                    : 'No logs found.'}
                </Text>
                {(searchQuery || activeFilter !== 'all') && (
                  <Text style={styles.emptySubtext}>Try adjusting your search terms or filters.</Text>
                )}
              </>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fa', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#00418b', fontFamily: 'Poppins-Bold' },
  searchContainer: { marginBottom: 16 },
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
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#333', fontFamily: 'Poppins-Regular', paddingVertical: 8 },
  clearButton: { padding: 4 },
  resultsCount: { fontSize: 14, color: '#666', fontFamily: 'Poppins-Regular', marginTop: 8, textAlign: 'center' },
  filterContainer: { marginBottom: 16 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterTab: { backgroundColor: '#00418b', borderColor: '#00418b' },
  filterText: { fontSize: 14, fontWeight: '600', fontFamily: 'Poppins-SemiBold' },
  daySection: { marginBottom: 18 },
  dayHeader: { fontSize: 16, fontWeight: 'bold', color: '#00418b', marginBottom: 6, fontFamily: 'Poppins-SemiBold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#222', fontFamily: 'Poppins-SemiBold' },
  role: { fontSize: 13, color: '#888', fontWeight: 'normal', fontFamily: 'Poppins-Regular' },
  action: { fontSize: 14, color: '#00418b', fontFamily: 'Poppins-Regular', marginRight: 8 },
  time: { fontSize: 13, color: '#888', fontFamily: 'Poppins-Regular', marginLeft: 'auto' },
  detailsRow: { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  details: { fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular', fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#888', fontFamily: 'Poppins-Regular', textAlign: 'center', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#999', fontFamily: 'Poppins-Regular', textAlign: 'center', marginTop: 4 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#ff6b6b', fontFamily: 'Poppins-Regular', textAlign: 'center', marginTop: 12, marginBottom: 20 },
  retryButton: { backgroundColor: '#00418b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins-Medium' },
});
