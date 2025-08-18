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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  <View style={styles.subjectItem}>
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
  </View>
);

const HorizontalSelector = ({ title, options, selected, onSelect, disabled }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 14, color: '#666', marginBottom: 8, fontFamily: 'Poppins-Regular' }}>{title}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            disabled={disabled}
            onPress={() => onSelect(opt)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: selected === opt ? '#00418b' : '#fff',
              borderWidth: 1,
              borderColor: selected === opt ? '#00418b' : '#ddd',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <Text style={{ color: selected === opt ? '#fff' : '#333', fontFamily: 'Poppins-SemiBold' }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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

  // Principal grade view states (mirroring web)
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

  const fetchGradesData = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd fetch from the grades API
      // const response = await axios.get(`${API_BASE_URL}/api/grades/institutional-overview`);
      
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

  // Fetch strands from sections (like web)
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
        const res = await fetch(`${API_BASE_URL}/api/sections?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const matchingStrands = [...new Set(
            (data || [])
              .filter(s => s.gradeLevel === selectedGradeLevel)
              .map(s => s.strandName)
              .filter(Boolean)
          )];
          setStrands(matchingStrands.length ? matchingStrands.sort() : ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL']);
        }
      } catch {}
      finally { setLoadingOptions(false); }
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
        const res = await fetch(`${API_BASE_URL}/api/sections?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const matchingSections = [...new Set(
            (data || [])
              .filter(s => s.gradeLevel === selectedGradeLevel && (s.strandName || '').toLowerCase().includes(selectedStrand.toLowerCase()))
              .map(s => s.sectionName)
              .filter(Boolean)
          )];
          setSections(matchingSections.length ? matchingSections.sort() : []);
        }
      } catch {}
      finally { setLoadingOptions(false); }
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
        const res = await fetch(`${API_BASE_URL}/api/subjects?schoolYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}&termName=${currentTerm.termName}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const subs = await res.json();
          const matching = (subs || []).filter(subject =>
            subject.gradeLevel === selectedGradeLevel &&
            (subject.strandName || '').toLowerCase().includes(selectedStrand.toLowerCase())
          );
          const uniqueSubjects = [...new Set(matching.map(s => s.subjectName).filter(Boolean))];
          setSubjects(uniqueSubjects.length ? uniqueSubjects.sort() : []);
        }
      } catch {}
      finally { setLoadingOptions(false); }
    })();
  }, [selectedSection, selectedStrand, selectedGradeLevel, academicYear, currentTerm]);

  // Fetch student grades when all selections are made (no restricted endpoints)
  useEffect(() => {
    (async () => {
      if (!selectedSubject || !selectedSection || !selectedStrand || !selectedGradeLevel || !academicYear || !currentTerm) {
        setStudentGrades([]);
        return;
      }
      try {
        setLoadingStudentGrades(true);
        const token = await AsyncStorage.getItem('jwtToken');

        // Prefer principal-view endpoint (used by web)
        const pvUrl = `${API_BASE_URL}/api/semestral-grades/principal-view?` +
          `gradeLevel=${encodeURIComponent(selectedGradeLevel)}&` +
          `strand=${encodeURIComponent(selectedStrand)}&` +
          `section=${encodeURIComponent(selectedSection)}&` +
          `subject=${encodeURIComponent(selectedSubject)}&` +
          `termName=${encodeURIComponent(currentTerm.termName)}&` +
          `academicYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
        let gradesPayload = [];
        let pvRes;
        try {
          pvRes = await fetch(pvUrl, { headers: { Authorization: `Bearer ${token}` } });
        } catch {}

        if (pvRes && pvRes.ok) {
          const pvData = await pvRes.json();
          gradesPayload = pvData.grades || [];
        } else {
          // Fallback: try class list (broader) then filter client-side
          const listUrl = `${API_BASE_URL}/api/semestral-grades/class/all?termName=${encodeURIComponent(currentTerm.termName)}&academicYear=${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
          const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
          if (listRes.ok) {
            const listData = await listRes.json();
            gradesPayload = listData.grades || [];
          } else {
            setStudentGrades([]);
            return;
          }
        }

        const filtered = (Array.isArray(gradesPayload) ? gradesPayload : []).filter(grade => {
          const subjectMatch = (grade.subjectName || '').toLowerCase().includes(selectedSubject.toLowerCase()) || (grade.subjectCode || '').toLowerCase().includes(selectedSubject.toLowerCase());
          const sectionMatch = !grade.section || grade.section === selectedSection;
          const strandMatch = !grade.strandName || (grade.strandName || '').toLowerCase().includes(selectedStrand.toLowerCase());
          const gradeLevelMatch = !grade.gradeLevel || grade.gradeLevel === selectedGradeLevel;
          const termMatch = !grade.termName || grade.termName === currentTerm.termName;
          const yearMatch = !grade.academicYear || grade.academicYear === `${academicYear.schoolYearStart}-${academicYear.schoolYearEnd}`;
          return subjectMatch && sectionMatch && strandMatch && gradeLevelMatch && termMatch && yearMatch;
        });

        const byStudent = new Map();
        filtered.forEach(grade => {
          const studentKey = grade.schoolID || grade.userID || grade.studentId || grade.studentID || grade._id;
          const studentName = grade.studentName || `${grade.firstname || ''} ${grade.lastname || ''}`.trim();
          const record = {
            studentName: studentName || 'N/A',
            schoolID: studentKey || 'N/A',
            grades: {
              quarter1: grade.quarter1 || grade.first_quarter || '-',
              quarter2: grade.quarter2 || grade.second_quarter || '-',
              quarter3: grade.quarter3 || grade.third_quarter || '-',
              quarter4: grade.quarter4 || grade.fourth_quarter || '-',
              semesterFinal: grade.semesterFinal || grade.final_grade || '-',
              remarks: grade.remarks || grade.remark || '-',
            },
          };
          byStudent.set(studentKey || `${grade.studentName}-${grade.subjectName}`, record);
        });

        setStudentGrades(Array.from(byStudent.values()));
      } catch (e) {
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academic Performance</Text>
        <Text style={styles.headerSubtitle}>Institutional overview and analytics</Text>
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
            <TouchableOpacity
              key={index}
              style={styles.subjectItem}
              onPress={() => handleSubjectPress(subject)}
            >
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.subject}</Text>
                <Text style={styles.subjectStats}>
                  {subject.totalStudents} students • Avg: {subject.averageGrade}%
                </Text>
              </View>
              <View style={styles.subjectMetrics}>
                <View style={styles.improvementContainer}>
                  <Icon
                    name={subject.improvement >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={subject.improvement >= 0 ? '#4CAF50' : '#F44336'}
                  />
                  <Text
                    style={[
                      styles.improvementText,
                      { color: subject.improvement >= 0 ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    {subject.improvement >= 0 ? '+' : ''}{subject.improvement}%
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewDetailsButton}>
                  <Text style={styles.viewDetailsText}>View</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Student Grades (Principal View) */}
      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Student Grades</Text>
        {/* Selectors */}
        <HorizontalSelector
          title="Grade Level"
          options={gradeLevels}
          selected={selectedGradeLevel}
          onSelect={(v) => { setSelectedGradeLevel(v); setSelectedStrand(''); setSelectedSection(''); setSelectedSubject(''); setStudentGrades([]); }}
          disabled={loadingOptions}
        />
        <HorizontalSelector
          title="Strand"
          options={strands}
          selected={selectedStrand}
          onSelect={(v) => { setSelectedStrand(v); setSelectedSection(''); setSelectedSubject(''); setStudentGrades([]); }}
          disabled={!selectedGradeLevel || loadingOptions}
        />
        <HorizontalSelector
          title="Section"
          options={sections}
          selected={selectedSection}
          onSelect={(v) => { setSelectedSection(v); setSelectedSubject(''); setStudentGrades([]); }}
          disabled={!selectedStrand || loadingOptions}
        />
        <HorizontalSelector
          title="Subject"
          options={subjects}
          selected={selectedSubject}
          onSelect={(v) => setSelectedSubject(v)}
          disabled={!selectedSection || loadingOptions}
        />

        {loadingStudentGrades ? (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ textAlign: 'center', color: '#666', fontFamily: 'Poppins-Regular' }}>Loading grades...</Text>
          </View>
        ) : studentGrades.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            {studentGrades.map((g, idx) => (
              <View key={`${g.schoolID}-${idx}`} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                <Text style={{ fontFamily: 'Poppins-SemiBold', color: '#333' }}>{g.studentName || 'N/A'}</Text>
                <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', marginBottom: 6 }}>ID: {g.schoolID || 'N/A'}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <Text style={{ color: '#333' }}>Q1: {g.grades?.quarter1 || '-'}</Text>
                  <Text style={{ color: '#333' }}>Q2: {g.grades?.quarter2 || '-'}</Text>
                  <Text style={{ color: '#333' }}>Q3: {g.grades?.quarter3 || '-'}</Text>
                  <Text style={{ color: '#333' }}>Q4: {g.grades?.quarter4 || '-'}</Text>
                  <Text style={{ color: '#00418b', fontFamily: 'Poppins-SemiBold' }}>Final: {g.grades?.semesterFinal || '-'}</Text>
                  <Text style={{ color: '#666' }}>Remarks: {g.grades?.remarks || '-'}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ textAlign: 'center', color: '#999', fontFamily: 'Poppins-Regular' }}>Select all parameters to view grades.</Text>
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
  header: {
    backgroundColor: '#00418b',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e3f2fd',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  performanceSection: {
    padding: 20,
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
});


