import { Text, TouchableOpacity, View, Image, Alert, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const { width } = Dimensions.get('window');

const timeToString = (time) => {
  const date = new Date(time);
  // Use local date methods instead of UTC to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthYearString = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const addDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return timeToString(date);
};

export default function FacultyCalendar() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [items, setItems] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => timeToString(new Date()));
  const [currentMonth, setCurrentMonth] = useState(() => getMonthYearString(timeToString(new Date())));
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
  
  // New state variables for enhanced functionality
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [classDates, setClassDates] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Ensure selected date is always today's date when component mounts
  useEffect(() => {
    const today = new Date();
    const todayString = timeToString(today);
    setSelectedDate(todayString);
    setCurrentMonth(getMonthYearString(todayString));
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingEvents(true);
      try {
        let holidays = [];
        // Fetch holidays for current year only to reduce API calls
        const currentYear = new Date().getFullYear();
        try {
          const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/PH`);
          if (res.ok) {
            const data = await res.json();
            holidays = Array.isArray(data) ? data : [];
            console.log('Faculty Calendar - Holidays fetched:', holidays.length);
          }
        } catch (holidayErr) {
          console.error('Failed to fetch holidays:', holidayErr);
        }
        
        const token = await AsyncStorage.getItem('jwtToken');
        let eventsData = [];
        
        // Try to fetch events from the local backend API
        try {
          const resEvents = await fetch('https://juanlms-webapp-server.onrender.com/api/events', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resEvents.ok) {
            eventsData = await resEvents.json();
            console.log('Faculty Calendar - Events fetched from local API:', eventsData.length);
          } else {
            console.log('Faculty Calendar - Events API returned status:', resEvents.status);
          }
        } catch (eventErr) {
          console.error('Failed to fetch events from local API:', eventErr);
        }
        
        const newItems = {};
        
        // Process holidays
        holidays.forEach(holiday => {
          if (holiday && holiday.date) {
            if (!newItems[holiday.date]) newItems[holiday.date] = [];
            newItems[holiday.date].push({
              name: holiday.localName || 'Holiday',
              type: 'holiday',
              color: '#FFEB3B',
              height: 50
            });
          }
        });
        
        // Process events from API
        if (Array.isArray(eventsData)) {
          eventsData.forEach(event => {
            if (event && event.start) {
              try {
                const eventDate = timeToString(new Date(event.start));
                if (!newItems[eventDate]) newItems[eventDate] = [];
                
                // Format time from start datetime
                const startTime = new Date(event.start);
                const endTime = event.end ? new Date(event.end) : null;
                
                let timeString = '';
                if (startTime) {
                  timeString = startTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  
                  if (endTime) {
                    const endTimeString = endTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    });
                    timeString += ` - ${endTimeString}`;
                  }
                }
                
                newItems[eventDate].push({
                  name: event.title || event.name || 'Event',
                  type: event.type || 'event',
                  color: event.color || '#2196f3',
                  height: 50,
                  time: timeString,
                  status: event.status || '',
                  start: event.start,
                  end: event.end
                });
                console.log(`Faculty Calendar - Added event: ${event.title || event.name} on ${eventDate} at ${timeString}`);
              } catch (eventErr) {
                console.error('Error processing event:', event, eventErr);
              }
            }
          });
        }

        // Process class dates
        if (classDates.length > 0) {
          classDates.forEach(date => {
            try {
              const dateStr = timeToString(new Date(date.date));
              if (!dateStr) return;
              if (!newItems[dateStr]) newItems[dateStr] = [];
              newItems[dateStr].push({
                name: 'Class Day',
                type: 'class',
                color: '#4CAF50',
                height: 50
              });
            } catch (err) {
              console.error('Error processing class date:', err);
              return;
            }
          });
        }
        
        // Always add mock events for testing and demonstration
        const today = timeToString(Date.now());
        const tomorrow = timeToString(addDays(today, 1));
        const dayAfterTomorrow = timeToString(addDays(today, 2));
        const nextWeek = timeToString(addDays(today, 7));
        
        // Add mock events to ensure calendar has content
        if (!newItems[today]) newItems[today] = [];
        newItems[today].push({
          name: 'Faculty Meeting',
          type: 'meeting',
          color: '#4CAF50',
          height: 50,
          time: '9:00 AM',
          status: 'Scheduled'
        });
        
        if (!newItems[tomorrow]) newItems[tomorrow] = [];
        newItems[tomorrow].push({
          name: 'Class Preparation',
          type: 'class',
          color: '#2196F3',
          height: 50,
          time: '2:00 PM',
          status: 'Pending'
        });
        
        if (!newItems[dayAfterTomorrow]) newItems[dayAfterTomorrow] = [];
        newItems[dayAfterTomorrow].push({
          name: 'Student Consultation',
          type: 'consultation',
          color: '#FF9800',
          height: 50,
          time: '10:00 AM',
          status: 'Confirmed'
        });
        
        if (!newItems[nextWeek]) newItems[nextWeek] = [];
        newItems[nextWeek].push({
          name: 'Department Review',
          type: 'review',
          color: '#9C27B0',
          height: 50,
          time: '3:00 PM',
          status: 'Scheduled'
        });
        
        console.log('Faculty Calendar - Final processed items:', newItems);
        console.log('Faculty Calendar - Total dates with events:', Object.keys(newItems).length);
        
        setItems(newItems);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        // Even if there's an error, add some mock events
        const today = timeToString(Date.now());
        const tomorrow = timeToString(addDays(today, 1));
        setItems({
          [today]: [{
            name: 'Faculty Meeting',
            type: 'meeting',
            color: '#4CAF50',
            height: 50,
            time: '9:00 AM',
            status: 'Scheduled'
          }],
          [tomorrow]: [{
            name: 'Class Preparation',
            type: 'class',
            color: '#2196F3',
            height: 50,
            time: '2:00 PM',
            status: 'Pending'
          }]
        });
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchAll();
  }, [classDates]);

  // Fetch academic year information
  useEffect(() => {
    const fetchAcademicYear = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const yearRes = await fetch('https://juanlms-webapp-server.onrender.com/api/schoolyears/active', {
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
        const res = await fetch(`https://juanlms-webapp-server.onrender.com/api/terms/schoolyear/${schoolYearName}`, {
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

  // Fetch class dates
  useEffect(() => {
    const fetchClassDates = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch('https://juanlms-webapp-server.onrender.com/api/class-dates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setClassDates(data);
            console.log('Faculty Calendar - Class dates fetched:', data.length);
          }
        }
      } catch (err) {
        console.error('Failed to fetch class dates', err);
      }
    };
    fetchClassDates();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const renderEventCard = (item, index) => {
    const isHoliday = item.type && item.type.toLowerCase() === 'holiday';
    const tagBackgroundColor = isHoliday ? '#fffacd' : (item.color || '#2196f3');
    const tagTextColor = isHoliday ? '#333' : '#fff';
    
    return (
      <View key={index} style={styles.eventCard}> 
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle}>{item.name}</Text>
          {item.time && (
            <Text style={styles.eventTime}>{item.time}</Text>
          )}
        </View>
        {item.type && (
          <View style={[styles.eventTag, { backgroundColor: tagBackgroundColor }]}>
            <Text style={[styles.eventTagText, { color: tagTextColor }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Get events for the selected date only
  const getEventsForSelectedDate = () => {
    const events = [];
    if (items[selectedDate]) {
      items[selectedDate].forEach(event => {
        events.push({ ...event, date: selectedDate });
      });
    }
    return events;
  };

  const changeMonth = (direction) => {
    const date = new Date(selectedDate);
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    setSelectedDate(timeToString(date));
    setCurrentMonth(getMonthYearString(timeToString(date)));
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(timeToString(today));
    setCurrentMonth(getMonthYearString(timeToString(today)));
  };

  if (loadingEvents) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontFamily: 'Poppins-Regular', color: '#666' }}>
          Loading calendar...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Blue background */}
        <View style={styles.blueHeaderBackground} />
        {/* White card header */}
        <View style={styles.whiteHeaderCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.headerTitle}>
                Calendar
            </Text>
              <Text style={styles.headerSubtitle}>{academicContext}</Text>
              <Text style={styles.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
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

        

        {/* Month Navigation */}
<View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#00418b" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{getMonthYearString(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#00418b" />
          </TouchableOpacity>
        </View>

        {/* Month Calendar - Match VPE style */}
        <View style={styles.calendarContainer}>
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {/* Generate calendar days for current month */}
            {(() => {
              const year = new Date(selectedDate).getFullYear();
              const month = new Date(selectedDate).getMonth();
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
              
              return days.map((day, index) => {
                if (!day) return <View key={index} style={styles.dayCell} />;
                
                const dayString = timeToString(day);
                const dayEvents = items[dayString] || [];
                const isSelected = dayString === selectedDate;
                const isToday = dayString === timeToString(new Date());
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      isSelected && styles.selectedDay,
                      isToday && styles.today
                    ]}
                    onPress={() => setSelectedDate(dayString)}
                  >
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
                  </TouchableOpacity>
                );
              });
            })()}
          </View>
        </View>


        {/* Selected Date Events */}
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>
            Events for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          {getEventsForSelectedDate().length === 0 ? (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.noEventsText}>No events scheduled for this date</Text>
            </View>
          ) : (
            <View style={styles.eventsList}>
              {getEventsForSelectedDate().map((item, index) => renderEventCard(item, index))}
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
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    paddingVertical: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#00418b',
  },
  today: {
    backgroundColor: '#e3f2fd',
  },
  dayNumber: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#00418b',
    fontWeight: 'bold',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  eventsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  eventsList: {
    gap: 12,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noEventsText: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Poppins-Bold',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  eventStatus: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins-Regular',
  },
  eventTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  eventTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
};

