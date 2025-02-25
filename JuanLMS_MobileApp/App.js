import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';

//folders
import SplashScreen from './components/SplashScreen';
import MyStyles from './components/styles/MyStyles';

//Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Login from './components/Login';
import StudentDashboard from './components/Students/StudentDashboard';
import StudentModule from './components/Students/StudentModule';
import StudentGrades from './components/Students/StudentGrades';
import StudentActs from './components/Students/StudentActs';
import StudentProgress from './components/Students/StudentProgress';


//Screen Change/Bottom Navigation Bar
const Screens = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const StudentNav = () => {
  return(
    <Tabs.Navigator>
      <Tabs.Screen name='SDash' component={StudentDashboard} 
      options={{tabBarIcon: () => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30 , shadowColor:'black'}}/>),}} />
    </Tabs.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Screens.Navigator initialRouteName='Login'>
        <Screens.Screen name='SplashScreen' component={SplashScreen}/>
        <Screens.Screen name='Login' component={Login}/>
        <Screens.Screen name='SModule' component={StudentModule}/>
        <Screens.Screen name='SGrade' component={StudentGrades}/>
        <Screens.Screen name='SActs' component={StudentActs}/>
        <Screens.Screen name='SNav' component={StudentNav}/>
        <Screens.Screen name='SProg' component={StudentProgress}/>
      </Screens.Navigator>
    </NavigationContainer>
  );
}

