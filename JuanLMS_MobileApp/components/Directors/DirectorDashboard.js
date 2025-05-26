import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import DirectorDashStyle from "../styles/directors/DirectorDashStyle.js";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function DirectorDashboard () {
  const navigation = useNavigation();

  const createModule = () =>{
    navigation.navigate('DModules');
  }

  const createQuizess = () =>{
    navigation.navigate('DQuizzes');
  }

  return (
    <View style={DirectorDashStyle.container}>
      {/* Blue background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
      {/* White card header */}
      <View style={{ backgroundColor: '#fff', borderRadius: 18, marginTop: 20, marginBottom: 10, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, zIndex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 20, color: '#00418b' }}>Hello, <Text style={{ fontWeight: 'bold' }}>Dean!</Text></Text>
            <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 13 }}>Date and Time</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('DProfile')}>
            <Image source={require('../../assets/profile-icon (2).png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 2, paddingTop: 10 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginRight: 8, elevation: 2 }}>
            <Icon name="book" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>12</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Modules</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginLeft: 8, elevation: 2 }}>
            <Icon name="clipboard-text" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>8</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Quizzes</Text>
          </View>
        </View>
        {/* Modern Cards */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Quick Actions</Text>
        <View>
          {/* <View style={DirectorDashStyle.card}>
            <View style={DirectorDashStyle.cardHeader}>
              <Icon name="plus" size={24} color="white" />
              <Text style={DirectorDashStyle.courseTitle}>Create Modules</Text>
            </View>
            <TouchableOpacity onPress={createModule} style={DirectorDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={DirectorDashStyle.card}>
            <View style={DirectorDashStyle.cardHeader}>
              <Icon name="plus" size={24} color="white" />
              <Text style={DirectorDashStyle.courseTitle}>Create Test</Text>
            </View>
            <TouchableOpacity onPress={createQuizess} style={DirectorDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View> */}
          <View style={DirectorDashStyle.card}>
            <View style={DirectorDashStyle.cardHeader}>
              <Icon name="calendar-month" size={24} color="white" />
              <Text style={DirectorDashStyle.courseTitle}>Class Schedules</Text>
            </View>
            <TouchableOpacity style={DirectorDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={DirectorDashStyle.card}>
            <View style={DirectorDashStyle.cardHeader}>
              <Icon name="calendar-clock" size={24} color="white" />
              <Text style={DirectorDashStyle.courseTitle}>School Schedules</Text>
            </View>
            <TouchableOpacity style={DirectorDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={DirectorDashStyle.card}>
            <View style={DirectorDashStyle.cardHeader}>
              <Icon name="account-tie" size={24} color="white" />
              <Text style={DirectorDashStyle.courseTitle}>Faculty</Text>
            </View>
            <TouchableOpacity style={DirectorDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
