//table
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import StudentGradesStyle from '../styles/Stud/StudentGradesStyle';

const { width } = Dimensions.get('window');

const StudentGrades = () => {
  const navigation = useNavigation();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('current');
  const [academicYear, setAcademicYear] = useState('');
  const [currentTerm, setCurrentTerm] = useState('');
  const [user, setUser] = useState(null);
  const [profilePicError, setProfilePicError] = useState(false);
  const [gradesUnavailable, setGradesUnavailable] = useState(false);

  const API_BASE = 'https://juanlms-webapp-server.onrender.com';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    fetchGrades();
    return () => clearInterval(timer);
  }, [selectedTerm]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        throw new Error('User data not found');
      }

      // Set user state for use in render function
      setUser(user);
      setProfilePicError(false);

      // Fetch academic year and term
      const yearResponse = await fetch(`${API_BASE}/api/schoolyears/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let activeYearName = '';
      let activeTermName = '';

      if (yearResponse.ok) {
        const yearData = await yearResponse.json();
        activeYearName = `${yearData.schoolYearStart}-${yearData.schoolYearEnd}`;
        setAcademicYear(activeYearName);

        const termResponse = await fetch(`${API_BASE}/api/terms/schoolyear/${yearData.schoolYearStart}-${yearData.schoolYearEnd}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (termResponse.ok) {
          const terms = await termResponse.json();
          const active = terms.find(term => term.status === 'active');
          if (active) {
            activeTermName = active.termName;
            setCurrentTerm(activeTermName);
          }
        }
      }

      // Determine student identifier (prefer schoolID like web app)
      const schoolID = user.schoolID || user.userID || user._id;
      if (!schoolID) {
        throw new Error('Missing student identifier (schoolID/userID)');
      }

      // Quick health check to avoid calling unavailable endpoints
      try {
        const health = await fetch(`${API_BASE}/api/grades/health`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!health.ok) {
          console.log('Grades health endpoint not available, skipping grades fetch');
          setGrades([]);
          setError('');
          setGradesUnavailable(true);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } catch (e) {
        console.log('Grades health check failed, skipping grades fetch');
        setGrades([]);
        setError('');
        setGradesUnavailable(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch grades using existing backend endpoint
      console.log('Fetching grades from:', `${API_BASE}/api/grades/student/${schoolID}`);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('School ID:', schoolID);
      
      // First, get the student's classes to provide required parameters
      let studentClasses = [];
      try {
        const classesResponse = await fetch(`${API_BASE}/api/classes/student/${schoolID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (classesResponse.ok) {
          studentClasses = await classesResponse.json();
          console.log('Student classes found:', studentClasses.length);
        } else {
          console.log('Classes endpoint not available, using fallback');
        }
      } catch (error) {
        console.log('Error fetching classes, using fallback:', error.message);
      }
      
      // Use the existing grades endpoint with required parameters
      const response = await fetch(`${API_BASE}/api/grades/student/${schoolID}?classId=${studentClasses[0]?.classID || ''}&academicYear=${activeYearName}&termName=${activeTermName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Grades endpoint unavailable or failed, returning empty list. Status:', response.status, errorText);
        setGrades([]);
        setError('');
        setGradesUnavailable(true);
        return;
      }

      const payload = await response.json();
      const allGrades = payload || [];
      setGradesUnavailable(false);

      // Transform existing grades data structure to UI-friendly format
      const transformed = allGrades.map(g => ({
        subjectCode: g.type === 'assignment' ? 'ASS' : 'QUIZ',
        subjectDescription: g.title || 'Unknown Activity',
        academicYear: g.academicYear || activeYearName,
        termName: g.termName || activeTermName,
        quarter1: g.type === 'assignment' ? (g.score || 'No grades yet') : 'No grades yet',
        quarter2: g.type === 'quiz' ? (g.score || 'No grades yet') : 'No grades yet',
        quarter3: 'No grades yet',
        quarter4: 'No grades yet',
        semestralGrade: g.score || 'No grades yet',
        remarks: g.score ? (g.score >= 75 ? 'PASSED' : 'FAILED') : 'No grades yet',
      }));

      // If no grades found but student has classes, show "No grades yet" for each class
      if (transformed.length === 0 && studentClasses.length > 0) {
        console.log('No grades found, showing "No grades yet" for enrolled classes');
        const noGradesSubjects = studentClasses.map(cls => ({
          subjectCode: cls.subjectCode || cls.classCode || 'N/A',
          subjectDescription: cls.className || cls.subjectName || 'Unknown Subject',
          academicYear: cls.academicYear || activeYearName,
          termName: cls.termName || activeTermName,
          quarter1: 'No grades yet',
          quarter2: 'No grades yet',
          quarter3: 'No grades yet',
          quarter4: 'No grades yet',
          semestralGrade: 'No grades yet',
          remarks: 'No grades yet',
        }));
        transformed.push(...noGradesSubjects);
      } else if (transformed.length === 0) {
        // Fallback: show generic subjects if no classes endpoint available
        console.log('No grades or classes found, showing generic subjects');
        const fallbackSubjects = [
          {
            subjectCode: 'MATH',
            subjectDescription: 'Mathematics',
            academicYear: activeYearName,
            termName: activeTermName,
            quarter1: 'No grades yet',
            quarter2: 'No grades yet',
            quarter3: 'No grades yet',
            quarter4: 'No grades yet',
            semestralGrade: 'No grades yet',
            remarks: 'No grades yet',
          },
          {
            subjectCode: 'ENG',
            subjectDescription: 'English',
            academicYear: activeYearName,
            termName: activeTermName,
            quarter1: 'No grades yet',
            quarter2: 'No grades yet',
            quarter3: 'No grades yet',
            quarter4: 'No grades yet',
            semestralGrade: 'No grades yet',
            remarks: 'No grades yet',
          }
        ];
        transformed.push(...fallbackSubjects);
      }

      // Filter grades for current or previous
      let filtered = transformed;
      if (selectedTerm === 'current' && activeYearName && activeTermName) {
        filtered = transformed.filter(
          it => it.academicYear === activeYearName && it.termName === activeTermName
        );
      } else if (selectedTerm === 'previous' && activeYearName && activeTermName) {
        filtered = transformed.filter(
          it => it.academicYear !== activeYearName || it.termName !== activeTermName
        );
      }

      setGrades(filtered);
      setError('');
      
      // Debug logging to verify remarks values
      console.log('Grades data received:', {
        totalGrades: filtered.length,
        remarksValues: filtered.map(g => g.remarks),
        normalizedRemarks: filtered.map(g => normalizeRemarks(g.remarks)),
        passedCount: filtered.filter(g => normalizeRemarks(g.remarks) === 'passed').length,
        conditionalCount: filtered.filter(g => normalizeRemarks(g.remarks) === 'conditional').length,
        failedCount: filtered.filter(g => normalizeRemarks(g.remarks) === 'failed').length
      });
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Failed to load grades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGrades();
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
    // Handle "No grades yet" text
    if (grade === 'No grades yet') return '#999';
    
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
      case 'No grades yet': return '#999';
      default: return '#999';
    }
  };

  // Helper function to normalize remarks for consistent comparison
  const normalizeRemarks = (remarks) => {
    if (!remarks || remarks === '-') return '';
    
    // Handle "No grades yet" case
    if (remarks === 'No grades yet') return 'no-grades';
    
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

  const getQuarterLabels = () => {
    if (currentTerm === 'Term 1') {
      return { q1: '1st Quarter', q2: '2nd Quarter' };
    }
    if (currentTerm === 'Term 2') {
      return { q1: '3rd Quarter', q2: '4th Quarter' };
    }
    return { q1: 'Quarter 1', q2: 'Quarter 2' };
  };

  const pickQuarterValues = (grade) => {
    if (currentTerm === 'Term 2') {
      return { qa: grade.quarter3 ?? 'No grades yet', qb: grade.quarter4 ?? 'No grades yet' };
    }
    return { qa: grade.quarter1 ?? 'No grades yet', qb: grade.quarter2 ?? 'No grades yet' };
  };

  const renderGradeRow = (grade, index) => (
    <View key={index} style={styles.gradeRow}>
      <View style={styles.subjectCell}>
        <Text style={styles.subjectCode}>{grade.subjectCode}</Text>
        <Text style={styles.subjectDescription} numberOfLines={2}>
          {grade.subjectDescription}
        </Text>
      </View>
      
      <View style={styles.gradeCell}>
        {(() => { const { qa } = pickQuarterValues(grade); return (
          <Text style={[styles.gradeText, { color: getGradeColor(qa) }]}>
            {qa || '-'}
          </Text>
        ); })()}
      </View>
      
      <View style={styles.gradeCell}>
        {(() => { const { qb } = pickQuarterValues(grade); return (
          <Text style={[styles.gradeText, { color: getGradeColor(qb) }]}>
            {qb || '-'}
          </Text>
        ); })()}
      </View>
      
             <View style={styles.gradeCell}>
         <Text style={[styles.gradeText, { color: getGradeColor(grade.semestralGrade) }]}>
           {grade.semestralGrade || 'No grades yet'}
         </Text>
       </View>
      
      <View style={styles.remarksCell}>
        <View style={[styles.remarksBadge, { backgroundColor: getRemarksColor(grade.remarks) }]}>
          <Text style={styles.remarksText}>{grade.remarks}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="grade-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {gradesUnavailable ? 'Grades Service Unavailable' : 'Grades Not Available'}
      </Text>
      <Text style={styles.emptyText}>
        {gradesUnavailable 
          ? 'Grades service is currently unavailable. Please ask your faculty about your grades.'
          : 'Grades are not available yet. Please ask your faculty about that.'}
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
                            <Text style={StudentGradesStyle.headerTitle}>Grades</Text>
            <Text style={StudentGradesStyle.headerSubtitle}>
              {formatDateTime(currentDateTime)}
            </Text>
            {academicYear && currentTerm && (
              <Text style={styles.academicInfo}>
                {academicYear} - {currentTerm} Term
              </Text>
            )}
                        </View>
          
          <TouchableOpacity onPress={() => navigation.navigate('SProfile')}>
            {loading ? (
              <View style={styles.profileInitialsContainer}>
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : user?.profilePic && !profilePicError ? (
              <Image 
                source={{ uri: user.profilePic }} 
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
            <TouchableOpacity style={styles.retryButton} onPress={fetchGrades}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : grades.length > 0 ? (
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
                <Text style={styles.headerSubject}>Subject</Text>
                <Text style={styles.headerGrade}>{getQuarterLabels().q1}</Text>
                <Text style={styles.headerGrade}>{getQuarterLabels().q2}</Text>
                <Text style={styles.headerGrade}>Semestral</Text>
                <Text style={styles.headerRemarks}>Remarks</Text>
              </View>
            </View>

            {/* Grades Rows */}
            {grades.map((grade, index) => renderGradeRow(grade, index))}

                         {/* Summary */}
             <View style={styles.summaryContainer}>
               <Text style={styles.summaryTitle}>Summary</Text>
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Total Subjects:</Text>
                 <Text style={styles.summaryValue}>{grades.length}</Text>
               </View>
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Passed:</Text>
                 <Text style={styles.summaryValue}>
                   {grades.filter(g => normalizeRemarks(g.remarks) === 'passed').length}
                 </Text>
               </View>
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Conditional:</Text>
                 <Text style={styles.summaryValue}>
                   {grades.filter(g => normalizeRemarks(g.remarks) === 'conditional').length}
                 </Text>
               </View>
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>Failed:</Text>
                 <Text style={styles.summaryValue}>
                   {grades.filter(g => normalizeRemarks(g.remarks) === 'failed').length}
                 </Text>
               </View>
               <View style={styles.summaryRow}>
                 <Text style={styles.summaryLabel}>No Grades Yet:</Text>
                 <Text style={styles.summaryValue}>
                   {grades.filter(g => normalizeRemarks(g.remarks) === 'no-grades').length}
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
  termSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -20,
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
  headerSubject: {
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
  gradeRow: {
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
  subjectCell: {
    flex: 2,
    marginRight: 8,
  },
  subjectCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subjectDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  gradeCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
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
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
};

export default StudentGrades;

