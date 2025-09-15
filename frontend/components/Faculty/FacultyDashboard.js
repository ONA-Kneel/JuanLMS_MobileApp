import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import FacultyDashStyle from '../styles/faculty/FacultyDashStyle';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FacultyDashboard() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch classes for the logged-in faculty
    const fetchClasses = async () => {
      if (!user || !user._id) {
        console.log('No user or user ID available');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        console.log('Fetching classes for faculty:', user._id);
        // First, get the current active academic year and term
        const academicResponse = await fetch(`https://juanlms-webapp-server.onrender.com/api/academic-year/active`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        let activeYear = '2025-2026';
        let activeTerm = 'Term 1';
        
        if (academicResponse.ok) {
          const academicData = await academicResponse.json();
          console.log('Academic year API response:', academicData);
          if (academicData.success && academicData.academicYear) {
            activeYear = academicData.academicYear.year;
            activeTerm = academicData.academicYear.currentTerm;
            console.log('Using academic year data:', activeYear, activeTerm);
          } else {
            console.log('Academic year data not in expected format:', academicData);
          }
        } else {
          console.log('Academic year API not available, using default values');
          console.log('Response status:', academicResponse.status);
        }

        console.log('Active Academic Year:', activeYear, 'Term:', activeTerm);
        
        // Update academic context for display
        setAcademicContext(`${activeYear} | ${activeTerm}`);

        // Fetch all classes first (revert to original API call)
        const response = await fetch(`https://juanlms-webapp-server.onrender.com/classes/faculty-classes`, {
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
        console.log('Classes API Response:', data);
        
        let allClasses = [];
        if (Array.isArray(data)) {
          allClasses = data;
          console.log('Classes array length:', allClasses.length);
        } else if (data.success && Array.isArray(data.classes)) {
          allClasses = data.classes;
          console.log('Classes from success response length:', allClasses.length);
        } else {
          console.log('Unexpected data format:', data);
          setClasses([]);
          setError(data.error || 'Failed to fetch classes');
          return;
        }
        
        // Log first few classes for debugging
        if (allClasses.length > 0) {
          console.log('First class sample:', allClasses[0]);
          console.log('Class properties:', Object.keys(allClasses[0]));
        }

        // Filter classes by active term and status
        const filteredClasses = allClasses.filter(classItem => {
          // Skip if no class data
          if (!classItem) return false;
          
          // Check if class belongs to current active term
          const classYear = classItem.academicYear || classItem.year;
          const classTerm = classItem.term || classItem.termName;
          
          const isCurrentTerm = classYear === activeYear && classTerm === activeTerm;
          
          // Check if class is active (not completed/archived) - less strict filtering
          const isActive = !classItem.isCompleted && 
                          classItem.status !== 'completed' && 
                          !classItem.isArchived &&
                          classItem.status !== 'archived';
          
          console.log(`Class: ${classItem.className || classItem.name}`, {
            year: classYear,
            term: classTerm,
            isCurrentTerm,
            isActive,
            status: classItem.status,
            isCompleted: classItem.isCompleted,
            isArchived: classItem.isArchived
          });
          
          return isCurrentTerm && isActive;
        });

        console.log('Filtered classes for current term:', filteredClasses.length);
        
        // If no classes found for current term, show all classes for debugging
        if (filteredClasses.length === 0) {
          console.log('No classes found for current term, showing all classes for debugging:');
          console.log('All classes:', allClasses);
          console.log('Active Year:', activeYear, 'Active Term:', activeTerm);
          
          // Show all classes temporarily for debugging
          setClasses(allClasses);
          setError('No classes found for current term. Showing all classes for debugging.');
        } else {
          setClasses(filteredClasses);
          setError(null);
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

  const modules = (course) => {
    navigation.navigate('FMod', { classId: course.classID || course._id });
  };
  
  const createClasses = () => {
    navigation.navigate('CClass');
  };
  
  const studProg = () => {
    navigation.navigate('FSProg');
  };
  
  const goToProfile = () => {
    navigation.navigate('FProfile');
  };

  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
  };

  return (
    <View style={FacultyDashStyle.container}>
  
      <ScrollView contentContainerStyle={{ paddingBottom: 80}}>
      {/* Blue background */}
      <View style={FacultyDashStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={FacultyDashStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
                      <Text style={FacultyDashStyle.headerTitle}>
              Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Faculty'}!</Text>
            </Text>
            <Text style={FacultyDashStyle.headerSubtitle}>{academicContext}</Text>
            <Text style={FacultyDashStyle.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
              {resolveProfileUri() ? (
                <Image 
                  source={{ uri: resolveProfileUri() }} 
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  resizeMode="cover"
                />
              ) : (
                <Image 
                  source={require('../../assets/profile-icon (2).png')} 
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

        {/* Stats Row */}
        {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ 
            flex: 1, 
            backgroundColor: '#00418b', 
            borderRadius: 16, 
            alignItems: 'center', 
            padding: 16, 
            marginRight: 8, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2 
          }}>
            <Icon name="book" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>{classes.length}</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>My Classes</Text>
          </View>
          
          <View style={{ 
            flex: 1, 
            backgroundColor: '#00418b', 
            borderRadius: 16, 
            alignItems: 'center', 
            padding: 16, 
            marginLeft: 8, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2 
          }}>
            <Icon name="account-group" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>
              {classes.reduce((total, cls) => total + (cls.members ? cls.members.length : 0), 0)}
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Total Students</Text>
          </View>
        </View> */}
        
        {/* Create Classes and Progression Buttons */}
        {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity onPress={createClasses} style={{ 
            flex: 1, 
            backgroundColor: '#e3eefd', 
            borderRadius: 16, 
            alignItems: 'center', 
            padding: 16, 
            marginRight: 8, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2 
          }}>
            <Icon name="plus" size={32} color="#00418b" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 16, fontFamily: 'Poppins-Bold' }}>Create Classes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={studProg} style={{ 
            flex: 1, 
            backgroundColor: '#e3eefd', 
            borderRadius: 16, 
            alignItems: 'center', 
            padding: 16, 
            marginLeft: 8, 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2 
          }}>
            <Icon name="chart-line" size={32} color="#00418b" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#00418b', fontWeight: 'bold', fontSize: 16, fontFamily: 'Poppins-Bold' }}>Student Progress</Text>
          </TouchableOpacity>
        </View> */}
        
          {/* Your Classes */}
         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8, paddingHorizontal: 20, }}>
           <Text style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>Your Classes</Text>
           <View style={{ flexDirection: 'row', gap: 8 }}>
             {/* <TouchableOpacity 
               onPress={() => {
                 console.log('Manual refresh triggered');
                 fetchClasses();
               }}
               style={{ 
                 backgroundColor: '#ff9800', 
                 paddingHorizontal: 12, 
                 paddingVertical: 6, 
                 borderRadius: 8 
               }}>
               <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Bold' }}>Refresh</Text>
             </TouchableOpacity> */}
             <TouchableOpacity 
               onPress={() => navigation.navigate('FClasses')}
               style={{ 
                 backgroundColor: '#00418b', 
                 paddingHorizontal: 12, 
                 paddingVertical: 6, 
                 borderRadius: 8 
               }}>
               <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Bold' }}>View All</Text>
             </TouchableOpacity>
           </View>
         </View>
        
        {loading ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color="#00418b" />
            <Text style={{ marginTop: 10, color: '#666', fontFamily: 'Poppins-Regular' }}>Loading your classes...</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Icon name="alert-circle" size={32} color="#ff4444" />
            <Text style={{ marginTop: 10, color: '#ff4444', fontFamily: 'Poppins-Regular' }}>{error}</Text>
          </View>
                 ) : classes.length === 0 ? (
           <View style={{ alignItems: 'center', padding: 20 }}>
             <Icon name="book-open-variant" size={32} color="#666" />
             <Text style={{ marginTop: 10, color: '#666', fontFamily: 'Poppins-Regular' }}>You have no classes yet.</Text>
             
             {/* Debug Info */}
             <View style={{ marginTop: 16, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, width: '100%' }}>
               <Text style={{ fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular', textAlign: 'center' }}>
                 Debug Info:
               </Text>
               <Text style={{ fontSize: 10, color: '#888', fontFamily: 'Poppins-Regular', textAlign: 'center', marginTop: 4 }}>
                 Academic Year: {academicContext}
               </Text>
               <Text style={{ fontSize: 10, color: '#888', fontFamily: 'Poppins-Regular', textAlign: 'center' }}>
                 Check console for detailed logs
               </Text>
             </View>
             
             <TouchableOpacity 
               onPress={createClasses}
               style={{ 
                 marginTop: 10, 
                 backgroundColor: '#00418b', 
                 paddingHorizontal: 20, 
                 paddingVertical: 10, 
                 borderRadius: 8 
               }}>
               <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold' }}>Create Your First Class</Text>
             </TouchableOpacity>
           </View>
        ) : (
          <>
            {classes.slice(0, 3).map((course, index) => (
              <TouchableOpacity 
                key={index} 
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 18,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => {
                  // Find the exact class by classID to avoid wrong navigation
                  const exactClass = classes.find(c => c.classID === course.classID);
                  if (exactClass) {
                    console.log('Navigating to class:', exactClass.classID, exactClass.className);
                    navigation.navigate('FMod', { classId: exactClass.classID });
                  } else {
                    // fallback
                    navigation.navigate('FMod', { classId: course.classID });
                  }
                }}
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
                      source={{ uri: course.image }}
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
                
            ))}
            {classes.length > 3 && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('FClasses')}
                style={{ 
                  alignItems: 'center', 
                  padding: 16, 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: 12, 
                  marginTop: 8 
                }}>
                <Text style={{ color: '#00418b', fontFamily: 'Poppins-Bold' }}>
                  View {classes.length - 3} more classes
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}