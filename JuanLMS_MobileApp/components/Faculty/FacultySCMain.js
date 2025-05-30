import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FacultySCMainStyle from '../styles/faculty/FacultySCMainStyle';

export default function FacultySCMain() {
  const navigation = useNavigation();

  return (
    <View style={FacultySCMainStyle.container}>
      {/* Blue curved header background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
      {/* Header with Logo and Return Button */}
      <View style={FacultySCMainStyle.header}>
        <TouchableOpacity
          style={FacultySCMainStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={FacultySCMainStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Image
          source={require('../../assets/Logo3.svg')}
          style={FacultySCMainStyle.logo}
        />
      </View>
      {/* White card with plus button */}
      <View style={FacultySCMainStyle.card}>
        <TouchableOpacity
          style={FacultySCMainStyle.crossButton}
          onPress={() => navigation.navigate('FReq')}
        >
          <Text style={FacultySCMainStyle.crossText}>+</Text>
        </TouchableOpacity>
        <View style={FacultySCMainStyle.iconContainer}>
          <Image
            //source={require('../../assets/support-icon.png')}
            style={FacultySCMainStyle.icon}
          />
        </View>
      </View>
      {/* Active Requests/Problems List */}
      <Text style={FacultySCMainStyle.sectionTitle}>Active Request/Problem</Text>
      <TouchableOpacity style={FacultySCMainStyle.problemBox}>
        <View style={FacultySCMainStyle.messageRow}>
          <Image
            //source={require('../../assets/mail-icon.png')}
            style={FacultySCMainStyle.mailIcon}
          />
          <Text style={FacultySCMainStyle.messageTextBold}>Problem title</Text>
        </View>
        <Text style={FacultySCMainStyle.checkMark}>✔✔</Text>
      </TouchableOpacity>
      <TouchableOpacity style={FacultySCMainStyle.requestBox}>
        <View style={FacultySCMainStyle.messageRow}>
          <Image
            //source={require('../../assets/mail-icon.png')}
            style={FacultySCMainStyle.mailIcon}
          />
          <Text style={FacultySCMainStyle.messageTextBold}>Request Title</Text>
        </View>
        <Text style={FacultySCMainStyle.checkMark}>✔</Text>
      </TouchableOpacity>
    </View>
  );
}
