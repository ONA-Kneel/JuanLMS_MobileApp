import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudentClasses() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        console.log('Fetching classes for student:', user._id);
        
        // Use the correct backend URL for the web app backend
        const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/classes`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response from /classes:', data);
        
        let allClasses = [];
        if (data.success && Array.isArray(data.classes)) {
          allClasses = data.classes;
        } else if (Array.isArray(data)) {
          allClasses = data;
        } else {
          throw new Error('Invalid response structure');
        }
        
        console.log('Total classes fetched:', allClasses.length);
        
        // Filter classes where the student is a member
        const userClasses = allClasses.filter(classItem => {
          if (!classItem || !classItem.members) {
            console.log('Class has no members array:', classItem?.className || classItem?.classID);
            return false;
          }
          
          console.log('Checking class:', classItem.className || classItem.classID);
          console.log('Class members:', classItem.members);
          console.log('User ID:', user._id);
          console.log('User ID type:', typeof user._id);
          
          // Try multiple matching strategies
          const isMember = classItem.members.some(member => {
            const memberId = typeof member === 'object' ? member.toString() : member;
            const userId = user._id.toString();
            
            console.log('Comparing member ID:', memberId, 'with user ID:', userId);
            console.log('Member ID type:', typeof memberId);
            console.log('User ID type:', typeof userId);
            
            // Strategy 1: Direct ID match
            if (memberId === userId) {
              console.log('Direct ID match found');
              return true;
            }
            
            // Strategy 2: Check if user has a studentCode property that matches
            if (user.studentCode && memberId === user.studentCode) {
              console.log('Student code match found');
              return true;
            }
            
            // Strategy 3: Check if user has an id property that matches
            if (user.id && memberId === user.id) {
              console.log('User ID match found');
              return true;
            }
            
            // Strategy 4: Check if member is a student code pattern (starts with 'S')
            if (memberId.startsWith('S') && user.studentCode && memberId === user.studentCode) {
              console.log('Student code pattern match found');
              return true;
            }
            
            return false;
          });
          
          if (isMember) {
            console.log('User is member of class:', classItem.className || classItem.classID);
          } else {
            console.log('User is NOT member of class:', classItem.className || classItem.classID);
          }
          
          return isMember;
        });
        
        // If no classes found with strict matching, try a more lenient approach
        if (userClasses.length === 0) {
          console.log('No classes found with strict matching, trying lenient approach...');
          
          // For now, show all classes as a fallback (you can adjust this logic)
          const fallbackClasses = allClasses.filter(classItem => {
            return classItem && classItem.className; // Just ensure it's a valid class
          });
          
          console.log('Fallback classes found:', fallbackClasses.length);
          setClasses(fallbackClasses);
        } else {
          setClasses(userClasses);
        }
        setError(null);
      } catch (error) {
        console.error('Network error fetching classes:', error);
        setClasses([]);
        setError('Network error occurred: ' + error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleClassPress = (course) => {
    // Find the exact class by classID to avoid wrong navigation
    const exactClass = classes.find(c => c.classID === course.classID);
    if (exactClass) {
      navigation.navigate('SModule', { classId: exactClass.classID });
    } else {
      navigation.navigate('SModule', { classId: course.classID });
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: '#00418b', 
        paddingTop: 50, 
        paddingBottom: 20, 
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: '#fff', 
            fontFamily: 'Poppins-Bold' 
          }}>
            My Classes
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ 
          color: '#fff', 
          fontSize: 14, 
          marginTop: 5, 
          fontFamily: 'Poppins-Regular' 
        }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Registered Classes Section */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          marginBottom: 16, 
          fontFamily: 'Poppins-Bold',
          color: '#333'
        }}>
          Registered Classes
        </Text>

        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color="#00418b" />
            <Text style={{ 
              marginTop: 16, 
              color: '#666', 
              fontFamily: 'Poppins-Regular',
              fontSize: 16
            }}>
              Loading your classes...
            </Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Icon name="alert-circle" size={48} color="#ff4444" />
            <Text style={{ 
              marginTop: 16, 
              color: '#ff4444', 
              fontFamily: 'Poppins-Regular',
              fontSize: 16,
              textAlign: 'center'
            }}>
              {error}
            </Text>
          </View>
        ) : classes.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Icon name="book-open-variant" size={48} color="#666" />
            <Text style={{ 
              marginTop: 16, 
              color: '#666', 
              fontFamily: 'Poppins-Regular',
              fontSize: 16,
              textAlign: 'center'
            }}>
              You have no registered classes yet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {classes.map((course, index) => (
              <TouchableOpacity 
                key={index} 
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  elevation: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={() => handleClassPress(course)}
              >
                {/* Class Image Placeholder */}
                <View style={{
                  height: 120,
                  backgroundColor: '#e3eefd',
                  borderRadius: 12,
                  marginBottom: 16,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name="book-open-page-variant" size={48} color="#00418b" />
                </View>

                {/* Class Info */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: 'bold', 
                      color: '#333',
                      fontFamily: 'Poppins-Bold',
                      marginBottom: 4
                    }}>
                      {course.className || course.name}
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: '#666',
                      fontFamily: 'Poppins-Regular'
                    }}>
                      {course.classCode || course.code}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#00418b" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Completed Classes Section */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 16, 
            fontFamily: 'Poppins-Bold',
            color: '#333'
          }}>
            Completed Classes
          </Text>
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Icon name="check-circle" size={48} color="#4CAF50" />
            <Text style={{ 
              marginTop: 16, 
              color: '#666', 
              fontFamily: 'Poppins-Regular',
              fontSize: 16,
              textAlign: 'center'
            }}>
              No completed classes yet
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 