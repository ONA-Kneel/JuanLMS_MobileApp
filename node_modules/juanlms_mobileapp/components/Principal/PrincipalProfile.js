import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import { useUser } from '../UserContext';

const ProfileField = ({ label, value, isEditable, onChangeText, placeholder }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {isEditable ? (
      <TextInput
        style={styles.editableField}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
    ) : (
      <Text style={styles.fieldValue}>{value}</Text>
    )}
  </View>
);

export default function PrincipalProfile() {
  const { user } = useUser();
  const isFocused = useIsFocused();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'Dr. Michael',
    lastName: 'Anderson',
    email: 'principal.anderson@juanlms.edu',
    phone: '+1 (555) 123-4567',
    department: 'Academic Administration',
    position: 'Principal',
    office: 'Room 201, Main Building',
    extension: '201',
    bio: 'Experienced educational leader with over 15 years in academic administration. Committed to fostering academic excellence and student success.',
    dateOfBirth: 'March 15, 1975',
    address: '123 Education Street, Academic City, AC 12345',
    emergencyContact: 'Sarah Anderson (Spouse) - +1 (555) 987-6543',
  });

  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (isFocused) {
      // In a real app, you'd fetch the user's profile data here
      setOriginalData({ ...profileData });
    }
  }, [isFocused]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // In a real app, you'd make an API call to update the profile
      // await axios.put(`${API_BASE_URL}/api/users/profile`, profileData);
      
      // Note: Audit logging would be implemented here in a real application

      setOriginalData({ ...profileData });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setProfileData({ ...originalData });
    setIsEditing(false);
  };

  const handleFieldChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const hasChanges = () => {
    return JSON.stringify(profileData) !== JSON.stringify(originalData);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account information</Text>
      </View>

      {/* Profile Picture Section */}
      <View style={styles.profilePictureSection}>
        <View style={styles.profilePictureContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/120x120/00418b/ffffff?text=MA' }}
            style={styles.profilePicture}
          />
          {isEditing && (
            <TouchableOpacity style={styles.changePictureButton}>
              <Icon name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.profileName}>
          {profileData.firstName} {profileData.lastName}
        </Text>
        <Text style={styles.profilePosition}>{profileData.position}</Text>
        <Text style={styles.profileDepartment}>{profileData.department}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Icon name="pencil" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.saveButton,
                !hasChanges() && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!hasChanges()}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Profile Information */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.fieldsGrid}>
          <ProfileField
            label="First Name"
            value={profileData.firstName}
            isEditable={isEditing}
            onChangeText={(text) => handleFieldChange('firstName', text)}
            placeholder="Enter first name"
          />
          <ProfileField
            label="Last Name"
            value={profileData.lastName}
            isEditable={isEditing}
            onChangeText={(text) => handleFieldChange('lastName', text)}
            placeholder="Enter last name"
          />
        </View>

        <ProfileField
          label="Email Address"
          value={profileData.email}
          isEditable={isEditing}
          onChangeText={(text) => handleFieldChange('email', text)}
          placeholder="Enter email address"
        />

        <ProfileField
          label="Phone Number"
          value={profileData.phone}
          isEditable={isEditing}
          onChangeText={(text) => handleFieldChange('phone', text)}
          placeholder="Enter phone number"
        />

        <ProfileField
          label="Date of Birth"
          value={profileData.dateOfBirth}
          isEditable={isEditing}
          onChangeText={(text) => handleFieldChange('dateOfBirth', text)}
          placeholder="Enter date of birth"
        />

        <ProfileField
          label="Address"
          value={profileData.address}
          isEditable={isEditing}
          onChangeText={(text) => handleFieldChange('address', text)}
          placeholder="Enter address"
        />

        <ProfileField
          label="Emergency Contact"
          value={profileData.emergencyContact}
          isEditable={isEditing}
          onChangeText={(text) => handleFieldChange('emergencyContact', text)}
          placeholder="Enter emergency contact"
        />
      </View>

      {/* Professional Information */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <ProfileField
          label="Department"
          value={profileData.department}
          isEditable={isEditing}
          onChangeText={(text) => handleFieldChange('department', text)}
          placeholder="Enter department"
        />

        <ProfileField
          label="Position"
          value={profileData.position}
          isEditable={false}
        />

        <ProfileField
          label="Office Location"
          value={profileData.office}
          isEditable={isEditing}
          onChangeText={(text) => handleFieldChange('office', text)}
          placeholder="Enter office location"
        />

        <ProfileField
          label="Extension"
          value={profileData.extension}
          isEditable={isEditing}
          onChangeText={(text) => handleFieldChange('extension', text)}
          placeholder="Enter extension"
        />
      </View>

      {/* Bio Section */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Biography</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>About</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editableField, styles.bioField]}
              value={profileData.bio}
              onChangeText={(text) => handleFieldChange('bio', text)}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.bioValue}>{profileData.bio}</Text>
          )}
        </View>
      </View>

      {/* Account Security */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Account Security</Text>
        
        <TouchableOpacity style={styles.securityOption}>
          <Icon name="lock" size={24} color="#00418b" />
          <View style={styles.securityOptionContent}>
            <Text style={styles.securityOptionTitle}>Change Password</Text>
            <Text style={styles.securityOptionDescription}>
              Update your account password for enhanced security
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.securityOption}>
          <Icon name="shield-check" size={24} color="#00418b" />
          <View style={styles.securityOptionContent}>
            <Text style={styles.securityOptionTitle}>Two-Factor Authentication</Text>
            <Text style={styles.securityOptionDescription}>
              Enable additional security for your account
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.securityOption}>
          <Icon name="account-key" size={24} color="#00418b" />
          <View style={styles.securityOptionContent}>
            <Text style={styles.securityOptionTitle}>API Keys</Text>
            <Text style={styles.securityOptionDescription}>
              Manage your API access keys and permissions
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Data Export */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        
        <TouchableOpacity style={styles.dataOption}>
          <Icon name="download" size={24} color="#00418b" />
          <View style={styles.dataOptionContent}>
            <Text style={styles.dataOptionTitle}>Export My Data</Text>
            <Text style={styles.dataOptionDescription}>
              Download a copy of your personal data
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dataOption}>
          <Icon name="delete" size={24} color="#F44336" />
          <View style={styles.dataOptionContent}>
            <Text style={[styles.dataOptionTitle, { color: '#F44336' }]}>
              Delete Account
            </Text>
            <Text style={styles.dataOptionDescription}>
              Permanently remove your account and all data
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  profilePictureSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changePictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00418b',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  profilePosition: {
    fontSize: 18,
    color: '#00418b',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  profileDepartment: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#00418b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  saveButton: {
    backgroundColor: '#00418b',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  profileSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  fieldsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  fieldValue: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  editableField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    fontFamily: 'Poppins-Regular',
  },
  bioField: {
    height: 100,
    textAlignVertical: 'top',
  },
  bioValue: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
  },
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  securityOptionContent: {
    flex: 1,
    marginLeft: 16,
  },
  securityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  securityOptionDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  dataOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataOptionContent: {
    flex: 1,
    marginLeft: 16,
  },
  dataOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  dataOptionDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
});
