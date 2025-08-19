import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import StudentGradesStyle from '../styles/Stud/StudentGradesStyle';

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
  const [user, setUser] = useState(null);
  const [profilePicError, setProfilePicError] = useState(false);

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

      // Set user state for use in render function
      setUser(user);
      setProfilePicError(false);

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

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchAcademicInfo(), fetchFacultyGrades()]).finally(() => setRefreshing(false));
  };

  const handleClassSelect = (opt) => {
    setSelectedClassId(opt.id);
    fetchFacultyGrades();
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getGradeColor = (grade) => {
    const value = typeof grade === 'string' ? parseFloat(grade) : grade;
    if (!value || isNaN(value)) return '#999';
    if (value >= 90) return '#4CAF50';
    if (value >= 85) return '#8BC34A';
    if (value >= 80) return '#CDDC39';
    if (value >= 75) return '#FF9800';
    return '#f44336';
  };

  const getRemarksColor = (remarks) => {
    switch (remarks) {
      case 'PASSED':
      case 'Passed': return '#4CAF50';
      case 'REPEAT':
      case 'INCOMPLETE':
      case 'Conditional': return '#FF9800';
      case 'FAILED':
      case 'Failed': return '#f44336';
      default: return '#999';
    }
  };

  // Helper function to normalize remarks for consistent comparison
  const normalizeRemarks = (remarks) => {
    if (!remarks || remarks === '-') return '';
    
    // Handle common variations
    const normalized = remarks.toLowerCase().trim();
    
    // Map common variations to standard values
    const remarksMap = {
      'passed': 'passed',
      'pass': 'passed',
      'p': 'passed',
      'conditional': 'conditional',
      'cond': 'conditional',
      'incomplete': 'conditional',
      'failed': 'failed',
      'fail': 'failed',
      'f': 'failed',
      'repeat': 'failed'
    };
    
    return remarksMap[normalized] || normalized;
  };

  const renderStudentRow = (student, index) => (
    <View key={index} style={styles.studentRow}>
      <View style={styles.studentCell}>
        <Text style={styles.studentName}>{student.studentName}</Text>
        <Text style={styles.studentId}>ID: {student.schoolID}</Text>
      </View>
      
      <View style={styles.gradeCell}>
        <Text style={[styles.gradeText, { color: getGradeColor(student.semesterFinal) }]}>
          {student.semesterFinal || '-'}
        </Text>
      </View>
      
      <View style={styles.remarksCell}>
        <View style={[styles.remarksBadge, { backgroundColor: getRemarksColor(student.remarks) }]}>
          <Text style={styles.remarksText}>{student.remarks}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="school-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Classes Found</Text>
      <Text style={styles.emptyText}>
        {selectedTerm === 'current' 
          ? 'No grades available for the current term yet.'
          : 'No previous grades found.'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading grades...</Text>
      </View>
    );
  }

  return (
    <View style={StudentGradesStyle.container}>
      {/* Blue background */}
      <View style={StudentGradesStyle.blueHeaderBackground} />

      {/* White card header */}
      <View style={StudentGradesStyle.whiteHeaderCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={StudentGradesStyle.headerTitle}>Class Grades</Text>
            <Text style={StudentGradesStyle.headerSubtitle}>
              {formatDateTime(currentDateTime)}
            </Text>
            {academicYear && currentTerm && (
              <Text style={styles.academicInfo}>
                {academicYear} - {currentTerm} Term
              </Text>
            )}
          </View>
          
          <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
            {loading ? (
              <View style={styles.profileInitialsContainer}>
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : user?.profilePicture && !profilePicError ? (
              <Image 
                source={{ uri: user.profilePicture }} 
                style={styles.profileImage}
                resizeMode="cover"
                onError={() => setProfilePicError(true)}
              />
            ) : user ? (
              <View style={styles.profileInitialsContainer}>
                <Text style={styles.profileInitialsText}>
                  {`${user.firstname?.charAt(0) || ''}${user.lastname?.charAt(0) || ''}`}
                </Text>
              </View>
            ) : (
              <View style={styles.profileInitialsContainer}>
                <Text style={styles.profileInitialsText}>U</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Class Selection */}
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

      {/* Term Selector */}
      <View style={styles.termSelector}>
        <TouchableOpacity
          style={[styles.termButton, selectedTerm === 'current' && styles.activeTermButton]}
          onPress={() => setSelectedTerm('current')}
        >
          <Text style={[styles.termButtonText, selectedTerm === 'current' && styles.activeTermButtonText]}>
            Current Term
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.termButton, selectedTerm === 'previous' && styles.activeTermButton]}
          onPress={() => setSelectedTerm('previous')}
        >
          <Text style={[styles.termButtonText, selectedTerm === 'previous' && styles.activeTermButtonText]}>
            Previous Terms
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grades Content */}
      <View style={StudentGradesStyle.contentWrapper}>
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchFacultyGrades}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : selectedClassId && studentsForClass.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#00418b']}
                tintColor="#00418b"
              />
            }
          >
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.headerRow}>
                <Text style={styles.headerStudent}>Student</Text>
                <Text style={styles.headerGrade}>Semestral</Text>
                <Text style={styles.headerRemarks}>Remarks</Text>
              </View>
            </View>

            {/* Student Rows */}
            {studentsForClass.map((student, index) => renderStudentRow(student, index))}

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Students:</Text>
                <Text style={styles.summaryValue}>{studentsForClass.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Passed:</Text>
                <Text style={styles.summaryValue}>
                  {studentsForClass.filter(s => normalizeRemarks(s.remarks) === 'passed').length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Conditional:</Text>
                <Text style={styles.summaryValue}>
                  {studentsForClass.filter(s => normalizeRemarks(s.remarks) === 'conditional').length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Failed:</Text>
                <Text style={styles.summaryValue}>
                  {studentsForClass.filter(s => normalizeRemarks(s.remarks) === 'failed').length}
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          renderEmptyState()
        )}
      </View>
    </View>
  );
};

const styles = {
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  academicInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileInitialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00418b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInitialsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  classSelector: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
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
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  termButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTermButton: {
    backgroundColor: '#00418b',
  },
  termButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTermButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerStudent: {
    flex: 2,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00418b',
  },
  headerGrade: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00418b',
    textAlign: 'center',
  },
  headerRemarks: {
    flex: 1.5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00418b',
    textAlign: 'center',
  },
  studentRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  studentCell: {
    flex: 2,
    marginRight: 8,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  studentId: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontFamily: 'Poppins-Regular',
  },
  gradeCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  remarksCell: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remarksBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  remarksText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  retryButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Medium',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
  },
};

export default FacultyGrades;
