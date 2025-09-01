import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function AssignmentSubmissions() {
  const route = useRoute();
  const navigation = useNavigation();
  const { assignmentId, assignmentTitle, className, onGradingComplete } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
    fetchSubmissions();
  }, [assignmentId]);

  // Add focus listener to refresh grading status when returning
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('DEBUG: AssignmentSubmissions screen focused');
    });
    return unsubscribe;
  }, [navigation]);

  // Add blur listener to trigger grading status refresh when leaving
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      console.log('DEBUG: AssignmentSubmissions screen blurred, triggering grading refresh');
      if (onGradingComplete) {
        onGradingComplete();
      }
    });
    return unsubscribe;
  }, [navigation, onGradingComplete]);

  const fetchSubmissions = async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE}/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load submissions');
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
      const initialScores = {};
      (Array.isArray(data) ? data : []).forEach(s => {
        initialScores[s._id] = s.grade ?? '';
      });
      setScores(initialScores);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const saveGrade = async (submission) => {
    try {
      const gradeVal = Number(scores[submission._id]);
      if (Number.isNaN(gradeVal)) {
        Alert.alert('Invalid score', 'Please enter a numeric score');
        return;
      }
      setSaving(prev => ({ ...prev, [submission._id]: true }));
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE}/assignments/${assignmentId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submissionId: submission._id, grade: gradeVal, feedback: '' }),
      });
      if (!res.ok) throw new Error('Failed to save grade');
      await fetchSubmissions();
      Alert.alert('Saved', 'Grade updated');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save grade');
    } finally {
      setSaving(prev => ({ ...prev, [submission._id]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading submissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{assignmentTitle || 'Assignment Submissions'}</Text>
          {className && <Text style={styles.headerSubtitle}>{className}</Text>}
          <Text style={styles.headerInfo}>
            Total Submissions: {submissions.length}
          </Text>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.content}
        data={submissions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.submissionCard}>
            <Text style={styles.studentName}>
              {item.student ? `${item.student.firstname} ${item.student.lastname}` : 'Student'}
            </Text>
            <Text style={styles.submissionStatus}>Status: {item.status}</Text>
            <View style={styles.gradingSection}>
              <View style={styles.scoreInputContainer}>
                <Text style={styles.scoreLabel}>Score:</Text>
                <TextInput
                  style={styles.scoreInput}
                  placeholder="Enter score"
                  keyboardType="numeric"
                  value={String(scores[item._id] ?? '')}
                  onChangeText={(t) => setScores(prev => ({ ...prev, [item._id]: t }))}
                />
                <Text style={styles.maxPoints}>/ 100</Text>
              </View>
              <TouchableOpacity
                onPress={() => saveGrade(item)}
                style={[styles.saveButton, saving[item._id] && styles.saveButtonDisabled]}
                disabled={!!saving[item._id]}
              >
                {saving[item._id] ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={16} color="#fff" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {item.grade !== undefined && item.grade !== null && (
              <View style={styles.currentScore}>
                <Text style={styles.currentScoreText}>
                  Current Score: {item.grade}/100
                </Text>
                <Text style={styles.percentageText}>
                  ({item.grade}%)
                </Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Submissions Yet</Text>
            <Text style={styles.emptyText}>
              Students haven't submitted any assignments yet.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  header: {
    backgroundColor: '#00418b',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    color: '#e3eefd',
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  headerInfo: {
    color: '#e3eefd',
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  content: {
    padding: 16,
  },
  submissionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  submissionStatus: {
    color: '#666',
    marginBottom: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  gradingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
    fontFamily: 'Poppins-Medium',
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    minWidth: 80,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  maxPoints: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
  },
  saveButton: {
    backgroundColor: '#00418b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  currentScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  currentScoreText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Medium',
  },
  percentageText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    fontFamily: 'Poppins-Bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
};


