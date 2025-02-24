import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

//folders
import MyStyles from './components/styles/MyStyles';
import SplashScreen from './components/SplashScreen';

//Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './components/Login';
import StudentDashboard from './components/Students/StudentDashboard';
import StudentModule from './components/Students/StudentModule';

const Screens = createNativeStackNavigator();



export default function App() {
  return (
    <NavigationContainer>
      <Screens.Navigator initialRouteName='Login'>
        <Screens.Screen name='SplashScreen' component={SplashScreen}/>
        <Screens.Screen name='Login' component={Login}/>
        <Screens.Screen name='SDash' component={StudentDashboard}/>
        <Screens.Screen name='SModule' component={StudentModule}/>
      </Screens.Navigator>
    </NavigationContainer>
  );
}

