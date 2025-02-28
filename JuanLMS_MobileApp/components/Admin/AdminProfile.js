import { Text, TouchableOpacity, View } from 'react-native';
import * as React from 'react'
import { MaterialIcons } from '@expo/vector-icons';
import AdminProfileStyle from '../styles/administrator/AdminProfileStyle';

export default function AdminProfile() {
  return (
    <View style={AdminProfileStyle.container}>
      <View style={AdminProfileStyle.card}>
        <View style={AdminProfileStyle.profileContainer}>
          <View style={AdminProfileStyle.avatar} />
          <Text style={AdminProfileStyle.name}>De Jesus, Edgar</Text>
          <Text style={AdminProfileStyle.info}>Admin</Text>
          <Text style={AdminProfileStyle.info}>College of Physical Therapy - Dean</Text>
          <TouchableOpacity style={AdminProfileStyle.button}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={AdminProfileStyle.buttonText}> Update Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={AdminProfileStyle.contactContainer}>
          <Text style={AdminProfileStyle.contactTitle}>Contact</Text>
          <View style={AdminProfileStyle.contactRow}>
            <MaterialIcons name="email" size={16} color="#555" />
            <Text style={AdminProfileStyle.contactText}>dejesusedgar@admin_sjddef.edu.ph</Text>
          </View>
        </View>
      </View>
      </View>

  );
}