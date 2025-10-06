import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchActiveQuarter } from '../../utils/academicContext';

const BASE_URL = 'https://juanlms-webapp-server.onrender.com';
function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
}

export default function FacultyClasses() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
  const [activeQuarter, setActiveQuarter] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    fetchAcademicContext();
    fetchActiveQuarterInfo();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeQuarter) {
      fetchClasses();
    }
  }, [activeQuarter, user]);

  const fetchActiveQuarterInfo = async () => {
    try {
      const quarterInfo = await fetchActiveQuarter();
      console.log('Faculty - Active quarter info:', quarterInfo);
      setActiveQuarter(quarterInfo);
    } catch (error) {
      console.error('Faculty - Error fetching active quarter info:', error);
      // Set default quarter info if fetch fails
      setActiveQuarter({
        quarterName: 'Quarter 1',
        termName: 'Term 1',
        schoolYear: '2025-2026',
        isActive: false
      });
    }
  };

  // Fetch active academic year and term for header
  const fetchAcademicContext = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch('https://juanlms-webapp-server.onrender.com/api/academic-year/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.academicYear) {
          setAcademicContext(`${data.academicYear.year} | ${data.academicYear.currentTerm}`);
        }
      }
    } catch (_) {}
  };

  const fetchClasses = async () => {
    if (!user || !user._id) {
      console.log('No user ID available');
      setLoading(false);
      return;
    }

    if (!activeQuarter) {
      console.log('No active quarter info available yet');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching classes for faculty:', user._id);
      console.log('Filtering by active quarter:', activeQuarter);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`https://juanlms-webapp-server.onrender.com/api/classes/my-classes?facultyID=${user._id}`, {
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
      console.log('API Response:', data);
      
      let userClasses = [];
      if (Array.isArray(data)) {
        userClasses = data;
      } else if (data.success && Array.isArray(data.classes)) {
        userClasses = data.classes;
      } else {
        setClasses([]);
        setError(data.error || 'Failed to fetch classes');
        return;
      }

      console.log('Faculty classes before quarter filtering:', userClasses);
      
      // Apply quarter filtering logic similar to web app
      const filteredClasses = userClasses.filter(cls => {
        // Filter out archived classes
        if (cls.isArchived === true) {
          console.log(`Faculty - Filtering out archived class: ${cls.className || cls.classCode}`);
          return false;
        }
        
        // Filter by academic year (tolerate missing academicYear)
        if (cls.academicYear && cls.academicYear !== activeQuarter.schoolYear) {
          console.log(`Faculty - Filtering out class with wrong year: ${cls.className || cls.classCode} (${cls.academicYear})`);
          return false;
        }
        
        // Filter by term (tolerate missing termName)
        if (cls.termName && cls.termName !== activeQuarter.termName) {
          console.log(`Faculty - Filtering out class with wrong term: ${cls.className || cls.classCode} (${cls.termName})`);
          return false;
        }
        
        // Filter by quarter (tolerate missing quarterName)
        if (cls.quarterName && cls.quarterName !== activeQuarter.quarterName) {
          console.log(`Faculty - Filtering out class with wrong quarter: ${cls.className || cls.classCode} (${cls.quarterName})`);
          return false;
        }
        
        console.log(`Faculty - Including class: ${cls.className || cls.classCode}`);
        return true;
      });
      
      console.log('Faculty classes after quarter filtering:', filteredClasses);
      setClasses(filteredClasses);
      setError(null);
    } catch (error) {
      console.error('Network error fetching classes:', error);
      setClasses([]);
      setError('Network error occurred: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClassPress = (course) => {
    // Find the exact class by classID to avoid wrong navigation
    const exactClass = classes.find(c => c.classID === course.classID);
    if (exactClass) {
      navigation.navigate('FMod', { classId: exactClass.classID });
    } else {
      navigation.navigate('FMod', { classId: course.classID });
    }
  };


  const goBack = () => {
    navigation.goBack();
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Blue background */}
        <View style={styles.blueHeaderBackground} />
        {/* White card header */}
        <View style={styles.whiteHeaderCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <Icon name="arrow-left" size={20} color="#00418b" />
              </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>
                My Classes
              </Text>
              <Text style={styles.headerSubtitle}>{academicContext}</Text>
              <Text style={styles.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
              {activeQuarter && (
                <Text style={styles.quarterInfo}>
                  Active Quarter: {activeQuarter.quarterName} of {activeQuarter.termName}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              
              {/* <TouchableOpacity onPress={createClass} style={styles.createButton}>
                <Icon name="plus" size={20} color="#00418b" />
              </TouchableOpacity> */}
              {/* <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
                {resolveProfileUri() ? (
                  <Image 
                    source={{ uri: resolveProfileUri() }} 
                    style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Image 
                    source={require('../../assets/profile-icon (2).png')} 
                    style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity> */}
            </View>
          </View>
        </View>

        <View style={{ padding: 15 }}>
        {/* Stats Section */}
        {/* {classes.length > 0 && (
          <View style={{ marginTop: 5, backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 10 }}>
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
        )} */}

        {/* Action Buttons */}
        <View style={{ marginBottom: 24, gap: 12 }}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ConfirmClasses')}
            style={{
              backgroundColor: '#1976D2',
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
            <Icon name="check-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ 
              color: '#fff', 
              fontSize: 16, 
              fontWeight: 'bold',
              fontFamily: 'Poppins-Bold'
            }}>
              Confirm Classes
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
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {classes.map((course, index) => {
              const imageUrl = getImageUrl(course.image);
              console.log('Class:', course.className, 'course.image:', course.image, 'imageUrl:', imageUrl);
              return (
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
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {course.image ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                      />
                    ) : (
                      <Icon name="book-open-page-variant" size={48} color="#00418b" />
                    )}
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
              );
            })}
          </View>
        )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  blueHeaderBackground: {
    backgroundColor: '#00418b',
    height: 90,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  whiteHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -40,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: '#222',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  headerSubtitle2: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  quarterInfo: {
    color: '#00418b',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  backButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
}; 