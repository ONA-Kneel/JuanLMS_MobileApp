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
import GroupChat from './components/GroupChat';
import GroupManagement from './components/GroupManagement';
import UnifiedChat from './components/UnifiedChat';
// import SupportMain from './components/SupportMain';
// import SupportRequest from './components/SupportRequest';

//Students
import StudentDashboard from './components/Students/StudentDashboard';
import StudentClasses from './components/Students/StudentClasses';
import StudentModule from './components/Students/StudentModule';
import StudentGrades from './components/Students/StudentGrades';
import StudentActs from './components/Students/StudentActs';
import StudentProgress from './components/Students/StudentProgress';
import StudentChats from './components/Students/StudentsChats';
import StudentsProfile from './components/Students/StudentsProfile';
import StudentCalendar from './components/Students/StudentsCalendar';
import StudentSCMain from './components/Students/StudentSCMain';
import StudentSupportCenter from './components/Students/StudentSupportCenter';
import QuizView from './components/Students/QuizView';
import AssignmentDetail from './components/Students/AssignmentDetail';
import CustomBottomNav from './components/CustomBottomNav';

//Faculty
import FacultyDashboard from './components/Faculty/FacultyDashboard';
import FacultyClasses from './components/Faculty/FacultyClasses';
import CreateClasses from './components/Faculty/CreateClasses';
import FacultyStudentProgress from './components/Faculty/FacultyStudentProgress';
import FacultyModule from './components/Faculty/FacultyModule';
import CreateModule from './components/Faculty/CreateModule';
import CreateActivity from './components/Faculty/CreateActivity';
import CreateAssignment from './components/Faculty/CreateAssignment';
import CreateQuiz from './components/Faculty/CreateQuiz';
import AssignmentSubmissions from './components/Faculty/AssignmentSubmissions';
import QuizSubmissions from './components/Faculty/QuizSubmissions';
import FacultyCalendar from './components/Faculty/FacultyCalendar';
import FacultyChats from './components/Faculty/FacultyChats';
import FacultyProfile from './components/Faculty/FacultyProfile';
import FacultySCMain from './components/Faculty/FacultySCMain';
import FacultySupportCenter from './components/Faculty/FacultySupportCenter';
import FacultyActs from './components/Faculty/FacultyActs';
import FacultyGrades from './components/Faculty/FacultyGrades';




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

//VPE
import VPEDashboard from './components/VPE/VPEDashboard';
import VPECalendar from './components/VPE/VPECalendar';
import VPEChats from './components/VPE/VPEChats';
import VPESupportCenter from './components/VPE/VPESupportCenter';
import VPEProfile from './components/VPE/VPEProfile';
import VPEAuditTrail from './components/VPE/VPEAuditTrail';


//Principal
import PrincipalDashboard from './components/Principal/PrincipalDashboard';
import PrincipalCalendar from './components/Principal/PrincipalCalendar';
import PrincipalChats from './components/Principal/PrincipalChats';
import PrincipalSupportCenter from './components/Principal/PrincipalSupportCenter';
import PrincipalProfile from './components/Principal/PrincipalProfile';
import PrincipalAuditTrail from './components/Principal/PrincipalAuditTrail';
import PrincipalGrades from './components/Principal/PrincipalGrades';



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
      <Tabs.Screen name="StudentDashboard" component={StudentDashboard} />
      <Tabs.Screen name="SActs" component={StudentActs} />
      <Tabs.Screen name="SCalendar" component={StudentCalendar} />
      <Tabs.Screen name="SGrade" component={StudentGrades} />
      <Tabs.Screen name="SChat" component={StudentChats} />
    </Tabs.Navigator>
  );
}

const facultyNavItems = [
  { label: 'Dashboard', icon: 'view-dashboard', route: 'FDashboard' },
  { label: 'Activities', icon: 'file-document', route: 'FActs' },
  { label: 'Grades', icon: 'star', route: 'FGrades' },
  { label: 'Calendar', icon: 'calendar', route: 'FCalendar' },
  { label: 'Chats', icon: 'chat', route: 'FChat' },
];

function FacultyTabs() {
  return (
    <Tabs.Navigator
      tabBar={props => <CustomBottomNav {...props} navItems={facultyNavItems} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="FDashboard" component={FacultyDashboard} />
      <Tabs.Screen name="FActs" component={FacultyActs} />
      <Tabs.Screen name="FGrades" component={FacultyGrades} />
      <Tabs.Screen name="FCalendar" component={FacultyCalendar} />
      <Tabs.Screen name="FChat" component={FacultyChats} />
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



const vpeNavItems = [
  { label: 'Dashboard', icon: 'view-dashboard', route: 'VPEDash' },
  { label: 'Calendar', icon: 'calendar', route: 'VPECalendar' },
  { label: 'Chats', icon: 'chat', route: 'VPEChats' },
  { label: 'Audit', icon: 'history', route: 'VPEAudit' },
   
];

function VPETabs() {
  return (
    <Tabs.Navigator
      tabBar={props => <CustomBottomNav {...props} navItems={vpeNavItems} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name='VPEDash' component={VPEDashboard} />
      <Tabs.Screen name='VPECalendar' component={VPECalendar} />
              <Tabs.Screen name='VPEChats' component={VPEChats} />
        <Tabs.Screen name='VPEAudit' component={VPEAuditTrail} />
      
    </Tabs.Navigator>
  );
}

const principalNavItems = [
  { label: 'Dashboard', icon: 'view-dashboard', route: 'PrincipalDash' },
  { label: 'Calendar', icon: 'calendar', route: 'PrincipalCalendar' },
  { label: 'Chats', icon: 'chat', route: 'PrincipalChats' },
  { label: 'Grades', icon: 'star', route: 'PrincipalGrades' },
  { label: 'Audit', icon: 'history', route: 'PrincipalAudit' },
];

function PrincipalTabs() {
  return (
    <Tabs.Navigator
      tabBar={props => <CustomBottomNav {...props} navItems={principalNavItems} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name='PrincipalDash' component={PrincipalDashboard} />
      <Tabs.Screen name='PrincipalCalendar' component={PrincipalCalendar} />
      <Tabs.Screen name='PrincipalChats' component={PrincipalChats} />
      <Tabs.Screen name='PrincipalGrades' component={PrincipalGrades} />
      <Tabs.Screen name='PrincipalAudit' component={PrincipalAuditTrail} />
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
        <Screens.Screen name='GroupChat' component={GroupChat} options={{ headerShown: false }}/>
        <Screens.Screen name='GroupManagement' component={GroupManagement} options={{ headerShown: false }}/>
        <Screens.Screen name='UnifiedChat' component={UnifiedChat} options={{ headerShown: false }}/>
        <Screens.Screen name='Login' component={Login} options={{ headerShown: false }}/>

        {/* Students */}
        <Screens.Screen name='SDash' component={StudentTabs} options={{ headerShown: false }}/>
        <Screens.Screen name='SClasses' component={StudentClasses} options={{ headerShown: false }}/>
        <Screens.Screen name='SModule' component={StudentModule} options={{ headerShown: false }}/>
        <Screens.Screen name='SGrade' component={StudentGrades} options={{ headerShown: false }}/>
        <Screens.Screen name='SActs' component={StudentActs} options={{ headerShown: false }}/>
        <Screens.Screen name='SProg' component={StudentProgress} options={{ headerShown: false }}/>
        <Screens.Screen name='SCalendar' component={StudentCalendar} options={{ headerShown: false }}/>
        <Screens.Screen name ='SMain' component={StudentSCMain} options={{ headerShown: false }}/>
        <Screens.Screen name ='SReq' component={StudentSupportCenter} options={{ headerShown: false }}/>
        <Screens.Screen name ='SProfile' component={StudentsProfile} options={{ headerShown: false }}/>
        <Screens.Screen name='QuizView' component={QuizView} options={{ headerShown: false }}/>
        <Screens.Screen name='AssignmentDetail' component={AssignmentDetail} options={{ headerShown: false }}/>


        {/*Faculties */}
        {/*Need tangalin ang "add a lesson" na naeedit, need daw upload lang and title lang ang editable*/}
        <Screens.Screen name='FDash' component={FacultyTabs} options={{ headerShown: false }}/>
        <Screens.Screen name='FClasses' component={FacultyClasses} options={{ headerShown: false }}/>
        <Screens.Screen name ='CClass' component={CreateClasses} options={{ headerShown: false }}/>
        <Screens.Screen name ='FSProg' component={FacultyStudentProgress} options={{ headerShown: false }}/>
        <Screens.Screen name ='FMod' component={FacultyModule} options={{ headerShown: false }}/>
        <Screens.Screen name ='CMod' component={CreateModule} options={{ headerShown: false }}/>
        <Screens.Screen name ='CAct' component={CreateActivity} options={{ headerShown: false }}/>
        <Screens.Screen name ='CreateAssignment' component={CreateAssignment} options={{ headerShown: false }}/>
        <Screens.Screen name ='CreateQuiz' component={CreateQuiz} options={{ headerShown: false }}/>
        <Screens.Screen name='AssignmentSubmissions' component={AssignmentSubmissions} options={{ headerShown: false }} />
        <Screens.Screen name='QuizSubmissions' component={QuizSubmissions} options={{ headerShown: false }} />
        <Screens.Screen name ='FActs' component={FacultyActs} options={{ headerShown: false }}/>
        <Screens.Screen name ='FGrades' component={FacultyGrades} options={{ headerShown: false }}/>
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



        {/* VPE */}
        <Screens.Screen name='VPEDash' component={VPETabs} options={{ headerShown: false }}/>
        <Screens.Screen name='VPEProfile' component={VPEProfile} options={{ headerShown: false }}/>
        <Screens.Screen name='VPESupportCenter' component={VPESupportCenter} options={{ headerShown: false }}/>

        {/* Principal */}
        <Screens.Screen name='PrincipalDash' component={PrincipalTabs} options={{ headerShown: false }}/>
        <Screens.Screen name='PrincipalProfile' component={PrincipalProfile} options={{ headerShown: false }}/>
        <Screens.Screen name='PrincipalSupportCenter' component={PrincipalSupportCenter} options={{ headerShown: false }}/>


      </Screens.Navigator>
    </NavigationContainer>
    </ChatProvider>
    </UserProvider>
  );
}