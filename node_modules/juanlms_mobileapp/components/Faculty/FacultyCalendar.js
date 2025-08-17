import { Text, TouchableOpacity, View, Image, Alert } from 'react-native';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import FacultyCalendarStyle from '../styles/faculty/FacultyCalendarStyle';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const timeToString = (time) => {
  const date = new Date(time);
  return date.toISOString().split('T')[0];
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

export default function FacultyCalendar() {
  const changeScreen = useNavigation();
  const [items, setItems] = useState({});
  const [selectedDate, setSelectedDate] = useState(timeToString(Date.now()));
  const [currentMonth, setCurrentMonth] = useState(getMonthYearString(timeToString(Date.now())));
  const [viewMode, setViewMode] = useState('Month');
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    return timeToString(startOfWeek);
  });
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
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
        for (let year = 2024; year <= 2030; year++) {
          try {
            const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
            if (res.ok) {
              const data = await res.json();
              holidays = holidays.concat(data);
            }
          } catch (err) {
            console.error(`Error fetching holidays for ${year}:`, err);
            continue;
          }
        }
        
        const token = await AsyncStorage.getItem('jwtToken');
        const resEvents = await fetch('https://juanlms-webapp-server.onrender.com/api/events', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const eventsData = await resEvents.json();
        const newItems = {};
        
        // Process holidays
        holidays.forEach(holiday => {
          if (!newItems[holiday.date]) newItems[holiday.date] = [];
          newItems[holiday.date].push({
            name: holiday.localName,
            type: 'holiday',
            color: '#FFEB3B',
            height: 50
          });
        });
        
        // Process events
        eventsData.forEach(event => {
          if (!event.date) return;
          let date = '';
          try {
            date = event.date.split('T')[0];
          } catch (err) {
            console.error('Error splitting event date:', err);
            return;
          }
          if (!newItems[date]) newItems[date] = [];
          newItems[date].push({
            name: event.title,
            type: 'event',
            color: event.color || '#2196f3',
            time: event.time || '',
            height: 50
          });
        });

        // Process class dates
        classDates.forEach(date => {
          try {
            const dateStr = new Date(date.date).toISOString().split('T')[0];
            if (!dateStr) return;
            if (!newItems[dateStr]) newItems[dateStr] = [];
            newItems[dateStr].push({
              name: 'Class Day',
              type: 'class',
              color: '#93c5fd',
              height: 50
            });
          } catch (err) {
            console.error('Error processing class date:', err);
            return;
          }
        });
        
        setItems(newItems);
      } catch (err) {
        console.error('Failed to fetch holidays or events:', err);
        setItems({});
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
    <View key={index} style={[FacultyCalendarStyle.eventCard, { backgroundColor: item.color || '#2196f3' }]}> 
      <View style={{ flex: 1 }}>
        <Text style={FacultyCalendarStyle.eventTitle}>{item.name}</Text>
        {item.time && <Text style={FacultyCalendarStyle.eventTime}>{item.time}</Text>}
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
      <Text style={FacultyCalendarStyle.eventStatus}>{item.status || ''}</Text>
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

  return (
    <View style={FacultyCalendarStyle.container}>
      {/* Blue background */}
      <View style={FacultyCalendarStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={FacultyCalendarStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={FacultyCalendarStyle.headerTitle}>Calendar</Text>
            <Text style={FacultyCalendarStyle.headerSubtitle}>{formatDateTime(currentDateTime)}</Text>
            {/* Academic Year and Term Info */}
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular' }}>
                {academicYear ? `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` : "Loading..."} | 
                {currentTerm ? ` ${currentTerm.termName}` : " Loading..."}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('FProfile')}>
            <Image 
              source={require('../../assets/profile-icon (2).png')} 
              style={{ width: 36, height: 36, borderRadius: 18 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Always show week row */}
      <View style={[FacultyCalendarStyle.calendarCard, { padding: 8, marginTop: 5, marginBottom: 10 }]}> 
        {/* Collapsible Month Calendar Toggle */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, marginBottom: 5, marginHorizontal: 10 }}
          onPress={() => setShowMonthCalendar(!showMonthCalendar)}
        >
          <Text style={{ fontFamily: 'Poppins-Bold', color: '#00418B', fontSize: 16, marginLeft: 4 }}>
            {getMonthYearString(selectedDate)}
          </Text>
          <Ionicons name={showMonthCalendar ? 'chevron-up' : 'chevron-down'} size={20} color="#00418B" />
        </TouchableOpacity>
        {/* Collapsible Month Calendar */}
        {showMonthCalendar && (
          <View style={[FacultyCalendarStyle.calendarCard, {marginBottom:5}]}> 
            <Calendar
              current={selectedDate}
              onDayPress={day => setSelectedDate(day.dateString)}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#00418B' }
              }}
              theme={{
                backgroundColor: '#fff',
                calendarBackground: '#fff',
                textSectionTitleColor: '#222',
                selectedDayBackgroundColor: '#00418B',
                selectedDayTextColor: '#fff',
                todayTextColor: '#00418B',
                dayTextColor: '#222',
                textDisabledColor: '#ccc',
                monthTextColor: '#00418B',
                arrowColor: '#00418B',
                textDayFontFamily: 'Poppins-Regular',
                textMonthFontFamily: 'Poppins-Bold',
                textDayHeaderFontFamily: 'Poppins-Medium',
              }}
            />
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop:5 }}>
          <TouchableOpacity onPress={goToPrevWeek} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={24} color="#00418B" />
          </TouchableOpacity>
          {weekDates.map(date => (
            <TouchableOpacity
              key={date}
              onPress={() => setSelectedDate(date)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                backgroundColor: selectedDate === date ? '#00418B' : '#f0f0f0',
                borderRadius: 10,
                marginHorizontal: 2,
              }}
            >
              <Text style={{
                color: selectedDate === date ? '#fff' : '#888',
                fontFamily: selectedDate === date ? 'Poppins-Bold' : 'Poppins-Regular',
                fontSize: 13,
              }}>
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={{
                color: selectedDate === date ? '#fff' : '#222',
                fontFamily: selectedDate === date ? 'Poppins-Bold' : 'Poppins-Regular',
                fontSize: 16,
              }}>
                {new Date(date).getDate()}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={goToNextWeek} style={{ padding: 8 }}>
            <Ionicons name="chevron-forward" size={24} color="#00418B" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Upcoming events */}
      <Text style={FacultyCalendarStyle.upcomingTitle}>Upcoming events</Text>
      <View style={FacultyCalendarStyle.eventsList}>
        {loadingEvents ? (
          <Text style={FacultyCalendarStyle.noEventsText}>Loading events...</Text>
        ) : getEventsForSelectedDate().length === 0 ? (
          <Text style={FacultyCalendarStyle.noEventsText}>No events</Text>
        ) : (
          getEventsForSelectedDate().map((item, index) => renderEventCard(item, index))
        )}
      </View>
    </View>
  );
}

