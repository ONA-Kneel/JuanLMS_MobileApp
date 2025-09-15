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
import StudentDashboardStyle from '../styles/Stud/StudentDashStyle';

const { width } = Dimensions.get('window');

const StudentGrades = () => {
  const navigation = useNavigation();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');
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
  const [studentClasses, setStudentClasses] = useState([]);

  const API_BASE = 'https://juanlms-webapp-server.onrender.com';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    fetchGrades();
    return () => clearInterval(timer);
  }, [selectedTerm]);

  const fetchStudentClasses = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || !user._id) return;

      const response = await fetch(`${API_BASE}/classes/my-classes`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Student classes loaded:', data);
        setStudentClasses(Array.isArray(data) ? data : []);
      } else {
        console.log('Failed to fetch student classes:', response.status);
        setStudentClasses([]);
      }
    } catch (error) {
      console.log('Error fetching student classes:', error.message);
      setStudentClasses([]);
    }
  };

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
      let schoolID = user.schoolID || user.userID || user._id;
      
      // Try to get schoolID from JWT token like web app
      try {
        const tokenRaw = await AsyncStorage.getItem('jwtToken');
        if (tokenRaw) {
          const payload = JSON.parse(atob(tokenRaw.split('.')[1] || '')) || {};
          const claimSchool = payload.schoolID || payload.schoolId;
          const claimUser = payload.userID || payload.userId || payload.sub;
          if (claimSchool) schoolID = claimSchool;
          if ((!schoolID || schoolID === 'null' || schoolID === 'undefined') && claimUser) {
            schoolID = claimUser;
          }
        }
      } catch (e) {
        console.log('Could not parse JWT token for schoolID');
      }
      
      if (!schoolID || schoolID === 'null' || schoolID === 'undefined') {
        schoolID = user.userID || user._id;
      }
      
      if (!schoolID) {
        throw new Error('Missing student identifier (schoolID/userID)');
      }
      
      console.log('🔍 Fetching grades using School ID:', schoolID);

      // Try to fetch grades from the Semestral_Grades_Collection endpoint using schoolID (like web app)
      let transformed = [];
      
      try {
        const response = await fetch(`${API_BASE}/api/semestral-grades/student/${schoolID}?termName=${activeTermName}&academicYear=${activeYearName}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.grades) {
            console.log('✅ Grades loaded from Semestral_Grades_Collection using School ID:', schoolID);
            console.log('Grades data:', data.grades);
            
            // Transform the grades data to match the expected format
            transformed = data.grades.map(grade => ({
              subjectCode: grade.subjectCode,
              subjectDescription: grade.subjectName,
              academicYear: grade.academicYear || activeYearName,
              termName: grade.termName || activeTermName,
              quarter1: grade.grades.quarter1 || '-',
              quarter2: grade.grades.quarter2 || '-',
              quarter3: grade.grades.quarter3 || '-',
              quarter4: grade.grades.quarter4 || '-',
              semestralGrade: grade.grades.semesterFinal || '-',
              remarks: grade.grades.semesterFinal ? (parseFloat(grade.grades.semesterFinal) >= 75 ? 'PASSED' : 'FAILED') : 'No grades yet',
            }));
            
            setGradesUnavailable(false);
          }
        } else if (response.status === 404) {
          console.log('Semestral grades endpoint not found (404), trying traditional grades...');
        }
      } catch (error) {
        console.log('Semestral grades endpoint error:', error.message);
      }
      
      // Fallback: Try to fetch from traditional grades endpoint
      if (transformed.length === 0) {
        try {
          const traditionalResponse = await fetch(`${API_BASE}/api/traditional-grades/student/${schoolID}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (traditionalResponse.ok) {
            const traditionalData = await traditionalResponse.json();
            if (traditionalData.success && traditionalData.grades) {
              console.log('✅ Grades loaded from traditional grades endpoint using School ID:', schoolID);
              console.log('Traditional grades data:', traditionalData.grades);
              
              // Transform traditional grades to match expected format
              transformed = traditionalData.grades.map(grade => ({
                subjectCode: grade.subjectCode || 'N/A',
                subjectDescription: grade.subjectName || 'N/A',
                academicYear: grade.academicYear || activeYearName,
                termName: grade.termName || activeTermName,
                quarter1: grade.quarter1 || '-',
                quarter2: grade.quarter2 || '-',
                quarter3: grade.quarter3 || '-',
                quarter4: grade.quarter4 || '-',
                semestralGrade: grade.semesterFinal || '-',
                remarks: grade.semesterFinal ? (parseFloat(grade.semesterFinal) >= 75 ? 'PASSED' : 'FAILED') : 'No grades yet',
              }));
              
              setGradesUnavailable(false);
            }
          } else if (traditionalResponse.status === 404) {
            console.log('Traditional grades endpoint not found (404)');
          }
        } catch (error) {
          console.log('Traditional grades endpoint error:', error.message);
        }
      }
      
      // If no grades found from either endpoint, try localStorage as last resort (like web app)
      if (transformed.length === 0) {
        console.log('No grades found from API endpoints, checking localStorage...');
        try {
          const savedGrades = await AsyncStorage.getItem('classGrades');
          if (savedGrades) {
            const parsedGrades = JSON.parse(savedGrades);
            const studentGrades = parsedGrades.find(g => 
              g.schoolID === schoolID
            );
            
            if (studentGrades) {
              console.log('✅ Grades loaded from localStorage using School ID:', schoolID);
              console.log('LocalStorage grades:', studentGrades);
              
              // Transform localStorage grades to match expected format
              transformed = [{
                subjectCode: studentGrades.subjectCode || 'N/A',
                subjectDescription: studentGrades.subjectName || 'N/A',
                academicYear: studentGrades.academicYear || activeYearName,
                termName: studentGrades.termName || activeTermName,
                quarter1: studentGrades.grades.quarter1 || '-',
                quarter2: studentGrades.grades.quarter2 || '-',
                quarter3: studentGrades.grades.quarter3 || '-',
                quarter4: studentGrades.grades.quarter4 || '-',
                semestralGrade: studentGrades.grades.semesterFinal || '-',
                remarks: studentGrades.grades.semesterFinal ? (parseFloat(studentGrades.grades.semesterFinal) >= 75 ? 'PASSED' : 'FAILED') : 'No grades yet',
              }];
              
              setGradesUnavailable(false);
            }
          }
        } catch (parseError) {
          console.error('Error parsing localStorage grades:', parseError);
        }
      }
      
      if (transformed.length === 0) {
        console.log('❌ No grades found from any source for School ID:', schoolID);
        console.log('This could be because:');
        console.log('1. Grades API endpoints are not implemented yet');
        console.log('2. Student has no grades recorded');
        console.log('3. Student ID format is incorrect');
        setGradesUnavailable(true);
        // Fetch student classes to show what subjects they're enrolled in
        await fetchStudentClasses();
      }

      // If no grades found, don't show fallback subjects
      if (transformed.length === 0) {
        console.log('No grades found for student');
        // Don't add fallback subjects - let the empty state handle this
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

  const resolveProfileUri = () => {
    const API_BASE = 'https://juanlms-webapp-server.onrender.com';
    const uri = user?.profilePic || user?.profilePicture;
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/uploads/')) return API_BASE + uri;
    return uri;
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

  // Helper function to get semester name based on term (like web app)
  const getSemesterName = (termName) => {
    if (termName === 'Term 1') return '1st Semester';
    if (termName === 'Term 2') return '2nd Semester';
    return termName;
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

  const renderClassesList = () => (
    <View>
      {/* Horizontal Scrollable Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalTableContainer}>
        <View style={styles.tableContent}>
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

          {/* Classes as Grade Rows */}
          {studentClasses.map((classItem, index) => (
            <View key={index} style={styles.gradeRow}>
              <View style={styles.subjectCell}>
                <Text style={styles.subjectCode}>{classItem.className || classItem.name}</Text>
                <Text style={styles.subjectDescription} numberOfLines={2}>
                  {classItem.section || classItem.classCode || classItem.code}
                </Text>
              </View>
              
              <View style={styles.gradeCell}>
                <Text style={[styles.gradeText, { color: '#999' }]}>-</Text>
              </View>
              
              <View style={styles.gradeCell}>
                <Text style={[styles.gradeText, { color: '#999' }]}>-</Text>
              </View>
              
              <View style={styles.gradeCell}>
                <Text style={[styles.gradeText, { color: '#999' }]}>-</Text>
              </View>
              
              <View style={styles.remarksCell}>
                <View style={[styles.remarksBadge, { backgroundColor: '#999' }]}>
                  <Text style={styles.remarksText}>No grades yet</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Subjects:</Text>
          <Text style={styles.summaryValue}>{studentClasses.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>No Grades Yet:</Text>
          <Text style={styles.summaryValue}>{studentClasses.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Passed:</Text>
          <Text style={styles.summaryValue}>0</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Conditional:</Text>
          <Text style={styles.summaryValue}>0</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Failed:</Text>
          <Text style={styles.summaryValue}>0</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="school-outline" size={64} color="#ccc" />
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
    <ScrollView>
      <View style={
      {
        paddingBottom: 80,
        // paddingHorizontal: 20,
        // paddingTop: 120, // Space for fixed header
      }
      }/>
      {/* Blue background */}
      <View style={StudentDashboardStyle.blueHeaderBackground} />
      
      {/* White card header */}
      <View style={StudentDashboardStyle.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={StudentDashboardStyle.headerTitle}>
              Grades
            </Text>
                         <Text style={StudentDashboardStyle.headerSubtitle}>{academicContext}</Text>
             <Text style={StudentDashboardStyle.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SProfile')}>
            {resolveProfileUri() ? (
              <Image 
                source={{ uri: resolveProfileUri() }} 
                style={{ width: 36, height: 36, borderRadius: 18 }}
                resizeMode="cover"
              />
            ) : (
              <Image 
                source={require('../../assets/profile-icon (2).png')} 
                style={{ width: 36, height: 36, borderRadius: 18 }}
                resizeMode="cover"
              />
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
            {/* Horizontal Scrollable Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalTableContainer}>
              <View style={styles.tableContent}>
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
              </View>
            </ScrollView>

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
        ) : studentClasses.length > 0 ? (
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
            {renderClassesList()}
          </ScrollView>
        ) : (
          renderEmptyState()
        )}
                </View>
                </ScrollView>
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
    margin: 20,
    marginTop: 20,
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
    width: 200,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00418b',
  },
  headerGrade: {
    width: 100,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00418b',
    textAlign: 'center',
  },
  headerRemarks: {
    width: 120,
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
    width: 200,
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
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  remarksCell: {
    width: 120,
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
  horizontalTableContainer: {
    marginBottom: 16,
  },
  tableContent: {
    minWidth: 600, // Ensure table has minimum width for proper display
  },
};

export default StudentGrades;

