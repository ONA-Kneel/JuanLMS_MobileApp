import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../UserContext';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function CreateAssignment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { classId, classInfo } = route.params || {};
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [points, setPoints] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [facultyClasses, setFacultyClasses] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  useEffect(() => {
    const loadClasses = async () => {
      try {
        if (classId) return; // use provided class from module context
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE}/api/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load classes');
        const data = await res.json();
        const facultyIdentifier = user?.userID || user?._id;
        const mine = Array.isArray(data) 
          ? data.filter(c => c.facultyID === facultyIdentifier)
          : (data.classes || []).filter(c => c.facultyID === facultyIdentifier);
        setFacultyClasses(mine);
        if (mine && mine.length > 0) {
          setSelectedClassIds(mine.map(c => c.classID));
        }
      } catch (e) {
        console.log('Load classes error:', e);
      }
    };
    loadClasses();
  }, [classId, user]);

  const toggleClass = (cid) => {
    setSelectedClassIds(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !points.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(points) <= 0) {
      Alert.alert('Error', 'Points must be greater than 0');
      return;
    }

    if (!classId && selectedClassIds.length === 0) {
      Alert.alert('Select classes', 'Please select at least one class to post the assignment.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const pointsNum = Math.min(parseInt(points), 100);
      const assignmentData = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        points: pointsNum,
        dueDate: dueDate.toISOString(),
        classID: classId, // single when provided
        classIDs: !classId && selectedClassIds.length > 0 ? selectedClassIds : undefined,
        type: 'assignment'
      };

      const attempt = async (url) => {
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(assignmentData)
        });
      };

      console.log('CreateAssignment: POST', `${API_BASE}/assignments`);
      let response = await attempt(`${API_BASE}/assignments`);

      if (response.ok) {
        let infoText = 'Assignment created successfully';
        try {
          const data = await response.json();
          const list = Array.isArray(data) ? data : (data ? [data] : []);
          if (list.length > 0) {
            const names = list.map(a => {
              const match = facultyClasses.find(c => c.classID === a.classID);
              return match ? `${match.className} (${match.classCode})` : a.classID;
            }).filter(Boolean);
            infoText = `Assignment posted to ${list.length} class${list.length > 1 ? 'es' : ''}${names.length ? `:\n${names.join('\n')}` : ''}`;
          }
        } catch (_) { /* ignore non-JSON success bodies */ }
        Alert.alert('Success', infoText, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        let errMsg = 'Failed to create assignment';
        try {
          const clone = response.clone();
          const errorData = await response.json();
          errMsg = errorData.error || errMsg;
        } catch (_) {}
        try {
          const text = await response.text();
          console.log('CreateAssignment error body:', text);
        } catch (_) {
          // ignore
        }
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      Alert.alert('Error', error.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{ 
        backgroundColor: '#00418b', 
        paddingTop: 50, 
        paddingBottom: 20, 
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleBack} style={{ padding: 8, marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              color: '#fff', 
              fontFamily: 'Poppins-Bold'
            }}>
              Create Assignment
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#e3eefd', 
              fontFamily: 'Poppins-Regular',
              marginTop: 4
            }}>
              {classInfo?.className || (classId ? 'Class' : 'Select classes')}{classInfo?.classCode ? ` - ${classInfo.classCode}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Class Selector (when no classId passed) */}
        {!classId && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, fontFamily: 'Poppins-Bold', color: '#333' }}>Assign to Classes</Text>
            {facultyClasses.length === 0 ? (
              <Text style={{ color: '#666', fontFamily: 'Poppins-Regular' }}>No classes found.</Text>
            ) : (
              facultyClasses.map(cls => (
                <TouchableOpacity key={cls.classID} onPress={() => toggleClass(cls.classID)} style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 8
                }}>
                  <Icon name={selectedClassIds.includes(cls.classID) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={selectedClassIds.includes(cls.classID) ? '#00418b' : '#999'} />
                  <Text style={{ marginLeft: 8, color: '#333', fontFamily: 'Poppins-Regular' }}>{cls.className} ({cls.classCode})</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Form */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 20, 
            fontFamily: 'Poppins-Bold',
            color: '#333'
          }}>
            Assignment Details
          </Text>

          {/* Title */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Title *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                fontFamily: 'Poppins-Regular',
                fontSize: 16
              }}
              placeholder="Enter assignment title"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Description *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                fontFamily: 'Poppins-Regular',
                fontSize: 16,
                minHeight: 80,
                textAlignVertical: 'top'
              }}
              placeholder="Enter assignment description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Instructions */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Instructions
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                fontFamily: 'Poppins-Regular',
                fontSize: 16,
                minHeight: 80,
                textAlignVertical: 'top'
              }}
              placeholder="Enter assignment instructions (optional)"
              value={instructions}
              onChangeText={setInstructions}
              multiline
            />
          </View>

          {/* Points */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Points *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                fontFamily: 'Poppins-Regular',
                fontSize: 16
              }}
              placeholder="Enter points value"
              value={points}
              onChangeText={(text) => {
                const onlyNums = text.replace(/[^0-9]/g, '');
                const num = Math.min(parseInt(onlyNums || '0', 10), 100);
                setPoints(onlyNums === '' ? '' : String(num));
              }}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          {/* Due Date */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Due Date
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ 
                fontFamily: 'Poppins-Regular',
                fontSize: 16,
                color: '#333'
              }}>
                {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Icon name="calendar" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#00418b',
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              opacity: loading ? 0.6 : 1
            }}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ 
                color: '#fff', 
                fontSize: 16, 
                fontWeight: 'bold',
                fontFamily: 'Poppins-Bold'
              }}>
                Create Assignment
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
          minimumDate={new Date()}
        />
      )}
    </KeyboardAvoidingView>
  );
}
