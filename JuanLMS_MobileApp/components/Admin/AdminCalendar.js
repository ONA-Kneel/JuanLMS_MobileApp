import { Text, TouchableOpacity, View, Animated } from 'react-native';
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

export default function AdminCalendar() {
  const [items, setItems] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarHeight = useState(new Animated.Value(0))[0];
  const [currentMonth, setCurrentMonth] = useState(getMonthYearString(timeToString(Date.now())));

  useEffect(() => {
    const fetchHolidays = async () => {
      let holidays = [];
      for (let year = 2024; year <= 2030; year++) {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
        const data = await res.json();
        holidays = holidays.concat(data);
      }
      // Convert to Agenda format
      const newItems = {};
      holidays.forEach(holiday => {
        newItems[holiday.date] = [{
          name: holiday.localName,
          type: 'holiday',
          height: 50
        }];
      });
      // Add today's sample event
      const today = timeToString(Date.now());
      if (!newItems[today]) {
        newItems[today] = [];
      }
      newItems[today].push({ name: 'Math Assignment Deadline', type: 'deadline', height: 50 });
      setItems(newItems);
    };
    fetchHolidays();
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

  // Update currentMonth when the visible month changes in CalendarList
  const onVisibleMonthsChange = (months) => {
    if (months && months.length > 0) {
      setCurrentMonth(getMonthYearString(months[0].dateString));
    }
  };

  return (
    <View style={AdminCalendarStyle.container}>
      <Image
        source={require('../../assets/Logo3.svg')}
        style={AdminCalendarStyle.logo}
      />
      {/* Header with Toggle Arrow */}
      <TouchableOpacity onPress={toggleCalendar} style={AdminCalendarStyle.header}>
        <Text style={AdminCalendarStyle.headerText}>{currentMonth}</Text>
        <Ionicons
          name={showCalendar ? 'chevron-up' : 'chevron-down'}
          size={24}
          style={AdminCalendarStyle.arrowIcon}
        />
      </TouchableOpacity>
      {/* Animated Horizontal Calendar */}
      <Animated.View style={{ height: calendarHeight, overflow: 'hidden' }}>
        <CalendarList
          horizontal
          pagingEnabled
          calendarWidth={350}
          style={{ marginBottom: 10 }}
          onVisibleMonthsChange={onVisibleMonthsChange}
        />
      </Animated.View>
      {/* Agenda for Deadlines and Events */}
      <Agenda
        items={items}
        loadItemsForMonth={loadItems}
        selected={timeToString(Date.now())}
        renderItem={renderItem}
        theme={{
          todayTextColor: '#FF5733',
          selectedDayBackgroundColor: '#c0c0c0',
          dotColor: '#4caf50',
        }}
      />
    </View>
  );
}
