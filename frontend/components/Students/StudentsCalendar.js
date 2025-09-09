import { Text, TouchableOpacity, View, Image, Alert, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import StudentCalendarStyle from '../styles/Stud/StudentCalendarStyle';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
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

export default function StudentCalendar() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [items, setItems] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => timeToString(new Date()));
  const [currentMonth, setCurrentMonth] = useState(() => getMonthYearString(timeToString(new Date())));
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // New state variables for web integration
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [classDates, setClassDates] = useState([]);
  const [assignmentEvents, setAssignmentEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Ensure selected date is always today's date when component mounts
  useEffect(() => {
    const today = new Date();
    const todayString = timeToString(today);
    setSelectedDate(todayString);
    setCurrentMonth(getMonthYearString(todayString));
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
          }
        }
      } catch (err) {
        console.error('Failed to fetch class dates', err);
      }
    };
    fetchClassDates();
  }, []);

  // Fetch assignment events
  useEffect(() => {
    const fetchAssignmentEvents = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch('https://juanlms-webapp-server.onrender.com/assignments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAssignmentEvents(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch assignment events', err);
      }
    };
    fetchAssignmentEvents();
  }, []);

  // Fetch all calendar data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoadingEvents(true);
        let holidays = [];
        
        // Fetch holidays for current year
        try {
          const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${new Date().getFullYear()}/PH`);
          if (res.ok) {
            const data = await res.json();
            holidays = Array.isArray(data) ? data : [];
          }
        } catch (holidayErr) {
          console.error('Failed to fetch holidays:', holidayErr);
        }

        try {
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

          // Process assignment events
          assignmentEvents.forEach(event => {
            try {
              if (!event.dueDate) return;
              const date = timeToString(new Date(event.dueDate));
              if (!newItems[date]) newItems[date] = [];
              newItems[date].push({
                name: event.title,
                type: event.type,
                color: event.color,
                subtitle: event.subtitle,
                time: event.end ? new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                height: 50,
                assignmentId: event.assignmentId,
                classId: event.classId
              });
            } catch (err) {
              console.error('Error processing assignment event:', err);
              return;
            }
          });

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

          setItems(newItems);
        } catch (err) {
          console.error('Error fetching events:', err);
          // Still process holidays even if events fail
          const newItems = {};
          holidays.forEach(holiday => {
            if (!holiday.date) return;
            if (!newItems[holiday.date]) newItems[holiday.date] = [];
            newItems[holiday.date].push({
              name: holiday.localName,
              type: 'holiday',
              color: '#FFEB3B',
              height: 50
            });
          });
          setItems(newItems);
        }
      } catch (err) {
        console.error('Failed to fetch holidays or events:', err);
        setItems({});
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchAll();
  }, [assignmentEvents, classDates]);

  // Add some mock events for testing if no real events exist
  useEffect(() => {
    if (!loadingEvents && Object.keys(items).length === 0) {
      const today = timeToString(Date.now());
      const tomorrow = timeToString(addDays(today, 1));
      const dayAfterTomorrow = timeToString(addDays(today, 2));
      
      const mockItems = {};
      mockItems[today] = [{
        name: 'Assignment Due',
        type: 'assignment',
        color: '#FF5722',
        height: 50,
        time: '11:59 PM',
        status: 'Due Today'
      }];
      
      mockItems[tomorrow] = [{
        name: 'Class Session',
        type: 'class',
        color: '#4CAF50',
        height: 50,
        time: '9:00 AM',
        status: 'Scheduled'
      }];
      
      mockItems[dayAfterTomorrow] = [{
        name: 'Quiz',
        type: 'quiz',
        color: '#9C27B0',
        height: 50,
        time: '2:00 PM',
        status: 'Upcoming'
      }];
      
      console.log('Student Calendar - Added mock events:', mockItems);
      setItems(mockItems);
    }
  }, [loadingEvents, items]);

  const renderEventCard = (item, index) => (
    <View key={index} style={[StudentCalendarStyle.eventCard, { backgroundColor: item.color || '#2196f3' }]}>
      <View style={{ flex: 1 }}>
        <Text style={StudentCalendarStyle.eventTitle}>{item.name}</Text>
        {item.subtitle && (
          <Text style={[StudentCalendarStyle.eventTime, { fontSize: 12, opacity: 0.8 }]}>
            {item.subtitle}
          </Text>
        )}
        {item.time && <Text style={StudentCalendarStyle.eventTime}>{item.time}</Text>}
        {item.type && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            alignSelf: 'flex-start',
            marginTop: 4
          }}>
            <Text style={{
              color: 'white',
              fontSize: 10,
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {item.type}
            </Text>
          </View>
        )}
      </View>
      <Text style={StudentCalendarStyle.eventStatus}>{item.status || ''}</Text>
    </View>
  );

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

  if (loadingEvents) {
    return (
      <View style={[StudentCalendarStyle.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontFamily: 'Poppins-Regular', color: '#666' }}>
          Loading calendar...
        </Text>
      </View>
    );
  }

  return (
    <View style={StudentCalendarStyle.container}>
      {/* Profile Header */}
      <View style={StudentCalendarStyle.profileHeader}>
        <View style={StudentCalendarStyle.profileHeaderContent}>
          <View style={StudentCalendarStyle.profileInfo}>
            <Text style={StudentCalendarStyle.greetingText}>
              Hello, <Text style={StudentCalendarStyle.userName}>{user?.firstname || 'Student'}!</Text>
            </Text>
            <Text style={StudentCalendarStyle.roleText}>Student</Text>
            <Text style={StudentCalendarStyle.dateText}>
              {moment(new Date()).format('dddd, MMMM D, YYYY')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SProfile')}>
            {(() => {
              const API_BASE = 'https://juanlms-webapp-server.onrender.com';
              const raw = user?.profilePic || user?.profilePicture;
              const uri = raw && typeof raw === 'string' && raw.startsWith('/uploads/') ? (API_BASE + raw) : raw;
              return uri ? (
                <Image 
                  source={{ uri }} 
                  style={StudentCalendarStyle.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <Image 
                  source={require('../../assets/profile-icon (2).png')} 
                  style={StudentCalendarStyle.profileImage}
                />
              );
            })()}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={StudentCalendarStyle.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Calendar Title */}
        <View style={StudentCalendarStyle.calendarTitleContainer}>
          <Text style={StudentCalendarStyle.calendarTitle}>Student Calendar</Text>
          <Ionicons name="calendar" size={28} color="#00418b" />
        </View>

        {/* Academic Year and Term Info */}
        <View style={StudentCalendarStyle.academicInfo}>
          <Text style={StudentCalendarStyle.academicText}>
            {academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : "Loading..."} | 
            {currentTerm ? ` ${currentTerm.termName}` : " Loading..."}
          </Text>
        </View>

        {/* Month Navigation */}
        <View style={StudentCalendarStyle.monthNavigation}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={StudentCalendarStyle.navButton}>
            <Ionicons name="chevron-back" size={24} color="#00418b" />
          </TouchableOpacity>
          <Text style={StudentCalendarStyle.monthText}>{getMonthYearString(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={StudentCalendarStyle.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#00418b" />
          </TouchableOpacity>
        </View>

        {/* Month Calendar - Match VPE style */}
        <View style={StudentCalendarStyle.calendarContainer}>
          <View style={StudentCalendarStyle.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={StudentCalendarStyle.dayHeader}>{day}</Text>
            ))}
          </View>
          <View style={StudentCalendarStyle.calendarGrid}>
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
                if (!day) return <View key={index} style={StudentCalendarStyle.dayCell} />;
                
                const dayString = timeToString(day);
                const dayEvents = items[dayString] || [];
                const isSelected = dayString === selectedDate;
                const isToday = dayString === timeToString(new Date());
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      StudentCalendarStyle.dayCell,
                      isSelected && StudentCalendarStyle.selectedDay,
                      isToday && StudentCalendarStyle.today
                    ]}
                    onPress={() => setSelectedDate(dayString)}
                  >
                    <Text style={[
                      StudentCalendarStyle.dayNumber,
                      isSelected && StudentCalendarStyle.selectedDayText,
                      isToday && StudentCalendarStyle.todayText
                    ]}>
                      {day.getDate()}
                    </Text>
                    {dayEvents.length > 0 && (
                      <View style={StudentCalendarStyle.eventIndicator}>
                        <Text style={StudentCalendarStyle.eventCount}>{dayEvents.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              });
            })()}
          </View>
        </View>

        {/* Selected Date Events */}
        <View style={StudentCalendarStyle.eventsContainer}>
          <Text style={StudentCalendarStyle.eventsTitle}>
            Events for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          {getEventsForSelectedDate().length === 0 ? (
            <View style={StudentCalendarStyle.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={StudentCalendarStyle.noEventsText}>No events scheduled for this date</Text>
            </View>
          ) : (
            <View style={StudentCalendarStyle.eventsList}>
              {getEventsForSelectedDate().map((item, index) => renderEventCard(item, index))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
