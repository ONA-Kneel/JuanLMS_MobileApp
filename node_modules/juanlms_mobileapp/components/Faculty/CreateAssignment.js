import React, { useState } from 'react';
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

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function CreateAssignment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { classId, classInfo } = route.params || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [points, setPoints] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
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

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const assignmentData = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        points: parseInt(points),
        dueDate: dueDate.toISOString(),
        classID: classId,
        type: 'assignment'
      };

      const response = await fetch(`${API_BASE}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignmentData)
      });

      if (response.ok) {
        Alert.alert('Success', 'Assignment created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assignment');
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
              {classInfo?.className || 'Class'} - {classInfo?.classCode || 'Code'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
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
              onChangeText={setPoints}
              keyboardType="numeric"
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
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </KeyboardAvoidingView>
  );
}
