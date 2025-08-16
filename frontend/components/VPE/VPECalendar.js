import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export default function VPECalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      setIsLoading(true);
      
      // Fetch calendar events from admin API
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const response = await axios.get(`${API_BASE_URL}/api/admin/academic-calendar?month=${month}&year=${year}`);
      
      if (response.data && Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      // For now, use mock data since API might not be fully implemented
      setEvents(getMockEvents());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockEvents = () => {
    const today = new Date();
    return [
      {
        id: 1,
        title: 'Academic Year Start',
        date: new Date(today.getFullYear(), 5, 1), // June 1
        type: 'academic',
        description: 'Beginning of new academic year'
      },
      {
        id: 2,
        title: 'First Term Start',
        date: new Date(today.getFullYear(), 7, 2), // August 2
        type: 'term',
        description: 'First term classes begin'
      },
      {
        id: 3,
        title: 'First Term End',
        date: new Date(today.getFullYear(), 7, 3), // August 3
        type: 'term',
        description: 'First term classes end'
      },
      {
        id: 4,
        title: 'Academic Year End',
        date: new Date(today.getFullYear() + 1, 3, 30), // April 30
        type: 'academic',
        description: 'End of academic year'
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

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academic Calendar</Text>
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
          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            {selectedDateEvents.map(event => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Icon 
                    name={event.type === 'academic' ? 'school' : 'calendar'} 
                    size={20} 
                    color="#00418b" 
                  />
                  <Text style={styles.eventTitle}>{event.title}</Text>
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noEventsContainer}>
            <Icon name="calendar-blank" size={48} color="#ccc" />
            <Text style={styles.noEventsText}>No events scheduled for this date</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: 'Poppins-SemiBold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
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
    color: '#333',
    fontFamily: 'Poppins-Regular',
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
    bottom: 2,
    right: 2,
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
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  eventsContainer: {
    flex: 1,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  eventDescription: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    fontFamily: 'Poppins-Regular',
  },
});


