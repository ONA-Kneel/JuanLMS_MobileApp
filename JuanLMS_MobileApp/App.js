import { Image } from 'react-native';
import React from 'react';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

//folders
import SplashScreen from './components/SplashScreen';

//Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Login from './components/Login';
import Chat from './components/Chat';
// import SupportMain from './components/SupportMain';
// import SupportRequest from './components/SupportRequest';

//Students
import StudentDashboard from './components/Students/StudentDashboard';
import StudentModule from './components/Students/StudentModule';
import StudentGrades from './components/Students/StudentGrades';
import StudentActs from './components/Students/StudentActs';
import StudentProgress from './components/Students/StudentProgress';
import StudentChats from './components/Students/StudentsChats';
import StudentsProfile from './components/Students/StudentsProfile';
import StudentCalendar from './components/Students/StudentsCalendar';
import StudentSCMain from './components/Students/StudentSCMain';
import StudentSupportCenter from './components/Students/StudentSupportCenter';
import CustomBottomNav from './components/CustomBottomNav';

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
import FacultySCMain from './components/Faculty/FacultySCMain';
import FacultySupportCenter from './components/Faculty/FacultySupportCenter';


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
import AdminAuditTrail from './components/Admin/AdminAuditTrail';
import AdminSupportCenter from './components/Admin/AdminSupportCenter';

//Parent
import ParentDashboard from './components/Parents/ParentDashboard';
import ParentSchedule from './components/Parents/ParentSchedule';
import ParentProgress from './components/Parents/ParentProgress';
import ParentGrades from './components/Parents/ParentGrades';
import ParentProfile from './components/Parents/ParentProfile';

//chats
import { ChatProvider } from './ChatContext';
import { UserProvider } from './components/UserContext';


//Bottom Navigation Bar
const Tabs = createBottomTabNavigator();

function StudentTabs() {
  return (
    <Tabs.Navigator
      tabBar={props => <CustomBottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="SDash" component={StudentDashboard} />
      <Tabs.Screen name="SActs" component={StudentActs} />
      <Tabs.Screen name="SCalendar" component={StudentCalendar} />
      <Tabs.Screen name="SGrade" component={StudentGrades} />
      <Tabs.Screen name="SChat" component={StudentChats} />
    </Tabs.Navigator>
  );
}

const facultyNavItems = [
  { label: 'Dashboard', icon: 'view-dashboard', route: 'FDashboard' },
  { label: 'Calendar', icon: 'calendar', route: 'FCalendar' },
  { label: 'Chats', icon: 'chat', route: 'FChat' },
  // { label: 'Profile', icon: 'account', route: 'FProfile' },
];

function FacultyTabs() {
  return (
    <Tabs.Navigator
      tabBar={props => <CustomBottomNav {...props} navItems={facultyNavItems} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="FDashboard" component={FacultyDashboard} />
      <Tabs.Screen name="FCalendar" component={FacultyCalendar} />
      <Tabs.Screen name="FChat" component={FacultyChats} />
      {/* <Tabs.Screen name="FSupportCenter" component={FacultySupportCenter} /> */}
      {/* <Tabs.Screen name="FProfile" component={FacultyProfile} /> */}
    </Tabs.Navigator>
  );
}

const adminNavItems = [
  { label: 'Dashboard', icon: 'view-dashboard', route: 'AdminDashB' },
  { label: 'Calendar', icon: 'calendar', route: 'ACalendar' },
  { label: 'Chats', icon: 'chat', route: 'AChat' },
  { label: 'Audit Trail', icon: 'history', route: 'AAuditTrail' },
  { label: 'Support Center', icon: 'help-circle', route: 'ASupportCenter' },
  // { label: 'Profile', icon: 'account', route: 'AProfile' },
];

const directorNavItems = [
  { label: 'Dashboard', icon: 'view-dashboard', route: 'DDash' },
  { label: 'Calendar', icon: 'calendar', route: 'DCalendar' },
  { label: 'Chats', icon: 'chat', route: 'DChats' },
  // { label: 'Profile', icon: 'account', route: 'DProfile' },
];

const parentNavItems = [
  { label: 'Dashboard', icon: 'view-dashboard', route: 'PDash' },
  { label: 'Grades', icon: 'star', route: 'PGrades' },
  // { label: 'Profile', icon: 'account', route: 'PProfile' },
];

function AdminDash() {
  return (
    <Tabs.Navigator
      tabBar={props => <CustomBottomNav {...props} navItems={adminNavItems} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name='AdminDashB' component={AdminDashboard} />
      <Tabs.Screen name='ACalendar' component={AdminCalendar} />
      <Tabs.Screen name='AChat' component={AdminChats} />
      <Tabs.Screen name='AAuditTrail' component={AdminAuditTrail} />
      <Tabs.Screen name='ASupportCenter' component={AdminSupportCenter} />
      {/* <Tabs.Screen name='AProfile' component={AdminProfile} /> */}
    </Tabs.Navigator>
  );
}

function DirectorDash() {
  return (
    <Tabs.Navigator
      tabBar={props => <CustomBottomNav {...props} navItems={directorNavItems} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name='DDash' component={DirectorDashboard} />
      <Tabs.Screen name='DCalendar' component={DirectorCalendar} />
      <Tabs.Screen name='DChats' component={DirectorChats} />
      {/* <Tabs.Screen name='DSupportCenter' component={DirectorSupportCenter} /> */}
      <Tabs.Screen name='DProfile' component={DirectorProfile} />
    </Tabs.Navigator>
  );
}

function ParentDash() {
  return (
    <Tabs.Navigator
      tabBar={props => <CustomBottomNav {...props} navItems={parentNavItems} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name='PDash' component={ParentDashboard} />
      <Tabs.Screen name='PGrades' component={ParentGrades} />
      {/* <Tabs.Screen name='PProfile' component={ParentProfile} /> */}
    </Tabs.Navigator>
  );
}

//Specific Screen Change
const Screens = createNativeStackNavigator();
export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
    'Poppins-Thin': require('./assets/fonts/Poppins-Thin.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <UserProvider>
    <ChatProvider>
    <NavigationContainer>
      <Screens.Navigator initialRouteName='Login'>

        {/*Assisted lang daw dapat */}

        {/* Used Everytime */}
        <Screens.Screen name='SplashScreen' component={SplashScreen} options={{ headerShown: false }}/>
        <Screens.Screen name='Chat' component={Chat} options={{ headerShown: false }}/>
        <Screens.Screen name='Login' component={Login} options={{ headerShown: false }}/>

        {/* Students */}
        <Screens.Screen name='SDash' component={StudentTabs} options={{ headerShown: false }}/>
        <Screens.Screen name='SModule' component={StudentModule} options={{ headerShown: false }}/>
        <Screens.Screen name='SGrade' component={StudentGrades} options={{ headerShown: false }}/>
        <Screens.Screen name='SActs' component={StudentActs} options={{ headerShown: false }}/>
        <Screens.Screen name='SProg' component={StudentProgress} options={{ headerShown: false }}/>
        <Screens.Screen name='SCalendar' component={StudentCalendar} options={{ headerShown: false }}/>
        <Screens.Screen name ='SMain' component={StudentSCMain} options={{ headerShown: false }}/>
        <Screens.Screen name ='SReq' component={StudentSupportCenter} options={{ headerShown: false }}/>
        <Screens.Screen name ='SProfile' component={StudentsProfile} options={{ headerShown: false }}/>


        {/*Faculties */}
        {/*Need tangalin ang "add a lesson" na naeedit, need daw upload lang and title lang ang editable*/}
        <Screens.Screen name='FDash' component={FacultyTabs} options={{ headerShown: false }}/>
        <Screens.Screen name ='CClass' component={CreateClasses} options={{ headerShown: false }}/>
        <Screens.Screen name ='FSProg' component={FacultyStudentProgress} options={{ headerShown: false }}/>
        <Screens.Screen name ='FMod' component={FacultyModule} options={{ headerShown: false }}/>
        <Screens.Screen name ='CMod' component={CreateModule} options={{ headerShown: false }}/>
        <Screens.Screen name ='CAct' component={CreateActivity} options={{ headerShown: false }}/>
        <Screens.Screen name ='FMain' component={FacultySCMain} options={{ headerShown: false }}/>
        <Screens.Screen name ='FReq' component={FacultySupportCenter} options={{ headerShown: false }}/>
        <Screens.Screen name ='FProfile' component={FacultyProfile} options={{ headerShown: false }}/>



        {/* Admininstrators */}
        <Screens.Screen name='ADash' component={AdminDash} options={{ headerShown: false }}/>
        <Screens.Screen name='GSched' component={GenSched} options={{ headerShown: false }}/>
        <Screens.Screen name='AProg' component={AdminProgress} options={{ headerShown: false }}/>
        <Screens.Screen name='AFaculty' component={AdminFaculty} options={{ headerShown: false }}/>
        <Screens.Screen name='AProfile' component={AdminProfile} options={{ headerShown: false }}/>
        <Screens.Screen name='ASupportCenter' component={AdminSupportCenter} options={{ headerShown: false }}/>

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
        <Screens.Screen name='PProfile' component={ParentProfile} options={{ headerShown: false }}/>
      </Screens.Navigator>
    </NavigationContainer>
    </ChatProvider>
    </UserProvider>
  );
}