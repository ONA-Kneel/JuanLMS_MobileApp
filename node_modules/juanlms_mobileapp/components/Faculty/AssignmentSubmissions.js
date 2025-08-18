import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function AssignmentSubmissions() {
  const route = useRoute();
  const navigation = useNavigation();
  const { assignmentId, assignmentTitle, className } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}/submissions`, {
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
      const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}/grade`, {
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 12 }}>Loading submissions...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ backgroundColor: '#00418b', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{assignmentTitle || 'Assignment'}</Text>
        {!!className && <Text style={{ color: '#e3eefd', marginTop: 4 }}>{className}</Text>}
      </View>

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={submissions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {item.student ? `${item.student.firstname} ${item.student.lastname}` : 'Student'}
            </Text>
            <Text style={{ color: '#666', marginBottom: 8 }}>Status: {item.status}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
                placeholder="Score"
                keyboardType="numeric"
                value={String(scores[item._id] ?? '')}
                onChangeText={(t) => setScores(prev => ({ ...prev, [item._id]: t }))}
              />
              <TouchableOpacity
                onPress={() => saveGrade(item)}
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
            <Text style={{ color: '#666' }}>No submissions yet.</Text>
          </View>
        }
      />
    </View>
  );
}


