import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUser } from '../UserContext';
import { getAuthHeaders, handleApiError } from '../../utils/apiUtils';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function ClassConfirmationModal({
    classData,
    visible,
    onClose,
    onSuccess
}) {
    const { user } = useUser();
    const [classDesc, setClassDesc] = useState(classData?.classDesc || "");
    const [loading, setLoading] = useState(false);

    const handleConfirmClass = async () => {
        if (!classData || !user?._id) return;

        try {
            setLoading(true);
            const headers = await getAuthHeaders();

            // Create form data for the confirmation request
            const formData = new FormData();
            formData.append('classDesc', classDesc);
            formData.append('facultyID', user._id);

            const response = await fetch(`${API_BASE}/api/classes/${classData.classID}/confirm`, {
                method: 'PATCH',
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Class confirmed successfully:', result);
                onSuccess();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to confirm class');
            }
        } catch (error) {
            console.error('Error confirming class:', error);
            const errorMessage = handleApiError(error, 'Failed to confirm class');
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Confirm Class</Text>
                        <TouchableOpacity 
                            onPress={handleClose} 
                            style={styles.closeBtn}
                            disabled={loading}
                        >
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Class Information */}
                        <View style={styles.classInfoSection}>
                            <Text style={styles.className}>{classData?.className}</Text>
                            <Text style={styles.classDetails}>
                                Class Code: {classData?.classCode}
                            </Text>
                            {classData?.section && (
                                <Text style={styles.classDetails}>
                                    Section: {classData.section}
                                </Text>
                            )}
                            <Text style={styles.classDetails}>
                                Students: {classData?.members?.length || 0}
                            </Text>
                            {classData?.academicYear && (
                                <Text style={styles.classDetails}>
                                    Academic Year: {classData.academicYear}
                                </Text>
                            )}
                            {classData?.termName && (
                                <Text style={styles.classDetails}>
                                    Term: {classData.termName}
                                </Text>
                            )}
                        </View>

                        {/* Student Members Section */}
                        {classData?.members && classData.members.length > 0 && (
                            <View style={styles.membersSection}>
                                <Text style={styles.sectionTitle}>
                                    Class Members ({classData.members.length})
                                </Text>
                                <ScrollView 
                                    style={styles.membersList} 
                                    nestedScrollEnabled={true}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {classData.members.map((member, index) => (
                                        <View key={member._id || index} style={styles.memberItem}>
                                            <View style={styles.memberInfo}>
                                                <Text style={styles.memberName}>
                                                    {member.firstName || member.firstname} {member.lastName || member.lastname}
                                                </Text>
                                                <Text style={styles.memberDetails}>
                                                    School ID: {member.schoolId || member.schoolID || 'N/A'}
                                                </Text>
                                            </View>
                                            <Text style={styles.memberRole}>
                                                {member.role || 'Student'}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Class Description */}
                        <View style={styles.descriptionSection}>
                            <Text style={styles.sectionTitle}>Class Description</Text>
                            <TextInput
                                style={styles.descriptionInput}
                                value={classDesc}
                                onChangeText={setClassDesc}
                                placeholder="Enter class description..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Note about image upload */}
                        <View style={styles.noteSection}>
                            <Icon name="information" size={16} color="#1976D2" />
                            <Text style={styles.noteText}>
                                Note: Image upload feature will be added in a future update.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.cancelBtn]}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.confirmBtn]}
                            onPress={handleConfirmClass}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.confirmBtnText}>Confirm Class</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = {
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        width: '100%',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00418b',
    },
    closeBtn: {
        padding: 5,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    classInfoSection: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    className: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    classDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    membersSection: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    membersList: {
        maxHeight: 150,
    },
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    memberDetails: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    memberRole: {
        fontSize: 12,
        color: '#999',
    },
    descriptionSection: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    descriptionInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#333',
        backgroundColor: '#f9f9f9',
        minHeight: 80,
    },
    noteSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: '#1976D2',
        marginLeft: 8,
        fontStyle: 'italic',
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmBtn: {
        backgroundColor: '#00418b',
    },
    confirmBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
};
