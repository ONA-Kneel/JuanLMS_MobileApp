import { Text, TouchableOpacity, View } from 'react-native';
import { Image, ScrollView } from 'react-native-web';
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
  const AdminFact = () => {
    changeScreen.navigate("AFaculty")
  }

  return (
    <View style={AdminDashStyle.container}>
      {/* Blue background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
      {/* White card header */}
      <View style={{ backgroundColor: '#fff', borderRadius: 18, marginTop: 20, marginBottom: 10, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, zIndex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 20, color: '#00418b' }}>Hello, <Text style={{ fontWeight: 'bold' }}>Dean!</Text></Text>
            <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 13 }}>Date and Time</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('AProfile')}>
            <Image source={require('../../assets/profile-icon (2).png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 2, paddingTop: 10 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginRight: 8, elevation: 2 }}>
            <Icon name="calendar" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>3</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Schedules</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginLeft: 8, elevation: 2 }}>
            <Icon name="chart-line" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>5</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Progression</Text>
          </View>
        </View>
        {/* Modern Cards */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Quick Actions</Text>
        <View>
          <View style={AdminDashStyle.card}>
            <View style={AdminDashStyle.cardHeader}>
              <Icon name="calendar" size={24} color="white" />
              <Text style={AdminDashStyle.titles}>Class Schedule</Text>
            </View>
            <TouchableOpacity onPress={Schedules} style={AdminDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={AdminDashStyle.card}>
            <View style={AdminDashStyle.cardHeader}>
              <Icon name="chart-line" size={24} color="white" />
              <Text style={AdminDashStyle.titles}>Course Progression</Text>
            </View>
            <TouchableOpacity onPress={Progressive} style={AdminDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View style={AdminDashStyle.card}>
            <View style={AdminDashStyle.cardHeader}>
              <Icon name="human-male-board" size={24} color="white" />
              <Text style={AdminDashStyle.titles}>Faculty</Text>
            </View>
            <TouchableOpacity onPress={AdminFact} style={AdminDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
