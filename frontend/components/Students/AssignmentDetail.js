import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Linking,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';
const { width } = Dimensions.get('window');

export default function AssignmentDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const { assignmentId, assignment } = route.params;

  const [assignmentData, setAssignmentData] = useState(assignment || null);
  const [loading, setLoading] = useState(!assignment);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  useEffect(() => {
    if (!assignment) {
      fetchAssignment();
    } else {
      checkSubmissionStatus();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${API_BASE}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignmentData(data);
        checkSubmissionStatus();
      } else {
        Alert.alert('Error', 'Failed to load assignment');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      Alert.alert('Error', 'Failed to load assignment');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkSubmissionStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      const response = await fetch(`${API_BASE}/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const submissions = await response.json();
        // Find the submission for this student
        const studentSubmission = submissions.find(sub => sub.student === user._id);
        if (studentSubmission) {
          setSubmissionStatus(studentSubmission);
        }
      }
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const openAttachment = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile && !submissionText.trim()) {
      Alert.alert('Error', 'Please attach a file or enter text for submission');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Create form data for file upload (matching web version exactly)
      const formData = new FormData();
      formData.append('studentId', user._id);
      
      // Handle file uploads (matching web version)
      if (selectedFile) {
        formData.append('files', {
          uri: selectedFile.uri,
          type: selectedFile.mimeType || 'application/octet-stream',
          name: selectedFile.name,
        });
      }
      
      // Handle text submission (matching web version - using 'context' field)
      if (submissionText.trim()) {
        formData.append('context', submissionText.trim());
      }

      const response = await fetch(`${API_BASE}/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Submission successful:', result);
        Alert.alert('Success', 'Assignment submitted successfully!');
        
        // Call the callback to refresh the parent screen
        if (route.params?.onSubmissionComplete) {
          console.log('Calling onSubmissionComplete callback...');
          route.params.onSubmissionComplete();
        }
        
        // Navigate back
        navigation.goBack();
      } else {
        const errorData = await response.json();
        console.error('Submission failed:', errorData);
        Alert.alert('Error', errorData.error || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      Alert.alert('Error', 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isOverdue = () => {
    if (!assignmentData || !assignmentData.dueDate) return false;
    const dueDate = new Date(assignmentData.dueDate);
    const now = new Date();
    return dueDate < now;
  };

  const getStatusColor = () => {
    if (submissionStatus) return '#4CAF50';
    if (isOverdue()) return '#f44336';
    return '#FF9800';
  };

  const getStatusText = () => {
    if (submissionStatus) return 'Submitted';
    if (isOverdue()) return 'Overdue';
    return 'Pending';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading assignment...</Text>
      </View>
    );
  }

  if (!assignmentData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Assignment not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignment Details</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Assignment Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.assignmentHeader}>
            <MaterialIcons name="assignment" size={32} color="#FF9800" />
            <View style={styles.assignmentTitleContainer}>
              <Text style={styles.assignmentTitle}>{assignmentData.title}</Text>
              <Text style={styles.assignmentClass}>{assignmentData.className || 'Unknown Class'}</Text>
            </View>
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsText}>{assignmentData.points || 0} pts</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={20} color="#666" />
              <Text style={styles.detailLabel}>Due Date:</Text>
              <Text style={[
                styles.detailValue,
                isOverdue() && styles.overdueText
              ]}>
                {formatDateTime(assignmentData.dueDate)}
              </Text>
            </View>

            {assignmentData.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{assignmentData.description}</Text>
              </View>
            )}

            {/* Attachments */}
            {(assignmentData.attachmentFile || assignmentData.attachmentLink) && (
              <View style={styles.attachmentsContainer}>
                <Text style={styles.attachmentsTitle}>Attachments</Text>
                
                {assignmentData.attachmentFile && (
                  <TouchableOpacity style={styles.attachmentItem}>
                    <MaterialIcons name="attach-file" size={20} color="#00418b" />
                    <Text style={styles.attachmentText}>Assignment File</Text>
                  </TouchableOpacity>
                )}

                {assignmentData.attachmentLink && (
                  <TouchableOpacity 
                    style={styles.attachmentItem}
                    onPress={() => openAttachment(assignmentData.attachmentLink)}
                  >
                    <MaterialIcons name="link" size={20} color="#00418b" />
                    <Text style={styles.attachmentText}>Assignment Link</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Submission Section */}
        {!submissionStatus && (
          <View style={styles.submissionCard}>
            <Text style={styles.submissionTitle}>Submit Your Work</Text>
            
            <View style={styles.fileSection}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 }}>Attach File (Optional)</Text>
              
              {selectedFile ? (
                <View style={styles.selectedFileContainer}>
                  <MaterialIcons name="attach-file" size={20} color="#00418b" />
                  <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                  <TouchableOpacity onPress={removeFile} style={styles.removeFileButton}>
                    <MaterialIcons name="close" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.filePickerButton} onPress={pickDocument}>
                  <MaterialIcons name="add" size={24} color="#00418b" />
                  <Text style={styles.filePickerText}>Choose File</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.textSubmissionSection}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 }}>Enter Text Submission (Optional)</Text>
              <TextInput
                style={styles.textSubmissionInput}
                multiline
                numberOfLines={4}
                placeholder="Write your submission here..."
                value={submissionText}
                onChangeText={setSubmissionText}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowSubmitModal(true)}
            >
              <Text style={styles.submitButtonText}>Submit Assignment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submission Status */}
        {submissionStatus && (
          <View style={styles.submissionStatusCard}>
            <View style={styles.statusHeader}>
              <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
              <Text style={styles.statusTitle}>Submitted Successfully</Text>
            </View>
            
            <View style={styles.submissionDetails}>
              <View style={styles.submissionDetailRow}>
                <Text style={styles.submissionDetailLabel}>Submitted:</Text>
                <Text style={styles.submissionDetailValue}>
                  {formatDateTime(submissionStatus.submittedAt)}
                </Text>
              </View>
              
              {submissionStatus.score !== undefined && (
                <View style={styles.submissionDetailRow}>
                  <Text style={styles.submissionDetailLabel}>Score:</Text>
                  <Text style={styles.submissionDetailValue}>
                    {submissionStatus.score} / {assignmentData.points || 0}
                  </Text>
                </View>
              )}
              
              {submissionStatus.feedback && (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackTitle}>Feedback</Text>
                  <Text style={styles.feedbackText}>{submissionStatus.feedback}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submit Confirmation Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Submit Assignment?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to submit this assignment? You won't be able to change your submission after submission.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonSubmit, submitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successHeader}>
              <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
              <Text style={styles.successTitle}>Assignment Submitted!</Text>
            </View>
            
            <Text style={styles.successText}>
              Your assignment has been submitted successfully. You can view your submission status and any feedback from your instructor.
            </Text>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  assignmentTitleContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  assignmentClass: {
    fontSize: 14,
    color: '#666',
  },
  pointsContainer: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00418b',
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  overdueText: {
    color: '#f44336',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachmentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentText: {
    fontSize: 14,
    color: '#00418b',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  fileSection: {
    marginBottom: 20,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00418b',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  filePickerText: {
    fontSize: 16,
    color: '#00418b',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00418b',
  },
  selectedFileName: {
    fontSize: 14,
    color: '#00418b',
    marginLeft: 8,
    flex: 1,
  },
  removeFileButton: {
    padding: 4,
  },
  textSubmissionSection: {
    marginBottom: 20,
  },
  textSubmissionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#00418b',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submissionStatusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  submissionDetails: {
    gap: 12,
  },
  submissionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  submissionDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  submissionDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  feedbackContainer: {
    marginTop: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: width - 40,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonSubmit: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: width - 40,
    alignItems: 'center',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
};
