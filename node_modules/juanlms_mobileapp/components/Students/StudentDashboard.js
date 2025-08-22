import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Image, Dimensions, ActivityIndicator, RefreshControl, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const { width } = Dimensions.get('window');

export default function StudentDashboard() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch academic year info
        const token = await AsyncStorage.getItem('jwtToken');
        const academicResponse = await fetch('https://juanlms-webapp-server.onrender.com/api/schoolyears/active', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (academicResponse.ok) {
          const academicData = await academicResponse.json();
          console.log("Student Dashboard - Fetched academic year:", academicData);
          setAcademicYear(academicData);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    generateCalendarDays();
  }, []);

  // Fetch active term for the academic year
  useEffect(() => {
    const fetchActiveTermForYear = async () => {
      if (!academicYear) return;
      
      try {
        const schoolYearName = `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
        console.log("Student Dashboard - Fetching terms for school year:", schoolYearName);
        
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`https://juanlms-webapp-server.onrender.com/api/terms/schoolyear/${schoolYearName}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const terms = await res.json();
          console.log("Student Dashboard - Fetched terms:", terms);
          const active = terms.find(term => term.status === 'active');
          console.log("Student Dashboard - Active term:", active);
          setCurrentTerm(active || null);
        } else {
          console.log("Student Dashboard - Failed to fetch terms, status:", res.status);
          setCurrentTerm(null);
        }
      } catch (err) {
        console.error("Student Dashboard - Error fetching terms:", err);
        setCurrentTerm(null);
      }
    };

    fetchActiveTermForYear();
  }, [academicYear]);

  // Fetch classes when we have both academic year and term
  useEffect(() => {
    const fetchClasses = async () => {
      if (!academicYear || !currentTerm || !user) {
        console.log('DEBUG: Cannot fetch classes yet:', {
          hasAcademicYear: !!academicYear,
          hasCurrentTerm: !!currentTerm,
          hasUser: !!user,
          user: user
        });
        return;
      }
      
      try {
        setClassesLoading(true);
        const token = await AsyncStorage.getItem('jwtToken');
        
        // Try to get the correct user ID - the classes API expects userID, not the hashed _id
        const userId = user.userID || user._id || await AsyncStorage.getItem('userID') || await extractUserIDFromToken();
        
        // Additional debugging for user ID
        console.log('DEBUG: User ID resolution:', {
          user_userID: user.userID,
          user_id: user._id,
          userID_from_storage: await AsyncStorage.getItem('userID'),
          userID_from_token: await extractUserIDFromToken(),
          final_userId: userId,
          user_object: user
        });
        
        if (!userId) {
          console.error('DEBUG: No valid user ID found for classes fetch');
          setError('User ID not found. Please log in again.');
          setClassesLoading(false);
          return;
        }
        
        console.log('DEBUG: Fetching classes with:', {
          academicYear: `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`,
          termName: currentTerm.termName,
          userId: userId,
          userObject: user
        });
        
        // Try multiple endpoints for better reliability
        let allClasses = [];
        let endpointUsed = '';
        
        // Try /classes/my-classes first (more specific endpoint)
        try {
          const res1 = await fetch('https://juanlms-webapp-server.onrender.com/api/classes/my-classes', {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          
          if (res1.ok) {
            const data1 = await res1.json();
            console.log('DEBUG: /classes/my-classes response:', data1);
            
            if (data1.success && Array.isArray(data1.classes)) {
              allClasses = data1.classes;
              endpointUsed = '/classes/my-classes';
            } else if (Array.isArray(data1)) {
              allClasses = data1;
              endpointUsed = '/classes/my-classes';
            }
          }
        } catch (error) {
          console.log('DEBUG: /classes/my-classes failed, trying /classes:', error.message);
        }
        
        // Fallback to /classes if my-classes didn't work
        if (allClasses.length === 0) {
          try {
            const res2 = await fetch('https://juanlms-webapp-server.onrender.com/api/classes', {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
            
            if (res2.ok) {
              const data2 = await res2.json();
              console.log('DEBUG: /classes response:', data2);
              
              if (data2.success && Array.isArray(data2.classes)) {
                allClasses = data2.classes;
                endpointUsed = '/classes';
              } else if (Array.isArray(data2)) {
                allClasses = data2;
                endpointUsed = '/classes';
              }
            }
          } catch (error) {
            console.log('DEBUG: /classes also failed:', error.message);
          }
        }
        
        if (allClasses.length === 0) {
          throw new Error('No classes data received from any endpoint');
        }
        
        console.log(`DEBUG: Successfully fetched ${allClasses.length} classes from ${endpointUsed}`);
        
        // Filter classes: only show classes from current term where student is a member
        const filtered = allClasses.filter(cls => {
          // Try multiple user ID matching strategies since the API might expect different formats
          const isMember = cls.members && (
            cls.members.includes(userId) || // Try the userID first
            cls.members.includes(user._id) || // Fallback to _id
            cls.members.includes(user.id) || // Fallback to id
            (user.studentCode && cls.members.includes(user.studentCode)) // Try studentCode if available
          );
          
          const isCurrentTerm = cls.academicYear === `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` && 
                               cls.termName === currentTerm.termName;
          const isNotArchived = cls.isArchived !== true;
          
          console.log('DEBUG: Class filter check:', {
            className: cls.className,
            classId: cls._id || cls.classID,
            isMember,
            isCurrentTerm,
            isNotArchived,
            classAcademicYear: cls.academicYear,
            classTermName: cls.termName,
            classMembers: cls.members,
            userId: userId,
            user_id: user._id,
            user_id_type: typeof user._id
          });
          
          return isMember && isCurrentTerm && isNotArchived;
        });
        
        console.log('DEBUG: Filtered classes for student:', filtered);
        setClasses(filtered);
        
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to load classes: ' + error.message);
      } finally {
        setClassesLoading(false);
      }
    };
    
    fetchClasses();
  }, [academicYear, currentTerm, user]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh classes if we have the required data
      if (academicYear && currentTerm && user) {
        const token = await AsyncStorage.getItem('jwtToken');
        
        // Try to get the correct user ID - the classes API expects userID, not the hashed _id
        const userId = user.userID || user._id || await AsyncStorage.getItem('userID') || await extractUserIDFromToken();
        
        if (!userId) {
          console.error('DEBUG: No valid user ID found for classes refresh');
          setRefreshing(false);
          return;
        }
        
        // Try multiple endpoints for better reliability
        let allClasses = [];
        
        // Try /classes/my-classes first
        try {
          const res1 = await fetch('https://juanlms-webapp-server.onrender.com/api/classes/my-classes', {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          
          if (res1.ok) {
            const data1 = await res1.json();
            if (data1.success && Array.isArray(data1.classes)) {
              allClasses = data1.classes;
            } else if (Array.isArray(data1)) {
              allClasses = data1;
            }
          }
        } catch (error) {
          console.log('DEBUG: Refresh - /classes/my-classes failed, trying /classes');
        }
        
        // Fallback to /classes if my-classes didn't work
        if (allClasses.length === 0) {
          try {
            const res2 = await fetch('https://juanlms-webapp-server.onrender.com/api/classes', {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
            
            if (res2.ok) {
              const data2 = await res2.json();
              if (data2.success && Array.isArray(data2.classes)) {
                allClasses = data2.classes;
              } else if (Array.isArray(data2)) {
                allClasses = data2;
              }
            }
          } catch (error) {
            console.log('DEBUG: Refresh - /classes also failed');
          }
        }
        
        if (allClasses.length > 0) {
          const filtered = allClasses.filter(cls => {
            // Try multiple user ID matching strategies
            const isMember = cls.members && (
              cls.members.includes(userId) || // Try the userID first
              cls.members.includes(user._id) || // Fallback to _id
              cls.members.includes(user.id) || // Fallback to id
              (user.studentCode && cls.members.includes(user.studentCode)) // Try studentCode if available
            );
            
            return isMember && 
                   cls.isArchived !== true &&
                   cls.academicYear === `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` &&
                   cls.termName === currentTerm.termName;
          });
          
          setClasses(filtered);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDateTime = (date) => {
    return moment(date).format('dddd, MMMM D, YYYY | h:mm:ss A');
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const debugAsyncStorage = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const userID = await AsyncStorage.getItem('userID');
      const token = await AsyncStorage.getItem('jwtToken');
      
      console.log('DEBUG: AsyncStorage contents:', {
        user: user ? JSON.parse(user) : null,
        userID: userID,
        hasToken: !!token
      });
      
      return { user: user ? JSON.parse(user) : null, userID, hasToken: !!token };
    } catch (error) {
      console.error('DEBUG: Error reading AsyncStorage:', error);
      return { error: error.message };
    }
  };

  const extractUserIDFromToken = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return null;
      
      // Decode JWT token to extract userID
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('DEBUG: JWT payload:', payload);
      
      return payload.userID || payload.id || null;
    } catch (error) {
      console.error('DEBUG: Error extracting userID from token:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontFamily: 'Poppins-Regular', color: '#666' }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Blue background */}
      <View style={styles.blueBackground} />
      
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>
              Hello, <Text style={styles.userName}>{user?.firstname || 'Student'}!</Text>
            </Text>
            <Text style={styles.academicContext}>
              {academicYear?.schoolYearStart || 'N/A'} - {academicYear?.schoolYearEnd || 'N/A'} | {currentTerm?.termName || 'N/A'}
            </Text>
            <Text style={styles.dateText}>
              {formatDateTime(currentDateTime)}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={async () => {
                const userId = user?.userID || user?._id || 'Not found';
                const asyncStorageData = await debugAsyncStorage();
                
                console.log('DEBUG: Current dashboard state:', {
                  academicYear,
                  currentTerm,
                  classesCount: classes.length,
                  classesLoading,
                  user: user,
                  userId: userId,
                  asyncStorageData: asyncStorageData
                });
                
                Alert.alert('Debug Info', 
                  `Academic Year: ${academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : 'Not loaded'}\n` +
                  `Term: ${currentTerm?.termName || 'Not loaded'}\n` +
                  `Classes: ${classes.length}\n` +
                  `User ID: ${userId}\n` +
                  `User Object: ${JSON.stringify(user, null, 2).substring(0, 100)}...\n` +
                  `AsyncStorage userID: ${asyncStorageData.userID || 'Not found'}`
                );
              }}
            >
              <Icon name="bug" size={16} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateToScreen('SProfile')}>
              {user?.profilePicture ? (
                <Image 
                  source={{ uri: user.profilePicture }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <Image 
                  source={require('../../assets/profile-icon (2).png')} 
                  style={styles.profileImage}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {error && (
        <View style={{ backgroundColor: '#fee', padding: 12, marginHorizontal: 20, borderRadius: 8, marginBottom: 10 }}>
          <Text style={{ color: '#c33', fontFamily: 'Poppins-Regular', fontSize: 14 }}>
            {error}
          </Text>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00418b']}
            tintColor="#00418b"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Academic Calendar Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Academic Calendar</Text>
          <View style={styles.calendarCard}>
            {/* Calendar Navigation */}
            <View style={styles.calendarNavigation}>
              <TouchableOpacity style={styles.calendarNavButton} onPress={goToToday}>
                <Text style={styles.calendarNavButtonText}>today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarNavButton} onPress={goToPreviousMonth}>
                <Text style={styles.calendarNavButtonText}>{'<'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarNavButton} onPress={goToNextMonth}>
                <Text style={styles.calendarNavButtonText}>{'>'}</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <View key={index} style={styles.calendarDayHeader}>
                  <Text style={styles.calendarDayHeaderText}>{day}</Text>
                </View>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    isToday(date) && styles.calendarDayToday,
                    !isCurrentMonth(date) && styles.calendarDayOtherMonth
                  ]}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isToday(date) && styles.calendarDayTextToday,
                    !isCurrentMonth(date) && styles.calendarDayTextOtherMonth
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Classes Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Classes</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity 
                style={styles.refreshClassesButton}
                onPress={() => {
                  console.log('DEBUG: Manual refresh of classes triggered');
                  if (academicYear && currentTerm && user) {
                    setClassesLoading(true);
                    // Trigger a manual refresh by calling the effect again
                    // The useEffect will handle the proper user ID logic
                    setClasses([]);
                    setTimeout(() => {
                      setClassesLoading(false);
                    }, 100);
                  }
                }}
              >
                <Icon name="refresh" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('SClasses')}
              >
                <Text style={styles.viewAllButtonText}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>
          {!academicYear || !currentTerm ? (
            <View style={styles.classesLoadingContainer}>
              <ActivityIndicator size="small" color="#00418b" />
              <Text style={styles.classesLoadingText}>Loading academic context...</Text>
            </View>
          ) : classesLoading ? (
            <View style={styles.classesLoadingContainer}>
              <ActivityIndicator size="small" color="#00418b" />
              <Text style={styles.classesLoadingText}>Loading classes...</Text>
            </View>
          ) : classes.length === 0 ? (
            <View style={styles.noClassesContainer}>
              <Icon name="school-outline" size={48} color="#ccc" />
              <Text style={styles.noClassesText}>No classes found for this term.</Text>
              <Text style={styles.noClassesSubtext}>Contact your administrator if you believe this is an error.</Text>
              <View style={styles.debugInfo}>
                <Text style={styles.debugInfoText}>
                  Academic Year: {academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : 'N/A'}
                </Text>
                <Text style={styles.debugInfoText}>
                  Term: {currentTerm?.termName || 'N/A'}
                </Text>
                <Text style={styles.debugInfoText}>
                  User ID: {user?.userID || user?._id || 'N/A'}
                </Text>
                <Text style={styles.debugInfoText}>
                  User Object: {user ? `${user.firstname || 'N/A'} ${user.lastname || 'N/A'}` : 'N/A'}
                </Text>
                <Text style={styles.debugInfoText}>
                  Note: Classes API expects userID, not _id
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.classesGrid}>
              {classes.slice(0, 4).map((cls, index) => (
                <TouchableOpacity
                  key={cls._id || cls.classID || index}
                  style={styles.classCard}
                  onPress={() => navigation.navigate('StudentModule', { 
                    classId: cls._id || cls.classID,
                    className: cls.className 
                  })}
                >
                  <View style={styles.classCardHeader}>
                    <Text style={styles.className} numberOfLines={2}>
                      {cls.className || 'Class Name'}
                    </Text>
                    <Text style={styles.classCode}>
                      {cls.classCode || cls.subjectCode || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.classCardDetails}>
                    {cls.facultyName && (
                      <Text style={styles.classFaculty} numberOfLines={1}>
                        {cls.facultyName}
                      </Text>
                    )}
                    {cls.schedule && (
                      <Text style={styles.classSchedule} numberOfLines={1}>
                        {cls.schedule}
                      </Text>
                    )}
                    {cls.room && (
                      <Text style={styles.classRoom} numberOfLines={1}>
                        {cls.room}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {classes.length > 4 && (
                <TouchableOpacity
                  style={styles.moreClassesCard}
                  onPress={() => navigation.navigate('SClasses')}
                >
                  <Icon name="more-horiz" size={32} color="#00418b" />
                  <Text style={styles.moreClassesText}>
                    +{classes.length - 4} more classes
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  
  // Blue background
  blueBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 160,
    backgroundColor: '#00418b',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },

  // Header styles
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  debugButton: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  greetingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#00418b',
  },
  userName: {
    fontWeight: 'bold',
  },
  dateText: {
    fontFamily: 'Poppins-Regular',
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  academicContext: {
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  // Scroll content
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Section container
  sectionContainer: {
    marginBottom: 24,
  },

  // Section title
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 16,
    marginLeft: 4,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshClassesButton: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },

  // Calendar section
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  calendarNavButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  calendarNavButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  calendarMonthText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayHeader: {
    width: (width - 80) / 7,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarDayHeaderText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#666',
  },
  calendarDay: {
    width: (width - 80) / 7,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  calendarDayToday: {
    backgroundColor: '#fff3cd',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayTextToday: {
    color: '#856404',
    fontFamily: 'Poppins-SemiBold',
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayTextOtherMonth: {
    color: '#999',
  },

  // Classes section styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noClassesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noClassesText: {
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontSize: 16,
  },
  noClassesSubtext: {
    fontFamily: 'Poppins-Regular',
    color: '#999',
    fontSize: 13,
    marginTop: 5,
  },
  classesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    width: (width - 40 - 12) / 2, // Two columns
  },
  classCardHeader: {
    marginBottom: 8,
  },
  className: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  classCode: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  classFaculty: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#00418b',
    marginBottom: 4,
  },
  classSchedule: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  classRoom: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
  },
  moreClassesCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  moreClassesText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#00418b',
    marginTop: 8,
  },
  viewAllButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  classesLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  classesLoadingText: {
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  debugInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugInfoText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
}); 