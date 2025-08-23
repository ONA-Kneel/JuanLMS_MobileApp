import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const API_BASE_URL = 'https://juanlms-webapp-server.onrender.com';

const PerformanceCard = ({ title, value, subtitle, icon, color, onPress }) => (
  <TouchableOpacity style={styles.performanceCard} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Icon name={icon} size={24} color="#fff" />
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

const GradeDistributionItem = ({ range, count, percentage, color }) => (
  <View style={styles.distributionItem}>
    <View style={styles.distributionHeader}>
      <Text style={styles.rangeText}>{range}</Text>
      <Text style={styles.countText}>{count} students</Text>
    </View>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
    <Text style={styles.percentageText}>{percentage}%</Text>
  </View>
);

const SubjectPerformanceItem = ({ subject, averageGrade, totalStudents, improvement }) => (
  <TouchableOpacity style={styles.subjectItem} onPress={() => {}}>
    <View style={styles.subjectInfo}>
      <Text style={styles.subjectName}>{subject}</Text>
      <Text style={styles.subjectStats}>
        {totalStudents} students • Avg: {averageGrade}%
      </Text>
    </View>
    <View style={styles.subjectMetrics}>
      <View style={styles.improvementContainer}>
        <Icon
          name={improvement >= 0 ? 'trending-up' : 'trending-down'}
          size={16}
          color={improvement >= 0 ? '#4CAF50' : '#F44336'}
        />
        <Text
          style={[
            styles.improvementText,
            { color: improvement >= 0 ? '#4CAF50' : '#F44336' },
          ]}
        >
          {improvement >= 0 ? '+' : ''}{improvement}%
        </Text>
      </View>
      <TouchableOpacity style={styles.viewDetailsButton}>
        <Text style={styles.viewDetailsText}>View</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

// Dropdown component for filters
const FilterDropdown = ({ title, options, selected, onSelect, placeholder, disabled }) => (
  <View style={styles.filterField}>
    <Text style={styles.filterLabel}>{title}</Text>
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.dropdownButtonDisabled
        ]}
        onPress={() => !disabled && onSelect()}
        disabled={disabled}
      >
        <Text style={styles.dropdownButtonText}>
          {selected || placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function PrincipalGrades() {
  const isFocused = useIsFocused();
  const [performanceData, setPerformanceData] = useState({
    overallAverage: 0,
    totalStudents: 0,
    passingRate: 0,
    improvementRate: 0,
  });
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Principal grade view states
  const [academicYear, setAcademicYear] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [gradeLevels, setGradeLevels] = useState(['Grade 11', 'Grade 12']);
  const [strands, setStrands] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedStrand, setSelectedStrand] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingStudentGrades, setLoadingStudentGrades] = useState(false);
  const [studentGrades, setStudentGrades] = useState([]);

  // Dropdown visibility states
  const [showGradeLevelDropdown, setShowGradeLevelDropdown] = useState(false);
  const [showStrandDropdown, setShowStrandDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const fetchGradesData = async () => {
    try {
      setIsLoading(true);
      // Use mock data for now
      setPerformanceData({
        overallAverage: 78.5,
        totalStudents: 1250,
        passingRate: 87.3,
        improvementRate: 5.2,
      });

      setGradeDistribution([
        { range: '90-100%', count: 156, percentage: 12.5, color: '#4CAF50' },
        { range: '80-89%', count: 312, percentage: 25.0, color: '#8BC34A' },
        { range: '70-79%', count: 375, percentage: 30.0, color: '#FFC107' },
        { range: '60-69%', count: 250, percentage: 20.0, color: '#FF9800' },
        { range: 'Below 60%', count: 157, percentage: 12.5, color: '#F44336' },
      ]);

      setSubjectPerformance([
        { subject: 'Mathematics', averageGrade: 82.3, totalStudents: 1250, improvement: 6.8 },
        { subject: 'English Literature', averageGrade: 79.1, totalStudents: 1250, improvement: 4.2 },
        { subject: 'Science', averageGrade: 76.8, totalStudents: 1250, improvement: 3.1 },
        { subject: 'History', averageGrade: 81.5, totalStudents: 1250, improvement: 5.9 },
        { subject: 'Computer Science', averageGrade: 85.2, totalStudents: 1250, improvement: 8.7 },
        { subject: 'Physical Education', averageGrade: 88.9, totalStudents: 1250, improvement: 2.1 },
      ]);
    } catch (error) {
      console.error('Error fetching grades data:', error);
      Alert.alert('Error', 'Failed to fetch grades data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGradesData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      fetchGradesData();
    }
  }, [isFocused]);

  // Fetch active academic year
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE_URL}/api/schoolyears/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const year = await res.json();
          setAcademicYear(year);
        }
      } catch (e) {
        // silent
      }
    })();
  }, []);

  // Fetch active term for year
  useEffect(() => {
    (async () => {
      if (!academicYear) return;
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const schoolYearName = `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
        const res = await fetch(`${API_BASE_URL}/api/terms/schoolyear/${schoolYearName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const terms = await res.json();
          const active = Array.isArray(terms) ? terms.find(t => t.status === 'active') : null;
          setCurrentTerm(active || null);
        }
      } catch {}
    })();
  }, [academicYear]);

  // Fetch strands from sections
  useEffect(() => {
    (async () => {
      if (!selectedGradeLevel || !academicYear || !currentTerm) {
        setStrands([]);
        setSelectedStrand('');
        return;
      }
      try {
        setLoadingOptions(true);
        const token = await AsyncStorage.getItem('jwtToken');
        
        // Read from the dedicated sections collection instead of grades (same as web app)
        const response = await fetch(`${API_BASE_URL}/api/sections?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const sections = await response.json();
          if (sections && sections.length > 0) {
            // Filter sections based on our selection criteria (same as web app)
            const matchingSections = sections.filter(section => 
              section.gradeLevel === selectedGradeLevel
            );
            
            if (matchingSections.length > 0) {
              // Extract unique strand names
              const uniqueStrands = [...new Set(
                matchingSections
                  .map(section => section.strandName)
                  .filter(strand => strand && strand.trim() !== '')
              )];
              
              if (uniqueStrands.length > 0) {
                setStrands(uniqueStrands.sort());
                return;
              }
            }
          }
        }
        
        // Fallback to sample strands if no data found (same as web app)
        setStrands(['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL']);
        
      } catch (error) {
        console.error('Error fetching strands:', error);
        // Fallback to sample strands
        setStrands(['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL']);
      } finally { 
        setLoadingOptions(false); 
      }
    })();
  }, [selectedGradeLevel, academicYear, currentTerm]);

  // Fetch sections when strand changes
  useEffect(() => {
    (async () => {
      if (!selectedStrand || !selectedGradeLevel || !academicYear || !currentTerm) {
        setSections([]);
        setSelectedSection('');
        return;
      }
      try {
        setLoadingOptions(true);
        const token = await AsyncStorage.getItem('jwtToken');
        
        // Read from the dedicated sections collection (same as web app)
        const response = await fetch(`${API_BASE_URL}/api/sections?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const sections = await response.json();
          if (sections && sections.length > 0) {
            // Filter sections based on our selection criteria (same as web app)
            const matchingSections = sections.filter(section => 
              section.gradeLevel === selectedGradeLevel && 
              section.strandName?.toLowerCase().includes(selectedStrand.toLowerCase())
            );
            
            if (matchingSections.length > 0) {
              // Extract unique section names
              const uniqueSections = [...new Set(
                matchingSections
                  .map(section => section.sectionName)
                  .filter(section => section && section.trim() !== '')
              )];
              
              if (uniqueSections.length > 0) {
                setSections(uniqueSections.sort());
                return;
              }
            }
          }
        }
        
        // Fallback to empty array if no data found
        setSections([]);
        
      } catch (error) {
        console.error('Error fetching sections:', error);
        setSections([]);
      } finally { 
        setLoadingOptions(false); 
      }
    })();
  }, [selectedStrand, selectedGradeLevel, academicYear, currentTerm]);

  // Fetch subjects when section changes
  useEffect(() => {
    (async () => {
      if (!selectedSection || !selectedStrand || !selectedGradeLevel || !academicYear || !currentTerm) {
        setSubjects([]);
        setSelectedSubject('');
        return;
      }
      try {
        setLoadingOptions(true);
        const token = await AsyncStorage.getItem('jwtToken');
        
        // Read from the dedicated subjects collection (same as web app)
        const response = await fetch(`${API_BASE_URL}/api/subjects?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const subjects = await response.json();
          if (subjects && subjects.length > 0) {
            // Filter subjects based on our selection criteria (same as web app)
            const matchingSubjects = subjects.filter(subject => {
              // Match grade level
              const gradeLevelMatch = subject.gradeLevel === selectedGradeLevel;
              
              // Match strand (case-insensitive)
              const strandMatch = subject.strandName?.toLowerCase().includes(selectedStrand.toLowerCase());
              
              // Match section by checking if the subject is taught in the selected section
              // We'll need to check if this subject is available for the selected section
              // For now, we'll include all subjects that match grade level and strand
              // The section filtering will happen when we fetch grades
              
              return gradeLevelMatch && strandMatch;
            });
            
            if (matchingSubjects.length > 0) {
              // Extract unique subject names
              const uniqueSubjects = [...new Set(
                matchingSubjects
                  .map(subject => subject.subjectName)
                  .filter(subject => subject && subject.trim() !== '')
              )];
              
              if (uniqueSubjects.length > 0) {
                setSubjects(uniqueSubjects.sort());
                return;
              }
            }
          }
        }
        
        // Fallback to sample subjects if no data found (same as web app)
        setSubjects(['Mathematics', 'Science', 'English', 'Filipino', 'Social Studies', 'Physical Education', 'Values Education']);
        
      } catch (error) {
        console.error('Error fetching subjects:', error);
        // Fallback to sample subjects
        setSubjects(['Mathematics', 'Science', 'English', 'Filipino', 'Social Studies', 'Physical Education', 'Values Education']);
      } finally { 
        setLoadingOptions(false); 
      }
    })();
  }, [selectedSection, selectedStrand, selectedGradeLevel, academicYear, currentTerm]);

  // Fetch student grades when all selections are made
  useEffect(() => {
    (async () => {
      if (!selectedSubject || !selectedSection || !selectedStrand || !selectedGradeLevel || !academicYear || !currentTerm) {
        setStudentGrades([]);
        return;
      }
      try {
        setLoadingStudentGrades(true);
        const token = await AsyncStorage.getItem('jwtToken');

        let grades = [];
        
        try {
          console.log('🔍 Using comprehensive endpoint to fetch grades...');
          
          // Step 1: Try to get students from the comprehensive endpoint (same as web app)
          const comprehensiveResponse = await fetch(
            `${API_BASE_URL}/api/grading/class/all/section/${selectedSection}/comprehensive?` +
            `trackName=${selectedStrand}&` +
            `strandName=${selectedStrand}&` +
            `gradeLevel=${selectedGradeLevel}&` +
            `schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&` +
            `termName=${currentTerm.termName}`,
            {
              headers: { "Authorization": `Bearer ${token}` }
            }
          );
          
          if (comprehensiveResponse.ok) {
            const comprehensiveData = await comprehensiveResponse.json();
            console.log('🔍 Comprehensive endpoint response:', comprehensiveData);
            
            if (comprehensiveData.success && comprehensiveData.data && comprehensiveData.data.students) {
              const students = comprehensiveData.data.students;
              console.log(`🔍 Found ${students.length} students from comprehensive endpoint`);
              
              // Step 2: For each student, fetch their grades using the student endpoint
              for (const student of students.slice(0, 20)) { // Limit to first 20 for performance
                try {
                  const studentID = student.userID || student.studentID || student._id || student.id;
                  if (studentID) {
                    const gradeResponse = await fetch(`${API_BASE_URL}/api/semestral-grades/student/${studentID}`, {
                      headers: { "Authorization": `Bearer ${token}` }
                    });
                    
                    if (gradeResponse.ok) {
                      const gradeData = await gradeResponse.json();
                      if (gradeData.success && gradeData.grades) {
                        // Filter grades by our criteria
                        const filteredGrades = gradeData.grades.filter(grade => {
                          const subjectMatch = grade.subjectName?.toLowerCase().includes(selectedSubject.toLowerCase()) ||
                                             grade.subjectCode?.toLowerCase().includes(selectedSubject.toLowerCase());
                          const sectionMatch = !grade.section || grade.section === selectedSection;
                          const termMatch = grade.termName === currentTerm.termName;
                          const yearMatch = grade.academicYear === `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
                          
                          return subjectMatch && sectionMatch && termMatch && yearMatch;
                        });
                        
                        if (filteredGrades.length > 0) {
                          // Transform the data to match our expected format
                          const transformedGrades = filteredGrades.map(grade => ({
                            _id: student._id || studentID,
                            studentName: student.name || student.studentName || `${student.firstname || ''} ${student.lastname || ''}`.trim(),
                            schoolID: studentID,
                            grades: {
                              quarter1: grade.quarter1 || grade.first_quarter || grade.grades?.quarter1 || '-',
                              quarter2: grade.quarter2 || grade.second_quarter || grade.grades?.quarter2 || '-',
                              quarter3: grade.quarter3 || grade.third_quarter || grade.grades?.quarter3 || '-',
                              quarter4: grade.quarter4 || grade.fourth_quarter || grade.grades?.quarter4 || '-',
                              semesterFinal: grade.semesterFinal || grade.final_grade || grade.grades?.semesterFinal || '-',
                              remarks: grade.remarks || grade.remark || grade.grades?.remarks || '-'
                            },
                            subjectName: grade.subjectName,
                            subjectCode: grade.subjectCode,
                            section: grade.section || selectedSection
                          }));
                          
                          grades.push(...transformedGrades);
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.log(`🔍 Error fetching grades for student ${student.name}:`, error);
                }
              }
            }
          } else {
            console.log('🔍 Comprehensive endpoint failed, trying alternative approach...');
          }
        } catch (error) {
          console.log('🔍 Comprehensive approach failed:', error);
        }
        
        // If no grades found, try the principal-view endpoint
        if (grades.length === 0) {
          try {
            console.log('🔍 Trying principal-view endpoint as fallback...');
            const pvUrl = `${API_BASE_URL}/api/semestral-grades/principal-view?` +
              `gradeLevel=${encodeURIComponent(selectedGradeLevel)}&` +
              `strand=${encodeURIComponent(selectedStrand)}&` +
              `section=${encodeURIComponent(selectedSection)}&` +
              `subject=${encodeURIComponent(selectedSubject)}&` +
              `termName=${encodeURIComponent(currentTerm.termName)}&` +
              `academicYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
            
            const pvRes = await fetch(pvUrl, { headers: { Authorization: `Bearer ${token}` } });
            
            if (pvRes && pvRes.ok) {
              const pvData = await pvRes.json();
              if (pvData.success && pvData.grades) {
                console.log('🔍 Found grades from principal-view endpoint:', pvData.grades.length);
                
                // Transform principal-view data to match our format
                const transformedGrades = pvData.grades.map(grade => ({
                  _id: grade._id || grade.studentId,
                  studentName: grade.studentName || `${grade.firstname || ''} ${grade.lastname || ''}`.trim(),
                  schoolID: grade.schoolID || grade.studentId,
                  grades: {
                    quarter1: grade.grades?.quarter1 || grade.quarter1 || '-',
                    quarter2: grade.grades?.quarter2 || grade.quarter2 || '-',
                    quarter3: grade.grades?.quarter3 || grade.quarter3 || '-',
                    quarter4: grade.grades?.quarter4 || grade.quarter4 || '-',
                    semesterFinal: grade.grades?.semesterFinal || grade.semesterFinal || '-',
                    remarks: grade.grades?.remarks || grade.remarks || '-'
                  },
                  subjectName: grade.subjectName,
                  subjectCode: grade.subjectCode,
                  section: grade.section || selectedSection
                }));
                
                grades = transformedGrades;
              }
            }
          } catch (error) {
            console.log('🔍 Principal-view endpoint failed:', error);
          }
        }
        
        // If still no grades, try the class/all endpoint as final fallback
        if (grades.length === 0) {
          try {
            console.log('🔍 Trying class/all endpoint as final fallback...');
            const listUrl = `${API_BASE_URL}/api/semestral-grades/class/all?termName=${encodeURIComponent(currentTerm.termName)}&academicYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
            const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
            
            if (listRes.ok) {
              const listData = await listRes.json();
              if (listData.success && listData.grades) {
                console.log('🔍 Found grades from class/all endpoint:', listData.grades.length);
                
                // Filter and transform class/all data
                const filtered = listData.grades.filter(grade => {
                  const subjectMatch = grade.subjectName?.toLowerCase().includes(selectedSubject.toLowerCase()) ||
                                     grade.subjectCode?.toLowerCase().includes(selectedSubject.toLowerCase());
                  const sectionMatch = !grade.section || grade.section === selectedSection;
                  const strandMatch = !grade.strandName || (grade.strandName || '').toLowerCase().includes(selectedStrand.toLowerCase());
                  const gradeLevelMatch = !grade.gradeLevel || grade.gradeLevel === selectedGradeLevel;
                  const termMatch = !grade.termName || grade.termName === currentTerm.termName;
                  const yearMatch = !grade.academicYear || grade.academicYear === `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
                  
                  return subjectMatch && sectionMatch && strandMatch && gradeLevelMatch && termMatch && yearMatch;
                });
                
                if (filtered.length > 0) {
                  // Transform to our format
                  const transformedGrades = filtered.map(grade => ({
                    _id: grade._id || grade.studentId,
                    studentName: grade.studentName || `${grade.firstname || ''} ${grade.lastname || ''}`.trim(),
                    schoolID: grade.schoolID || grade.studentId,
                    grades: {
                      quarter1: grade.grades?.quarter1 || grade.quarter1 || '-',
                      quarter2: grade.grades?.quarter2 || grade.quarter2 || '-',
                      quarter3: grade.grades?.quarter3 || grade.quarter3 || '-',
                      quarter4: grade.grades?.quarter4 || grade.quarter4 || '-',
                      semesterFinal: grade.grades?.semesterFinal || grade.semesterFinal || '-',
                      remarks: grade.grades?.remarks || grade.remarks || '-'
                    },
                    subjectName: grade.subjectName,
                    subjectCode: grade.subjectCode,
                    section: grade.section || selectedSection
                  }));
                  
                  grades = transformedGrades;
                }
              }
            }
          } catch (error) {
            console.log('🔍 Class/all endpoint failed:', error);
          }
        }

        console.log('🔍 Final grades found:', grades);
        
        if (grades.length > 0) {
          // Group by student to avoid duplicates
          const byStudent = new Map();
          grades.forEach(grade => {
            const studentKey = grade.schoolID || grade._id;
            if (studentKey) {
              byStudent.set(studentKey, grade);
            }
          });
          
          setStudentGrades(Array.from(byStudent.values()));
        } else {
          setStudentGrades([]);
        }
      } catch (e) {
        console.error('🔍 Error fetching grades:', e);
        setStudentGrades([]);
      } finally {
        setLoadingStudentGrades(false);
      }
    })();
  }, [selectedSubject, selectedSection, selectedStrand, selectedGradeLevel, academicYear, currentTerm]);

  const handlePerformanceCardPress = (type) => {
    switch (type) {
      case 'overall':
        Alert.alert('Overall Performance', `Institution-wide average: ${performanceData.overallAverage}%`);
        break;
      case 'students':
        Alert.alert('Student Count', `Total enrolled students: ${performanceData.totalStudents.toLocaleString()}`);
        break;
      case 'passing':
        Alert.alert('Passing Rate', `${performanceData.passingRate}% of students are passing their courses`);
        break;
      case 'improvement':
        Alert.alert('Improvement Rate', `Average improvement: ${performanceData.improvementRate}% from last semester`);
        break;
      default:
        break;
    }
  };

  const handleSubjectPress = (subject) => {
    Alert.alert(
      subject.subject,
      `Average Grade: ${subject.averageGrade}%\nTotal Students: ${subject.totalStudents}\nImprovement: ${subject.improvement >= 0 ? '+' : ''}${subject.improvement}%`
    );
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
      case 'Failed': return '#F44336';
      default: return '#999';
    }
  };

  const normalizeRemarks = (remarks) => {
    if (!remarks || remarks === '-') return '';
    const normalized = remarks.toLowerCase().trim();
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
    if (currentTerm?.termName === 'Term 1') {
      return { q1: '1st Quarter', q2: '2nd Quarter' };
    }
    if (currentTerm?.termName === 'Term 2') {
      return { q1: '3rd Quarter', q2: '4th Quarter' };
    }
    return { q1: 'Quarter 1', q2: 'Quarter 2' };
  };

  const renderGradeRow = (grade, index) => (
    <View key={index} style={styles.gradeRow}>
      <View style={styles.subjectCell}>
        <Text style={styles.studentName}>{grade.studentName}</Text>
        <Text style={styles.studentID}>ID: {grade.schoolID}</Text>
      </View>
      
      <View style={styles.gradeCell}>
        <Text style={[styles.gradeText, { color: getGradeColor(grade.grades?.quarter1) }]}>
          {grade.grades?.quarter1 || '-'}
        </Text>
      </View>
      
      <View style={styles.gradeCell}>
        <Text style={[styles.gradeText, { color: getGradeColor(grade.grades?.quarter2) }]}>
          {grade.grades?.quarter2 || '-'}
        </Text>
      </View>
      
      <View style={styles.gradeCell}>
        <Text style={[styles.gradeText, { color: getGradeColor(grade.grades?.semesterFinal) }]}>
          {grade.grades?.semesterFinal || '-'}
        </Text>
      </View>
      
      <View style={styles.remarksCell}>
        <View style={[styles.remarksBadge, { backgroundColor: getRemarksColor(grade.grades?.remarks) }]}>
          <Text style={styles.remarksText}>{grade.grades?.remarks || '-'}</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading grades...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Blue background */}
      <View style={styles.blueHeaderBackground} />

      {/* White card header */}
      <View style={styles.whiteHeaderCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Academic Performance</Text>
            <Text style={styles.headerSubtitle}>
              {formatDateTime(new Date())}
            </Text>
            {academicYear && currentTerm && (
              <Text style={styles.academicInfo}>
                {academicYear.schoolYearStart}-{academicYear.schoolYearEnd} - {currentTerm.termName}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Performance Overview Cards */}
      <View style={styles.performanceSection}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.performanceGrid}>
          <PerformanceCard
            title="Overall Average"
            value={`${performanceData.overallAverage}%`}
            subtitle="Institution-wide"
            icon="chart-line"
            color="#4CAF50"
            onPress={() => handlePerformanceCardPress('overall')}
          />
          <PerformanceCard
            title="Total Students"
            value={performanceData.totalStudents.toLocaleString()}
            subtitle="Enrolled"
            icon="account-group"
            color="#2196F3"
            onPress={() => handlePerformanceCardPress('students')}
          />
          <PerformanceCard
            title="Passing Rate"
            value={`${performanceData.passingRate}%`}
            subtitle="Students passing"
            icon="check-circle"
            color="#8BC34A"
            onPress={() => handlePerformanceCardPress('passing')}
          />
          <PerformanceCard
            title="Improvement"
            value={`+${performanceData.improvementRate}%`}
            subtitle="From last semester"
            icon="trending-up"
            color="#FF9800"
            onPress={() => handlePerformanceCardPress('improvement')}
          />
        </View>
      </View>

      {/* Grade Distribution */}
      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Grade Distribution</Text>
        <View style={styles.distributionContainer}>
          {gradeDistribution.map((item, index) => (
            <GradeDistributionItem
              key={index}
              range={item.range}
              count={item.count}
              percentage={item.percentage}
              color={item.color}
            />
          ))}
        </View>
      </View>

      {/* Subject Performance */}
      <View style={styles.subjectsSection}>
        <Text style={styles.sectionTitle}>Subject Performance</Text>
        <View style={styles.subjectsContainer}>
          {subjectPerformance.map((subject, index) => (
            <SubjectPerformanceItem
              key={index}
              subject={subject.subject}
              averageGrade={subject.averageGrade}
              totalStudents={subject.totalStudents}
              improvement={subject.improvement}
            />
          ))}
        </View>
      </View>

      {/* Student Grades (Principal View) */}
      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Student Grades</Text>
        
        {/* Filter Dropdowns */}
        <View style={styles.filterContainer}>
          <FilterDropdown
            title="Grade Level"
            options={gradeLevels}
            selected={selectedGradeLevel}
            onSelect={() => setShowGradeLevelDropdown(!showGradeLevelDropdown)}
            placeholder="Select Grade Level"
            disabled={loadingOptions}
          />
          
          <FilterDropdown
            title="Strand"
            options={strands}
            selected={selectedStrand}
            onSelect={() => setShowStrandDropdown(!showStrandDropdown)}
            placeholder="Select Strand"
            disabled={!selectedGradeLevel || loadingOptions}
          />
          
          <FilterDropdown
            title="Section"
            options={sections}
            selected={selectedSection}
            onSelect={() => setShowSectionDropdown(!showSectionDropdown)}
            placeholder="Select Section"
            disabled={!selectedStrand || loadingOptions}
          />
          
          <FilterDropdown
            title="Subject"
            options={subjects}
            selected={selectedSubject}
            onSelect={() => setShowSubjectDropdown(!showSubjectDropdown)}
            placeholder="Select Subject"
            disabled={!selectedSection || loadingOptions}
          />
        </View>

        {loadingStudentGrades ? (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ textAlign: 'center', color: '#666', fontFamily: 'Poppins-Regular' }}>Loading grades...</Text>
          </View>
        ) : studentGrades.length > 0 ? (
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
                <Text style={styles.headerSubject}>Student</Text>
                <Text style={styles.headerGrade}>{getQuarterLabels().q1}</Text>
                <Text style={styles.headerGrade}>{getQuarterLabels().q2}</Text>
                <Text style={styles.headerGrade}>Semestral</Text>
                <Text style={styles.headerRemarks}>Remarks</Text>
              </View>
            </View>

            {/* Grades Rows */}
            {studentGrades.map((grade, index) => renderGradeRow(grade, index))}

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Students:</Text>
                <Text style={styles.summaryValue}>{studentGrades.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Passed:</Text>
                <Text style={styles.summaryValue}>
                  {studentGrades.filter(g => normalizeRemarks(g.grades?.remarks) === 'passed').length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Conditional:</Text>
                <Text style={styles.summaryValue}>
                  {studentGrades.filter(g => normalizeRemarks(g.grades?.remarks) === 'conditional').length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Failed:</Text>
                <Text style={styles.summaryValue}>
                  {studentGrades.filter(g => normalizeRemarks(g.grades?.remarks) === 'failed').length}
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ textAlign: 'center', color: '#999', fontFamily: 'Poppins-Regular' }}>
              {selectedSubject ? 'No grades found for selected criteria.' : 'Select all parameters to view grades.'}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Generate Report', 'Report generation feature coming soon!')}
        >
          <Icon name="file-pdf-box" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Generate Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Export Data', 'Data export feature coming soon!')}
        >
          <Icon name="download" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Export Data</Text>
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
  blueHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#00418b',
  },
  whiteHeaderCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 40,
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  academicInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  performanceSection: {
    padding: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  distributionSection: {
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
  distributionContainer: {
    gap: 16,
  },
  distributionItem: {
    marginBottom: 16,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    fontFamily: 'Poppins-Regular',
  },
  subjectsSection: {
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
  subjectsContainer: {
    gap: 16,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  subjectStats: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  subjectMetrics: {
    alignItems: 'flex-end',
  },
  improvementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  improvementText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  viewDetailsButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterField: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minHeight: 48,
  },
  dropdownButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
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
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentID: {
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
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
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  },
});


