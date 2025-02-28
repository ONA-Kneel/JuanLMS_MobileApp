import { Text, TouchableOpacity, View } from 'react-native';
import * as React from 'react'
import { MaterialIcons } from '@expo/vector-icons';
import FacultyProfileStyle from '../styles/faculty/FacultyProfileStyle';

export default function FacultyProfile() {
  return (
    <View style={FacultyProfileStyle.container}>
      <View style={FacultyProfileStyle.card}>
        <View style={FacultyProfileStyle.profileContainer}>
          <View style={FacultyProfileStyle.avatar} />
          <Text style={FacultyProfileStyle.name}>James, Johnson</Text>
          <Text style={FacultyProfileStyle.info}>Faculty</Text>
          <Text style={FacultyProfileStyle.info}>College of Entrepreneurship</Text>
          <TouchableOpacity style={FacultyProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={FacultyProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={FacultyProfileStyle.contactContainer}>
          <Text style={FacultyProfileStyle.contactTitle}>Contact</Text>
          <View style={FacultyProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={FacultyProfileStyle.contactText}>jamesjhonson@sjddef.edu.ph</Text>
          </View>
        </View>
      </View>
      </View>

  );
}