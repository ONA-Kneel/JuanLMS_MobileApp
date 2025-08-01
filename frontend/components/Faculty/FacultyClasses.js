import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';

export default function FacultyClasses() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user || !user._id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching classes for faculty:', user._id);
        const response = await fetch(`https://juanlms-mobileapp.onrender.com/api/faculty-classes?facultyID=${user._id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.success && Array.isArray(data.classes)) {
          console.log('Classes loaded successfully:', data.classes);
          setClasses(data.classes);
          setError(null);
        } else {
          console.error('Invalid API Response:', data);
          setClasses([]);
          setError(data.error || 'Failed to fetch classes');
        }
      } catch (error) {
        console.error('Network error fetching classes:', error);
        setClasses([]);
        setError('Network error occurred: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, [user]);

  const handleClassPress = (course) => {
    navigation.navigate('FMod', { classId: course.classID || course._id });
  };

  const createClass = () => {
    navigation.navigate('CClass');
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
          <TouchableOpacity onPress={createClass} style={{ padding: 8 }}>
            <Icon name="plus" size={24} color="#fff" />
          </TouchableOpacity>
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
        {/* Create Class Button */}
        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity 
            onPress={createClass}
            style={{
              backgroundColor: '#00418b',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Icon name="plus-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ 
              color: '#fff', 
              fontSize: 16, 
              fontWeight: 'bold',
              fontFamily: 'Poppins-Bold'
            }}>
              Create New Class
            </Text>
          </TouchableOpacity>
        </View>

        {/* Your Classes Section */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          marginBottom: 16, 
          fontFamily: 'Poppins-Bold',
          color: '#333'
        }}>
          Your Classes
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
              You have no classes yet.
            </Text>
            <TouchableOpacity 
              onPress={createClass}
              style={{ 
                marginTop: 16, 
                backgroundColor: '#00418b', 
                paddingHorizontal: 20, 
                paddingVertical: 12, 
                borderRadius: 8 
              }}>
              <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold' }}>Create Your First Class</Text>
            </TouchableOpacity>
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
                      fontFamily: 'Poppins-Regular',
                      marginBottom: 8
                    }}>
                      {course.classCode || course.code}
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#888',
                      fontFamily: 'Poppins-Regular'
                    }}>
                      {course.members ? course.members.length : 0} Students
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#00418b" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats Section */}
        {classes.length > 0 && (
          <View style={{ marginTop: 32, backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: 'bold', 
              marginBottom: 16, 
              fontFamily: 'Poppins-Bold',
              color: '#333'
            }}>
              Class Statistics
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: '#00418b',
                  fontFamily: 'Poppins-Bold'
                }}>
                  {classes.length}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#666',
                  fontFamily: 'Poppins-Regular'
                }}>
                  Total Classes
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: '#00418b',
                  fontFamily: 'Poppins-Bold'
                }}>
                  {classes.reduce((total, cls) => total + (cls.members ? cls.members.length : 0), 0)}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#666',
                  fontFamily: 'Poppins-Regular'
                }}>
                  Total Students
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
} 