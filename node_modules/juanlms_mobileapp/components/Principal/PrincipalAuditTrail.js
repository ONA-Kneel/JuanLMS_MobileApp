import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDate } from '../../utils/dateUtils';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

const getFilterColor = (category) => {
  switch (category.toLowerCase()) {
    case 'academic':
      return '#2196F3';
    case 'faculty':
      return '#FF9800';
    case 'admin':
      return '#9C27B0';
    case 'student':
      return '#4CAF50';
    case 'system':
      return '#607D8B';
    default:
      return '#666';
  }
};

// Normalize categories/roles so filters match expected tabs
const normalizeCategory = (log) => {
  const raw = ((log.category || log.userRole || '') + '').toLowerCase().trim();
  if (raw === 'students') return 'student';
  if (raw === 'vice president of education') return 'admin'; // falls under admin tab, same as web app UX
  return raw;
};

const LogItem = ({ log, onPress }) => (
  <TouchableOpacity style={styles.logItem} onPress={onPress}>
    <View style={styles.logHeader}>
      <View style={styles.logInfo}>
        <Text style={styles.logAction}>{log.action}</Text>
        <View style={[styles.filterBadge, { backgroundColor: getFilterColor(normalizeCategory(log) || 'system') }]}>
          <Text style={styles.filterText}>{(normalizeCategory(log) || 'system')}</Text>
        </View>
      </View>
      <Text style={styles.logTime}>{formatDate(log.timestamp, 'hh:mm A')}</Text>
    </View>

    <Text style={styles.logDetails} numberOfLines={2}>
      {log.details}
    </Text>

    <View style={styles.logFooter}>
      <View style={styles.footerItem}>
        <Icon name="account" size={16} color="#666" />
        <Text style={styles.footerText}>{log.userName}</Text>
      </View>
      <View style={styles.footerItem}>
        <Icon name="monitor" size={16} color="#666" />
        <Text style={styles.footerText}>{log.ipAddress || 'N/A'}</Text>
      </View>
      <View style={styles.footerItem}>
        <Icon name="web" size={16} color="#666" />
        <Text style={styles.footerText}>{log.userAgent || 'Mobile App'}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

function groupLogsByDay(logs) {
  const grouped = {};
  logs.forEach(log => {
    // Use UTC date for stable grouping regardless of device timezone
    const dateKey = new Date(log.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(log);
  });
  return grouped;
}

const sortByTimestampDesc = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);

export default function PrincipalAuditTrail() {
  const isFocused = useIsFocused();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE_URL}/audit-logs?page=1&limit=200&action=all&role=all`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied for your role. Only Admin and Principal can view audit logs.');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.logs && Array.isArray(data.logs)) {
        // Map and normalize categories/roles for stable filtering
        const normalized = data.logs.map(l => ({
          ...l,
          category: normalizeCategory(l) || l.category,
        }));
        // Ensure newest logs appear first consistently
        const sorted = normalized.sort(sortByTimestampDesc);
        setLogs(sorted);
        setFilteredLogs(sorted);
      } else {
        setLogs([]);
        setFilteredLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError(error.message || 'Failed to fetch audit logs. Please try again.');
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockLogs = () => [
    {
      id: 1,
      action: 'Profile Updated',
      details: 'Principal profile information modified - updated office location and contact details',
      category: 'Admin',
      user: 'Dr. Michael Anderson',
      timestamp: '2 hours ago',
      ipAddress: '192.168.1.100',
      userAgent: 'JuanLMS Mobile App v2.1',
    },
    {
      id: 2,
      action: 'Announcement Created',
      details: 'New announcement created: "Faculty Meeting Schedule Update" targeting faculty members',
      category: 'Academic',
      user: 'Dr. Michael Anderson',
      timestamp: '3 hours ago',
      ipAddress: '192.168.1.100',
      userAgent: 'JuanLMS Mobile App v2.1',
    },
    {
      id: 3,
      action: 'Support Ticket Updated',
      details: 'Ticket #1234 status changed from "Open" to "In Progress" - Faculty Meeting Room Booking Issue',
      category: 'Faculty',
      user: 'Dr. Michael Anderson',
      timestamp: '4 hours ago',
      ipAddress: '192.168.1.100',
      userAgent: 'JuanLMS Mobile App v2.1',
    },
    {
      id: 4,
      action: 'User Login',
      details: 'Successful login from mobile application',
      category: 'System',
      user: 'Dr. Michael Anderson',
      timestamp: '5 hours ago',
      ipAddress: '192.168.1.100',
      userAgent: 'JuanLMS Mobile App v2.1',
    },
    {
      id: 5,
      action: 'Grade Report Generated',
      details: 'Institutional grade report exported for Q1 2024 academic performance review',
      category: 'Academic',
      user: 'Dr. Michael Anderson',
      timestamp: '1 day ago',
      ipAddress: '192.168.1.100',
      userAgent: 'JuanLMS Mobile App v2.1',
    },
    {
      id: 6,
      action: 'Faculty Meeting Scheduled',
      details: 'Monthly faculty meeting scheduled for next Tuesday at 2:00 PM in Conference Room A',
      category: 'Faculty',
      user: 'Dr. Michael Anderson',
      timestamp: '2 days ago',
      ipAddress: '192.168.1.100',
      userAgent: 'JuanLMS Mobile App v2.1',
    },
    {
      id: 7,
      action: 'Student Performance Review',
      details: 'Reviewed academic performance metrics for Computer Science department - 8.7% improvement noted',
      category: 'Academic',
      user: 'Dr. Michael Anderson',
      timestamp: '3 days ago',
      ipAddress: '192.168.1.100',
      userAgent: 'JuanLMS Mobile App v2.1',
    },
    {
      id: 8,
      action: 'System Configuration Updated',
      details: 'Updated academic calendar settings and holiday schedule for upcoming semester',
      category: 'Admin',
      user: 'Dr. Michael Anderson',
      timestamp: '1 week ago',
      ipAddress: '192.168.1.100',
      userAgent: 'JuanLMS Mobile App v2.1',
    },
  ];

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
      filtered = filtered.filter(log => normalizeCategory(log) === activeFilter.toLowerCase());
    }

    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        (log.action || '').toLowerCase().includes(query) ||
        (log.details || '').toLowerCase().includes(query) ||
        (log.userName || '').toLowerCase().includes(query) ||
        (normalizeCategory(log) || '').toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  }, [activeFilter, searchQuery, logs]);

  const handleLogPress = (log) => {
    Alert.alert(
      log.action,
      `Details: ${log.details}\n\nUser: ${log.userName} (${log.userRole})\nCategory: ${(log.category || log.userRole || 'system').toString()}\nTime: ${formatDate(log.timestamp, 'MMMM D, YYYY hh:mm A')}\nIP: ${log.ipAddress || 'N/A'}\nUser Agent: ${log.userAgent || 'N/A'}`,
      [{ text: 'Close' }]
    );
  };

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Audit Trail</Text>
        <Text style={styles.headerSubtitle}>Monitor system activities and user actions</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'academic', 'faculty', 'admin', 'student', 'system'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logs List */}
      <View style={styles.content}>
        <FlatList
          data={days}
          keyExtractor={item => item}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item: day }) => (
            <View style={styles.daySection}>
              <Text style={styles.dayHeader}>
                {formatDate(day, 'dddd, MMMM D, YYYY')}
              </Text>
              {[...grouped[day]].sort(sortByTimestampDesc).map((log) => (
                <LogItem
                  key={log._id || log.id}
                  log={log}
                  onPress={() => handleLogPress(log)}
                />
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
                    {searchQuery.length > 0 ? 'No results found for your search.' : 'No logs found.'}
                  </Text>
                  {searchQuery.length > 0 && (
                    <Text style={styles.emptySubtext}>Try adjusting your search terms.</Text>
                  )}
                </>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
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
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
    fontFamily: 'Poppins-Regular',
  },
  clearButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  activeFilterTab: {
    backgroundColor: '#00418b',
    borderColor: '#00418b',
  },
  filterTabText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  activeFilterTabText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  logItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logInfo: {
    flex: 1,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    fontFamily: 'Poppins-SemiBold',
  },
  filterBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  logTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  logDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'Poppins-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
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
