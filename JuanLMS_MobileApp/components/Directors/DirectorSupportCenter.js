import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Image } from 'react-native';
import DirectorSupportStyle from '../styles/directors/DirectorSupportStyle';
import { useNavigation } from '@react-navigation/native';

export default function DirectorSupportCenter() {
  const navigation = useNavigation();

  return (
    <View style={DirectorSupportStyle.container}>
      {/* Blue curved header background */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120, backgroundColor: '#00418b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, zIndex: 0 }} />
      <View style={DirectorSupportStyle.header}>
        <Image source={require('../../assets/Logo3.svg')} style={DirectorSupportStyle.logo} />
      </View>
      <View style={DirectorSupportStyle.card}>
        <TouchableOpacity
          style={DirectorSupportStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={DirectorSupportStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <View style={DirectorSupportStyle.iconContainer}>
          {/* <Image
            source={require('../../assets/headset-icon.png')}
            style={DirectorSupportStyle.icon}
          /> */}
        </View>
        <TextInput style={DirectorSupportStyle.input} placeholder="Name" placeholderTextColor="#ccc" />
        <TextInput style={DirectorSupportStyle.input} placeholder="Problem Title" placeholderTextColor="#ccc" />
        <TextInput
          style={DirectorSupportStyle.textarea}
          placeholder="Problem Description"
          placeholderTextColor="#ccc"
          multiline={true}
        />
        <View style={DirectorSupportStyle.buttonContainer}>
          <TouchableOpacity style={DirectorSupportStyle.problemButton}>
            <Text style={DirectorSupportStyle.problemButtonText}>Send as Problem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={DirectorSupportStyle.requestButton}>
            <Text style={DirectorSupportStyle.requestButtonText}>Send as Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
