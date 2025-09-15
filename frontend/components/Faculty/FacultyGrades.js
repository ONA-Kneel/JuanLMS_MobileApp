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
  Modal,
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
  const [user, setUser] = useState(null);
  const [profilePicError, setProfilePicError] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

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
        const academicYearStr = `${yearData.schoolYearStart}-${yearData.schoolYearEnd}`;
        setAcademicYear(academicYearStr);
        
        // Fetch active term
        const termResponse = await fetch(`${API_BASE}/api/terms/schoolyear/${yearData.schoolYearStart}-${yearData.schoolYearEnd}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (termResponse.ok) {
          const terms = await termResponse.json();
          const active = terms.find(term => term.status === 'active');
          if (active) {
            setCurrentTerm(active.termName);
            setAcademicContext(`${academicYearStr} | ${active.termName}`);
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
      
      // First, try to get all faculty classes (even without grades)
      let allClasses = [];
      try {
        // Use the correct endpoint for faculty classes
        const classesRes = await fetch(`${API_BASE}/api/classes/faculty-classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (classesRes.ok) {
          allClasses = await classesRes.json();
          console.log('All faculty classes found:', allClasses.length);
        } else {
          // Fallback to my-classes endpoint
          console.log('faculty-classes endpoint failed, trying my-classes endpoint');
          const myClassesRes = await fetch(`${API_BASE}/api/classes/my-classes`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (myClassesRes.ok) {
            allClasses = await myClassesRes.json();
            console.log('All faculty classes found via my-classes:', allClasses.length);
          } else {
            // Final fallback to faculty-assignments endpoint
            console.log('my-classes endpoint failed, trying faculty-assignments endpoint');
            try {
              const assignmentsRes = await fetch(`${API_BASE}/api/faculty-assignments`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (assignmentsRes.ok) {
                const assignments = await assignmentsRes.json();
                // Convert faculty assignments to class-like objects
                allClasses = assignments.map(assignment => ({
                  classID: `${assignment.subjectName}-${assignment.sectionName}`,
                  className: assignment.subjectName,
                  section: assignment.sectionName,
                  trackName: assignment.trackName,
                  strandName: assignment.strandName,
                  gradeLevel: assignment.gradeLevel,
                  academicYear: assignment.schoolYear,
                  termName: assignment.termName
                }));
                console.log('All faculty classes found via faculty-assignments:', allClasses.length);
              }
            } catch (assignmentError) {
              console.log('faculty-assignments endpoint also failed:', assignmentError.message);
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch faculty classes, will use grades data instead');
      }

      // Then get grades data
      const res = await fetch(`${API_BASE}/api/semestral-grades/faculty/${facultyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let allGrades = [];
      if (res.ok) {
        const payload = await res.json();
        allGrades = payload?.grades || [];
      } else {
        // Gracefully handle missing endpoint or server error by treating as no grades
        console.log('Faculty semestral endpoint unavailable, proceeding with empty grades. Status:', res.status);
        allGrades = [];
      }
      console.log('All grades received:', allGrades.length);
      console.log('Sample grade:', allGrades[0]);

      // Filter by current/previous term like student view
      const byTerm = allGrades.filter(g => {
        if (!academicYear || !currentTerm) return true;
        if (selectedTerm === 'current') {
          return g.academicYear === academicYear && g.termName === currentTerm;
        }
        return g.academicYear !== academicYear || g.termName !== currentTerm;
      });
      console.log('Grades after term filtering:', byTerm.length);
      console.log('Selected term:', selectedTerm);
      console.log('Academic year:', academicYear);
      console.log('Current term:', currentTerm);

      // Build class options - prioritize classes from grades, then add any missing classes
      const byClass = new Map();
      
      // Add classes from grades data
      byTerm.forEach(g => {
        const key = g.classID || `${g.subjectCode}-${g.section || ''}`;
        if (!byClass.has(key)) {
          byClass.set(key, {
            id: key,
            classID: g.classID || key,
            title: g.subjectName || g.subjectCode || 'Class',
            section: g.section || '',
            hasGrades: true
          });
        }
      });

      // Add classes from faculty classes API that don't have grades yet
      allClasses.forEach(cls => {
        const key = cls.classID || cls._id;
        if (!byClass.has(key)) {
          byClass.set(key, {
            id: key,
            classID: key,
            title: cls.className || cls.subjectName || cls.subjectCode || 'Class',
            section: cls.section || cls.sectionName || '',
            hasGrades: false,
            // Additional metadata from faculty assignments
            trackName: cls.trackName,
            strandName: cls.strandName,
            gradeLevel: cls.gradeLevel,
            academicYear: cls.academicYear,
            termName: cls.termName
          });
        }
      });

      // If still no classes found, try to create from all grades
      if (byClass.size === 0 && allGrades.length > 0) {
        console.log('No classes found, creating from all grades');
        allGrades.forEach(g => {
          const key = g.classID || `${g.subjectCode}-${g.section || ''}`;
          if (!byClass.has(key)) {
            byClass.set(key, {
              id: key,
              classID: g.classID || key,
              title: g.subjectName || g.subjectCode || 'Class',
              section: g.section || '',
              hasGrades: true
            });
          }
        });
      }
      
      const options = Array.from(byClass.values());
      console.log('Final class options:', options.length, options);
      setClassOptions(options);
      
      // Only set selectedClassId if none is currently selected
      if (!selectedClassId && options.length > 0) {
        setSelectedClassId(options[0].id);
      }

      // Students for chosen class
      const currentSelectedClassId = selectedClassId || options[0]?.id;
      if (currentSelectedClassId) {
        // Try to get students from term-filtered grades first
        let selectedGrades = byTerm.filter(g => (g.classID || `${g.subjectCode}-${g.section || ''}`) === currentSelectedClassId);
        
        // If no students found, try from all grades
        if (selectedGrades.length === 0) {
          selectedGrades = allGrades.filter(g => (g.classID || `${g.subjectCode}-${g.section || ''}`) === currentSelectedClassId);
        }
        
        const students = selectedGrades.map(g => ({
          studentId: g.studentId,
          studentName: g.studentName,
          schoolID: g.schoolID,
          semesterFinal: g.grades?.semesterFinal ?? '-',
          remarks: g.grades?.remarks ?? '-',
        }));
        console.log('Students found for class:', students.length);
        setStudentsForClass(students);
      } else {
        setStudentsForClass([]);
      }
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
    setShowClassDropdown(false);
    fetchFacultyGrades();
  };

  const getSelectedClassName = () => {
    const selectedClass = classOptions.find(opt => opt.id === selectedClassId);
    if (!selectedClass) return 'Select Class';
    
    let displayName = selectedClass.title;
    if (selectedClass.section) {
      displayName += ` - ${selectedClass.section}`;
    }
    if (selectedClass.gradeLevel) {
      displayName += ` (${selectedClass.gradeLevel})`;
    }
    return displayName;
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

  const renderEmptyState = () => {
    const selectedClass = classOptions.find(opt => opt.id === selectedClassId);
    const hasGrades = selectedClass?.hasGrades;
    
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="school-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>
          {hasGrades === false ? 'No Grades Found Yet' : 'No Classes Found'}
        </Text>
        <Text style={styles.emptyText}>
          {hasGrades === false 
            ? 'This class has no grades recorded yet. Grades will appear here once they are entered.'
            : selectedTerm === 'current' 
              ? 'No grades available for the current term yet.'
              : 'No previous grades found.'
          }
        </Text>
      </View>
    );
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
      {/* Blue background */}
      <View style={styles.blueHeaderBackground} />

      {/* White card header */}
      <View style={styles.whiteHeaderCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
                      <Text style={styles.headerTitle}>
              Hello, <Text style={{ fontWeight: 'bold', fontFamily: 'Poppins-Bold' }}>{user?.firstname || 'Faculty'}!</Text>
            </Text>
            <Text style={styles.headerSubtitle}>{academicContext}</Text>
            <Text style={styles.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
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
      </View>

      {/* Class Selection Dropdown */}
      {classOptions.length > 0 && (
        <View style={styles.classSelector}>
          <Text style={styles.selectorLabel}>Select Class:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowClassDropdown(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {getSelectedClassName()}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
          </TouchableOpacity>
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

      {/* Class Dropdown Modal */}
      <Modal
        visible={showClassDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClassDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowClassDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setShowClassDropdown(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
              {classOptions.map((opt) => (
                                 <TouchableOpacity
                   key={opt.id}
                   style={[
                     styles.dropdownItem,
                     selectedClassId === opt.id && styles.dropdownItemActive
                   ]}
                   onPress={() => handleClassSelect(opt)}
                 >
                   <View style={styles.dropdownItemContent}>
                     <Text style={[
                       styles.dropdownItemTitle,
                       selectedClassId === opt.id && styles.dropdownItemTitleActive
                     ]}>
                       {opt.title}
                     </Text>
                     {opt.section && (
                       <Text style={[
                         styles.dropdownItemSection,
                         selectedClassId === opt.id && styles.dropdownItemSectionActive
                       ]}>
                         Section: {opt.section}
                       </Text>
                     )}
                     {opt.trackName && opt.strandName && (
                       <Text style={[
                         styles.dropdownItemTrack,
                         selectedClassId === opt.id && styles.dropdownItemTrackActive
                       ]}>
                         {opt.trackName} - {opt.strandName}
                       </Text>
                     )}
                     {opt.gradeLevel && (
                       <Text style={[
                         styles.dropdownItemGradeLevel,
                         selectedClassId === opt.id && styles.dropdownItemGradeLevelActive
                       ]}>
                         {opt.gradeLevel}
                       </Text>
                     )}
                     {!opt.hasGrades && (
                       <Text style={[
                         styles.dropdownItemNoGrades,
                         selectedClassId === opt.id && styles.dropdownItemNoGradesActive
                       ]}>
                         No grades yet
                       </Text>
                     )}
                   </View>
                   {selectedClassId === opt.id && (
                     <MaterialIcons name="check" size={20} color="#00418b" />
                   )}
                 </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Grades Content */}
      <View style={styles.contentWrapper}>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  blueHeaderBackground: {
    backgroundColor: '#00418b',
    height: 90,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  whiteHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -40,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    color: '#222',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  headerSubtitle2: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
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
    marginTop: '10%',
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Medium',
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemActive: {
    backgroundColor: '#e3f2fd',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Medium',
    marginBottom: 4,
  },
  dropdownItemTitleActive: {
    color: '#00418b',
    fontFamily: 'Poppins-SemiBold',
  },
  dropdownItemSection: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  dropdownItemSectionActive: {
    color: '#00418b',
  },
  dropdownItemNoGrades: {
    fontSize: 12,
    color: '#ff9800',
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
  },
  dropdownItemNoGradesActive: {
    color: '#ff9800',
  },
  dropdownItemTrack: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  dropdownItemTrackActive: {
    color: '#00418b',
  },
  dropdownItemGradeLevel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  dropdownItemGradeLevelActive: {
    color: '#00418b',
  },
};

export default FacultyGrades;
