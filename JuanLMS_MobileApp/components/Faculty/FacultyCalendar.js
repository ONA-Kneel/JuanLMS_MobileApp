import { Text, TouchableOpacity, View, Animated } from 'react-native';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Agenda } from 'react-native-calendars';
import { Card, Avatar } from 'react-native-paper';
import { CalendarList } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native-web';
import FacultyCalendarStyle from '../styles/faculty/FacultyCalendarStyle';

const timeToString = (time) => {
  const date = new Date(time);
  return date.toISOString().split('T')[0];
};

export default function FacultyCalendar() {
  const [items, setItems] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarHeight = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const today = timeToString(Date.now());
    const newItems = {
      [today]: [{ name: 'Math Assignment Deadline', type: 'deadline', height: 50 }],
    };
    setItems(newItems);
  }, []);

  const loadItems = (day) => {
    const strTime = timeToString(day.timestamp);
    if (!items[strTime]) {
      return; // Only update if events already exist — no empty entries
    }
    setTimeout(() => {
      setItems((prevItems) => ({ ...prevItems }));
    }, 1000);
  };

  const renderItem = (item) => {
    // Conditional style based on the event type
    const cardStyle = item.name === 'Math Assignment Deadline'
      ? { backgroundColor: '#00418b' } // Apply the color to the Math Assignment Deadline card
      : { backgroundColor: '#ffffff' }; // Default color for other events

    return (
      <Card style={[{ marginRight: 10, marginTop: 17 }, cardStyle]}>
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: item.name === 'Math Assignment Deadline' ? '#fff' : '#000' }}>
              {item.name}
            </Text>
            <Avatar.Text label={item.type === 'deadline' ? 'D' : 'E'} />
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

  return (
    <View style={FacultyCalendarStyle.container}>
      <Image
        source={require('../../assets/Logo3.svg')}
        style={FacultyCalendarStyle.logo}
      />

      {/* Header with Toggle Arrow */}
      <TouchableOpacity onPress={toggleCalendar} style={FacultyCalendarStyle.header}>
        <Text style={FacultyCalendarStyle.headerText}>February 2025</Text>
        <Ionicons
          name={showCalendar ? 'chevron-up' : 'chevron-down'}
          size={24}
          style={FacultyCalendarStyle.arrowIcon}
        />
      </TouchableOpacity>

      {/* Animated Horizontal Calendar */}
      <Animated.View style={{ height: calendarHeight, overflow: 'hidden' }}>
        <CalendarList
          horizontal
          pagingEnabled
          calendarWidth={350}
          style={{ marginBottom: 10 }}
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
