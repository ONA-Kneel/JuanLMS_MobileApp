import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StudentSCMainStyle from '../styles/Stud/StudentSCMainStyle';


export default function StudentSCMain() {
  const navigation = useNavigation();

  return (
    <View style={StudentSCMainStyle.container}>
      <View style={
      {
        paddingBottom: 80,
        // paddingHorizontal: 20,
        // paddingTop: 120, // Space for fixed header
      }
      }/>
      {/* Blue background */}
      <View style={StudentDashboardStyle.blueHeaderBackground} />
      
      {/* White card header */}
      <View style={StudentDashboardStyle.whiteHeaderCard}>
        <TouchableOpacity
          style={StudentSCMainStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={StudentSCMainStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={StudentDashboardStyle.headerTitle}>
              Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Student'}!</Text>
            </Text>
              <Text style={StudentDashboardStyle.headerSubtitle}>{academicContext}</Text>
             <Text style={StudentDashboardStyle.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={() => changeScreen.navigate('SProfile')}>
            {resolveProfileUri() ? (
              <Image 
                source={{ uri: resolveProfileUri() }} 
                style={{ width: 36, height: 36, borderRadius: 18 }}
                resizeMode="cover"
              />
            ) : (
              <Image 
                source={require('../../assets/profile-icon (2).png')} 
                style={{ width: 36, height: 36, borderRadius: 18 }}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Header with Logo and Return Button */}
      <View style={StudentSCMainStyle.header}>
        <TouchableOpacity
          style={StudentSCMainStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={StudentSCMainStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/Logo3.svg')}
          style={StudentSCMainStyle.logo}
          resizeMode="contain"
        />
      </View>

      {/* Card with plus button */}
      <View style={StudentSCMainStyle.card}>
        <TouchableOpacity
          style={StudentSCMainStyle.crossButton}
          onPress={() => navigation.navigate('DSupCent')}
        >
          <Text style={StudentSCMainStyle.crossText}>+</Text>
        </TouchableOpacity>

        <View style={StudentSCMainStyle.iconContainer}>
          <Image
            //source={require('../../assets/support-icon.png')}
            style={StudentSCMainStyle.icon}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Active Requests/Problems List */}
      <Text style={StudentSCMainStyle.sectionTitle}>Active Request/Problem</Text>

      <TouchableOpacity style={StudentSCMainStyle.problemBox}>
        <View style={StudentSCMainStyle.messageRow}>
          <Image
            //source={require('../../assets/mail-icon.png')}
            style={StudentSCMainStyle.mailIcon}
            resizeMode="contain"
          />
          <Text style={StudentSCMainStyle.messageTextBold}>Problem title</Text>
        </View>
        <Text style={StudentSCMainStyle.checkMark}>✔✔</Text>
      </TouchableOpacity>

      <TouchableOpacity style={StudentSCMainStyle.requestBox}>
        <View style={StudentSCMainStyle.messageRow}>
          <Image
            //source={require('../../assets/mail-icon.png')}
            style={StudentSCMainStyle.mailIcon}
            resizeMode="contain"
          />
          <Text style={StudentSCMainStyle.messageTextBold}>Request Title</Text>
        </View>
        <Text style={StudentSCMainStyle.checkMark}>✔</Text>
      </TouchableOpacity>
    </View>
  );
}
