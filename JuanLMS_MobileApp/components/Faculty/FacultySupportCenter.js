import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FacultySupportStyle from '../styles/faculty/FacultySupportStyle';

export default function FacultySupportCenter() {
  const navigation = useNavigation();

  return (
    <View style={FacultySupportStyle.container}>
      
      <View style={FacultySupportStyle.header}>
        <Image source={require('../../assets/Logo3.svg')} style={FacultySupportStyle.logo} />
      </View>

      <View style={FacultySupportStyle.card}>
        <TouchableOpacity
          style={FacultySupportStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={FacultySupportStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>

        <View style={FacultySupportStyle.iconContainer}>
          {/* <Image
            source={require('../../assets/headset-icon.png')}
            style={FacultySupportStyle.icon}
          /> */}
        </View>

        <TextInput style={FacultySupportStyle.input} placeholder="Name" placeholderTextColor="#ccc" />
        <TextInput style={FacultySupportStyle.input} placeholder="Problem Title" placeholderTextColor="#ccc" />
        <TextInput
          style={FacultySupportStyle.textarea}
          placeholder="Problem Description"
          placeholderTextColor="#ccc"
          multiline={true}
        />

        <View style={FacultySupportStyle.buttonContainer}>
          <TouchableOpacity style={FacultySupportStyle.problemButton}>
            <Text style={FacultySupportStyle.problemButtonText}>Send as Problem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={FacultySupportStyle.requestButton}>
            <Text style={FacultySupportStyle.requestButtonText}>Send as Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
