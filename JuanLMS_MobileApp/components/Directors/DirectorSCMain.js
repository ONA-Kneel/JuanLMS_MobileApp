import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import DirectorSCMainStyle from '../styles/directors/DirectorSCMainStyle';
import { useNavigation } from '@react-navigation/native';

export default function DirectorSCMain() {
  const navigation = useNavigation();

  return (
    <View style={DirectorSCMainStyle.container}>
      {/* Blue curved header background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
      {/* Header with Logo and Return Button */}
      <View style={DirectorSCMainStyle.header}>
        <TouchableOpacity
          style={DirectorSCMainStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={DirectorSCMainStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Image
          source={require('../../assets/Logo3.svg')}
          style={DirectorSCMainStyle.logo}
        />
      </View>
      {/* White card with plus button */}
      <View style={DirectorSCMainStyle.card}>
        <TouchableOpacity
          style={DirectorSCMainStyle.crossButton}
          onPress={() => navigation.navigate('DSupCent')}
        >
          <Text style={DirectorSCMainStyle.crossText}>+</Text>
        </TouchableOpacity>
        <View style={DirectorSCMainStyle.iconContainer}>
          <Image
            //source={require('../../assets/support-icon.png')}
            style={DirectorSCMainStyle.icon}
          />
        </View>
      </View>
      {/* Active Requests/Problems List */}
      <Text style={DirectorSCMainStyle.sectionTitle}>Active Request/Problem</Text>
      <TouchableOpacity style={DirectorSCMainStyle.problemBox}>
        <View style={DirectorSCMainStyle.messageRow}>
          <Image
            //source={require('../../assets/mail-icon.png')}
            style={DirectorSCMainStyle.mailIcon}
          />
          <Text style={DirectorSCMainStyle.messageTextBold}>Problem title</Text>
        </View>
        <Text style={DirectorSCMainStyle.checkMark}>✔✔</Text>
      </TouchableOpacity>
      <TouchableOpacity style={DirectorSCMainStyle.requestBox}>
        <View style={DirectorSCMainStyle.messageRow}>
          <Image
            //source={require('../../assets/mail-icon.png')}
            style={DirectorSCMainStyle.mailIcon}
          />
          <Text style={DirectorSCMainStyle.messageTextBold}>Request Title</Text>
        </View>
        <Text style={DirectorSCMainStyle.checkMark}>✔</Text>
      </TouchableOpacity>
    </View>
  );
}
