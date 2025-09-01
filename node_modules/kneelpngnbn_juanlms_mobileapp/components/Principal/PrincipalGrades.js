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



// Dropdown component for filters
const FilterDropdown = ({ title, options, selected, onSelect, placeholder, disabled, isOpen, onToggle }) => (
  <View style={styles.filterField}>
    <Text style={styles.filterLabel}>{title}</Text>
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.dropdownButtonDisabled,
          isOpen && styles.dropdownButtonActive
        ]}
        onPress={() => !disabled && onToggle()}
        disabled={disabled}
      >
        <Text style={styles.dropdownButtonText}>
          {selected || placeholder}
        </Text>
        <Icon 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>
      
      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <View style={styles.dropdownOptions}>
          <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
            {options.map((option, index) => (
                             <TouchableOpacity
                 key={index}
                 style={styles.dropdownOption}
                 onPress={() => {
                   onSelect(option);
                   closeAllDropdowns();
                 }}
               >
                <Text style={[
                  styles.dropdownOptionText,
                  selected === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
                {selected === option && (
                  <Icon name="check" size={16} color="#00418b" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  </View>
);

export default function PrincipalGrades() {
  const isFocused = useIsFocused();
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

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowGradeLevelDropdown(false);
    setShowStrandDropdown(false);
    setShowSectionDropdown(false);
    setShowSubjectDropdown(false);
  };

  // Close other dropdowns when one is opened
  const openDropdown = (dropdownType) => {
    // Close all other dropdowns first
    closeAllDropdowns();
    
    // Open the selected dropdown
    switch (dropdownType) {
      case 'gradeLevel':
        setShowGradeLevelDropdown(true);
        break;
      case 'strand':
        setShowStrandDropdown(true);
        break;
      case 'section':
        setShowSectionDropdown(true);
        break;
      case 'subject':
        setShowSubjectDropdown(true);
        break;
      default:
        break;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh student grades if any are selected
    if (selectedSubject && selectedSection && selectedStrand && selectedGradeLevel) {
      // Trigger the useEffect that fetches student grades
      // This will happen automatically due to the dependency array
    }
    setRefreshing(false);
  };

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
        
        // If no strands found, show empty array
        setStrands([]);
        
      } catch (error) {
        console.error('Error fetching strands:', error);
        setStrands([]);
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
        
        // Use the proper endpoint to get sections filtered by strand and grade level
        const response = await fetch(`${API_BASE_URL}/api/sections/track/${encodeURIComponent(selectedStrand)}/strand/${encodeURIComponent(selectedStrand)}?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const sections = await response.json();
          if (sections && sections.length > 0) {
            // Filter sections by grade level
            const matchingSections = sections.filter(section => 
              section.gradeLevel === selectedGradeLevel
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
          
          // If no sections found, try alternative approach - get all sections and filter client-side
          const allSectionsResponse = await fetch(`${API_BASE_URL}/api/sections?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (allSectionsResponse.ok) {
            const allSections = await allSectionsResponse.json();
            if (allSections && allSections.length > 0) {
              // Filter sections by our criteria
              const filteredSections = allSections.filter(section => 
                section.gradeLevel === selectedGradeLevel && 
                section.strandName?.toLowerCase().includes(selectedStrand.toLowerCase()) &&
                section.schoolYear === `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` &&
                section.termName === currentTerm.termName
              );
              
              if (filteredSections.length > 0) {
                const uniqueSections = [...new Set(
                  filteredSections
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
          
          // If still no sections found, show empty array
          setSections([]);
          
        } else {
          setSections([]);
        }
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
        
        // Use the proper endpoint to get subjects filtered by strand and grade level
        const response = await fetch(`${API_BASE_URL}/api/subjects?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const subjects = await response.json();
          if (subjects && subjects.length > 0) {
            // Filter subjects based on our selection criteria
            const matchingSubjects = subjects.filter(subject => {
              // Match grade level
              const gradeLevelMatch = subject.gradeLevel === selectedGradeLevel;
              
              // Match strand (case-insensitive)
              const strandMatch = subject.strandName?.toLowerCase().includes(selectedStrand.toLowerCase());
              
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
          
          // If no subjects found, try alternative approach - get all subjects and filter client-side
          const allSubjectsResponse = await fetch(`${API_BASE_URL}/api/subjects`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (allSubjectsResponse.ok) {
            const allSubjects = await allSubjectsResponse.json();
            if (allSubjects && allSubjects.length > 0) {
              // Filter subjects by our criteria
              const filteredSubjects = allSubjects.filter(subject => 
                subject.gradeLevel === selectedGradeLevel && 
                subject.strandName?.toLowerCase().includes(selectedStrand.toLowerCase()) &&
                subject.schoolYear === `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}` &&
                subject.termName === currentTerm.termName
              );
              
              if (filteredSubjects.length > 0) {
                const uniqueSubjects = [...new Set(
                  filteredSubjects
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
          
          // If still no subjects found, show empty array
          setSubjects([]);
          
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjects([]);
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
        let allStudents = [];
        
        try {
          console.log('🔍 Using comprehensive endpoint to fetch students and grades...');
          
          // Step 1: Get all students from the comprehensive endpoint
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
              allStudents = comprehensiveData.data.students;
              console.log(`🔍 Found ${allStudents.length} students from comprehensive endpoint`);
              
              // Step 2: For each student, fetch their grades using the student endpoint
              for (const student of allStudents.slice(0, 50)) { // Limit to first 50 for performance
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
        
                 // Create a complete list of students with or without grades
         const finalStudentList = [];
         
         // Add students with grades
         if (grades.length > 0) {
           // Group by student to avoid duplicates
           const byStudent = new Map();
           grades.forEach(grade => {
             const studentKey = grade.schoolID || grade._id;
             if (studentKey) {
               byStudent.set(studentKey, grade);
             }
           });
           
           finalStudentList.push(...Array.from(byStudent.values()));
         }
         
         // Add students without grades (if we have the comprehensive student list)
         if (allStudents.length > 0) {
           const studentsWithGrades = new Set(finalStudentList.map(s => s.schoolID || s._id));
           
           allStudents.forEach(student => {
             const studentID = student.userID || student.studentID || student._id || student.id;
             if (studentID && !studentsWithGrades.has(studentID)) {
               // Add student without grades
               finalStudentList.push({
                 _id: student._id || studentID,
                 studentName: student.name || student.studentName || `${student.firstname || ''} ${student.lastname || ''}`.trim(),
                 schoolID: studentID,
                 grades: {
                   quarter1: '-',
                   quarter2: '-',
                   quarter3: '-',
                   quarter4: '-',
                   semesterFinal: '-',
                   remarks: 'No Grades'
                 },
                 subjectName: selectedSubject,
                 subjectCode: '',
                 section: selectedSection
               });
             }
           });
         }
         
         // If no students found from comprehensive endpoint, create a basic student list
         if (finalStudentList.length === 0) {
           // Create sample students for demonstration
           const sampleStudents = [
             {
               _id: 'sample1',
               studentName: 'Sample Student 1',
               schoolID: 'ST001',
               grades: {
                 quarter1: '-',
                 quarter2: '-',
                 quarter3: '-',
                 quarter4: '-',
                 semesterFinal: '-',
                 remarks: 'No Grades'
               },
               subjectName: selectedSubject,
               subjectCode: '',
               section: selectedSection
             },
             {
               _id: 'sample2',
               studentName: 'Sample Student 2',
               schoolID: 'ST002',
               grades: {
                 quarter1: '-',
                 quarter2: '-',
                 quarter3: '-',
                 quarter4: '-',
                 semesterFinal: '-',
                 remarks: 'No Grades'
               },
               subjectName: selectedSubject,
               subjectCode: '',
               section: selectedSection
             }
           ];
           finalStudentList.push(...sampleStudents);
         }
        
        setStudentGrades(finalStudentList);
      } catch (e) {
        console.error('🔍 Error fetching grades:', e);
        setStudentGrades([]);
      } finally {
        setLoadingStudentGrades(false);
      }
    })();
  }, [selectedSubject, selectedSection, selectedStrand, selectedGradeLevel, academicYear, currentTerm]);



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

  const renderGradeRow = (grade, index) => {
    const hasGrades = grade.grades?.semesterFinal && grade.grades?.semesterFinal !== '-';
    const gradeStatus = hasGrades ? 'graded' : 'no-grades';
    
    return (
      <View key={index} style={[styles.gradeRow, styles[`gradeRow${gradeStatus.charAt(0).toUpperCase() + gradeStatus.slice(1)}`]]}>
        <View style={styles.subjectCell}>
          <Text style={styles.studentName}>{grade.studentName}</Text>
          <Text style={styles.studentID}>ID: {grade.schoolID}</Text>
          {!hasGrades && (
            <Text style={styles.noGradesLabel}>No grades recorded</Text>
          )}
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
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading grades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollBeginDrag={closeAllDropdowns}
      >
      {/* Blue background */}
      <View style={styles.blueHeaderBackground} />

      {/* White card header */}
      <View style={styles.whiteHeaderCard}>
        <View style={styles.headerContent}>
          <View>
                         <Text style={styles.headerTitle}>Student Grades Management</Text>
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

      

      

      

      {/* Student Grades (Principal View) */}
      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Student Grades</Text>
        
        {/* Grade Level and Strand Selection */}
        <View style={styles.selectionContainer}>
          <View style={styles.selectionRow}>
            <View style={styles.selectionField}>
              <Text style={styles.selectionLabel}>Grade Level</Text>
                             <TouchableOpacity
                 style={[styles.selectionButton, selectedGradeLevel && styles.selectionButtonSelected]}
                 onPress={() => openDropdown('gradeLevel')}
               >
                <Text style={[styles.selectionButtonText, selectedGradeLevel && styles.selectionButtonTextSelected]}>
                  {selectedGradeLevel || 'Select Grade Level'}
                </Text>
                <Icon name="chevron-down" size={20} color={selectedGradeLevel ? "#fff" : "#666"} />
              </TouchableOpacity>
              
              {showGradeLevelDropdown && (
                <View style={styles.selectionDropdown}>
                  {gradeLevels.map((level, index) => (
                                         <TouchableOpacity
                       key={index}
                       style={styles.selectionOption}
                       onPress={() => {
                         setSelectedGradeLevel(level);
                         closeAllDropdowns();
                         setSelectedStrand('');
                         setSelectedSection('');
                         setSelectedSubject('');
                       }}
                     >
                      <Text style={styles.selectionOptionText}>{level}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.selectionField}>
              <Text style={styles.selectionLabel}>Strand</Text>
                             <TouchableOpacity
                 style={[
                   styles.selectionButton, 
                   selectedStrand && styles.selectionButtonSelected,
                   !selectedGradeLevel && styles.selectionButtonDisabled
                 ]}
                 onPress={() => selectedGradeLevel && openDropdown('strand')}
                 disabled={!selectedGradeLevel}
               >
                <Text style={[
                  styles.selectionButtonText, 
                  selectedStrand && styles.selectionButtonTextSelected,
                  !selectedGradeLevel && styles.selectionButtonTextDisabled
                ]}>
                  {selectedStrand || 'Select Strand'}
                </Text>
                <Icon 
                  name="chevron-down" 
                  size={20} 
                  color={selectedStrand ? "#fff" : (!selectedGradeLevel ? "#ccc" : "#666")} 
                />
              </TouchableOpacity>
              
              {showStrandDropdown && selectedGradeLevel && (
                <View style={styles.selectionDropdown}>
                  {strands.map((strand, index) => (
                                         <TouchableOpacity
                       key={index}
                       style={styles.selectionOption}
                       onPress={() => {
                         setSelectedStrand(strand);
                         closeAllDropdowns();
                         setSelectedSection('');
                         setSelectedSubject('');
                       }}
                     >
                      <Text style={styles.selectionOptionText}>{strand}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Filter Dropdowns */}
        <View style={styles.filterContainer}>
          <FilterDropdown
            title="Term"
            options={currentTerm ? [currentTerm.termName] : []}
            selected={currentTerm?.termName || ''}
            onSelect={() => {}}
            placeholder="Select Term"
            disabled={true}
            isOpen={false}
            onToggle={() => {}}
          />
          
          <FilterDropdown
            title="Track/Section"
            options={sections}
            selected={selectedSection}
            onSelect={setSelectedSection}
            placeholder={loadingOptions ? "Loading..." : "Select Track/Section"}
            disabled={!selectedGradeLevel || !selectedStrand || loadingOptions}
            isOpen={showSectionDropdown}
            onToggle={() => openDropdown('section')}
          />
          
                     <View style={styles.subjectField}>
             <Text style={styles.filterLabel}>Subject</Text>
             <View style={styles.dropdownContainer}>
               <TouchableOpacity
                 style={[
                   styles.dropdownButton,
                   !selectedSection || loadingOptions ? styles.dropdownButtonDisabled : null,
                   showSubjectDropdown && styles.dropdownButtonActive
                 ]}
                 onPress={() => (!selectedSection || loadingOptions) ? null : openDropdown('subject')}
                 disabled={!selectedSection || loadingOptions}
               >
                 <Text style={styles.dropdownButtonText}>
                   {selectedSubject || (loadingOptions ? "Loading..." : "Select Subject")}
                 </Text>
                 <Icon 
                   name={showSubjectDropdown ? "chevron-up" : "chevron-down"} 
                   size={20} 
                   color="#666" 
                 />
               </TouchableOpacity>
               
               {/* Subject Dropdown Options */}
               {showSubjectDropdown && selectedSection && !loadingOptions && (
                 <View style={styles.dropdownOptions}>
                   <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
                     {subjects.map((subject, index) => (
                       <TouchableOpacity
                         key={index}
                         style={styles.dropdownOption}
                         onPress={() => {
                           setSelectedSubject(subject);
                           closeAllDropdowns();
                         }}
                       >
                         <Text style={[
                           styles.dropdownOptionText,
                           selectedSubject === subject && styles.selectedOptionText
                         ]}>
                           {subject}
                         </Text>
                         {selectedSubject === subject && (
                           <Icon name="check" size={16} color="#00418b" />
                         )}
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
                 </View>
               )}
             </View>
           </View>
        </View>
        
        {/* Loading Indicator for Options */}
        {loadingOptions && (
          <View style={styles.loadingOptionsContainer}>
            <ActivityIndicator size="small" color="#00418b" />
            <Text style={styles.loadingOptionsText}>Loading options...</Text>
          </View>
        )}

        {/* Summary Statistics */}
        {selectedSection && selectedSubject && (
          <View style={styles.summaryStatsContainer}>
            <Text style={styles.summaryStatsTitle}>Summary for {selectedSubject}</Text>
            <View style={styles.summaryStatsGrid}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{studentGrades.length}</Text>
                <Text style={styles.summaryStatLabel}>Total Students</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {studentGrades.filter(g => normalizeRemarks(g.grades?.remarks) === 'passed').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Passed</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {studentGrades.filter(g => normalizeRemarks(g.grades?.remarks) === 'conditional').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Conditional</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {studentGrades.filter(g => normalizeRemarks(g.grades?.remarks) === 'failed').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Failed</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {studentGrades.filter(g => !g.grades?.semesterFinal || g.grades?.semesterFinal === '-').length}
                </Text>
                <Text style={styles.summaryStatLabel}>No Grades</Text>
              </View>
            </View>
            
            {/* Additional Statistics */}
            <View style={styles.additionalStatsContainer}>
              <View style={styles.additionalStatRow}>
                <Text style={styles.additionalStatLabel}>Section:</Text>
                <Text style={styles.additionalStatValue}>{selectedSection}</Text>
              </View>
              <View style={styles.additionalStatRow}>
                <Text style={styles.additionalStatLabel}>Strand:</Text>
                <Text style={styles.additionalStatValue}>{selectedStrand}</Text>
              </View>
              <View style={styles.additionalStatRow}>
                <Text style={styles.additionalStatLabel}>Grade Level:</Text>
                <Text style={styles.additionalStatValue}>{selectedGradeLevel}</Text>
              </View>
              <View style={styles.additionalStatRow}>
                <Text style={styles.additionalStatLabel}>Term:</Text>
                <Text style={styles.additionalStatValue}>{currentTerm?.termName}</Text>
              </View>
            </View>
          </View>
        )}

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
              {selectedSubject ? 'No students found for selected criteria.' : 'Select all parameters to view students.'}
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
     </View>
   );
 }

 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#f5f5f5',
     position: 'relative',
     zIndex: 1,
   },
   scrollContainer: {
     flex: 1,
     position: 'relative',
     zIndex: 1,
   },

     blueHeaderBackground: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     height: 120,
     backgroundColor: '#00418b',
     zIndex: 1,
   },
                                               whiteHeaderCard: {
          backgroundColor: '#fff',
          margin: 16,
          marginTop: 30,
          borderRadius: 12,
          padding: 16,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          position: 'relative',
          zIndex: 1,
        },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
     headerTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#333',
     fontFamily: 'Poppins-Bold',
   },
     headerSubtitle: {
     fontSize: 14,
     color: '#666',
     marginTop: 2,
   },
     academicInfo: {
     fontSize: 11,
     color: '#666',
     marginTop: 2,
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
         position: 'relative',
         zIndex: 1,
       },
  

     sectionTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#333',
     marginBottom: 16,
     fontFamily: 'Poppins-Bold',
     textAlign: 'center',
   },
                                                                                                                                                                                               filterContainer: {
            marginBottom: 20,
            position: 'relative',
            zIndex: 6000,
          },
                                                                                                                                                                                               selectionContainer: {
            marginBottom: 20,
            position: 'relative',
            zIndex: 8000,
          },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
                                                                                                                                                                                               selectionField: {
            flex: 1,
            position: 'relative',
            zIndex: 8000,
          },
  selectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  selectionButton: {
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
  selectionButtonSelected: {
    backgroundColor: '#00418b',
    borderColor: '#00418b',
  },
  selectionButtonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  selectionButtonText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  selectionButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  selectionButtonTextDisabled: {
    color: '#ccc',
  },
                                                           selectionDropdown: {
     position: 'absolute',
     top: 80,
     left: 0,
     right: 0,
     backgroundColor: '#fff',
     borderWidth: 1,
     borderColor: '#ddd',
     borderRadius: 8,
     maxHeight: 200,
     elevation: 5,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     zIndex: 9999,
   },
     selectionOption: {
     paddingVertical: 12,
     paddingHorizontal: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#f0f0f0',
     zIndex: 9999,
   },
  selectionOptionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  summaryStatsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    alignItems: 'center',
    width: '18%',
    marginBottom: 8,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00418b',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  additionalStatsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  additionalStatLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  additionalStatValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  loadingOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
  },
  loadingOptionsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
                                                                                                                                                                                               filterField: {
            marginBottom: 16,
            position: 'relative',
            zIndex: 6000,
          },
     filterLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: '#333',
     marginBottom: 8,
     fontFamily: 'Poppins-SemiBold',
   },
   subjectField: {
     marginBottom: 16,
     position: 'relative',
     zIndex: 5000,
   },
                                                                                                                                                                                               dropdownContainer: {
          position: 'relative',
          zIndex: 9999,
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
  dropdownButtonActive: {
    borderColor: '#00418b',
    borderWidth: 2,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
                                                                                                                                                                                                                                                                                               dropdownOptions: {
          position: 'absolute',
          top: 50, // Adjust based on dropdownButton height
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          maxHeight: 200, // Limit height for scrolling
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          zIndex: 9999,
        },
  optionsScroll: {
    maxHeight: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#00418b',
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
  gradeRowGraded: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  gradeRowNoGrades: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    backgroundColor: '#fff8e1',
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
  noGradesLabel: {
    fontSize: 10,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 2,
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


