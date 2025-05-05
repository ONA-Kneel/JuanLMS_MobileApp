import { Image } from 'react-native';

//folders
import SplashScreen from './components/SplashScreen';

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
import FacultyCalendar from './components/Faculty/FacultyCalendar';
import FacultyChats from './components/Faculty/FacultyChats';
import FacultyProfile from './components/Faculty/FacultyProfile';

//Director
import DirectorDashboard from './components/Directors/DirectorDashboard';
import DirectorProfile from './components/Directors/DirectorProfile';
import DirectorSupportCenter from './components/Directors/DirectorSupportCenter';
import DirectorChats from './components/Directors/DirectorChats';
import DirectorCalendar from './components/Directors/DirectorCalendar';
import DirectorCModule from './components/Directors/DirectorCModule';
import DirectorCQuizzes from './components/Directors/DirectorCQuizzess';
import DirectorSCMain from './components/Directors/DirectorSCMain';

//Admin
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminCalendar from './components/Admin/AdminCalendar';
import AdminChats from './components/Admin/AdminChats';
import AdminProfile from './components/Admin/AdminProfile';
import GenSched from './components/Admin/GenSched';
import AdminProgress from './components/Admin/AdminProgress';
import AdminFaculty from './components/Admin/AdminFaculty';

//Parent
import ParentDashboard from './components/Parents/ParentDashboard';
import ParentSchedule from './components/Parents/ParentSchedule';
import ParentProgress from './components/Parents/ParentProgress';
import ParentGrades from './components/Parents/ParentGrades';
import ParentProfile from './components/Parents/ParentProfile';

//Bottom Navigation Bar
const Tabs = createBottomTabNavigator();
//Student Dashboard
const StudentDash = () => {
  return(
    <Tabs.Navigator screenOptions={{ tabBarShowLabel: false }} >
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
    <Tabs.Navigator screenOptions={{ tabBarShowLabel: false }}>
      <Tabs.Screen name='FDashboard' component={FacultyDashboard} //Student Dashboard is now merged with Bottom Navigation
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='FCalendar' component={FacultyCalendar} //Calendar of Events for Faculty
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/9.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='FChat' component={FacultyChats} //Chats tab
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/8.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='FProfile' component={FacultyProfile} //Profile Tab
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/7.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
    </Tabs.Navigator>
  )
}

//Admin Dashboard
const AdminDash = () => {
  return(
    <Tabs.Navigator screenOptions={{ tabBarShowLabel: false }}>
      <Tabs.Screen name='AdminDashB' component={AdminDashboard}  //Student Dashboard is now merged with Bottom Navigation
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='ACalendar' component={AdminCalendar} //Calendar of Events
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/9.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='AChat' component={AdminChats} //Chats tab
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/8.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='AProfile' component={AdminProfile} //Profile Tab
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/7.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
    </Tabs.Navigator>
  )
}

//Parent Dashboard
const ParentDash =() =>{
  return(
    <Tabs.Navigator screenOptions={{ tabBarShowLabel: false }}>
      <Tabs.Screen name='PDash' component={ParentDashboard}
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
       <Tabs.Screen name='PProfile' component={ParentProfile}
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/7.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
    </Tabs.Navigator>
  )
}

//Director Dashboard
const DirectorDash = () =>{
  return(
    <Tabs.Navigator screenOptions={{ tabBarShowLabel: false }}>
      <Tabs.Screen name='DDash' component={DirectorDashboard}
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='DCalendar' component={DirectorCalendar}
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='DChats' component={DirectorChats}
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
      <Tabs.Screen name='DProfile' component={DirectorProfile}
      options={{ tabBarIcon: ({ focused }) => (<Image source={require('./assets/icons/6.svg')} style={{ width: 30, height: 30, overlayColor: focused ? 'blue': 'gray' }} />), }}/>
    </Tabs.Navigator>
  )
}
//Specific Screen Change
const Screens = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Screens.Navigator initialRouteName='Login'>

        {/*Remove the automatic scheduling */}
        {/*Assisted lang daw dapat */}

        {/* Used Everytime */}
        <Screens.Screen name='SplashScreen' component={SplashScreen} options={{ headerShown: false }}/>
        <Screens.Screen name='Chats' component={Chat} options={{ headerShown: false }}/>
        <Screens.Screen name='Login' component={Login} options={{ headerShown: false }}/>
        
        {/* Students */}
        <Screens.Screen name='SDash' component={StudentDash} options={{ headerShown: false }}/>
        <Screens.Screen name='SModule' component={StudentModule} options={{ headerShown: false }}/>
        <Screens.Screen name='SGrade' component={StudentGrades} options={{ headerShown: false }}/>
        <Screens.Screen name='SActs' component={StudentActs} options={{ headerShown: false }}/>
        <Screens.Screen name='SProg' component={StudentProgress} options={{ headerShown: false }}/>
        <Screens.Screen name='SCalendar' component={StudentCalendar} options={{ headerShown: false }}/>

        {/*Faculties */}
        {/*Need tangalin ang "add a lesson" na naeedit, need daw upload lang and title lang ang editable*/}
        <Screens.Screen name='FDash' component={FacultyDash} options={{ headerShown: false }}/>
        <Screens.Screen name ='CClass' component={CreateClasses} options={{ headerShown: false }}/>
        <Screens.Screen name ='FSProg' component={FacultyStudentProgress} options={{ headerShown: false }}/>
        <Screens.Screen name ='FMod' component={FacultyModule} options={{ headerShown: false }}/>
        <Screens.Screen name ='CMod' component={CreateModule} options={{ headerShown: false }}/>
        <Screens.Screen name ='CAct' component={CreateActivity} options={{ headerShown: false }}/>
        
        {/* Admininstrators */}
        <Screens.Screen name='ADash' component={AdminDash} options={{ headerShown: false }}/>
        <Screens.Screen name='GSched' component={GenSched} options={{ headerShown: false }}/>
        <Screens.Screen name='AProg' component={AdminProgress} options={{ headerShown: false }}/>
        <Screens.Screen name='AFaculty' component={AdminFaculty} options={{ headerShown: false }}/>

        {/* Directors */}
        <Screens.Screen name='DDash' component={DirectorDash} options={{headerShown: false}}/>
        <Screens.Screen name='DSupCent' component={DirectorSupportCenter} options={{headerShown: false}}/>
        <Screens.Screen name='DProfile' component={DirectorProfile} options={{headerShown: false}}/>
        <Screens.Screen name='DChats' component={DirectorChats} options={{headerShown: false}}/>
        <Screens.Screen name='DCalendar' component={DirectorCalendar} options={{headerShown: false}}/>
        <Screens.Screen name='DModules' component={DirectorCModule} options={{headerShown: false}}/>
        <Screens.Screen name='DQuizzes' component={DirectorCQuizzes} options={{headerShown: false}}/>
        <Screens.Screen name='DScMain' component={DirectorSCMain} options={{headerShown: false}}/>


        {/* Parents */}
        {/*"My Grades" tab should be "Student's Grade" */}
        <Screens.Screen name='PDash' component={ParentDash} options={{ headerShown: false }}/>
        <Screens.Screen name='PSched' component={ParentSchedule} options={{ headerShown: false }}/>
        <Screens.Screen name='PProg' component={ParentProgress} options={{ headerShown: false }}/>
        <Screens.Screen name='PGrade' component={ParentGrades} options={{ headerShown: false }}/>
      </Screens.Navigator>
    </NavigationContainer>
  );
}