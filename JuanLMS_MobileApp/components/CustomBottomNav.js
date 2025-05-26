import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const defaultNavItems = [
  { label: 'Dashboard', icon: 'view-dashboard', route: 'SDash' },
  { label: 'Activities', icon: 'file-document', route: 'SActs' },
  { label: 'Calendar', icon: 'calendar', route: 'SCalendar' },
  { label: 'Grades', icon: 'star', route: 'SGrade' },
  { label: 'Chats', icon: 'chat', route: 'SChat' },
];

export default function CustomBottomNav({ state, descriptors, navigation, navItems = defaultNavItems }) {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderTopWidth: 2,
      borderTopColor: '#e0e0e0',
      paddingVertical: 8,
      padding:5,
      elevation: 8,
    }}>
      {navItems.map((item, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={item.label}
            onPress={() => navigation.navigate(item.route)}
            style={{ alignItems: 'center', flex: 1 }}
          >
            <Icon
              name={item.icon}
              size={28}
              color={isFocused ? '#00418b' : '#222'}
            />
            <Text style={{
              fontSize: 12,
              color: isFocused ? '#00418b' : '#222',
              fontFamily: 'Poppins-Regular',
              marginTop: 2,
            }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
} 