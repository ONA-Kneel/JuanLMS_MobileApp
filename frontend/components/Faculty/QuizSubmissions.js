import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function QuizSubmissions() {
  const route = useRoute();
  const navigation = useNavigation();
  const { quizId, quizTitle, className } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState({});
  const [quizInfo, setQuizInfo] = useState(null);

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
    fetchQuizInfo();
    fetchResponses();
  }, [quizId]);

  const fetchQuizInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE}/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setQuizInfo(data);
      }
    } catch (error) {
      console.error('Error fetching quiz info:', error);
    }
  };

  const fetchResponses = async () => {
    if (!quizId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE}/api/quizzes/${quizId}/responses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load responses');
      const data = await res.json();
      setResponses(Array.isArray(data) ? data : []);
      const initialScores = {};
      (Array.isArray(data) ? data : []).forEach(r => {
        initialScores[r._id] = r.score ?? '';
      });
      setScores(initialScores);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const saveScore = async (response) => {
    try {
      const scoreVal = Number(scores[response._id]);
      if (Number.isNaN(scoreVal)) {
        Alert.alert('Invalid score', 'Please enter a numeric score');
        return;
      }
      
      // Validate score against quiz total points
      if (quizInfo && scoreVal > quizInfo.points) {
        Alert.alert('Invalid score', `Score cannot exceed ${quizInfo.points} points`);
        return;
      }
      
      setSaving(prev => ({ ...prev, [response._id]: true }));
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE}/api/grades/quiz/${response._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: scoreVal, feedback: '' }),
      });
      if (!res.ok) throw new Error('Failed to save score');
      await fetchResponses();
      Alert.alert('Saved', 'Score updated successfully');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save score');
    } finally {
      setSaving(prev => ({ ...prev, [response._id]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading quiz responses...</Text>
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
          <Text style={styles.headerTitle}>{quizTitle || 'Quiz Submissions'}</Text>
          {className && <Text style={styles.headerSubtitle}>{className}</Text>}
          {quizInfo && (
            <Text style={styles.headerInfo}>
              Total Points: {quizInfo.points || 100} | Responses: {responses.length}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {responses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="quiz" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Responses Yet</Text>
            <Text style={styles.emptyText}>
              Students haven't submitted any responses to this quiz yet.
            </Text>
          </View>
        ) : (
          responses.map((item) => (
            <View key={item._id} style={styles.responseCard}>
              <View style={styles.responseHeader}>
                <View style={styles.studentInfo}>
                  <MaterialIcons name="person" size={20} color="#666" />
                  <Text style={styles.studentName}>
                    {item.studentId ? `${item.studentId.firstname} ${item.studentId.lastname}` : 'Student'}
                  </Text>
                </View>
                <Text style={styles.submissionTime}>
                  {new Date(item.submittedAt).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.scoreSection}>
                <View style={styles.scoreInputContainer}>
                  <Text style={styles.scoreLabel}>Score:</Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="Enter score"
                    keyboardType="numeric"
                    value={String(scores[item._id] ?? '')}
                    onChangeText={(t) => setScores(prev => ({ ...prev, [item._id]: t }))}
                  />
                  <Text style={styles.maxPoints}>/ {quizInfo?.points || 100}</Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => saveScore(item)}
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
              
              {item.score !== undefined && item.score !== null && (
                <View style={styles.currentScore}>
                  <Text style={styles.currentScoreText}>
                    Current Score: {item.score}/{quizInfo?.points || 100}
                  </Text>
                  <Text style={styles.percentageText}>
                    ({Math.round((item.score / (quizInfo?.points || 100)) * 100)}%)
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
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
    flex: 1,
    padding: 16,
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
  responseCard: {
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
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  submissionTime: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
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
    fontSize: 16,
    minWidth: 80,
    textAlign: 'center',
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
    fontFamily: 'Poppins-Medium',
  },
  currentScore: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentScoreText: {
    fontSize: 14,
    color: '#00418b',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  percentageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
};


