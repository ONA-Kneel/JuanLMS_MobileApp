import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useContext } from 'react';
import { UserContext } from '../UserContext';

export default function VPEProfile() {
  const { user, setUser } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    if (user) {
      setEditedProfile({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || 'Academic Affairs',
        position: user.position || 'Vice President in Education'
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!editedProfile.firstname.trim() || !editedProfile.lastname.trim() || !editedProfile.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Update user profile
      const updatedUser = { ...user, ...editedProfile };
      setUser(updatedUser);

      // Note: Audit logging would be implemented here in a real application

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditedProfile({
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || 'Academic Affairs',
      position: user.position || 'Vice President in Education'
    });
    setIsEditing(false);
  };

  const ProfileField = ({ label, value, isEditing, onChangeText, placeholder, keyboardType = 'default' }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not specified'}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Icon name="account" size={28} color="#00418b" />
      </View>

      {/* Profile Picture Section */}
      <View style={styles.profilePictureSection}>
        <View style={styles.profilePictureContainer}>
          <Image
            source={require('../../assets/profile-icon (2).png')}
            style={styles.profilePicture}
            defaultSource={require('../../assets/profile-icon (2).png')}
          />
          {isEditing && (
            <TouchableOpacity style={styles.changePictureButton}>
              <Icon name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.roleText}>Vice President in Education</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!isEditing ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Icon name="pencil" size={20} color="#00418b" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.profileCard}>
          <ProfileField
            label="First Name"
            value={editedProfile.firstname}
            isEditing={isEditing}
            onChangeText={(text) => setEditedProfile({...editedProfile, firstname: text})}
            placeholder="Enter first name"
          />

          <ProfileField
            label="Last Name"
            value={editedProfile.lastname}
            isEditing={isEditing}
            onChangeText={(text) => setEditedProfile({...editedProfile, lastname: text})}
            placeholder="Enter last name"
          />

          <ProfileField
            label="Email"
            value={editedProfile.email}
            isEditing={isEditing}
            onChangeText={(text) => setEditedProfile({...editedProfile, email: text})}
            placeholder="Enter email address"
            keyboardType="email-address"
          />

          <ProfileField
            label="Phone"
            value={editedProfile.phone}
            isEditing={isEditing}
            onChangeText={(text) => setEditedProfile({...editedProfile, phone: text})}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />

          <ProfileField
            label="Department"
            value={editedProfile.department}
            isEditing={isEditing}
            onChangeText={(text) => setEditedProfile({...editedProfile, department: text})}
            placeholder="Enter department"
          />

          <ProfileField
            label="Position"
            value={editedProfile.position}
            isEditing={isEditing}
            onChangeText={(text) => setEditedProfile({...editedProfile, position: text})}
            placeholder="Enter position"
          />
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.accountInfoContainer}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.profileCard}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>User ID</Text>
            <Text style={styles.fieldValue}>{user?._id || 'N/A'}</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Role</Text>
            <Text style={styles.fieldValue}>Vice President in Education</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Account Created</Text>
            <Text style={styles.fieldValue}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last Login</Text>
            <Text style={styles.fieldValue}>
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard}>
            <Icon name="lock" size={24} color="#00418b" />
            <Text style={styles.quickActionTitle}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <Icon name="bell" size={24} color="#00418b" />
            <Text style={styles.quickActionTitle}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <Icon name="shield" size={24} color="#00418b" />
            <Text style={styles.quickActionTitle}>Privacy Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <Icon name="help-circle" size={24} color="#00418b" />
            <Text style={styles.quickActionTitle}>Help & Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton}>
        <Icon name="logout" size={20} color="#ff6b6b" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#00418b',
  },
  changePictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00418b',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  profileInfoContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#00418b',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  editActions: {
    flexDirection: 'row',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00418b',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    backgroundColor: '#f9f9f9',
  },
  accountInfoContainer: {
    marginBottom: 24,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
});
