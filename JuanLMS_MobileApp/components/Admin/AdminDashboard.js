import { Text, TouchableOpacity, View } from 'react-native';
import { Image, ProgressBar, ScrollView } from 'react-native-web';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AdminDashStyle from '../styles/administrator/AdminDashStyle';

export default function AdminDashboard() {
  
  const changeScreen = useNavigation();
  
  const Schedules = () => {
    changeScreen.navigate("GSched")
  }

  const Progressive = () => {
    changeScreen.navigate("AProg")
  }

  return (
    <View>
      <View style={AdminDashStyle.header}>
        <Image source={require('../../assets/Logo3.svg')} style={AdminDashStyle.logo} />
        <Text style={{marginTop:-25, marginLeft:30, fontSize:20, fontWeight:'bold'}}>Welcome, Dean</Text>
      </View>
      
      <ScrollView>
        {/* Class Schedule */}
        <View style={AdminDashStyle.card}>
          <View style={[AdminDashStyle.cardHeader, { flexDirection: 'row', alignItems: 'center' }]}>
            <Icon name="calendar" size={24} color="white"/>
            <Text style={[AdminDashStyle.titles, { marginLeft: 10 }]}>Class Schedule</Text>
          </View>
          <TouchableOpacity 
            onPress={Schedules}
            style={AdminDashStyle.arrowButton}>
            <Icon name="arrow-right" size={24} color="white"/>
          </TouchableOpacity>
        </View>

        {/* Course Progression */}
        <View style={AdminDashStyle.card}>
          <View style={[AdminDashStyle.cardHeader, { flexDirection: 'row', alignItems: 'center' }]}>
            <Icon name="chart-line" size={24} color="white"/>  
            <Text style={[AdminDashStyle.titles, { marginLeft: 10 }]}>Course Progression</Text>
          </View>
          <TouchableOpacity 
            onPress={Progressive}
            style={AdminDashStyle.arrowButton}>
            <Icon name="arrow-right" size={24} color="white"/>
          </TouchableOpacity>
        </View>

        {/* Faculty */}
        <View style={AdminDashStyle.card}>
          <View style={[AdminDashStyle.cardHeader, { flexDirection: 'row', alignItems: 'center' }]}>
            <Icon name="human-male-board" size={24} color="white"/>
            <Text style={[AdminDashStyle.titles, { marginLeft: 10 }]}>Faculty</Text>
          </View>
          <TouchableOpacity style={AdminDashStyle.arrowButton}>
            <Icon name="arrow-right" size={24} color="white"/>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
