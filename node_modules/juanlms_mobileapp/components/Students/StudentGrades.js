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
  
  // Quiz tab states
  const [activeTab, setActiveTab] = useState('grades'); // 'grades' or 'quiz'
  const [quizzes, setQuizzes] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');

  const API_BASE = 'https://juanlms-webapp-server.onrender.com';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    fetchGrades();
    return () => clearInterval(timer);
  }, [selectedTerm]);

  useEffect(() => {
    if (activeTab === 'quiz') {
      fetchQuizzes();
    }
  }, [activeTab]);

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

      // Fetch semestral grades from Web App backend
      const response = await fetch(`${API_BASE}/api/semestral-grades/student/${schoolID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }

      const payload = await response.json();
      const allGrades = payload?.grades || [];

      // Transform to UI-friendly structure
      const transformed = allGrades.map(g => ({
        subjectCode: g.subjectCode,
        subjectDescription: g.subjectName,
        academicYear: g.academicYear,
        termName: g.termName,
        quarter1: g.grades?.quarter1 ?? '-',
        quarter2: g.grades?.quarter2 ?? '-',
        quarter3: g.grades?.quarter3 ?? '-',
        quarter4: g.grades?.quarter4 ?? '-',
        semestralGrade: g.grades?.semesterFinal ?? '-',
        remarks: g.grades?.remarks ?? '-',
      }));

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

  const fetchQuizzes = async () => {
    try {
      setQuizLoading(true);
      setQuizError('');
      
      const token = await AsyncStorage.getItem('jwtToken');
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        throw new Error('User data not found');
      }

      // Get student ID
      const studentId = user.schoolID || user.userID || user._id;
      
      // First, fetch the student's classes
      const classesResponse = await fetch(`${API_BASE}/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!classesResponse.ok) {
        throw new Error('Failed to fetch classes');
      }

      const classesData = await classesResponse.json();
      const studentClasses = Array.isArray(classesData) ? classesData : [];
      
      // Fetch quizzes for all student's classes
      const allQuizzes = [];
      
      for (const classItem of studentClasses) {
        try {
          const quizResponse = await fetch(`${API_BASE}/api/quizzes?classID=${classItem.classID}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (quizResponse.ok) {
            const quizData = await quizResponse.json();
            if (Array.isArray(quizData)) {
              allQuizzes.push(...quizData);
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch quizzes for class ${classItem.classID}:`, err);
        }
      }
      
      // Check which quizzes the student has already submitted
      const quizzesWithSubmissionStatus = await Promise.all(
        allQuizzes.map(async (quiz) => {
          try {
            const submissionResponse = await fetch(`${API_BASE}/api/quizzes/${quiz._id}/response/${studentId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            return {
              ...quiz,
              isSubmitted: submissionResponse.ok,
              classInfo: {
                className: studentClasses.find(c => c.classID === quiz.classID)?.className || 'Unknown',
                classCode: studentClasses.find(c => c.classID === quiz.classID)?.classCode || 'N/A'
              }
            };
          } catch (err) {
            return {
              ...quiz,
              isSubmitted: false,
              classInfo: {
                className: studentClasses.find(c => c.classID === quiz.classID)?.className || 'Unknown',
                classCode: studentClasses.find(c => c.classID === quiz.classID)?.classCode || 'N/A'
              }
            };
          }
        })
      );
      
      // Filter only active quizzes and sort by creation date
      const activeQuizzes = quizzesWithSubmissionStatus
        .filter(quiz => quiz.status === 'active')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setQuizzes(activeQuizzes);
      
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setQuizError('Failed to load quizzes');
    } finally {
      setQuizLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'grades') {
      fetchGrades();
    } else {
      fetchQuizzes();
    }
  };

  const handleStartQuiz = (quiz) => {
    // Check if quiz is already submitted
    if (quiz.isSubmitted) {
      Alert.alert(
        'Quiz Already Completed',
        'You have already completed this quiz. You can view your results.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Results', 
            onPress: () => navigation.navigate('QuizView', { 
              quizId: quiz._id, 
              review: true 
            })
          }
        ]
      );
      return;
    }

    // Check if quiz is available (we already filter for active quizzes, but double-check)
    if (quiz.status !== 'active') {
      Alert.alert('Quiz Not Available', 'This quiz is not currently available.');
      return;
    }

    // Check if quiz is posted (has postAt date and it's in the past)
    if (quiz.postAt) {
      const now = new Date();
      const postAt = new Date(quiz.postAt);
      if (postAt > now) {
        Alert.alert('Quiz Not Posted Yet', 'This quiz will be available later.');
        return;
      }
    }

    // Navigate to quiz
    navigation.navigate('QuizView', { quizId: quiz._id });
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
      return { qa: grade.quarter3 ?? '-', qb: grade.quarter4 ?? '-' };
    }
    return { qa: grade.quarter1 ?? '-', qb: grade.quarter2 ?? '-' };
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
          {grade.semestralGrade || '-'}
        </Text>
      </View>
      
      <View style={styles.remarksCell}>
        <View style={[styles.remarksBadge, { backgroundColor: getRemarksColor(grade.remarks) }]}>
          <Text style={styles.remarksText}>{grade.remarks}</Text>
        </View>
      </View>
    </View>
  );

  const renderQuizCard = (quiz, index) => (
    <View key={index} style={styles.quizCard}>
      <View style={styles.quizHeader}>
        <View style={styles.quizTitleContainer}>
          <Text style={styles.quizTitle}>{quiz.title}</Text>
          <Text style={styles.quizSubject}>{quiz.classInfo?.className || 'General'}</Text>
        </View>
        <View style={[styles.quizStatus, { 
          backgroundColor: quiz.isSubmitted ? '#4CAF50' : '#FF9800' 
        }]}>
          <Text style={styles.quizStatusText}>
            {quiz.isSubmitted ? 'Completed' : 'Available'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.quizDescription} numberOfLines={2}>
        {quiz.description || 'No description available'}
      </Text>
      
      <View style={styles.quizInfo}>
        <View style={styles.quizInfoItem}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.quizInfoText}>
            {quiz.timing?.timeLimit ? `${quiz.timing.timeLimit} min` : 'No time limit'}
          </Text>
        </View>
        <View style={styles.quizInfoItem}>
          <MaterialIcons name="quiz" size={16} color="#666" />
          <Text style={styles.quizInfoText}>
            {quiz.questions?.length || 0} questions
          </Text>
        </View>
        <View style={styles.quizInfoItem}>
          <MaterialIcons name="stars" size={16} color="#666" />
          <Text style={styles.quizInfoText}>
            {quiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0} points
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.quizActionButton, quiz.isSubmitted && styles.completedQuizButton]}
        onPress={() => handleStartQuiz(quiz)}
      >
        <MaterialIcons 
          name={quiz.isSubmitted ? "visibility" : "play-arrow"} 
          size={20} 
          color="white" 
        />
        <Text style={styles.quizActionButtonText}>
          {quiz.isSubmitted ? 'View Results' : 'Start Quiz'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="grade-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Grades Available</Text>
      <Text style={styles.emptyText}>
        {selectedTerm === 'current' 
          ? 'No grades have been posted for the current term yet.'
          : 'No previous grades found.'
        }
      </Text>
    </View>
  );

  const renderQuizEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="quiz" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Quizzes Available</Text>
      <Text style={styles.emptyText}>
        There are no quizzes available for you at the moment.
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

      {/* Main Tabs */}
      <View style={styles.mainTabs}>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'grades' && styles.activeMainTab]}
          onPress={() => setActiveTab('grades')}
        >
          <MaterialIcons name="grade" size={20} color={activeTab === 'grades' ? 'white' : '#666'} />
          <Text style={[styles.mainTabText, activeTab === 'grades' && styles.activeMainTabText]}>
            Academic Grades
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'quiz' && styles.activeMainTab]}
          onPress={() => setActiveTab('quiz')}
        >
          <MaterialIcons name="quiz" size={20} color={activeTab === 'quiz' ? 'white' : '#666'} />
          <Text style={[styles.mainTabText, activeTab === 'quiz' && styles.activeMainTabText]}>
            Quizzes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'grades' ? (
        <>
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
                </View>
                        </ScrollView>
            ) : (
              renderEmptyState()
            )}
                    </View>
        </>
      ) : (
        /* Quiz Tab Content */
        <View style={StudentGradesStyle.contentWrapper}>
          {quizError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={64} color="#f44336" />
              <Text style={styles.errorText}>{quizError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchQuizzes}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : quizLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00418b" />
              <Text style={styles.loadingText}>Loading quizzes...</Text>
            </View>
          ) : quizzes.length > 0 ? (
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
              {quizzes.map((quiz, index) => renderQuizCard(quiz, index))}
            </ScrollView>
          ) : (
            renderQuizEmptyState()
          )}
        </View>
      )}
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
  mainTabs: {
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
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeMainTab: {
    backgroundColor: '#00418b',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeMainTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  termSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
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
  // Quiz styles
  quizCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  quizTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  quizSubject: {
    fontSize: 12,
    color: '#666',
  },
  quizStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quizStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  quizInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quizInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quizInfoText: {
    fontSize: 12,
    color: '#666',
  },
  quizActionButton: {
    backgroundColor: '#00418b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  completedQuizButton: {
    backgroundColor: '#4CAF50',
  },
  quizActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
};

export default StudentGrades;

