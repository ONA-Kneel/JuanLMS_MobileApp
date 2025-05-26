import { Text, TouchableOpacity, View } from 'react-native';
import { Image, ScrollView } from 'react-native-web';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import ParentDashStyle from '../styles/parent/ParentDashStyle';

export default function ParentDashboard() {
  const changeScreen = useNavigation();

  const Scheduling = () => {
    changeScreen.navigate("PSched")
  }
  const Learning = () => {
    changeScreen.navigate("PProg")
  }
  const Grading = () => {
    changeScreen.navigate("PGrade")
  }

  return (
    <View style={ParentDashStyle.container}>
      {/* Blue background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
      {/* White card header */}
      <View style={{ backgroundColor: '#fff', borderRadius: 18, marginTop: 20, marginBottom: 10, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, zIndex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 20, color: '#00418b' }}>Hello, <Text style={{ fontWeight: 'bold' }}>Parent!</Text></Text>
            <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 13 }}>Date and Time</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('PProfile')}>
            <Image source={require('../../assets/profile-icon (2).png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 2, paddingTop: 10 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginRight: 8, elevation: 2 }}>
            <Icon name="calendar" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>2</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Schedules</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#00418b', borderRadius: 16, alignItems: 'center', padding: 16, marginLeft: 8, elevation: 2 }}>
            <Icon name="chart-line" size={32} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, fontFamily: 'Poppins-Bold' }}>4</Text>
            <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>Learning</Text>
          </View>
        </View>
        {/* Modern Cards */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 8, fontFamily: 'Poppins-Bold' }}>Quick Actions</Text>
        <View>
          <View style={ParentDashStyle.card}>
            <View style={ParentDashStyle.cardHeader}>
              <Icon name="calendar" size={24} color="white" />
              <Text style={ParentDashStyle.titles}>My Child's Schedule</Text>
            </View>
            <TouchableOpacity onPress={Scheduling} style={ParentDashStyle.arrowButton}>
              <Icon name="arrow-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
