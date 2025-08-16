import { Text, TouchableOpacity, View, Image } from 'react-native';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import AdminCalendarStyle from '../styles/administrator/AdminCalendarStyle';
import { useNavigation } from '@react-navigation/native';

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

export default function AdminCalendar() {
  const changeScreen = useNavigation();
  const [items, setItems] = useState({});
  const [selectedDate, setSelectedDate] = useState(timeToString(Date.now()));
  const [currentMonth, setCurrentMonth] = useState(getMonthYearString(timeToString(Date.now())));
  const [viewMode, setViewMode] = useState('Month');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    return timeToString(startOfWeek);
  });
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
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
            let date = '';
            try {
              date = event.date.split('T')[0];
            } catch (err) {
              console.error('Error splitting event date:', err);
              return;
            }
            if (date && !newItems[date]) newItems[date] = [];
            if (date) {
              newItems[date].push({
                name: event.title || 'Event',
                type: 'event',
                color: event.color || '#2196f3',
                time: event.time || '',
                height: 50
              });
            }
          }
        });
        
        setItems(newItems);
      } catch (err) {
        console.error('Failed to fetch calendar data:', err);
        setItems({});
      }
    };
    fetchAll();
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
    <View style={AdminCalendarStyle.container}>
      {/* Blue background */}
      <View style={AdminCalendarStyle.blueHeaderBackground} />
      {/* White card header */}
      <View style={AdminCalendarStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={AdminCalendarStyle.headerTitle}>Calendar</Text>
            <Text style={AdminCalendarStyle.headerSubtitle}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('AProfile')}>
            <Image 
              source={require('../../assets/profile-icon (2).png')} 
              style={{ width: 36, height: 36, borderRadius: 18 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Always show week row */}
      <View style={[AdminCalendarStyle.calendarCard, { padding: 8, marginTop: 5, marginBottom: 10 }]}> 
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
          <View style={[AdminCalendarStyle.calendarCard, {marginBottom:5}]}> 
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
      <Text style={AdminCalendarStyle.upcomingTitle}>Upcoming events</Text>
      <View style={AdminCalendarStyle.eventsList}>
        {getEventsForSelectedDate().length === 0 ? (
          <Text style={AdminCalendarStyle.noEventsText}>No events</Text>
        ) : (
          getEventsForSelectedDate().map((item, index) => renderEventCard(item, index))
        )}
      </View>
    </View>
  );
}

