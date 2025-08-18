import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FacultyGrades = () => {
  const navigation = useNavigation();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [classOptions, setClassOptions] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [studentsForClass, setStudentsForClass] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('current');
  const [academicYear, setAcademicYear] = useState('');
  const [currentTerm, setCurrentTerm] = useState('');
  // View-only: no grade edit state

  const API_BASE = 'https://juanlms-webapp-server.onrender.com';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    fetchAcademicInfo();
    fetchFacultyGrades();
    return () => clearInterval(timer);
  }, [selectedTerm]);

  const fetchAcademicInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
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

  const fetchFacultyGrades = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('User data not found');

      const facultyId = user.userID || user._id;
      const res = await fetch(`${API_BASE}/api/semestral-grades/faculty/${facultyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch grades');
      const payload = await res.json();
      const allGrades = payload?.grades || [];

      // Filter by current/previous term like student view
      const byTerm = allGrades.filter(g => {
        if (!academicYear || !currentTerm) return true;
        if (selectedTerm === 'current') {
          return g.academicYear === academicYear && g.termName === currentTerm;
        }
        return g.academicYear !== academicYear || g.termName !== currentTerm;
      });

      // Build class options
      const byClass = new Map();
      byTerm.forEach(g => {
        const key = g.classID || `${g.subjectCode}-${g.section || ''}`;
        if (!byClass.has(key)) {
          byClass.set(key, {
            id: key,
            classID: g.classID || key,
            title: g.subjectName || g.subjectCode || 'Class',
            section: g.section || ''
          });
        }
      });
      const options = Array.from(byClass.values());
      setClassOptions(options);
      const activeClassId = selectedClassId || options[0]?.id || null;
      if (!selectedClassId && activeClassId) setSelectedClassId(activeClassId);

      // Students for chosen class
      const selectedGrades = byTerm.filter(g => (g.classID || `${g.subjectCode}-${g.section || ''}`) === activeClassId);
      const students = selectedGrades.map(g => ({
        studentId: g.studentId,
        studentName: g.studentName,
        schoolID: g.schoolID,
        semesterFinal: g.grades?.semesterFinal ?? '-',
        remarks: g.grades?.remarks ?? '-',
      }));
      setStudentsForClass(students);
      setError('');
    } catch (error) {
      console.error('Error fetching grades:', error);
      setError('Failed to load grades');
      setStudentsForClass([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    Promise.all([fetchAcademicInfo(), fetchFacultyGrades()]).finally(() => setRefreshing(false));
  };

  const handleClassSelect = (opt) => {
    setSelectedClassId(opt.id);
    fetchFacultyGrades();
  };

  // View-only: remove edit/save handlers

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

      {/* Class Selection (from posted grades) */}
      {classOptions.length > 0 && (
        <View style={styles.classSelector}>
          <Text style={styles.selectorLabel}>Select Class:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.classScroll}
          >
            {classOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.classTab,
                  selectedClassId === opt.id && styles.classTabActive
                ]}
                onPress={() => handleClassSelect(opt)}
              >
                <Text style={[
                  styles.classTabText,
                  selectedClassId === opt.id && styles.classTabTextActive
                ]}>
                  {opt.title}
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

      {/* Grades Table (view-only) */}
      {selectedClassId && studentsForClass.length > 0 ? (
        <ScrollView 
          style={styles.gradesContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tableHeader}>
            <Text style={styles.studentHeader}>Student</Text>
            <Text style={styles.gradeHeader}>Semestral</Text>
            <Text style={styles.gradeHeader}>Remarks</Text>
          </View>

          {studentsForClass.map((studentGrade) => (
            <View key={studentGrade.studentId} style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentGrade.studentName}</Text>
                <Text style={styles.studentId}>ID: {studentGrade.schoolID}</Text>
              </View>
              
              <View style={styles.finalGrade}>
                <Text style={styles.gradeText}>{studentGrade.semesterFinal || '-'}</Text>
              </View>
              
              <View style={styles.finalGrade}>
                <Text style={styles.gradeText}>{studentGrade.remarks || '-'}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="school-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Classes Found</Text>
          <Text style={styles.emptyText}>
            No grades available for the selected period.
          </Text>
        </View>
      )}
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
