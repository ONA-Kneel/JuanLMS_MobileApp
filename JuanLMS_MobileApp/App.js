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
//Students
import StudentDashboard from './components/Students/StudentDashboard';
import StudentModule from './components/Students/StudentModule';
import StudentGrades from './components/Students/StudentGrades';
import StudentActs from './components/Students/StudentActs';
import StudentProgress from './components/Students/StudentProgress';
import StudentChats from './components/Students/StudentsChats';
import Chat from './components/Chat';
import StudentsProfile from './components/Students/StudentsProfile';
import StudentCalendar from './components/Students/StudentsCalendar';

//Faculty
import FacultyDashboard from './components/Faculty/FacultyDashboard';
import CreateClasses from './components/Faculty/CreateClasses';
import FacultyStudentProgress from './components/Faculty/FacultyStudentProgress';
import FacultyModule from './components/Faculty/FacultyModule';
import CreateModule from './components/Faculty/CreateModule';
import CreateActivity from './components/Faculty/CreateActivity';


//Bottom Navigation Bar
const Tabs = createBottomTabNavigator();
//Student Dashboard
const StudentDash = () => {
  return(
    <Tabs.Navigator>
      <Tabs.Screen name='Dashboard' component={StudentDashboard} //Student Dashboard is now merged with Bottom Navigation
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='Calendar' component={StudentCalendar} //Calendar View for Students
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/9.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='SChat' component={StudentChats} //Chats tab for Current Student Account
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/8.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='SProf' component={StudentsProfile} //Profile tab for Current Student Account
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/7.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
    </Tabs.Navigator>
  )
}

//Faculty Dashboard
const FacultyDash = () => {
  return(
    <Tabs.Navigator>
      <Tabs.Screen name='FDashboard' component={FacultyDashboard} //Student Dashboard is now merged with Bottom Navigation
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
    </Tabs.Navigator>
  )
}

//Specific Screen Change
const Screens = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Screens.Navigator initialRouteName='FMod'>
        <Screens.Screen name='SplashScreen' component={SplashScreen}/>
        <Screens.Screen name='Login' component={Login}/>
        <Screens.Screen name='SDash' component={StudentDash}/>
        <Screens.Screen name='SModule' component={StudentModule}/>
        <Screens.Screen name='SGrade' component={StudentGrades}/>
        <Screens.Screen name='SActs' component={StudentActs}/>
        <Screens.Screen name='SProg' component={StudentProgress}/>
        <Screens.Screen name='Chats' component={Chat}/>
        <Screens.Screen name='SCalendar' component={StudentCalendar}/>
        {/*Faculties */}
        <Screens.Screen name='FDash' component={FacultyDash}/>
        <Screens.Screen name ='CClass' component={CreateClasses}/>
        <Screens.Screen name ='FSProg' component={FacultyStudentProgress}/>
        <Screens.Screen name ='FMod' component={FacultyModule}/>
        <Screens.Screen name ='CMod' component={CreateModule}/>
        <Screens.Screen name ='CAct' component={CreateActivity}/>


      </Screens.Navigator>
    </NavigationContainer>
  );
}