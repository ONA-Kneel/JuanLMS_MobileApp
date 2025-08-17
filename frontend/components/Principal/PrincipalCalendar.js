import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDate, getCurrentDate, addDays, isSameDay, isSameMonth, isBefore, clone } from '../../utils/dateUtils';

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

const CalendarDay = ({ day, isCurrentMonth, isSelected, hasEvents, onPress, isToday }) => (
  <TouchableOpacity
    style={[
      styles.calendarDay,
      !isCurrentMonth && styles.otherMonthDay,
      isSelected && styles.selectedDay,
      isToday && styles.today,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.dayText,
        !isCurrentMonth && styles.otherMonthText,
        isSelected && styles.selectedDayText,
        isToday && styles.todayText,
      ]}
    >
      {day}
    </Text>
    {hasEvents && <View style={styles.eventDot} />}
  </TouchableOpacity>
);

const EventItem = ({ event, onPress }) => (
  <TouchableOpacity style={styles.eventItem} onPress={onPress}>
    <View style={[styles.eventColor, { backgroundColor: event.color }]} />
    <View style={styles.eventContent}>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventTime}>{event.time}</Text>
      <Text style={styles.eventLocation}>{event.location}</Text>
      {event.type && (
        <View style={styles.eventTypeBadge}>
          <Text style={styles.eventTypeText}>{event.type}</Text>
        </View>
      )}
    </View>
    <Icon name="chevron-right" size={20} color="#666" />
  </TouchableOpacity>
);

export default function PrincipalCalendar() {
  const isFocused = useIsFocused();
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // New state variables for enhanced functionality
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [classDates, setClassDates] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const fetchCalendarEvents = async () => {
    try {
      setIsLoading(true);
      
      // Fetch calendar events from multiple endpoints like the web app does
      const [classDatesRes, eventsRes, holidaysRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/class-dates`),
        axios.get(`${API_BASE_URL}/events`),
        axios.get(`https://date.nager.at/api/v3/PublicHolidays/${new Date().getFullYear()}/PH`)
      ]);
      
      let allEvents = [];
      
      // Process class dates
      if (classDatesRes.data && Array.isArray(classDatesRes.data)) {
        setClassDates(classDatesRes.data);
        allEvents = allEvents.concat(classDatesRes.data.map(date => ({
          id: `class-${date._id}`,
          title: 'Class Day',
          date: formatDate(new Date(date.date), 'YYYY-MM-DD'),
          time: 'All Day',
          location: 'All Classrooms',
          color: '#4CAF50',
          category: 'Academic',
          type: 'class'
        })));
      }
      
      // Process events
      if (eventsRes.data && Array.isArray(eventsRes.data)) {
        allEvents = allEvents.concat(eventsRes.data.map(event => ({
          id: `event-${event._id}`,
          title: event.title,
          date: formatDate(new Date(event.date), 'YYYY-MM-DD'),
          time: event.time || 'All Day',
          location: event.location || 'TBD',
          color: event.color || '#2196F3',
          category: event.category || 'Event',
          type: 'event'
        })));
      }
      
      // Process holidays
      if (holidaysRes.data && Array.isArray(holidaysRes.data)) {
        setHolidays(holidaysRes.data);
        allEvents = allEvents.concat(holidaysRes.data.map(holiday => ({
          id: `holiday-${holiday.date}`,
          title: holiday.localName || 'Holiday',
          date: holiday.date,
          time: 'All Day',
          location: 'School Closed',
          color: '#FF9800',
          category: 'Holiday',
          type: 'holiday'
        })));
      }
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
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

  const getMockEvents = () => [
    {
      id: 1,
      title: 'Faculty Meeting',
      date: formatDate(getCurrentDate(), 'YYYY-MM-DD'),
      time: '9:00 AM - 10:00 AM',
      location: 'Conference Room A',
      color: '#4CAF50',
      category: 'Academic',
      type: 'meeting'
    },
    {
      id: 2,
      title: 'Student Orientation',
      date: formatDate(addDays(getCurrentDate(), 2), 'YYYY-MM-DD'),
      time: '2:00 PM - 4:00 PM',
      location: 'Auditorium',
      color: '#2196F3',
      category: 'Student',
      type: 'orientation'
    },
    {
      id: 3,
      title: 'Board Meeting',
      date: formatDate(addDays(getCurrentDate(), 5), 'YYYY-MM-DD'),
      time: '3:00 PM - 5:00 PM',
      location: 'Board Room',
      color: '#FF9800',
      category: 'Administrative',
      type: 'meeting'
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCalendarEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      fetchCalendarEvents();
    }
  }, [isFocused]);

  const getDaysInMonth = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay());
    
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const endOfWeek = new Date(end);
    endOfWeek.setDate(end.getDate() + (6 - end.getDay()));
    
    const days = [];
    let day = new Date(startOfWeek);

    while (isBefore(day, endOfWeek) || isSameDay(day, endOfWeek)) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date, 'YYYY-MM-DD');
    return events.filter(event => event.date === dateStr);
  };

  const getMonthDisplayName = (date) => {
    const monthName = getMonthName(date.getMonth());
    const year = date.getFullYear();
    return `${monthName} ${year}`;
  };

  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleEventPress = (event) => {
    Alert.alert(
      event.title,
      `Time: ${event.time}\nLocation: ${event.location}\nCategory: ${event.category}\nType: ${event.type}`,
      [{ text: 'OK' }]
    );
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academic Calendar</Text>
        <Text style={styles.headerSubtitle}>Manage academic events and schedules</Text>
        {/* Academic Year and Term Info */}
        <View style={styles.academicInfo}>
          <Text style={styles.academicText}>
            {academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : "Loading..."} | 
            {currentTerm ? ` ${currentTerm.termName}` : " Loading..."}
          </Text>
        </View>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
          <Icon name="chevron-left" size={24} color="#00418b" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{getMonthDisplayName(currentDate)}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
          <Icon name="chevron-right" size={24} color="#00418b" />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        <View style={styles.weekDaysHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekDayHeader}>
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, getCurrentDate());
            
            return (
              <CalendarDay
                key={index}
                day={day.getDate()}
                isCurrentMonth={isSameMonth(day, currentDate)}
                isSelected={isSelected}
                hasEvents={dayEvents.length > 0}
                onPress={() => handleDateSelect(day)}
                isToday={isToday}
              />
            );
          })}
        </View>
      </View>

      {/* Selected Date Events */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsSectionTitle}>
          Events for {formatDate(selectedDate, 'MMMM D, YYYY')}
        </Text>
        
        {selectedDateEvents.length > 0 ? (
          selectedDateEvents.map(event => (
            <EventItem
              key={event.id}
              event={event}
              onPress={() => handleEventPress(event)}
            />
          ))
        ) : (
          <View style={styles.noEventsContainer}>
            <Icon name="calendar-blank" size={48} color="#ccc" />
            <Text style={styles.noEventsText}>No events scheduled for this date</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.addEventButton}
          onPress={() => Alert.alert('Add Event', 'Event creation feature coming soon!')}
        >
          <Icon name="plus" size={24} color="#fff" />
          <Text style={styles.addEventButtonText}>Add New Event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Helper function for month names
const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  academicInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
  academicText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins-SemiBold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  otherMonthText: {
    color: '#999',
  },
  selectedDay: {
    backgroundColor: '#00418b',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 2,
    borderColor: '#00418b',
    borderRadius: 20,
  },
  todayText: {
    color: '#00418b',
    fontWeight: 'bold',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9800',
  },
  eventsSection: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Poppins-Regular',
  },
  eventLocation: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  eventTypeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  eventTypeText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontFamily: 'Poppins-Bold',
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontFamily: 'Poppins-Regular',
  },
  quickActions: {
    padding: 20,
  },
  addEventButton: {
    backgroundColor: '#00418b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addEventButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
});
