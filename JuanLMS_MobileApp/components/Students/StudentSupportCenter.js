import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StudentSupportStyle from '../styles/Stud/StudentSupportStyle';



export default function StudentSupportCenter() {
  const navigation = useNavigation();

  return (
    <View style={StudentSupportStyle.container}>
      
      <View style={StudentSupportStyle.header}>
        <Image source={require('../../assets/Logo3.svg')} style={StudentSupportStyle.logo} />
      </View>

      <View style={StudentSupportStyle.card}>
        <TouchableOpacity
          style={StudentSupportStyle.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={StudentSupportStyle.backArrow}>{'<'}</Text>
        </TouchableOpacity>

        <View style={StudentSupportStyle.iconContainer}>
          {/* <Image
            source={require('../../assets/headset-icon.png')}
            style={StudentSupportStyle.icon}
          /> */}
        </View>

        <TextInput style={StudentSupportStyle.input} placeholder="Name" placeholderTextColor="#ccc" />
        <TextInput style={StudentSupportStyle.input} placeholder="Problem Title" placeholderTextColor="#ccc" />
        <TextInput
          style={StudentSupportStyle.textarea}
          placeholder="Problem Description"
          placeholderTextColor="#ccc"
          multiline={true}
        />

        <View style={StudentSupportStyle.buttonContainer}>
          <TouchableOpacity style={StudentSupportStyle.problemButton}>
            <Text style={StudentSupportStyle.problemButtonText}>Send as Problem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={StudentSupportStyle.requestButton}>
            <Text style={StudentSupportStyle.requestButtonText}>Send as Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
