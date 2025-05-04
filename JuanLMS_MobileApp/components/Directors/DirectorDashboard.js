import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import DirectorDashStyle from "../styles/directors/DirectorDashStyle.js";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function DirectorDashboard () {
  const navigation = useNavigation();

  return (
    <View style={DirectorDashStyle.container}>
      {/* Logo and Welcome Text */}
      <View style={DirectorDashStyle.header}>
        <Image source={require('../../assets/Logo3.svg')} style={DirectorDashStyle.logo} />
        <Text style={DirectorDashStyle.welcomeText}>Welcome, Dean</Text>
      </View>

      {/* Create Buttons */}
      <View style={DirectorDashStyle.iconsContainer}>
        <TouchableOpacity style={DirectorDashStyle.iconWrapper}>
          <View style={DirectorDashStyle.iconCircle}>
            <Icon name="plus" size={30} color="#fff" />
          </View>
          <Text style={DirectorDashStyle.iconLabel}>Create Classes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={DirectorDashStyle.iconWrapper}>
          <View style={DirectorDashStyle.iconCircle}>
            <Icon name="plus" size={30} color="#fff" />
          </View>
          <Text style={DirectorDashStyle.iconLabel}>Create Test</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Options */}
      <View style={DirectorDashStyle.menuContainer}>
        <TouchableOpacity style={DirectorDashStyle.menuItem}>
          <Icon name="calendar-month" size={30} color="#fff" />
          <Text style={DirectorDashStyle.menuText}>Class Schedules</Text>
        </TouchableOpacity>

        <TouchableOpacity style={DirectorDashStyle.menuItem}>
          <Icon name="calendar-clock" size={30} color="#fff" />
          <Text style={DirectorDashStyle.menuText}>School Schedules</Text>
        </TouchableOpacity>

        <TouchableOpacity style={DirectorDashStyle.menuItem}>
          <Icon name="account-tie" size={30} color="#fff" />
          <Text style={DirectorDashStyle.menuText}>Faculty</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
