import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

// Helper function to format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Activity Card Component
function ActivityCard({ activity, onActivityPress }) {
  const navigation = useNavigation();
  const getActivityIcon = (type) => {
    switch (type) {
      case 'quiz':
        return { name: 'quiz', color: '#9C27B0' };
      case 'assignment':
        return { name: 'assignment', color: '#FF9800' };
      default:
        return { name: 'school', color: '#4CAF50' };
    }
  };

  const icon = getActivityIcon(activity.type);

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityIconContainer}>
          <MaterialIcons 
            name={icon.name} 
            size={24} 
            color={icon.color} 
          />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityClass}>{activity.className || 'Unknown Class'}</Text>
          {activity.description && (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {activity.description}
            </Text>
          )}
          <Text style={styles.activityDueDate}>
            Due: {formatDateTime(activity.dueDate)}
          </Text>
          <Text style={styles.activityType}>
            Type: {activity.type ? activity.type.charAt(0).toUpperCase() + activity.type.slice(1) : 'Activity'}
          </Text>
        </View>
        <View style={styles.activityPoints}>
          <Text style={styles.pointsText}>
            {activity.type === 'quiz' 
              ? (activity.totalPoints || activity.points || 0) 
              : (activity.points !== undefined && activity.points !== null ? activity.points : 0)
            } pts
          </Text>
        </View>
      </View>
      
      <View style={styles.activityFooter}>
        <View style={styles.activityStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={16} color="#666" />
            <Text style={styles.statText}>
              {activity.isSubmitted ? 'Completed' : 'Pending'}
            </Text>
          </View>
          {activity.isSubmitted && activity.score !== undefined && (
            <View style={styles.statItem}>
              <MaterialIcons name="grade" size={16} color="#4CAF50" />
              <Text style={styles.statText}>
                Score: {activity.score}/{activity.type === 'quiz' ? (activity.totalPoints || activity.points || 100) : (activity.points || 100)}
              </Text>
            </View>
          )}
          {activity.isSubmitted && activity.type === 'quiz' && activity.percentage !== undefined && (
            <View style={styles.statItem}>
              <MaterialIcons name="percent" size={16} color="#FF9800" />
              <Text style={styles.statText}>
                {activity.percentage}%
              </Text>
            </View>
          )}
          {activity.isSubmitted && activity.type === 'quiz' && activity.timeSpent !== undefined && (
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={16} color="#2196F3" />
              <Text style={styles.statText}>
                {Math.floor(activity.timeSpent / 60)}m {activity.timeSpent % 60}s
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtonsRow}>
          {activity.type === 'quiz' && activity.isSubmitted && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.resultsButton]}
              onPress={() => navigation.navigate('QuizView', { quizId: activity._id, review: true })}
            >
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.resultsButtonText}>View Results</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => onActivityPress(activity)}
          >
            <MaterialIcons name="visibility" size={16} color="#2196F3" />
            <Text style={styles.viewButtonText}>
              {activity.isSubmitted ? 'View Details' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Main StudentActs Component
export default function StudentActs() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && user._id) {
      fetchActivities();
    }
  }, [user]);

  // Add focus listener to refresh activities when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchActivities();
    });
    return unsubscribe;
  }, [navigation]);
  
  // Debug activities state changes
  useEffect(() => {
    console.log('DEBUG: Activities state changed:', {
      total: activities.length,
      upcoming: activities.filter(a => !a.isSubmitted && (!a.dueDate || new Date(a.dueDate) > new Date())).length,
      pastDue: activities.filter(a => !a.isSubmitted && a.dueDate && new Date(a.dueDate) < new Date()).length,
      completed: activities.filter(a => a.isSubmitted).length
    });
  }, [activities]);

  // Add submission status checking for each activity
  const checkSubmissionStatuses = async (activitiesList) => {
    try {
      console.log('DEBUG: checkSubmissionStatuses called with', activitiesList.length, 'activities');
      const token = await AsyncStorage.getItem('jwtToken');
      const updatedActivities = await Promise.all(
        activitiesList.map(async (activity) => {
          if (activity.type === 'assignment') {
            try {
              const response = await fetch(`${API_BASE}/assignments/${activity._id}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const submissions = await response.json();
                console.log(`DEBUG: Submissions for assignment ${activity._id}:`, submissions);
                const studentSubmission = submissions.find(sub => {
                  // Backend populates student with User object, so check both cases
                  let submissionStudentId;
                  if (sub.student && typeof sub.student === 'object' && sub.student._id) {
                    // student is populated User object
                    submissionStudentId = sub.student._id;
                  } else {
                    // student is direct ID
                    submissionStudentId = sub.student;
                  }
                  
                  const userId = user.userID || user._id; // Use school ID if available, fallback to MongoDB ID
                  const matches = submissionStudentId === userId || submissionStudentId === userId.toString();
                  
                  console.log(`DEBUG: Checking submission ${sub._id}: student=${sub.student}, submissionStudentId=${submissionStudentId}, userId=${userId}, matches=${matches}`);
                  
                  return matches;
                });
                
                if (studentSubmission) {
                  return { 
                    ...activity, 
                    submittedAt: studentSubmission.submittedAt || new Date(), 
                    status: 'submitted',
                    submissionId: studentSubmission._id,
                    isSubmitted: true,
                    score: studentSubmission.grade || 0
                  };
                } else {
                  // No submission found, mark as not submitted
                  return {
                    ...activity,
                    isSubmitted: false,
                    status: 'not_submitted',
                    score: 0
                  };
                }
              }
            } catch (error) {
              console.error('Error checking submission status:', error);
            }
                    } else if (activity.type === 'quiz') {
            try {
              console.log('DEBUG: Checking quiz submission for:', activity._id, 'user:', user._id, 'activity points:', activity.points);
              // Use the same approach as web app: fetch all responses and filter
              const response = await fetch(`${API_BASE}/api/quizzes/${activity._id}/responses`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const responseData = await response.json();
                console.log('Quiz responses for', activity._id, ':', responseData);
                console.log('DEBUG: Raw quiz response data structure:', responseData.map(r => ({
                  _id: r._id,
                  quizId: r.quizId,
                  studentId: r.studentId,
                  score: r.score,
                  total: r.total
                })));
                
                if (Array.isArray(responseData)) {
                  // Find responses by this student (using correct field names from QuizResponse model)
                  const studentResponse = responseData.find(resp => {
                    // QuizResponse model uses quizId and studentId fields
                    // Backend populates studentId with User object, so check both cases
                    const matchesQuiz = resp.quizId === activity._id || resp.quizId === activity._id.toString();
                    
                    // Check if studentId is populated (User object) or direct ID
                    let matchesStudent = false;
                    const userId = user.userID || user._id; // Use school ID if available, fallback to MongoDB ID
                    if (resp.studentId && typeof resp.studentId === 'object' && resp.studentId._id) {
                      // studentId is populated User object
                      matchesStudent = resp.studentId._id === userId || resp.studentId._id === userId.toString();
                    } else {
                      // studentId is direct ID
                      matchesStudent = resp.studentId === userId || resp.studentId === userId.toString();
                    }
                    
                    console.log(`DEBUG: Checking response ${resp._id}: quizId=${resp.quizId}, studentId=${resp.studentId}, activity._id=${activity._id}, user.userID=${user.userID}, user._id=${user._id}, matchesQuiz=${matchesQuiz}, matchesStudent=${matchesStudent}`);
                    
                    return matchesQuiz && matchesStudent;
                  });
                  
                  if (studentResponse) {
                    console.log('Found student response for quiz:', activity._id, studentResponse);
                    
                    // Calculate percentage if not provided
                    let percentage = studentResponse.percentage;
                    if (percentage === undefined && studentResponse.score !== undefined && studentResponse.total !== undefined) {
                      percentage = Math.round((studentResponse.score / studentResponse.total) * 100);
                    }
                    
                    // Update the activity with submission info
                    activity.submittedAt = studentResponse.submittedAt || new Date();
                    activity.status = 'submitted';
                    activity.isSubmitted = true;
                    activity.score = studentResponse.score || 0;
                    activity.totalPoints = studentResponse.total || activity.points || 10;
                    activity.percentage = percentage || 0;
                    
                    console.log('Updated quiz activity:', activity._id, 'score:', activity.score, 'totalPoints:', activity.totalPoints, 'percentage:', activity.percentage);
                  } else {
                    console.log('No student response found for quiz:', activity._id);
                    activity.isSubmitted = false;
                    activity.status = 'not_submitted';
                    activity.score = 0;
                    activity.totalPoints = activity.points || 10;
                    activity.percentage = 0;
                  }
                } else {
                  console.log('Quiz response data is not an array for:', activity._id);
                  activity.isSubmitted = false;
                  activity.status = 'not_submitted';
                  activity.score = 0;
                  activity.totalPoints = activity.points || 10;
                  activity.percentage = 0;
                }
              } else {
                console.log('Quiz response not OK for:', activity._id, 'status:', response.status);
                activity.isSubmitted = false;
                activity.status = 'error';
                activity.score = 0;
                activity.totalPoints = activity.points || 10;
                activity.percentage = 0;
              }
            } catch (error) {
              console.log('Error checking quiz submission for', activity._id, ':', error);
              activity.isSubmitted = false;
              activity.status = 'error';
              activity.score = 0;
              activity.totalPoints = activity.points || 10;
              activity.percentage = 0;
            }
          }
          
          // Return the activity with its current state
          return activity;
        })
      );
      
      console.log('DEBUG: checkSubmissionStatuses returning', updatedActivities.length, 'activities');
      console.log('DEBUG: Sample activities with status:', updatedActivities.slice(0, 3).map(a => ({
        title: a.title,
        type: a.type,
        isSubmitted: a.isSubmitted,
        status: a.status
      })));
      return updatedActivities;
    } catch (error) {
      console.error('Error checking submission statuses:', error);
      return activitiesList;
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await AsyncStorage.getItem('jwtToken');
      
      if (!user || !user._id) {
        console.warn('User not ready, skipping activities fetch');
        setLoading(false);
        return;
      }

      console.log('DEBUG: Fetching activities for student:', user._id);
      console.log('DEBUG: User object:', { userID: user.userID, _id: user._id, firstname: user.firstname, lastname: user.lastname });

      // Get classes where this student is enrolled using the my-classes endpoint
      const classesResponse = await fetch(`${API_BASE}/api/classes/my-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!classesResponse.ok) {
        throw new Error('Failed to fetch classes');
      }

      const classesData = await classesResponse.json();
      
      // The my-classes endpoint already filters classes based on user role and membership
      const studentClasses = Array.isArray(classesData) ? classesData : [];

      console.log('DEBUG: Student classes found:', studentClasses.length);

      if (studentClasses.length === 0) {
        console.log('DEBUG: No classes found for student, trying alternative approach...');
        
        // Fallback approach - fetch all activities directly
        const allAssignmentsResponse = await fetch(`${API_BASE}/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const allQuizzesResponse = await fetch(`${API_BASE}/api/quizzes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let allActivities = [];
        
        if (allAssignmentsResponse.ok) {
          const assignments = await allAssignmentsResponse.json();
          // Filter assignments assigned to this student
          const studentAssignments = assignments.filter(assignment => {
            const entry = assignment.assignedTo?.find?.(e => e.classID);
            return entry && Array.isArray(entry.studentIDs) && entry.studentIDs.includes(user.userID);
          });
          allActivities.push(...studentAssignments.map(item => ({ ...item, type: 'assignment' })));
        }
        
        if (allQuizzesResponse.ok) {
          const quizzes = await allQuizzesResponse.json();
          // Filter quizzes assigned to this student
          const studentQuizzes = quizzes.filter(quiz => {
            const entry = quiz.assignedTo?.find?.(e => e.classID);
            return entry && Array.isArray(entry.studentIDs) && entry.studentIDs.includes(user.userID);
          });
          allActivities.push(...studentQuizzes.map(item => ({ ...item, type: 'quiz' })));
        }
        
        // Filter for posted activities only
        const now = new Date();
        const postedActivities = allActivities.filter(item => {
          if (item.type === 'assignment') {
            const scheduleEnabled = item?.schedulePost === true;
            const postAt = item?.postAt ? new Date(item.postAt) : null;
            if (scheduleEnabled && postAt) return postAt <= now;
            return true;
          } else if (item.type === 'quiz') {
            const openEnabled = item?.timing?.openEnabled;
            const openDate = item?.timing?.open ? new Date(item.timing.open) : null;
            if (openEnabled && openDate) return openDate <= now;
            return true;
          }
          return false;
        });
        
        // Add basic class info for fallback activities
        const postedActivitiesWithClassInfo = postedActivities.map(item => ({
          ...item,
          className: item.className || 'Unknown Class',
          classCode: item.classCode || 'N/A',
          classID: item.classID || (item.assignedTo && item.assignedTo[0]?.classID)
        }));
        
        const activitiesWithStatus = await checkSubmissionStatuses(postedActivitiesWithClassInfo);
        activitiesWithStatus.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
        console.log('DEBUG: Setting activities state (fallback):', activitiesWithStatus.length);
        setActivities(activitiesWithStatus);
        if (activitiesWithStatus.length === 0) {
          console.warn('DEBUG: Fallback produced 0 activities. Check if endpoints return data and item types include className/dates.');
        }
        setLoading(false);
        return;
      }

      // Get all class IDs for this student
      const studentClassIDs = studentClasses.map(cls => cls.classID);

      // Fetch both assignments and quizzes per class
      const perClassPromises = studentClassIDs.map((cid) => [
        fetch(`${API_BASE}/assignments?classID=${encodeURIComponent(cid)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => (res.ok ? res.json() : []))
          .then(assignments => {
            console.log('DEBUG: Assignments fetched for class', cid, ':', assignments);
            // Filter assignments assigned to this student (same logic as web app)
            const studentAssignments = assignments.filter(assignment => {
              const entry = assignment.assignedTo?.find?.(e => e.classID === cid);
              return entry && Array.isArray(entry.studentIDs) && entry.studentIDs.includes(user.userID);
            });
            console.log('DEBUG: Student assignments for class', cid, ':', studentAssignments.length);
            return studentAssignments.map(item => ({ ...item, type: 'assignment' }));
          })
          .catch(() => []),
        fetch(`${API_BASE}/api/quizzes?classID=${encodeURIComponent(cid)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => (res.ok ? res.json() : []))
          .then(quizzes => {
            console.log('DEBUG: Quizzes fetched for class', cid, ':', quizzes);
            // Filter quizzes assigned to this student (same logic as web app)
            const studentQuizzes = quizzes.filter(quiz => {
              const entry = quiz.assignedTo?.find?.(e => e.classID === cid);
              return entry && Array.isArray(entry.studentIDs) && entry.studentIDs.includes(user.userID);
            });
            console.log('DEBUG: Student quizzes for class', cid, ':', studentQuizzes.length);
            return studentQuizzes.map(item => {
              console.log('DEBUG: Individual quiz item:', item._id, 'title:', item.title, 'points:', item.points, 'questions:', item.questions?.length);
              return { ...item, type: 'quiz' };
            });
          })
          .catch(() => [])
      ]);

      const flattenedPromises = perClassPromises.flat();
      const perClassResults = await Promise.all(flattenedPromises);
      let merged = [];
      perClassResults.forEach((list, index) => {
        if (Array.isArray(list)) {
          merged.push(...list);
        }
      });
      
      console.log('DEBUG: Merged activities before filtering:', merged);

      // Filter for ONLY POSTED activities
      const now = new Date();
      const postedActivities = merged.filter(item => {
        if (item.type === 'assignment') {
          const scheduleEnabled = item?.schedulePost === true;
          const postAt = item?.postAt ? new Date(item.postAt) : null;
          if (scheduleEnabled && postAt) {
            const isPosted = postAt <= now;
            console.log('DEBUG: Assignment', item._id, 'schedulePost:', scheduleEnabled, 'postAt:', postAt, 'isPosted:', isPosted);
            return isPosted;
          }
          console.log('DEBUG: Assignment', item._id, 'no schedule, considered posted');
          return true;
        } else if (item.type === 'quiz') {
          const openEnabled = item?.timing?.openEnabled;
          const openDate = item?.timing?.open ? new Date(item.timing.open) : null;
          if (openEnabled && openDate) {
            const isPosted = openDate <= now;
            console.log('DEBUG: Quiz', item._id, 'openEnabled:', openEnabled, 'openDate:', openDate, 'isPosted:', isPosted);
            return isPosted;
          }
          console.log('DEBUG: Quiz', item._id, 'no timing, considered posted');
          return true;
        }
        console.log('DEBUG: Unknown type item', item._id, 'type:', item.type);
        return false;
      });
      
      console.log('DEBUG: Posted activities after filtering:', postedActivities);

      // Normalize and enrich with class info for display
      const normalized = postedActivities.map(item => {
        console.log('DEBUG: Normalizing item:', item._id, 'type:', item.type, 'points:', item.points, 'questions:', item.questions?.length, 'timing:', item.timing);
        
        // Find the class info for this activity
        let classInfo = null;
        if (item.classID) {
          classInfo = studentClasses.find(cls => cls.classID === item.classID);
        } else if (item.assignedTo && item.assignedTo[0]?.classID) {
          classInfo = studentClasses.find(cls => cls.classID === item.assignedTo[0].classID);
        }
        
        const normalizedItem = {
          ...item,
          type: item.type || (item.questions ? 'quiz' : 'assignment'),
          className: classInfo?.className || item.classInfo?.className || item.className || 'Unknown Class',
          classCode: classInfo?.classCode || item.classInfo?.classCode || item.classCode || 'N/A',
          classID: item.classID || item.classInfo?.classID || (item.assignedTo && item.assignedTo[0]?.classID),
          points: item.points !== undefined ? item.points : (item.type === 'quiz' ? 100 : 0)
        };
        console.log('DEBUG: Normalized item:', normalizedItem._id, 'final type:', normalizedItem.type, 'final points:', normalizedItem.points, 'className:', normalizedItem.className);
        return normalizedItem;
      });

      // Deduplicate by _id
      const dedup = new Map();
      normalized.forEach(it => {
        if (it && it._id && !dedup.has(it._id)) dedup.set(it._id, it);
      });
      let allActivities = Array.from(dedup.values());

      // Sort by due date ascending
      allActivities.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
      
      // Check submission statuses for posted activities only
      console.log('DEBUG: About to check submission statuses for', allActivities.length, 'activities');
      const activitiesWithStatus = await checkSubmissionStatuses(allActivities);
      
      console.log('DEBUG: Final activities with status:', activitiesWithStatus);
      
      // Debug completion status
      console.log('DEBUG: Completion status breakdown:');
      activitiesWithStatus.forEach(activity => {
        console.log(`- ${activity.title} (${activity.type}): isSubmitted=${activity.isSubmitted}, status=${activity.status}, score=${activity.score}`);
      });
      
      // Summary of completion status
      const completedCount = activitiesWithStatus.filter(a => a.isSubmitted).length;
      const pendingCount = activitiesWithStatus.filter(a => !a.isSubmitted).length;
      console.log(`DEBUG: Summary - Total: ${activitiesWithStatus.length}, Completed: ${completedCount}, Pending: ${pendingCount}`);
      
      // Log quiz-specific information
      const quizActivities = activitiesWithStatus.filter(a => a.type === 'quiz');
      console.log('DEBUG: Quiz activities:', quizActivities.map(q => ({
        id: q._id,
        title: q.title,
        points: q.points,
        totalPoints: q.totalPoints,
        score: q.score,
        percentage: q.percentage,
        timeSpent: q.timeSpent,
        isSubmitted: q.isSubmitted,
        status: q.status
      })));
      
      // Log assignment-specific information
      const assignmentActivities = activitiesWithStatus.filter(a => a.type === 'assignment');
      console.log('DEBUG: Assignment activities:', assignmentActivities.map(a => ({
        id: a._id,
        title: a.title,
        points: a.points,
        score: a.score,
        isSubmitted: a.isSubmitted,
        status: a.status
      })));
      
      // Log all activities summary
      console.log('DEBUG: Activities summary - Total:', activitiesWithStatus.length, 'Quizzes:', quizActivities.length, 'Assignments:', assignmentActivities.length);
      
      // Log any activities with missing or unexpected data
      const activitiesWithIssues = activitiesWithStatus.filter(a => {
        if (a.type === 'quiz') {
          return !a.points || !a.totalPoints || a.score === undefined;
        } else if (a.type === 'assignment') {
          return !a.points || a.score === undefined;
        }
        return false;
      });
      
      if (activitiesWithIssues.length > 0) {
        console.log('DEBUG: Activities with potential issues:', activitiesWithIssues.map(a => ({
          id: a._id,
          type: a.type,
          title: a.title,
          points: a.points,
          totalPoints: a.totalPoints,
          score: a.score,
          isSubmitted: a.isSubmitted
        })));
      }
      
      // Log successful quiz activities for verification
      const successfulQuizzes = activitiesWithStatus.filter(a => a.type === 'quiz' && a.isSubmitted && a.score !== undefined && a.totalPoints);
      if (successfulQuizzes.length > 0) {
        console.log('DEBUG: Successful quiz activities:', successfulQuizzes.map(q => ({
          id: q._id,
          title: q.title,
          points: q.points,
          totalPoints: q.totalPoints,
          score: q.score,
          percentage: q.percentage,
          timeSpent: q.timeSpent
        })));
      }
      
      // Log any activities that might have score display issues
      const scoreDisplayIssues = activitiesWithStatus.filter(a => {
        if (a.type === 'quiz' && a.isSubmitted) {
          return a.score !== undefined && a.totalPoints && a.score > a.totalPoints;
        }
        return false;
      });
      
      if (scoreDisplayIssues.length > 0) {
        console.log('DEBUG: Activities with score display issues:', scoreDisplayIssues.map(a => ({
          id: a._id,
          title: a.title,
          score: a.score,
          totalPoints: a.totalPoints,
          percentage: a.percentage
        })));
      }
      
      // Final verification log
      console.log('DEBUG: Setting activities state with', activitiesWithStatus.length, 'activities');
      
      // Log the first few activities for quick verification
      if (activitiesWithStatus.length > 0) {
        console.log('DEBUG: First 3 activities preview:', activitiesWithStatus.slice(0, 3).map(a => ({
          id: a._id,
          type: a.type,
          title: a.title,
          points: a.points,
          totalPoints: a.totalPoints,
          score: a.score,
          isSubmitted: a.isSubmitted
        })));
      }
      
      // Log any activities with missing critical data
      const criticalIssues = activitiesWithStatus.filter(a => {
        if (a.type === 'quiz') {
          return !a.title || !a.points || (a.isSubmitted && a.score === undefined);
        } else if (a.type === 'assignment') {
          return !a.title || !a.points || (a.isSubmitted && a.score === undefined);
        }
        return false;
      });
      
      if (criticalIssues.length > 0) {
        console.warn('DEBUG: Activities with critical data issues:', criticalIssues.map(a => ({
          id: a._id,
          type: a.type,
          title: a.title,
          points: a.points,
          score: a.score,
          isSubmitted: a.isSubmitted
        })));
      }
      
      // Log the final state that will be set
      console.log('DEBUG: Final activities state to be set:', {
        totalCount: activitiesWithStatus.length,
        quizCount: activitiesWithStatus.filter(a => a.type === 'quiz').length,
        assignmentCount: activitiesWithStatus.filter(a => a.type === 'assignment').length,
        submittedCount: activitiesWithStatus.filter(a => a.isSubmitted).length,
        quizSubmittedCount: activitiesWithStatus.filter(a => a.type === 'quiz' && a.isSubmitted).length,
        assignmentSubmittedCount: activitiesWithStatus.filter(a => a.type === 'assignment' && a.isSubmitted).length
      });
      
      // Log any quiz activities that should display scores
      const quizScoreActivities = activitiesWithStatus.filter(a => a.type === 'quiz' && a.isSubmitted && a.score !== undefined);
      if (quizScoreActivities.length > 0) {
        console.log('DEBUG: Quiz activities that should display scores:', quizScoreActivities.map(q => ({
          id: q._id,
          title: q.title,
          score: q.score,
          totalPoints: q.totalPoints,
          percentage: q.percentage,
          timeSpent: q.timeSpent,
          points: q.points
        })));
      }
      
      // Log any quiz activities that might have display issues
      const quizDisplayIssues = activitiesWithStatus.filter(a => {
        if (a.type === 'quiz' && a.isSubmitted) {
          return !a.totalPoints || a.score === undefined || a.percentage === undefined;
        }
        return false;
      });
      
      if (quizDisplayIssues.length > 0) {
        console.warn('DEBUG: Quiz activities with potential display issues:', quizDisplayIssues.map(q => ({
          id: q._id,
          title: q.title,
          score: q.score,
          totalPoints: q.totalPoints,
          percentage: q.percentage,
          timeSpent: q.timeSpent,
          points: q.points
        })));
      }
      
      // Log the final activities array for inspection
      console.log('DEBUG: Final activities array:', JSON.stringify(activitiesWithStatus, null, 2));
      
      // Log any activities with missing data that might cause display issues
      const missingDataActivities = activitiesWithStatus.filter(a => {
        if (a.type === 'quiz') {
          return !a.title || !a.className || !a.dueDate || !a.points;
        } else if (a.type === 'assignment') {
          return !a.title || !a.className || !a.dueDate || !a.points;
        }
        return false;
      });
      
      if (missingDataActivities.length > 0) {
        console.warn('DEBUG: Activities with missing display data:', missingDataActivities.map(a => ({
          id: a._id,
          type: a.type,
          title: a.title,
          className: a.className,
          dueDate: a.dueDate,
          points: a.points
        })));
      }
      
      // Log the final state summary
      console.log('DEBUG: Final state summary:', {
        totalActivities: activitiesWithStatus.length,
        quizActivities: activitiesWithStatus.filter(a => a.type === 'quiz').length,
        assignmentActivities: activitiesWithStatus.filter(a => a.type === 'assignment').length,
        submittedQuizzes: activitiesWithStatus.filter(a => a.type === 'quiz' && a.isSubmitted).length,
        submittedAssignments: activitiesWithStatus.filter(a => a.type === 'assignment' && a.isSubmitted).length,
        quizScores: activitiesWithStatus.filter(a => a.type === 'quiz' && a.isSubmitted && a.score !== undefined).length,
        quizPercentages: activitiesWithStatus.filter(a => a.type === 'quiz' && a.isSubmitted && a.percentage !== undefined).length,
        quizTimeSpent: activitiesWithStatus.filter(a => a.type === 'quiz' && a.isSubmitted && a.timeSpent !== undefined).length
      });
      
      // Log any activities that might have rendering issues
      const renderingIssues = activitiesWithStatus.filter(a => {
        if (a.type === 'quiz' && a.isSubmitted) {
          return !a.score || !a.totalPoints || a.score > a.totalPoints;
        }
        return false;
      });
      
      if (renderingIssues.length > 0) {
        console.warn('DEBUG: Activities with potential rendering issues:', renderingIssues.map(a => ({
          id: a._id,
          type: a.type,
          title: a.title,
          score: a.score,
          totalPoints: a.totalPoints,
          percentage: a.percentage
        })));
      }
      
      // Log the final activities state for verification
      console.log('DEBUG: Final activities state verification:', {
        activities: activitiesWithStatus.map(a => ({
          id: a._id,
          type: a.type,
          title: a.title,
          points: a.points,
          totalPoints: a.totalPoints,
          score: a.score,
          percentage: a.percentage,
          timeSpent: a.timeSpent,
          isSubmitted: a.isSubmitted
        }))
      });
      
      // Log any activities that might have display issues in the UI
      const uiDisplayIssues = activitiesWithStatus.filter(a => {
        if (a.type === 'quiz' && a.isSubmitted) {
          return !a.score || !a.totalPoints || !a.percentage || !a.timeSpent;
        }
        return false;
      });
      
      if (uiDisplayIssues.length > 0) {
        console.warn('DEBUG: Activities with UI display issues:', uiDisplayIssues.map(a => ({
          id: a._id,
          type: a.type,
          title: a.title,
          score: a.score,
          totalPoints: a.totalPoints,
          percentage: a.percentage,
          timeSpent: a.timeSpent
        })));
      }
      
      console.log('DEBUG: Setting activities state (main):', activitiesWithStatus.length);
      setActivities(activitiesWithStatus);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleActivityPress = (activity) => {
    // If quiz is already submitted, open the modal with a View Results action
    if (activity.type === 'quiz' && activity.isSubmitted) {
      setSelectedActivity(activity);
      setShowActivityModal(true);
      return;
    }
    // For assignments already submitted, keep the info modal notice
    if (activity.type !== 'quiz' && activity.isSubmitted) {
      Alert.alert(
        'Already Completed',
        `You have already completed this ${activity.type === 'quiz' ? 'quiz' : 'assignment'}.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const navigateToActivity = (activity) => {
    setShowActivityModal(false);
    
    // If quiz is already submitted, open in review mode
    if (activity.type === 'quiz') {
      if (activity.isSubmitted) {
        navigation.navigate('QuizView', { quizId: activity._id, review: true });
      } else {
        navigation.navigate('QuizView', { quizId: activity._id });
      }
    } else {
      navigation.navigate('AssignmentDetail', { 
        assignmentId: activity._id,
        assignment: activity,
        onSubmissionComplete: () => {
          setTimeout(() => {
            fetchActivities();
          }, 100);
        }
      });
    }
  };

  // Filter activities based on selected tab and search query
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (activity.className && activity.className.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'upcoming') {
      if (!activity.dueDate) {
        const result = matchesSearch && !activity.isSubmitted;
        console.log(`DEBUG: ${activity.title} in upcoming tab (no due date): isSubmitted=${activity.isSubmitted}, result=${result}`);
        return result;
      }
      const now = new Date();
      const dueDate = new Date(activity.dueDate);
      const result = dueDate > now && !activity.isSubmitted && matchesSearch;
      console.log(`DEBUG: ${activity.title} in upcoming tab: dueDate=${activity.dueDate}, isSubmitted=${activity.isSubmitted}, result=${result}`);
      return result;
    } else if (activeTab === 'pastDue') {
      if (!activity.dueDate) {
        console.log(`DEBUG: ${activity.title} in pastDue tab (no due date): excluded`);
        return false; // keep pastDue strict
      }
      const now = new Date();
      const dueDate = new Date(activity.dueDate);
      const result = dueDate < now && !activity.isSubmitted && matchesSearch;
      console.log(`DEBUG: ${activity.title} in pastDue tab: dueDate=${activity.dueDate}, isSubmitted=${activity.isSubmitted}, result=${result}`);
      return result;
    } else if (activeTab === 'completed') {
      const result = activity.isSubmitted && matchesSearch;
      console.log(`DEBUG: ${activity.title} in completed tab: isSubmitted=${activity.isSubmitted}, result=${result}`);
      return result;
    }
    
    return matchesSearch; // activeTab === 'all'
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Activities</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <MaterialIcons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Activity Tabs - compact segmented control */}
      <View style={styles.activityTabsContainer}>
        <View style={styles.activityTabsBar}>
          {[
            { key: 'all', label: 'All', count: activities.length },
            { key: 'upcoming', label: 'Upcoming', count: activities.filter(a => {
              if (!a.isSubmitted) {
                if (!a.dueDate) return true; // include items without dueDate
                return new Date(a.dueDate) > new Date();
              }
              return false;
            }).length },
            { key: 'pastDue', label: 'Past Due', count: activities.filter(a => !a.isSubmitted && a.dueDate && new Date(a.dueDate) < new Date()).length },
            { key: 'completed', label: 'Completed', count: activities.filter(a => a.isSubmitted).length }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.activityTabSegment,
                activeTab === tab.key && styles.activityTabSegmentActive
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.activityTabText,
                activeTab === tab.key && styles.activityTabTextActive
              ]}>{`${tab.label} (${tab.count})`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Activities List */}
      <ScrollView 
        style={styles.activitiesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Activities Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || activeTab !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No activities available at this time'
              }
            </Text>
          </View>
        ) : (
          filteredActivities.map((activity, index) => (
            <ActivityCard
              key={`${activity._id}_${index}`}
              activity={activity}
              onActivityPress={handleActivityPress}
            />
          ))
        )}
      </ScrollView>

      {/* Activity Details Modal */}
      <Modal
        visible={showActivityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activity Details</Text>
              <TouchableOpacity onPress={() => setShowActivityModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedActivity && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalActivityHeader}>
                  <MaterialIcons 
                    name={selectedActivity.type === 'quiz' ? 'quiz' : 'assignment'} 
                    size={32} 
                    color={selectedActivity.type === 'quiz' ? '#9C27B0' : '#FF9800'} 
                  />
                  <Text style={styles.modalActivityTitle}>{selectedActivity.title}</Text>
                  <Text style={styles.modalActivityType}>
                    {selectedActivity.type === 'quiz' ? 'Quiz' : 'Assignment'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Details</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Class:</Text>
                    <Text style={styles.modalDetailValue}>{selectedActivity.className}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Due Date:</Text>
                    <Text style={styles.modalDetailValue}>
                      {formatDateTime(selectedActivity.dueDate)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Points:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedActivity.type === 'quiz' ? (selectedActivity.totalPoints || selectedActivity.points || 0) : (selectedActivity.points || 0)} points
                    </Text>
                  </View>
                  
                  {selectedActivity.type === 'quiz' && selectedActivity.isSubmitted && selectedActivity.score !== undefined && (
                    <>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Score:</Text>
                        <Text style={styles.modalDetailValue}>
                          {selectedActivity.score}/{selectedActivity.totalPoints || selectedActivity.points || 100}
                        </Text>
                      </View>
                      {selectedActivity.percentage !== undefined && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Percentage:</Text>
                          <Text style={styles.modalDetailValue}>{selectedActivity.percentage}%</Text>
                        </View>
                      )}
                      {selectedActivity.timeSpent !== undefined && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Time Spent:</Text>
                          <Text style={styles.modalDetailValue}>
                            {Math.floor(selectedActivity.timeSpent / 60)}m {selectedActivity.timeSpent % 60}s
                          </Text>
                        </View>
                      )}
                      {selectedActivity.submittedAt && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Submitted:</Text>
                          <Text style={styles.modalDetailValue}>
                            {formatDateTime(selectedActivity.submittedAt)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {selectedActivity.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.modalDescription}>{selectedActivity.description}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => navigateToActivity(selectedActivity)}
                >
                  <Text style={styles.modalActionButtonText}>
                    {selectedActivity.type === 'quiz'
                      ? (selectedActivity.isSubmitted ? 'View Results' : 'Take Quiz')
                      : 'View Assignment'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  activityTabsContainer: {
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activityTabsBar: {
    marginHorizontal: 10,
    backgroundColor: '#f1f3f8',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 2,
  },
  activityTabSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  activityTabSegmentActive: {
    backgroundColor: '#00418b',
  },
  activityTabText: {
    color: '#3a3a3a',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  activityTabTextActive: {
    color: '#fff',
  },
  activitiesContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 0,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 1,
    fontFamily: 'Poppins-Bold',
  },
  activityClass: {
    fontSize: 12,
    color: '#666',
    marginBottom: 1,
    fontFamily: 'Poppins-Medium',
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 1,
    fontFamily: 'Poppins-Regular',
  },
  activityDueDate: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  activityType: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
  },
  activityPoints: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00418b',
    fontFamily: 'Poppins-Bold',
  },
  activityFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 6,
  },
  activityStats: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  statText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
    fontFamily: 'Poppins-Regular',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  viewButton: {
    backgroundColor: '#e3f2fd',
  },
  viewButtonText: {
    color: '#2196F3',
    fontSize: 10,
    marginLeft: 2,
    fontFamily: 'Poppins-Medium',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  resultsButton: {
    backgroundColor: '#e8f5e9',
    marginRight: 8,
  },
  resultsButtonText: {
    color: '#4CAF50',
    fontSize: 10,
    marginLeft: 2,
    fontFamily: 'Poppins-Medium',
  },
  emptyContainer: {
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
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  modalContent: {
    padding: 20,
  },
  modalActivityHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalActivityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  modalActivityType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    fontFamily: 'Poppins-Regular',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
    fontFamily: 'Poppins-Regular',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  modalActionButton: {
    backgroundColor: '#00418b',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
};