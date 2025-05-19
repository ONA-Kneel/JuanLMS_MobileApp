import { Text, TouchableOpacity, View, Animated, Platform } from 'react-native';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Agenda } from 'react-native-calendars';
import { Card, Avatar } from 'react-native-paper';
import { CalendarList } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native-web';
import AdminCalendarStyle from '../styles/administrator/AdminCalendarStyle';

const timeToString = (time) => {
  const date = new Date(time);
  return date.toISOString().split('T')[0];
};

const getMonthYearString = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Custom Agenda component for web
const WebAgenda = ({ items, renderItem, selectedDate, setSelectedDate }) => {
  // Get current week's dates based on selectedDate
  const getCurrentWeekDates = () => {
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

  const weekDates = getCurrentWeekDates();

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

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: '#fff',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {weekDates.map(date => (
            <TouchableOpacity
              key={date}
              onPress={() => setSelectedDate(date)}
              style={{
                padding: 8,
                backgroundColor: selectedDate === date ? '#c0c0c0' : '#f0f0f0',
                borderRadius: 5,
                minWidth: 40,
                alignItems: 'center'
              }}
            >
              <Text style={{ 
                color: selectedDate === date ? '#000' : '#666',
                fontSize: 12
              }}>
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={{ 
                color: selectedDate === date ? '#000' : '#666',
                fontSize: 14,
                fontWeight: 'bold'
              }}>
                {new Date(date).getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ flex: 1, padding: 10 }}>
        {getEventsForSelectedDate().map((item, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            {renderItem(item)}
          </View>
        ))}
      </View>
    </View>
  );
};

export default function AdminCalendar() {
  const [items, setItems] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarHeight = useState(new Animated.Value(0))[0];
  const [currentMonth, setCurrentMonth] = useState(getMonthYearString(timeToString(Date.now())));
  const [selectedDate, setSelectedDate] = useState(timeToString(Date.now()));

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. Fetch holidays
        let holidays = [];
        for (let year = 2024; year <= 2030; year++) {
          const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
          const data = await res.json();
          holidays = holidays.concat(data);
        }

        // 2. Fetch events from your backend
        const resEvents = await fetch('http://localhost:5000/api/events');
        const eventsData = await resEvents.json();

        // 3. Merge into Agenda format
        const newItems = {};

        // Add holidays
        holidays.forEach(holiday => {
          if (!newItems[holiday.date]) newItems[holiday.date] = [];
          newItems[holiday.date].push({
            name: holiday.localName,
            type: 'holiday',
            color: '#FFEB3B',
            height: 50
          });
        });

        // Add events
        eventsData.forEach(event => {
          const date = event.date.split('T')[0];
          if (!newItems[date]) newItems[date] = [];
          newItems[date].push({
            name: event.title,
            type: 'event',
            color: event.color || '#2196f3',
            height: 50
          });
        });

        setItems(newItems);
      } catch (err) {
        console.error('Failed to fetch holidays or events:', err);
      }
    };
    fetchAll();
  }, []);

  const loadItems = (day) => {
    const strTime = timeToString(day.timestamp);
    if (!items[strTime]) {
      return;
    }
    setTimeout(() => {
      setItems((prevItems) => ({ ...prevItems }));
    }, 1000);
  };

  const renderItem = (item) => {
    let cardStyle = { backgroundColor: '#ffffff' };
    let textColor = '#000';
    let avatarLabel = 'E';
    if (item.type === 'holiday') {
      cardStyle = { backgroundColor: '#FFEB3B' };
      textColor = '#B71C1C';
      avatarLabel = 'H';
    } else if (item.type === 'event') {
      cardStyle = { backgroundColor: item.color || '#2196f3' };
      textColor = '#fff';
      avatarLabel = 'E';
    } else if (item.name === 'Math Assignment Deadline') {
      cardStyle = { backgroundColor: '#00418b' };
      textColor = '#fff';
      avatarLabel = 'D';
    }
    return (
      <Card style={[{ marginRight: 10, marginTop: 17 }, cardStyle]}>
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: textColor }}>{item.name}</Text>
            <Avatar.Text label={avatarLabel} />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const toggleCalendar = () => {
    Animated.timing(calendarHeight, {
      toValue: showCalendar ? 0 : 350,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setShowCalendar(!showCalendar);
  };

  const onVisibleMonthsChange = (months) => {
    if (months && months.length > 0) {
      setCurrentMonth(getMonthYearString(months[0].dateString));
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={AdminCalendarStyle.container}>
      <Image
        source={require('../../assets/Logo3.svg')}
        style={AdminCalendarStyle.logo}
      />
      <TouchableOpacity onPress={toggleCalendar} style={AdminCalendarStyle.header}>
        <Text style={AdminCalendarStyle.headerText}>{currentMonth}</Text>
        <Ionicons
          name={showCalendar ? 'chevron-up' : 'chevron-down'}
          size={24}
          style={AdminCalendarStyle.arrowIcon}
        />
      </TouchableOpacity>
      <Animated.View style={{ height: calendarHeight, overflow: 'hidden' }}>
        <CalendarList
          horizontal
          pagingEnabled
          calendarWidth={350}
          style={{ marginBottom: 10 }}
          onVisibleMonthsChange={onVisibleMonthsChange}
          onDayPress={onDayPress}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: '#c0c0c0' }
          }}
        />
      </Animated.View>
      {Platform.OS === 'web' ? (
        <WebAgenda items={items} renderItem={renderItem} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      ) : (
        <Agenda
          items={items}
          loadItemsForMonth={loadItems}
          selected={selectedDate}
          renderItem={renderItem}
          theme={{
            todayTextColor: '#FF5733',
            selectedDayBackgroundColor: '#c0c0c0',
            dotColor: '#4caf50',
          }}
        />
      )}
    </View>
  );
}
