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

const API_BASE_URL = 'http://localhost:5000';

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

