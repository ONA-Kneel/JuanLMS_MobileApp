import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StudentSCMainStyle from '../styles/Stud/StudentSCMainStyle';


export default function StudentSCMain() {
  const navigation = useNavigation();

  return (
    <View style={StudentSCMainStyle.container}>
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
