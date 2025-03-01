import { Text, TouchableOpacity, View } from 'react-native';
import { Image, ProgressBar, ScrollView } from 'react-native-web';
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

  const Grading = ()=>{
    changeScreen.navigate("PGrade")
  }

  return (
    <View>
      <View style={ParentDashStyle.header}>
        <Image source={require('../../assets/Logo3.svg')} style={ParentDashStyle.logo} />
        <Text style={{marginTop:-25, marginLeft:30, fontSize:20, fontWeight:'bold'}}>Welcome, Parent</Text>
      </View>
      
      <ScrollView>
        {/* My Child Schedule */}
        <View style={ParentDashStyle.card}>
          <View style={[ParentDashStyle.cardHeader, { flexDirection: 'row', alignItems: 'center' }]}>
            <Icon name="calendar" size={24} color="white"/>
            <Text style={[ParentDashStyle.titles, { marginLeft: 10 }]}>My Child's Schedule</Text>
          </View>
          <TouchableOpacity 
            onPress={Scheduling}
            style={ParentDashStyle.arrowButton}>
            <Icon name="arrow-right" size={24} color="white"/>
          </TouchableOpacity>
        </View>

        {/* Course Progression */}
        <View style={ParentDashStyle.card}>
          <View style={[ParentDashStyle.cardHeader, { flexDirection: 'row', alignItems: 'center' }]}>
            <Icon name="chart-line" size={24} color="white"/>  
            <Text style={[ParentDashStyle.titles, { marginLeft: 10 }]}>My Child's Learning</Text>
          </View>
          <TouchableOpacity 
            onPress={Learning}
            style={ParentDashStyle.arrowButton}>
            <Icon name="arrow-right" size={24} color="white"/>
          </TouchableOpacity>
        </View>

        {/* Faculty */}
        <View style={ParentDashStyle.card}>
          <View style={[ParentDashStyle.cardHeader, { flexDirection: 'row', alignItems: 'center' }]}>
            <Icon name="human-male-board" size={24} color="white"/>
            <Text style={[ParentDashStyle.titles, { marginLeft: 10 }]}>My Child's Grade</Text>
          </View>
          <TouchableOpacity 
            onPress={Grading}
            style={ParentDashStyle.arrowButton}>
            <Icon name="arrow-right" size={24} color="white"/>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
