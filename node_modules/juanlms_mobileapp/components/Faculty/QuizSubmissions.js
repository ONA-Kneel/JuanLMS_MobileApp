import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function QuizSubmissions() {
  const route = useRoute();
  const navigation = useNavigation();
  const { quizId, quizTitle, className } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
    fetchResponses();
  }, [quizId]);

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
      setSaving(prev => ({ ...prev, [response._id]: true }));
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE}/api/grades/quiz/${response._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: scoreVal, feedback: '' }),
      });
      if (!res.ok) throw new Error('Failed to save score');
      await fetchResponses();
      Alert.alert('Saved', 'Score updated');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save score');
    } finally {
      setSaving(prev => ({ ...prev, [response._id]: false }));
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 12 }}>Loading quiz responses...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ backgroundColor: '#00418b', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{quizTitle || 'Quiz'}</Text>
        {!!className && <Text style={{ color: '#e3eefd', marginTop: 4 }}>{className}</Text>}
      </View>

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={responses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {item.studentId ? `${item.studentId.firstname} ${item.studentId.lastname}` : 'Student'}
            </Text>
            <Text style={{ color: '#666', marginBottom: 8 }}>Submitted: {new Date(item.submittedAt).toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
                placeholder="Score"
                keyboardType="numeric"
                value={String(scores[item._id] ?? '')}
                onChangeText={(t) => setScores(prev => ({ ...prev, [item._id]: t }))}
              />
              <TouchableOpacity
                onPress={() => saveScore(item)}
                style={{ backgroundColor: '#00418b', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginLeft: 8 }}
                disabled={!!saving[item._id]}
              >
                {saving[item._id] ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: '#666' }}>No responses yet.</Text>
          </View>
        }
      />
    </View>
  );
}


