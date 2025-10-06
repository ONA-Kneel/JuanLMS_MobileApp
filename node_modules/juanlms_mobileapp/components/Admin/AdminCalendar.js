import { Text, TouchableOpacity, View, Image, Alert, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AdminCalendarStyle from '../styles/administrator/AdminCalendarStyle';
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

const getCurrentWeekDates = (selectedDate) => {
  const today = new Date(selectedDate);
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(timeToString(date));
  }
  return weekDates;
};

const addDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return timeToString(date);
};

export default function AdminCalendar() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [items, setItems] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => timeToString(new Date()));
  const [currentMonth, setCurrentMonth] = useState(() => getMonthYearString(timeToString(new Date())));
  const [viewMode, setViewMode] = useState('Month');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    return timeToString(startOfWeek);
  });
  const [showMonthCalendar, setShowMonthCalendar] = useState(true);
  
  // New state variables for enhanced functionality
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [classDates, setClassDates] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

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
          }
        } catch (holidayErr) {
          console.error('Failed to fetch holidays:', holidayErr);
        }

        let eventsData = [];
        try {
          const resEvents = await fetch('https://juanlms-webapp-server.onrender.com/events');
          if (resEvents.ok) {
            const data = await resEvents.json();
            eventsData = Array.isArray(data) ? data : [];
          }
        } catch (eventErr) {
          console.error('Failed to fetch events:', eventErr);
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

        // Process events
        eventsData.forEach(event => {
          if (event && event.date) {
            const eventDate = timeToString(new Date(event.date));
            if (!newItems[eventDate]) newItems[eventDate] = [];
            newItems[eventDate].push({
              name: event.title || 'Event',
              type: 'event',
              color: '#2196f3',
              height: 50,
              time: event.time || '',
              status: event.status || ''
            });
          }
        });

        // Process class dates
        if (classDates.length > 0) {
          classDates.forEach(classDate => {
            if (classDate && classDate.date) {
              const classDateStr = timeToString(new Date(classDate.date));
              if (!newItems[classDateStr]) newItems[classDateStr] = [];
              newItems[classDateStr].push({
                name: 'Class Day',
                type: 'class',
                color: '#4CAF50',
                height: 50
              });
            }
          });
        }

        setItems(newItems);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchAll();
  }, [classDates]);

  // Ensure selectedDate is always set to today when component mounts
  useEffect(() => {
    const today = new Date();
    const todayString = timeToString(today);
    console.log('AdminCalendar - Setting selectedDate to today:', todayString);
    console.log('AdminCalendar - Today object:', today);
    setSelectedDate(todayString);
    setCurrentMonth(getMonthYearString(todayString));
    
    // Update weekStartDate to match today's week
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    setWeekStartDate(timeToString(startOfWeek));
  }, []);

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

  const renderEventCard = (item, index) => (
    <View key={index} style={[AdminCalendarStyle.eventCard, { backgroundColor: item.color || '#2196f3' }]}> 
      <View style={{ flex: 1 }}>
        <Text style={AdminCalendarStyle.eventTitle}>{item.name}</Text>
        {item.time && <Text style={AdminCalendarStyle.eventTime}>{item.time}</Text>}
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
      <Text style={AdminCalendarStyle.eventStatus}>{item.status || ''}</Text>
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

  // Week view: get week dates for the current week
  const weekDates = getCurrentWeekDates(weekStartDate);

  // Month navigation
  const changeMonth = (direction) => {
    const date = new Date(selectedDate);
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    const newDateStr = timeToString(date);
    setSelectedDate(newDateStr);
    setCurrentMonth(getMonthYearString(newDateStr));
  };

  // Handlers for week navigation
  const goToPrevWeek = () => {
    setWeekStartDate(addDays(weekStartDate, -7));
    setSelectedDate(addDays(weekStartDate, -7));
  };
  const goToNextWeek = () => {
    setWeekStartDate(addDays(weekStartDate, 7));
    setSelectedDate(addDays(weekStartDate, 7));
  };

  // When switching to week view, sync weekStartDate to selectedDate's week
  React.useEffect(() => {
    if (viewMode === 'Week') {
      const date = new Date(selectedDate);
      const currentDay = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - currentDay);
      setWeekStartDate(timeToString(startOfWeek));
    }
  }, [viewMode, selectedDate]);

  if (loadingEvents) {
    return (
      <View style={[AdminCalendarStyle.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={{ marginTop: 16, fontFamily: 'Poppins-Regular', color: '#666' }}>
          Loading calendar...
        </Text>
      </View>
    );
  }

  return (
    <View style={AdminCalendarStyle.container}>
      {/* Profile Header */}
      <View style={AdminCalendarStyle.profileHeader}>
        <View style={AdminCalendarStyle.profileHeaderContent}>
          <View style={AdminCalendarStyle.profileInfo}>
            <Text style={AdminCalendarStyle.greetingText}>
              Hello, <Text style={AdminCalendarStyle.userName}>{user?.firstname || 'Admin'}!</Text>
            </Text>
            <Text style={AdminCalendarStyle.roleText}>Administrator</Text>
            <Text style={AdminCalendarStyle.dateText}>
              {moment(new Date()).format('dddd, MMMM D, YYYY')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AProfile')}>
            {(() => {
              const API_BASE = 'https://juanlms-webapp-server.onrender.com';
              const raw = user?.profilePic || user?.profilePicture;
              const uri = raw && typeof raw === 'string' && raw.startsWith('/uploads/') ? (API_BASE + raw) : raw;
              return uri ? (
                <Image 
                  source={{ uri }} 
                  style={AdminCalendarStyle.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <Image 
                  source={require('../../assets/profile-icon (2).png')} 
                  style={AdminCalendarStyle.profileImage}
                />
              );
            })()}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={AdminCalendarStyle.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Calendar Title */}
        <View style={AdminCalendarStyle.calendarTitleContainer}>
          <Text style={AdminCalendarStyle.calendarTitle}>Administrative Calendar</Text>
          <Ionicons name="calendar" size={28} color="#00418b" />
        </View>

        {/* Academic Year and Term Info */}
        <View style={AdminCalendarStyle.academicInfo}>
          <Text style={AdminCalendarStyle.academicText}>
            {academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : "Loading..."} | 
            {currentTerm ? ` ${currentTerm.termName}` : " Loading..."}
          </Text>
        </View>

        {/* Month Navigation (always visible) */}
        <View style={AdminCalendarStyle.monthNavigation}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={AdminCalendarStyle.navButton}>
            <Ionicons name="chevron-back" size={24} color="#00418b" />
          </TouchableOpacity>
          <Text style={AdminCalendarStyle.monthText}>{getMonthYearString(selectedDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={AdminCalendarStyle.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#00418b" />
          </TouchableOpacity>
        </View>

        {/* Month Calendar */}
        {showMonthCalendar && (
          <View style={AdminCalendarStyle.calendarContainer}>
            <View style={AdminCalendarStyle.dayHeaders}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={AdminCalendarStyle.dayHeader}>{day}</Text>
              ))}
            </View>
            <View style={AdminCalendarStyle.calendarGrid}>
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
                  if (!day) return <View key={index} style={AdminCalendarStyle.dayCell} />;
                  
                  const dayString = timeToString(day);
                  const dayEvents = items[dayString] || [];
                  const isSelected = dayString === selectedDate;
                  const isToday = dayString === timeToString(new Date());
                  
                  // Debug logging for the current day being rendered
                  if (isSelected || isToday) {
                    console.log(`AdminCalendar - Day ${day.getDate()}: dayString=${dayString}, selectedDate=${selectedDate}, isSelected=${isSelected}, isToday=${isToday}`);
                  }
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        AdminCalendarStyle.dayCell,
                        isSelected && AdminCalendarStyle.selectedDay,
                        isToday && AdminCalendarStyle.today
                      ]}
                      onPress={() => setSelectedDate(dayString)}
                    >
                      <Text style={[
                        AdminCalendarStyle.dayNumber,
                        isSelected && AdminCalendarStyle.selectedDayText,
                        isToday && AdminCalendarStyle.todayText
                      ]}>
                        {day.getDate()}
                      </Text>
                      {dayEvents.length > 0 && (
                        <View style={AdminCalendarStyle.eventIndicator}>
                          <Text style={AdminCalendarStyle.eventCount}>{dayEvents.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          </View>
        )}

        {/* Week View */}
        <View style={AdminCalendarStyle.weekContainer}>
          <View style={AdminCalendarStyle.weekNavigation}>
            <TouchableOpacity onPress={goToPrevWeek} style={AdminCalendarStyle.weekNavButton}>
              <Ionicons name="chevron-back" size={24} color="#00418b" />
            </TouchableOpacity>
            <Text style={AdminCalendarStyle.weekText}>Week View</Text>
            <TouchableOpacity onPress={goToNextWeek} style={AdminCalendarStyle.weekNavButton}>
              <Ionicons name="chevron-forward" size={24} color="#00418b" />
            </TouchableOpacity>
          </View>
          
          <View style={AdminCalendarStyle.weekGrid}>
            {weekDates.map(date => (
              <TouchableOpacity
                key={date}
                onPress={() => setSelectedDate(date)}
                style={[
                  AdminCalendarStyle.weekDay,
                  selectedDate === date && AdminCalendarStyle.selectedWeekDay
                ]}
              >
                <Text style={[
                  AdminCalendarStyle.weekDayText,
                  selectedDate === date && AdminCalendarStyle.selectedWeekDayText
                ]}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[
                  AdminCalendarStyle.weekDateText,
                  selectedDate === date && AdminCalendarStyle.selectedWeekDayText
                ]}>
                  {new Date(date).getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Date Events */}
        <View style={AdminCalendarStyle.eventsContainer}>
          <Text style={AdminCalendarStyle.eventsTitle}>
            Events for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          {getEventsForSelectedDate().length === 0 ? (
            <View style={AdminCalendarStyle.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={AdminCalendarStyle.noEventsText}>No events scheduled for this date</Text>
            </View>
          ) : (
            <View style={AdminCalendarStyle.eventsList}>
              {getEventsForSelectedDate().map((item, index) => renderEventCard(item, index))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

