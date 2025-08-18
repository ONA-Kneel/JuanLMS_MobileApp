import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FacultyGrades = () => {
  const navigation = useNavigation();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('current');
  const [academicYear, setAcademicYear] = useState('');
  const [currentTerm, setCurrentTerm] = useState('');
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    score: '',
    remarks: ''
  });

  const API_BASE = 'https://juanlms-webapp-server.onrender.com';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    fetchClasses();
    fetchAcademicInfo();
    return () => clearInterval(timer);
  }, []);

  const fetchAcademicInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch academic year and term
      const yearResponse = await fetch(`${API_BASE}/api/schoolyears/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (yearResponse.ok) {
        const yearData = await yearResponse.json();
        setAcademicYear(`${yearData.schoolYearStart}-${yearData.schoolYearEnd}`);
        
        // Fetch active term
        const termResponse = await fetch(`${API_BASE}/api/terms/schoolyear/${yearData.schoolYearStart}-${yearData.schoolYearEnd}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (termResponse.ok) {
          const terms = await termResponse.json();
          const active = terms.find(term => term.status === 'active');
          if (active) {
            setCurrentTerm(active.termName);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching academic info:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;

      if (!user) {
        throw new Error('User data not found');
      }

      // Fetch classes taught by the faculty member
      const response = await fetch(`${API_BASE}/api/classes/faculty/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data);
        
        if (data.length > 0) {
          setSelectedClass(data[0]);
          fetchStudents(data[0]._id);
        }
      } else {
        throw new Error('Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/api/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        fetchGrades(classId, data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchGrades = async (classId, studentList) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const allGrades = [];

      // Fetch grades for the entire class
      const response = await fetch(`${API_BASE}/api/grades/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const classGrades = await response.json();
        setGrades(classGrades);
      }

      setGrades(allGrades);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses().finally(() => setRefreshing(false));
  };

  const handleClassSelect = (classItem) => {
    setSelectedClass(classItem);
    fetchStudents(classItem._id);
  };

  const handleGradeEdit = (student, activity) => {
    setSelectedStudent(student);
    setSelectedActivity(activity);
    setGradeForm({
      score: activity.score?.toString() || '',
      remarks: activity.feedback || ''
    });
    setGradeModalVisible(true);
  };

  const handleSaveGrade = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/api/grades/${selectedActivity._id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: parseFloat(gradeForm.score),
          remarks: gradeForm.remarks
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Grade updated successfully');
        setGradeModalVisible(false);
        // Refresh grades
        if (selectedClass) {
          fetchStudents(selectedClass._id);
        }
      } else {
        throw new Error('Failed to update grade');
      }
    } catch (error) {
      console.error('Error updating grade:', error);
      Alert.alert('Error', 'Failed to update grade');
    }
  };

  const calculateFinalGrade = (studentGrades) => {
    if (!studentGrades || studentGrades.length === 0) return 'N/A';
    
    const totalPoints = studentGrades.reduce((sum, grade) => sum + (grade.points || 0), 0);
    const earnedPoints = studentGrades.reduce((sum, grade) => sum + (grade.score || 0), 0);
    
    if (totalPoints === 0) return 'N/A';
    
    const percentage = (earnedPoints / totalPoints) * 100;
    
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A') return '#4CAF50';
    if (grade === 'B') return '#8BC34A';
    if (grade === 'C') return '#FFC107';
    if (grade === 'D') return '#FF9800';
    if (grade === 'F') return '#F44336';
    return '#666';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading grades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Class Grades</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtitle}>{academicYear} - {currentTerm}</Text>
          <Text style={styles.headerTime}>
            {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {/* Class Selection */}
      {classes.length > 0 && (
        <View style={styles.classSelector}>
          <Text style={styles.selectorLabel}>Select Class:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.classScroll}
          >
            {classes.map((classItem) => (
              <TouchableOpacity
                key={classItem._id}
                style={[
                  styles.classTab,
                  selectedClass?._id === classItem._id && styles.classTabActive
                ]}
                onPress={() => handleClassSelect(classItem)}
              >
                <Text style={[
                  styles.classTabText,
                  selectedClass?._id === classItem._id && styles.classTabTextActive
                ]}>
                  {classItem.className}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Term Selection */}
      <View style={styles.termSelector}>
        <Text style={styles.selectorLabel}>Term:</Text>
        <View style={styles.termButtons}>
          <TouchableOpacity
            style={[
              styles.termButton,
              selectedTerm === 'current' && styles.termButtonActive
            ]}
            onPress={() => setSelectedTerm('current')}
          >
            <Text style={[
              styles.termButtonText,
              selectedTerm === 'current' && styles.termButtonTextActive
            ]}>
              Current Term
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.termButton,
              selectedTerm === 'previous' && styles.termButtonActive
            ]}
            onPress={() => setSelectedTerm('previous')}
          >
            <Text style={[
              styles.termButtonText,
              selectedTerm === 'previous' && styles.termButtonTextActive
            ]}>
              Previous Terms
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grades Table */}
      {selectedClass && students.length > 0 ? (
        <ScrollView 
          style={styles.gradesContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tableHeader}>
            <Text style={styles.studentHeader}>Student</Text>
            <Text style={styles.gradeHeader}>Final Grade</Text>
            <Text style={styles.actionHeader}>Actions</Text>
          </View>

          {grades.map((studentGrade, index) => (
            <View key={studentGrade.studentId} style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentGrade.studentName}</Text>
                <Text style={styles.studentId}>ID: {studentGrade.studentId}</Text>
              </View>
              
              <View style={styles.finalGrade}>
                <Text style={[
                  styles.gradeText,
                  { color: getGradeColor(calculateFinalGrade(studentGrade.grades)) }
                ]}>
                  {calculateFinalGrade(studentGrade.grades)}
                </Text>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => navigation.navigate('FMod', { 
                    classId: selectedClass._id,
                    studentId: studentGrade.studentId 
                  })}
                >
                  <MaterialIcons name="visibility" size={20} color="#2196F3" />
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleGradeEdit(studentGrade, studentGrade.grades[0])}
                >
                  <MaterialIcons name="edit" size={20} color="#FF9800" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="school-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Classes Found</Text>
          <Text style={styles.emptyText}>
            You don't have any classes assigned yet.
          </Text>
        </View>
      )}

      {/* Grade Edit Modal */}
      <Modal
        visible={gradeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Grade</Text>
              <TouchableOpacity onPress={() => setGradeModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalStudentName}>
              {selectedStudent?.studentName}
            </Text>
            
            <Text style={styles.modalActivityName}>
              {selectedActivity?.title}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Score"
              value={gradeForm.score}
              onChangeText={(text) => setGradeForm({...gradeForm, score: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Remarks"
              value={gradeForm.remarks}
              onChangeText={(text) => setGradeForm({...gradeForm, remarks: text})}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setGradeModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGrade}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  headerTime: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  classSelector: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  classScroll: {
    flexDirection: 'row',
  },
  classTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  classTabActive: {
    backgroundColor: '#00418b',
  },
  classTabText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  classTabTextActive: {
    color: '#fff',
  },
  termSelector: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  termButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  termButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  termButtonActive: {
    backgroundColor: '#00418b',
  },
  termButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  termButtonTextActive: {
    color: '#fff',
  },
  gradesContainer: {
    flex: 1,
    padding: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#00418b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  studentHeader: {
    flex: 2,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  gradeHeader: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  actionHeader: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  studentRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentInfo: {
    flex: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  studentId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  finalGrade: {
    flex: 1,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  actionHeader: {
    flex: 1,
    alignItems: 'center',
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  viewButtonText: {
    color: '#2196F3',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FF9800',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    fontFamily: 'Poppins-Bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  modalStudentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  modalActivityName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#00418b',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
};

export default FacultyGrades;
