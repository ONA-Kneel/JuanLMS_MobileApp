import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, Dimensions, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { getAuthHeaders, handleApiError } from '../../utils/apiUtils';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';
const { width } = Dimensions.get('window');

export default function VPECalendar() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  // New state variables for enhanced functionality
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [classDates, setClassDates] = useState([]);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      setIsLoading(true);
      
      // Fetch calendar events from multiple endpoints like the web app does
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const headers = await getAuthHeaders();

      const [classDatesRes, eventsRes, holidaysRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/class-dates`, { headers }),
        axios.get(`${API_BASE_URL}/events`, { headers }),
        axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`)
      ]);
      
      let allEvents = [];
      
      // Process class dates
      if (classDatesRes.data && Array.isArray(classDatesRes.data)) {
        setClassDates(classDatesRes.data);
        allEvents = allEvents.concat(classDatesRes.data.map(date => ({
          id: `class-${date._id}`,
          title: 'Class Day',
          date: new Date(date.date),
          type: 'class',
          description: 'Regular class day',
          color: '#4CAF50'
        })));
      }
      
      // Process events
      if (eventsRes.data && Array.isArray(eventsRes.data)) {
        allEvents = allEvents.concat(eventsRes.data.map(event => ({
          id: `event-${event._id}`,
          title: event.title,
          date: new Date(event.date),
          type: 'event',
          description: event.description || 'Event',
          color: '#2196F3'
        })));
      }
      
      // Process holidays
      if (holidaysRes.data && Array.isArray(holidaysRes.data)) {
        setHolidays(holidaysRes.data);
        allEvents = allEvents.concat(holidaysRes.data.map(holiday => ({
          id: `holiday-${holiday.date}`,
          title: holiday.localName || 'Holiday',
          date: new Date(holiday.date),
          type: 'holiday',
          description: 'Public Holiday',
          color: '#FF9800'
        })));
      }
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      const errorMessage = handleApiError(error, 'Failed to fetch calendar events');
      Alert.alert('Error', errorMessage);
      // For now, use mock data since API might not be fully implemented
      setEvents(getMockEvents());
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch academic year information
  useEffect(() => {
    const fetchAcademicYear = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const yearRes = await fetch(`${API_BASE_URL}/api/schoolyears/active`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (yearRes.ok) {
          const year = await yearRes.json();
          setAcademicYear(year);
        }
      } catch (err) {
        console.error('Failed to fetch academic year', err);
      }
    };
    fetchAcademicYear();
  }, []);

  // Fetch active term for the academic year
  useEffect(() => {
    const fetchActiveTermForYear = async () => {
      if (!academicYear) return;
      try {
        const schoolYearName = `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE_URL}/api/terms/schoolyear/${schoolYearName}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const terms = await res.json();
          const active = terms.find(term => term.status === 'active');
          setCurrentTerm(active || null);
        } else {
          setCurrentTerm(null);
        }
      } catch {
        setCurrentTerm(null);
      }
    };
    fetchActiveTermForYear();
  }, [academicYear]);

  const getMockEvents = () => {
    const today = new Date();
    return [
      {
        id: 1,
        title: 'Academic Year Start',
        date: new Date(today.getFullYear(), 5, 1), // June 1
        type: 'academic',
        description: 'Beginning of new academic year',
        color: '#4CAF50'
      },
      {
        id: 2,
        title: 'First Term Start',
        date: new Date(today.getFullYear(), 7, 2), // August 2
        type: 'term',
        description: 'First term classes begin',
        color: '#2196F3'
      },
      {
        id: 3,
        title: 'First Term End',
        date: new Date(today.getFullYear(), 7, 3), // August 3
        type: 'term',
        description: 'First term classes end',
        color: '#FF9800'
      },
      {
        id: 4,
        title: 'Academic Year End',
        date: new Date(today.getFullYear() + 1, 3, 30), // April 30
        type: 'academic',
        description: 'End of academic year',
        color: '#F44336'
      }
    ];
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayName = (dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = getEventsForDate(selectedDate);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileHeaderContent}>
          <View style={styles.profileInfo}>
            <Text style={styles.greetingText}>
              Hello, <Text style={styles.userName}>{user?.firstname || 'VPE'}!</Text>
            </Text>
            <Text style={styles.academicContext}>
              {academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : "Loading..."} | 
              {currentTerm ? ` ${currentTerm.termName}` : " Loading..."}
            </Text>
            <Text style={styles.dateText}>
              {moment(new Date()).format('dddd, MMMM D, YYYY')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('VPEProfile')}>
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

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Calendar Title */}
        <View style={styles.calendarTitleContainer}>
          <Text style={styles.calendarTitle}>Academic Calendar</Text>
          <Icon name="calendar" size={28} color="#00418b" />
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navButton}>
            <Icon name="chevron-left" size={24} color="#00418b" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{getMonthName(currentDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navButton}>
            <Icon name="chevron-right" size={24} color="#00418b" />
          </TouchableOpacity>
        </View>

        {/* Today Button */}
        <View style={styles.todayButtonContainer}>
          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Icon name="calendar-today" size={16} color="#00418b" />
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.calendarGrid}>
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isSelected = day && selectedDate.toDateString() === day.toDateString();
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedDay,
                    isToday && styles.today
                  ]}
                  onPress={() => day && setSelectedDate(day)}
                  disabled={!day}
                >
                  {day && (
                    <>
                      <Text style={[
                        styles.dayNumber,
                        isSelected && styles.selectedDayText,
                        isToday && styles.todayText
                      ]}>
                        {day.getDate()}
                      </Text>
                      {dayEvents.length > 0 && (
                        <View style={styles.eventIndicator}>
                          <Text style={styles.eventCount}>{dayEvents.length}</Text>
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Events */}
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>
            Events for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          {selectedDateEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {selectedDateEvents.map(event => (
                <View key={event.id} style={[styles.eventCard, { borderLeftColor: event.color }]}>
                  <View style={styles.eventHeader}>
                    <Icon 
                      name={event.type === 'academic' ? 'school' : 
                            event.type === 'class' ? 'calendar' : 
                            event.type === 'holiday' ? 'flag' : 'calendar'} 
                      size={20} 
                      color={event.color} 
                    />
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  {event.type && (
                    <View style={[styles.eventTypeBadge, { backgroundColor: `${event.color}20` }]}>
                      <Text style={[styles.eventTypeText, { color: event.color }]}>
                        {event.type.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noEventsContainer}>
              <Icon name="calendar-blank" size={48} color="#ccc" />
              <Text style={styles.noEventsText}>No events scheduled for this date</Text>
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
    backgroundColor: '#f7f9fa',
  },
  
  // Profile Header
  profileHeader: {
    backgroundColor: '#00418b',
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
  },
  academicContext: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#e3f2fd',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#b3e5fc',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
    padding: 20,
  },

  // Calendar Title
  calendarTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  calendarTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#00418b',
  },

  // Month Navigation
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
  },
  monthText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },

  // Today Button
  todayButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00418b',
  },
  todayButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#00418b',
    marginLeft: 8,
  },

  // Calendar Container
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width - 80) / 7,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#00418b',
    borderColor: '#00418b',
  },
  today: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCount: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
  },

  // Events Container
  eventsContainer: {
    flex: 1,
  },
  eventsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    marginBottom: 16,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginLeft: 12,
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 12,
  },
  eventTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    marginTop: 16,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
});


