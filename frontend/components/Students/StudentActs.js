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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTimer } from '../../TimerContext';
import * as DocumentPicker from 'expo-document-picker';

// Check if DocumentPicker is available
const isDocumentPickerAvailable = () => {
  try {
    const isAvailable = DocumentPicker && DocumentPicker.getDocumentAsync;
    return isAvailable;
  } catch (error) {
    console.error('DocumentPicker availability check failed:', error);
    return false;
  }
};

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
  const { formatTime } = useTimer();
  
  if (!activity || !onActivityPress) {
    console.error('ActivityCard received invalid props:', { activity, onActivityPress });
    return null;
  }

  if (!activity._id || !activity.type || !activity.title) {
    console.error('ActivityCard received invalid activity object:', activity);
    return null;
  }

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

  const handleViewButtonPress = () => {
    try {
      onActivityPress(activity);
    } catch (error) {
      console.error('Error in ActivityCard view button press:', error);
    }
  };

  const handleResultsButtonPress = () => {
    try {
      navigation.navigate('QuizView', { quizId: activity._id, review: true });
    } catch (error) {
      console.error('Error in ActivityCard results button press:', error);
    }
  };

  const getMotivationalMessage = (score, total) => {
    if (score === total) return "🎉 Perfect! You aced it!";
    if (score >= total * 0.8) return "🌟 Great job! Keep it up!";
    if (score >= total * 0.5) return "👍 Good effort! Review for improvement!";
    return "💪 Keep trying! Every attempt helps!";
  };

     const renderTimingInfo = () => {
     if (activity.type === 'quiz') {
       const now = new Date();
       const openDate = activity.openDate;
       const closeDate = activity.closeDate;
       const duration = activity.duration;
       
       if (activity.quizStatus === 'not_open' && openDate) {
         const timeUntilOpen = Math.ceil((openDate - now) / 1000);
         return (
           <View style={styles.timingInfo}>
             <MaterialIcons name="schedule" size={16} color="#FF9800" />
             <Text style={styles.timingText}>
               Opens in {formatTime(timeUntilOpen)}
             </Text>
           </View>
         );
       }
       
       if (activity.quizStatus === 'open' && closeDate) {
         const timeRemaining = Math.ceil((closeDate - now) / 1000);
         return (
           <View style={styles.timingInfo}>
             <MaterialIcons name="timer" size={16} color="#4CAF50" />
             <Text style={styles.timingText}>
               Closes in {formatTime(timeRemaining)}
             </Text>
           </View>
         );
       }
       
       // Show past due indicator
       if (activity.autoAssigned) {
         return (
           <View style={[styles.timingInfo, { backgroundColor: '#ffebee', borderColor: '#F44336' }]}>
             <MaterialIcons name="schedule" size={16} color="#F44336" />
             <Text style={[styles.timingText, { color: '#F44336' }]}>
               ⏰ Past Due - Auto-assigned Zero
             </Text>
           </View>
         );
       }
       
       if (duration > 0) {
         return (
           <View style={styles.timingInfo}>
             <MaterialIcons name="access-time" size={16} color="#2196F3" />
             <Text style={styles.timingText}>
               Duration: {formatTime(duration)}
             </Text>
           </View>
         );
       }
     } else if (activity.type === 'assignment') {
       // Show assignment timing info
       const now = new Date();
       const dueDate = activity.dueDate ? new Date(activity.dueDate) : null;
       
       if (dueDate && now > dueDate && !activity.isSubmitted) {
         // Assignment is past due and not submitted
         return (
           <View style={[styles.timingInfo, { backgroundColor: '#f5f5f5', borderColor: '#9E9E9E' }]}>
             <MaterialIcons name="lock" size={16} color="#9E9E9E" />
             <Text style={[styles.timingText, { color: '#9E9E9E' }]}>
               🔒 Submission Closed - Past Due
             </Text>
           </View>
         );
       } else if (dueDate && now <= dueDate && !activity.isSubmitted) {
         // Assignment is not yet due
         const timeUntilDue = Math.ceil((dueDate - now) / 1000);
         return (
           <View style={styles.timingInfo}>
             <MaterialIcons name="schedule" size={16} color="#FF9800" />
             <Text style={styles.timingText}>
               Due in {formatTime(timeUntilDue)}
             </Text>
           </View>
         );
       }
     }
     
     return null;
   };

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
          {activity.className && (
            <Text style={styles.activityClass}>{activity.className}</Text>
          )}
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
      
      {renderTimingInfo()}
      
      <View style={styles.activityFooter}>
                 <View style={styles.activityStats}>
           <View style={styles.statItem}>
             <MaterialIcons 
               name={activity.type === 'assignment' && !activity.isSubmitted && activity.dueDate && new Date(activity.dueDate) < new Date() 
                 ? "lock" 
                 : "schedule"} 
               size={16} 
               color={activity.autoAssigned ? "#F44336" : 
                 (activity.type === 'assignment' && !activity.isSubmitted && activity.dueDate && new Date(activity.dueDate) < new Date()) 
                   ? "#9E9E9E" 
                   : "#666"} 
             />
             <Text style={[
               styles.statText,
               activity.autoAssigned && { color: "#F44336", fontStyle: "italic" },
               (activity.type === 'assignment' && !activity.isSubmitted && activity.dueDate && new Date(activity.dueDate) < new Date()) && { 
                 color: "#9E9E9E", 
                 fontStyle: "italic" 
               }
             ]}>
               {activity.autoAssigned ? 'Auto-Zero' : 
                 (activity.type === 'assignment' && !activity.isSubmitted && activity.dueDate && new Date(activity.dueDate) < new Date()) 
                   ? 'Submission Closed' 
                   : (activity.isSubmitted ? 'Completed' : 'Pending')
               }
             </Text>
           </View>
           
           {/* Show replacement status for assignments */}
           {activity.type === 'assignment' && activity.isSubmitted && activity.hasReplacement && (
             <View style={styles.statItem}>
               <MaterialIcons name="file-upload" size={16} color="#FF9800" />
               <Text style={styles.statText}>
                 🔄 Replaced ({activity.replacementCount || 1}x)
                 {activity.replacementIsLate && (
                   <Text style={{ color: '#f44336', fontWeight: 'bold' }}> - Late</Text>
                 )}
               </Text>
             </View>
           )}
           
           {/* Show submission timing status */}
           {activity.type === 'assignment' && activity.isSubmitted && activity.dueDate && (
             <View style={styles.statItem}>
               <MaterialIcons 
                 name="schedule" 
                 size={16} 
                 color={new Date(activity.dueDate) < new Date() ? '#f44336' : '#4CAF50'} 
               />
               <Text style={[
                 styles.statText,
                 { color: new Date(activity.dueDate) < new Date() ? '#f44336' : '#4CAF50' }
               ]}>
                 {new Date(activity.dueDate) < new Date() ? 'Past Due' : 'On Time'}
               </Text>
             </View>
           )}
           
           {activity.isSubmitted && activity.score !== undefined && (
             <View style={styles.statItem}>
               <MaterialIcons 
                 name="grade" 
                 size={16} 
                 color={activity.autoAssigned ? "#F44336" : "#4CAF50"} 
               />
               <Text style={[
                 styles.statText,
                 activity.autoAssigned && { color: "#F44336", fontStyle: "italic" }
               ]}>
                 Score: {activity.score}/{activity.type === 'quiz' ? (activity.totalPoints || activity.points || 100) : (activity.points || 100)}
                 {activity.autoAssigned && " (Auto-assigned)"}
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
            </View>
          )}
          
          {/* Motivational message for completed quizzes */}
          {activity.isSubmitted && activity.type === 'quiz' && activity.score !== undefined && (
            <View style={[
              styles.motivationalContainer,
              activity.autoAssigned && { backgroundColor: '#ffebee' }
            ]}>
              <Text style={[
                styles.motivationalText,
                activity.autoAssigned && { color: '#F44336' }
              ]}>
                {activity.autoAssigned 
                  ? "⏰ Quiz expired - Auto-assigned zero score" 
                  : getMotivationalMessage(activity.score, activity.type === 'quiz' ? (activity.totalPoints || activity.points || 100) : (activity.points || 100))
                }
              </Text>
            </View>
          )}
        </View>

                 <View style={styles.actionButtonsRow}>
           {activity.type === 'quiz' && activity.isSubmitted && (
             <TouchableOpacity 
               style={[styles.actionButton, styles.resultsButton]}
               onPress={handleResultsButtonPress}
             >
               <MaterialIcons 
                 name="check-circle" 
                 size={16} 
                 color={activity.autoAssigned ? "#F44336" : "#4CAF50"} 
               />
               <Text style={[
                 styles.resultsButtonText,
                 activity.autoAssigned && { color: "#F44336" }
               ]}>
                 {activity.autoAssigned ? 'View Zero Score' : 'View Results'}
               </Text>
             </TouchableOpacity>
           )}

           {activity.type === 'assignment' && activity.isSubmitted && (
             <TouchableOpacity 
               style={[
                 styles.actionButton, 
                 styles.replacementButton,
                 (activity.dueDate && new Date(activity.dueDate) < new Date()) && styles.disabledButton
               ]}
               onPress={() => {
                 console.log('=== REPLACEMENT BUTTON PRESSED ===');
                 console.log('Original activity object:', activity);
                 console.log('Original activity._id:', activity._id);
                 console.log('Original activity._id type:', typeof activity._id);
                 console.log('Original activity._id length:', activity._id?.length);
                 
                 // Create a clean copy of the activity object to avoid corruption
                 const cleanActivity = {
                   _id: String(activity._id), // Ensure ID is a string and not truncated
                   title: activity.title,
                   type: activity.type,
                   className: activity.className,
                   dueDate: activity.dueDate,
                   isSubmitted: activity.isSubmitted,
                   action: 'replace'
                 };
                 
                 console.log('Clean activity object:', cleanActivity);
                 console.log('Clean activity._id:', cleanActivity._id);
                 console.log('Clean activity._id type:', typeof cleanActivity._id);
                 console.log('Clean activity._id length:', cleanActivity._id.length);
                 
                 // Validate the ID length before proceeding
                 if (cleanActivity._id.length !== 24) {
                   console.error('Activity ID appears to be truncated:', cleanActivity._id);
                   Alert.alert('Error', 'Invalid activity ID. Please try refreshing the page.');
                   return;
                 }
                 
                 console.log('=== REPLACEMENT BUTTON END ===');
                 onActivityPress(cleanActivity);
               }}
               disabled={activity.dueDate && new Date(activity.dueDate) < new Date()}
             >
               <MaterialIcons 
                 name="file-upload" 
                 size={16} 
                 color={(activity.dueDate && new Date(activity.dueDate) < new Date()) ? "#9E9E9E" : "#FF9800"} 
               />
               <Text style={[
                 styles.replacementButtonText,
                 (activity.dueDate && new Date(activity.dueDate) < new Date()) && { color: "#9E9E9E" }
               ]}>
                 {(activity.dueDate && new Date(activity.dueDate) < new Date()) ? 'Submission Closed' : 'Replace File'}
               </Text>
             </TouchableOpacity>
           )}

           <TouchableOpacity 
             style={[styles.actionButton, styles.viewButton]}
             onPress={handleViewButtonPress}
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
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedActivities, setCompletedActivities] = useState([]);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedAssignmentForReplacement, setSelectedAssignmentForReplacement] = useState(null);
  const [replacementFile, setReplacementFile] = useState(null);
  const [uploadingReplacement, setUploadingReplacement] = useState(false);

  useEffect(() => {
    if (user && user._id) {
      fetchActivities();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchActivities();
    });
    return unsubscribe;
  }, [navigation]);

  // Separate effect to handle file replacement trigger
  useEffect(() => {
    const params = navigation.getState()?.routes?.[navigation.getState()?.routes?.length - 1]?.params;
    
    console.log('=== NAVIGATION PARAMS EFFECT ===');
    console.log('Navigation params:', params);
    console.log('triggerFileReplacement:', params?.triggerFileReplacement);
    console.log('assignmentId from params:', params?.assignmentId);
    console.log('assignmentId type:', typeof params?.assignmentId);
    console.log('assignmentId length:', params?.assignmentId?.length);
    
    if (params?.triggerFileReplacement && params?.assignmentId && activities.length > 0) {
      // Ensure the assignmentId is a valid string
      const assignmentId = String(params.assignmentId);
      console.log('assignmentId after String() conversion:', assignmentId);
      console.log('assignmentId length after conversion:', assignmentId.length);
      
      if (assignmentId.length !== 24) {
        console.error('Invalid assignment ID from navigation:', assignmentId);
        return;
      }
      
      const assignment = activities.find(a => String(a._id) === assignmentId);
      console.log('Found assignment:', assignment);
      console.log('Assignment _id:', assignment?._id);
      console.log('Assignment _id type:', typeof assignment?._id);
      console.log('Assignment _id length:', assignment?._id?.length);
      
      if (assignment) {
        setTimeout(() => {
          console.log('Calling handleFileReplacement with assignment:', assignment);
          handleFileReplacement(assignment);
        }, 1000); // Longer delay to ensure activities are fully loaded
      }
    }
    
    console.log('=== END NAVIGATION PARAMS EFFECT ===');
  }, [navigation, activities]);

  const checkSubmissionStatuses = async (activitiesList) => {
    try {
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
                const studentSubmission = submissions.find(sub => {
                  const assignmentMatches = sub.assignment === activity._id || 
                                          sub.assignment?._id === activity._id ||
                                          sub.assignmentId === activity._id;
                  
                  if (!assignmentMatches) return false;
                  
                  let matches = false;
                  if (sub.student && typeof sub.student === 'object' && sub.student._id) {
                    matches = sub.student._id === user._id || 
                             sub.student._id === user._id ||
                             sub.student.userID === user._id ||
                             sub.student.studentID === user._id;
                  } else {
                    matches = sub.student === user._id || 
                             sub.student === user._id ||
                             sub.student === user._id.toString() || 
                             sub.student === user._id.toString();
                  }
                  
                  return matches;
                });
                
                if (studentSubmission) {
                  // Calculate timing status
                  const now = new Date();
                  const dueDate = activity.dueDate ? new Date(activity.dueDate) : null;
                  let timingStatus = 'on-time';
                  let daysLate = 0;
                  
                  if (dueDate && studentSubmission.lastUpdated && new Date(studentSubmission.lastUpdated) > dueDate) {
                    daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
                    if (daysLate === 0) {
                      timingStatus = 'late';
                    } else {
                      timingStatus = 'overdue';
                    }
                  }
                  
                  return { 
                    ...activity, 
                    submittedAt: studentSubmission.submittedAt || new Date(), 
                    status: 'submitted',
                    submissionId: studentSubmission._id,
                    isSubmitted: true,
                    score: studentSubmission.grade || 0,
                    // Enhanced replacement information
                    hasReplacement: studentSubmission.hasReplacement || false,
                    replacementCount: studentSubmission.replacementCount || 0,
                    lastUpdated: studentSubmission.lastUpdated || studentSubmission.submittedAt,
                    originalSubmissionDate: studentSubmission.originalSubmissionDate || studentSubmission.submittedAt,
                    timingStatus: timingStatus,
                    daysLate: daysLate
                  };
                } else {
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
              // Check if quiz is currently open and has timing constraints
              const now = new Date();
              const openDate = activity.timing?.open ? new Date(activity.timing.open) : null;
              const closeDate = activity.timing?.close ? new Date(activity.timing.close) : null;
              const duration = activity.timing?.duration || 0; // in seconds
              
              // Determine quiz status
              let quizStatus = 'not_open';
              if (openDate && now < openDate) {
                quizStatus = 'not_open';
              } else if (closeDate && now > closeDate) {
                quizStatus = 'closed';
              } else if (openDate && closeDate && now >= openDate && now <= closeDate) {
                quizStatus = 'open';
              } else if (!openDate && !closeDate) {
                quizStatus = 'always_open';
              }

              // Add timing information to activity
              activity.quizStatus = quizStatus;
              activity.openDate = openDate;
              activity.closeDate = closeDate;
              activity.duration = duration;
              activity.isCurrentlyOpen = quizStatus === 'open' || quizStatus === 'always_open';
              
              // Check if quiz is past due and should auto-assign zero
              const isPastDue = closeDate && now > closeDate;
              const hasDueDate = activity.dueDate && new Date(activity.dueDate) < now;
              const shouldAutoZero = isPastDue || hasDueDate;
              
              const response = await fetch(`${API_BASE}/api/quizzes/${activity._id}/responses`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const responseData = await response.json();
                
                if (Array.isArray(responseData)) {
                  const studentResponse = responseData.find(resp => {
                    const studentField = resp.student || resp.studentId || resp.userId;
                    const matchesQuiz = resp.quiz === activity._id || 
                                       resp.quiz?._id === activity._id ||
                                       resp.quizId === activity._id;
                                       
                    const matchesStudent = studentField && (
                      studentField._id === user._id ||
                      studentField === user._id ||
                      studentField.userID === user._id ||
                      studentField.studentID === user._id
                    );
                    
                    return matchesQuiz && matchesStudent;
                  });
                  
                                     if (studentResponse) {
                     let percentage = studentResponse.percentage;
                     if (percentage === undefined && studentResponse.score !== undefined && studentResponse.total !== undefined) {
                       percentage = Math.round((studentResponse.score / studentResponse.total) * 100);
                     }
                     
                     activity.submittedAt = studentResponse.submittedAt || new Date();
                     activity.status = 'submitted';
                     activity.isSubmitted = true;
                     activity.score = studentResponse.score || 0;
                     activity.totalPoints = studentResponse.total || activity.points || 10;
                     activity.percentage = percentage || 0;
                     activity.timeSpent = studentResponse.timeSpent || 'N/A';
                   } else {
                     // Check if quiz is past due and should auto-assign zero
                     if (shouldAutoZero) {
                       activity.isSubmitted = true; // Mark as submitted to show the zero score
                       activity.status = 'auto_zero';
                       activity.score = 0;
                       activity.totalPoints = activity.points || 10;
                       activity.percentage = 0;
                       activity.submittedAt = closeDate || activity.dueDate || new Date(); // Use close date or due date as submission time
                       activity.autoAssigned = true; // Flag to indicate this was auto-assigned
                     } else {
                       activity.isSubmitted = false;
                       activity.status = 'not_submitted';
                       activity.score = 0;
                       activity.totalPoints = activity.points || 10;
                       activity.percentage = 0;
                     }
                   }
                } else {
                  activity.isSubmitted = false;
                  activity.status = 'not_submitted';
                  activity.score = 0;
                  activity.totalPoints = activity.points || 10;
                  activity.percentage = 0;
                }
              } else {
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
          
          return activity;
        })
      );
      
      const completed = updatedActivities.filter(a => a.isSubmitted);
      setCompletedActivities(completed);
      
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
        throw new Error('User data not found');
      }

      console.log('=== fetchActivities START ===');
      console.log('User ID:', user._id);
      console.log('User ID type:', typeof user._id);
      console.log('User ID length:', user._id?.length);

      // Get classes where this student is enrolled
      const classesResponse = await fetch(`${API_BASE}/classes/my-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!classesResponse.ok) {
        throw new Error('Failed to fetch student classes');
      }

      const classesData = await classesResponse.json();
      const studentClasses = Array.isArray(classesData) ? classesData : [];
      
      console.log('Student classes found:', studentClasses.length);
      console.log('First class:', studentClasses[0]);

      if (studentClasses.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Get all class IDs for this student
      const studentClassIDs = studentClasses.map(cls => cls.classID);

      // Fetch assignments per class (like StudentClasses.js does successfully)
      const allAssignments = [];
      for (const studentClass of studentClasses) {
        const assignmentRes = await fetch(`${API_BASE}/assignments?classID=${encodeURIComponent(studentClass.classID)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (assignmentRes.ok) {
          const assignmentData = await assignmentRes.json();
          console.log(`Assignments for class ${studentClass.classID}:`, assignmentData.length);
          if (assignmentData.length > 0) {
            console.log('First assignment:', assignmentData[0]);
            console.log('First assignment ID:', assignmentData[0]._id);
            console.log('First assignment ID type:', typeof assignmentData[0]._id);
            console.log('First assignment ID length:', assignmentData[0]._id?.length);
          }
          allAssignments.push(...(Array.isArray(assignmentData) ? assignmentData : []));
        }
      }
      
      // Fetch quizzes per class
      const allQuizzes = [];
      for (const studentClass of studentClasses) {
        const quizRes = await fetch(`${API_BASE}/api/quizzes?classID=${encodeURIComponent(studentClass.classID)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          allQuizzes.push(...(Array.isArray(quizData) ? quizData : []));
        }
      }
      
      // Since we're fetching per class, we already have the right assignments
       // No need for complex filtering - just use what we fetched
       const filteredActivities = allAssignments;
       
       // For quizzes, also simplify filtering since we fetched per class
       const filteredQuizzes = allQuizzes;
       
       // Merge and normalize
       const assignmentsWithType = filteredActivities.map(a => ({ 
         ...a, 
         type: 'assignment',
         className: a.classInfo?.className || a.className,
         classCode: a.classInfo?.classCode || a.classCode || 'N/A',
         classID: a.classID || a.classInfo?.classID || (a.assignedTo && a.assignedTo[0]?.classID)
       }));
       
       console.log('=== ASSIGNMENT PROCESSING DEBUG ===');
       console.log('Total assignments found:', filteredActivities.length);
       if (filteredActivities.length > 0) {
         console.log('First assignment before processing:', filteredActivities[0]);
         console.log('First assignment ID before processing:', filteredActivities[0]._id);
         console.log('First assignment ID type before processing:', typeof filteredActivities[0]._id);
         console.log('First assignment ID length before processing:', filteredActivities[0]._id?.length);
         
         console.log('First assignment after processing:', assignmentsWithType[0]);
         console.log('First assignment ID after processing:', assignmentsWithType[0]._id);
         console.log('First assignment ID type after processing:', typeof assignmentsWithType[0]._id);
         console.log('First assignment ID length after processing:', assignmentsWithType[0]._id?.length);
       }
       console.log('=== END ASSIGNMENT PROCESSING DEBUG ===');
       
       const quizzesWithType = filteredQuizzes.map(q => ({ 
         ...q, 
         type: 'quiz',
         className: q.classInfo?.className || q.className,
         classCode: q.classInfo?.classCode || q.classCode || 'N/A',
         classID: q.classID || q.classInfo?.classID || (q.assignedTo && q.assignedTo[0]?.classID)
       }));
       
       let merged = [...assignmentsWithType, ...quizzesWithType];
       
       // Deduplicate by _id to avoid multiple entries if a quiz is returned for several classes
       const dedup = new Map();
       merged.forEach(it => {
         if (it && it._id && !dedup.has(it._id)) dedup.set(it._id, it);
       });
       let allActivities = Array.from(dedup.values());

       // Filter for ONLY POSTED activities
       const now = new Date();
       
       const postedActivities = allActivities.filter(item => {
         if (item.type === 'assignment') {
           const scheduleEnabled = item?.schedulePost === true;
           const postAt = item?.postAt ? new Date(item.postAt) : null;
           if (scheduleEnabled && postAt) {
             const isPosted = postAt <= now;
             return isPosted;
           }
           return true;
         } else if (item.type === 'quiz') {
           return true;
           
           // For quizzes, we need to be more lenient with the posting logic
           // Newly created quizzes should appear immediately unless explicitly scheduled
           
           const timing = item?.timing;
           const openEnabled = timing?.openEnabled;
           const openDate = timing?.open ? new Date(timing.open) : null;
           const closeDate = timing?.close ? new Date(timing.close) : null;
           
           // If no timing object exists, consider quiz as posted (legacy quizzes)
           if (!timing) {
             return true;
           }
           
           // If timing exists but openEnabled is false or undefined, consider as posted
           if (openEnabled === false || openEnabled === undefined) {
             return true;
           }
           
           // If openEnabled is true but no open date, consider as posted (immediate posting)
           if (openEnabled === true && !openDate) {
             return true;
           }
           
           // If openEnabled is true and open date exists, check if it's time to open
           if (openEnabled === true && openDate) {
             const isPosted = openDate <= now;
             return isPosted;
           }
           
           // Default case: consider as posted
           return true;
         }
         return false;
       });
      

      
      // Add basic class info for activities
      const postedActivitiesWithClassInfo = postedActivities.map(item => ({
        ...item,
        className: item.className,
        classCode: item.classCode || 'N/A',
        classID: item.classID || (item.assignedTo && item.assignedTo[0]?.classID)
      }));
      
      const activitiesWithStatus = await checkSubmissionStatuses(postedActivitiesWithClassInfo);
      // Sort: latest first within activities tabs
      activitiesWithStatus.sort((a, b) => new Date(b.dueDate || b.createdAt || 0) - new Date(a.dueDate || a.createdAt || 0));
      
      console.log('=== FINAL ACTIVITIES DEBUG ===');
      console.log('Total activities with status:', activitiesWithStatus.length);
      if (activitiesWithStatus.length > 0) {
        const firstAssignment = activitiesWithStatus.find(a => a.type === 'assignment');
        if (firstAssignment) {
          console.log('First assignment in final list:', firstAssignment);
          console.log('First assignment ID in final list:', firstAssignment._id);
          console.log('First assignment ID type in final list:', typeof firstAssignment._id);
          console.log('First assignment ID length in final list:', firstAssignment._id?.length);
        }
      }
      console.log('=== END FINAL ACTIVITIES DEBUG ===');
      
      setActivities(activitiesWithStatus);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleActivityPress = (activity) => {
    try {
      if (!activity || !activity._id) {
        console.error('Invalid activity data in handleActivityPress:', activity);
        Alert.alert('Error', 'Invalid activity data. Please try refreshing the page.');
        return;
      }

      if (!user || !user._id) {
        console.error('User session not available in handleActivityPress');
        Alert.alert('Error', 'User session not available. Please log in again.');
        return;
      }

      // Handle file replacement for assignments
      if (activity.action === 'replace' && activity.type === 'assignment') {
        handleFileReplacement(activity);
        return;
      }

      if (activity.type === 'quiz' && activity.isSubmitted) {
        setSelectedActivity(activity);
        setShowActivityModal(true);
        return;
      }
      
      // For assignments, allow viewing even if submitted
      if (activity.type === 'assignment' && activity.isSubmitted) {
        setSelectedActivity(activity);
        setShowActivityModal(true);
        return;
      }

      setSelectedActivity(activity);
      setShowActivityModal(true);
      
    } catch (error) {
      console.error('Error in handleActivityPress:', error);
      Alert.alert('Error', 'Failed to open activity details. Please try again.');
    }
  };

  const navigateToActivity = (activity) => {
    try {
      if (!activity || !activity._id) {
        console.error('Invalid activity data:', activity);
        Alert.alert('Error', 'Invalid activity data for navigation.');
        return;
      }

      if (!navigation) {
        console.error('Navigation not available');
        Alert.alert('Error', 'Navigation not available.');
        return;
      }

      setShowActivityModal(false);
      
      if (activity.type === 'quiz') {
        if (activity.isSubmitted) {
          navigation.navigate('QuizView', { quizId: activity._id, review: true });
        } else {
          navigation.navigate('QuizView', { quizId: activity._id });
        }
      } else if (activity.type === 'assignment') {
        navigation.navigate('AssignmentDetail', { 
          assignmentId: activity._id,
          assignment: activity,
          viewMode: activity.isSubmitted, // Pass viewMode for submitted assignments
          onSubmissionComplete: () => {
            setTimeout(() => {
              fetchActivities();
            }, 100);
          }
        });
      } else {
        console.error('Unknown activity type:', activity.type);
        Alert.alert('Error', `Unknown activity type: ${activity.type}`);
      }
    } catch (error) {
      console.error('Error in navigateToActivity:', error);
      Alert.alert('Error', 'Failed to navigate to activity. Please try again.');
    }
  };

  const handleFileReplacement = (assignment) => {
    if (!assignment || !assignment._id) {
      console.error('Invalid assignment in handleFileReplacement');
      return;
    }
    
    console.log('=== handleFileReplacement START ===');
    console.log('Original assignment object:', assignment);
    console.log('Original assignment._id:', assignment._id);
    console.log('Original assignment._id type:', typeof assignment._id);
    console.log('Original assignment._id length:', assignment._id?.length);
    
    // Create a clean copy of the assignment with explicit ID handling
    const cleanAssignment = {
      _id: String(assignment._id), // Ensure ID is a string and not truncated
      title: assignment.title,
      type: assignment.type,
      className: assignment.className,
      dueDate: assignment.dueDate,
      isSubmitted: assignment.isSubmitted
    };
    
    console.log('Clean assignment object:', cleanAssignment);
    console.log('Clean assignment._id:', cleanAssignment._id);
    console.log('Clean assignment._id type:', typeof cleanAssignment._id);
    console.log('Clean assignment._id length:', cleanAssignment._id.length);
    
    // Validate the ID length (MongoDB ObjectIds are 24 characters)
    if (cleanAssignment._id.length !== 24) {
      console.error('Assignment ID appears to be truncated:', cleanAssignment._id);
      Alert.alert('Error', 'Invalid assignment ID. Please try refreshing the page.');
      return;
    }
    
    console.log('handleFileReplacement - Clean assignment created:', {
      id: cleanAssignment._id,
      idLength: cleanAssignment._id.length,
      title: cleanAssignment.title
    });
    
    setSelectedAssignmentForReplacement(cleanAssignment);
    setShowReplacementModal(true);
    
    console.log('=== handleFileReplacement END ===');
  };

  const uploadReplacementFile = async () => {
    if (!replacementFile || !selectedAssignmentForReplacement) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }

    try {
      setUploadingReplacement(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      console.log('=== uploadReplacementFile START ===');
      console.log('selectedAssignmentForReplacement:', selectedAssignmentForReplacement);
      console.log('selectedAssignmentForReplacement._id:', selectedAssignmentForReplacement._id);
      console.log('selectedAssignmentForReplacement._id type:', typeof selectedAssignmentForReplacement._id);
      console.log('selectedAssignmentForReplacement._id length:', selectedAssignmentForReplacement._id?.length);
      
      // Validate assignment ID thoroughly
      const assignmentId = String(selectedAssignmentForReplacement._id);
      console.log('assignmentId after String() conversion:', assignmentId);
      console.log('assignmentId type after conversion:', typeof assignmentId);
      console.log('assignmentId length after conversion:', assignmentId.length);
      
      if (!assignmentId || assignmentId.length !== 24) {
        throw new Error(`Invalid assignment ID: ${assignmentId} (length: ${assignmentId?.length})`);
      }
      
      // Create form data for file upload
      const formData = new FormData();
      
      // Create the file object that FormData expects
      const fileToUpload = {
        uri: replacementFile.uri,
        type: replacementFile.type || 'application/octet-stream',
        name: replacementFile.name || 'replacement_file'
      };
      
      formData.append('replacementFile', fileToUpload);
      formData.append('studentId', user._id);
      
      console.log('=== USER ID DEBUG ===');
      console.log('user object:', user);
      console.log('user._id:', user._id);
      console.log('user._id type:', typeof user._id);
      console.log('user._id length:', user._id?.length);
      console.log('=== END USER ID DEBUG ===');
      
      // Check if submission is late
      const now = new Date();
      const dueDate = selectedAssignmentForReplacement.dueDate ? new Date(selectedAssignmentForReplacement.dueDate) : null;
      const isLate = dueDate && now > dueDate;
      
      formData.append('isLate', isLate.toString());
      formData.append('submissionTime', now.toISOString());
      
      console.log('=== FORMDATA DEBUG ===');
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      console.log('=== END FORMDATA DEBUG ===');

      // Construct URL with validated ID
      const uploadUrl = `${API_BASE}/assignments/${assignmentId}/replace-file`;
      
      console.log('=== URL CONSTRUCTION DEBUG ===');
      console.log('API_BASE:', API_BASE);
      console.log('assignmentId:', assignmentId);
      console.log('assignmentId length:', assignmentId.length);
      console.log('uploadUrl:', uploadUrl);
      console.log('uploadUrl length:', uploadUrl.length);
      console.log('=== END URL DEBUG ===');
      
      // Test URL construction by logging each part separately
      console.log('URL Construction Test:');
      console.log('  API_BASE:', `"${API_BASE}"`);
      console.log('  /assignments/:', '"/assignments/"');
      console.log('  assignmentId:', `"${assignmentId}"`);
      console.log('  /replace-file:', '"/replace-file"');
      console.log('  Final URL:', `"${uploadUrl}"`);
      
      console.log('Uploading replacement file:', {
        assignmentId: assignmentId,
        assignmentIdLength: assignmentId.length,
        uploadUrl: uploadUrl,
        fileName: replacementFile.name,
        fileSize: replacementFile.size
      });

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let the browser set it with boundary
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert(
          'Success', 
          `File replacement uploaded successfully! ${isLate ? 'Note: This is a late submission.' : 'Submitted on time.'}`,
          [{ text: 'OK', onPress: () => {
            setShowReplacementModal(false);
            setReplacementFile(null);
            setSelectedAssignmentForReplacement(null);
            fetchActivities(); // Refresh to show updated status
          }}]
        );
      } else {
        // Try to get the response as text first to see what's actually being returned
        const responseText = await response.text();
        
        // Try to parse as JSON if possible
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          errorData = { message: `Server returned HTML instead of JSON. Status: ${response.status}` };
        }
        
        Alert.alert('Error', errorData.message || 'Failed to upload replacement file.');
      }
    } catch (error) {
      console.error('Error uploading replacement file:', error);
      Alert.alert('Error', `Failed to upload replacement file: ${error.message}`);
    } finally {
      setUploadingReplacement(false);
      console.log('=== uploadReplacementFile END ===');
    }
  };

  const selectReplacementFile = async () => {
    try {
      // Check if DocumentPicker is available
      if (!isDocumentPickerAvailable()) {
        throw new Error('DocumentPicker not available on this device');
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        
        const fileData = {
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/octet-stream',
          size: selectedFile.size || 0,
          uri: selectedFile.uri
        };
        
        setReplacementFile(fileData);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      
      // Provide more specific error messages
      if (error.message === 'DocumentPicker not available on this device') {
        Alert.alert('Error', 'Document picker is not available on this device. Please try updating the app.');
      } else {
        Alert.alert('Error', `Failed to pick document: ${error.message}`);
      }
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (activity.className && activity.className.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'completed') {
      return completedActivities.includes(activity) && matchesSearch;
    }

    if (activeTab === 'upcoming') {
      if (!activity.dueDate) {
        return matchesSearch && !activity.isSubmitted;
      }
      const now = new Date();
      const dueDate = new Date(activity.dueDate);
      return dueDate > now && !activity.isSubmitted && matchesSearch;
    } else if (activeTab === 'pastDue') {
      if (!activity.dueDate) {
        return false;
      }
      const now = new Date();
      const dueDate = new Date(activity.dueDate);
      return dueDate < now && !activity.isSubmitted && matchesSearch;
    }
    
    return matchesSearch;
  });



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color="#f44336" />
        <Text style={styles.errorTitle}>Error Loading Activities</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchActivities}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Activities</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      <View style={styles.gradingTabsContainer}>
        <View style={styles.gradingTabsBar}>
          {[
            { key: 'all', label: 'All', count: activities.length },
            { key: 'upcoming', label: 'Upcoming', count: activities.filter(a => {
              if (!a.isSubmitted) {
                if (!a.dueDate) return true;
                return new Date(a.dueDate) > new Date();
              }
              return false;
            }).length },
            { key: 'pastDue', label: 'Past Due', count: activities.filter(a => !a.isSubmitted && a.dueDate && new Date(a.dueDate) < new Date()).length },
            { key: 'completed', label: 'Completed', count: completedActivities.length }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.gradingTabSegment,
                activeTab === tab.key && styles.gradingTabSegmentActive
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.gradingTabText,
                activeTab === tab.key && styles.gradingTabTextActive
              ]}>{`${tab.label} (${tab.count})`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
          [...filteredActivities].sort((a, b) => new Date(b.dueDate || b.createdAt || 0) - new Date(a.dueDate || a.createdAt || 0)).map((activity, index) => (
            <ActivityCard
              key={`${activity._id}_${index}`}
              activity={activity}
              onActivityPress={handleActivityPress}
            />
          ))
        )}
      </ScrollView>

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

            {selectedActivity ? (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalActivityHeader}>
                  <MaterialIcons 
                    name={selectedActivity.type === 'quiz' ? 'quiz' : 'assignment'} 
                    size={32} 
                    color={selectedActivity.type === 'quiz' ? '#9C27B0' : '#FF9800'} 
                  />
                  <Text style={styles.modalActivityTitle}>
                    {selectedActivity.title || 'Untitled Activity'}
                  </Text>
                  <Text style={styles.modalActivityType}>
                    {selectedActivity.type === 'quiz' ? 'Quiz' : 'Assignment'}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Details</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Class:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedActivity.className || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Due Date:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedActivity.dueDate ? formatDateTime(selectedActivity.dueDate) : 'No due date'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Points:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedActivity.type === 'quiz' 
                        ? (selectedActivity.totalPoints || selectedActivity.points || 0) 
                        : (selectedActivity.points || 0)
                      } points
                    </Text>
                  </View>
                  
                  {selectedActivity.type === 'quiz' && selectedActivity.isSubmitted && selectedActivity.score !== undefined && (
                    <>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Score:</Text>
                        <Text style={[
                          styles.modalDetailValue,
                          selectedActivity.autoAssigned && { color: '#F44336', fontStyle: 'italic' }
                        ]}>
                          {selectedActivity.score}/{selectedActivity.totalPoints || selectedActivity.points || 100}
                          {selectedActivity.autoAssigned && " (Auto-assigned)"}
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
                      {selectedActivity.autoAssigned && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Status:</Text>
                          <Text style={[styles.modalDetailValue, { color: '#F44336', fontStyle: 'italic' }]}>
                            Auto-assigned Zero (Past Due)
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
                      ? (selectedActivity.isSubmitted 
                          ? (selectedActivity.autoAssigned ? 'View Zero Score' : 'View Results')
                          : 'Take Quiz')
                      : 'View Assignment'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.modalErrorText}>No activity selected</Text>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => setShowActivityModal(false)}
                >
                  <Text style={styles.modalActionButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
                     </View>
         </View>
       </Modal>

                       {/* File Replacement Modal */}
         <Modal
           visible={showReplacementModal}
           transparent
           animationType="slide"
           onRequestClose={() => setShowReplacementModal(false)}
         >
          <View style={styles.modalOverlay}>
           <View style={styles.modal}>
                           <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Replace Assignment File</Text>
                <TouchableOpacity onPress={() => setShowReplacementModal(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              

             <View style={styles.modalContent}>
               {selectedAssignmentForReplacement && (
                 <>
                   <View style={styles.modalSection}>
                     <Text style={styles.modalSectionTitle}>Assignment Details</Text>
                     <View style={styles.modalDetailRow}>
                       <Text style={styles.modalDetailLabel}>Title:</Text>
                       <Text style={styles.modalDetailValue}>
                         {selectedAssignmentForReplacement.title}
                       </Text>
                     </View>
                     <View style={styles.modalDetailRow}>
                       <Text style={styles.modalDetailLabel}>Class:</Text>
                       <Text style={styles.modalDetailValue}>
                         {selectedAssignmentForReplacement.className}
                       </Text>
                     </View>
                     <View style={styles.modalDetailRow}>
                       <Text style={styles.modalDetailLabel}>Due Date:</Text>
                       <Text style={styles.modalDetailValue}>
                         {selectedAssignmentForReplacement.dueDate ? formatDateTime(selectedAssignmentForReplacement.dueDate) : 'No due date'}
                       </Text>
                     </View>
                     <View style={styles.modalDetailRow}>
                       <Text style={styles.modalDetailLabel}>Current Status:</Text>
                       <Text style={styles.modalDetailValue}>
                         {selectedAssignmentForReplacement.isSubmitted 
                           ? 'Submitted' 
                           : (selectedAssignmentForReplacement.dueDate && new Date(selectedAssignmentForReplacement.dueDate) < new Date())
                             ? 'Submission Closed'
                             : 'Not Submitted'
                         }
                       </Text>
                     </View>
                   </View>

                   <View style={styles.modalSection}>
                     <Text style={styles.modalSectionTitle}>Upload Replacement File</Text>
                     
                                           {replacementFile ? (
                        <View style={styles.fileInfoContainer}>
                          <MaterialIcons name="description" size={24} color="#4CAF50" />
                          <View style={styles.fileInfoText}>
                            <Text style={styles.fileName}>{replacementFile.name}</Text>
                                                     <Text style={styles.fileSize}>
                            {replacementFile.size ? (replacementFile.size / 1024 / 1024).toFixed(2) : '0'} MB
                          </Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.removeFileButton}
                            onPress={() => setReplacementFile(null)}
                          >
                            <MaterialIcons name="close" size={20} color="#F44336" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View>
                          <TouchableOpacity 
                            style={styles.fileUploadButton}
                            onPress={selectReplacementFile}
                          >
                            <MaterialIcons name="cloud-upload" size={24} color="#2196F3" />
                            <Text style={styles.fileUploadText}>Select Replacement File</Text>
                          </TouchableOpacity>
                          
                          
                        </View>
                      )}

                     <View style={styles.replacementInfoContainer}>
                       <MaterialIcons name="info" size={16} color="#FF9800" />
                       <Text style={styles.replacementInfoText}>
                         This will replace your current submission. The new file will be marked as the latest upload.
                         {selectedAssignmentForReplacement.hasReplacement && (
                           <Text style={{ fontWeight: 'bold' }}>
                             {'\n'}Previous replacements: {selectedAssignmentForReplacement.replacementCount || 1}
                           </Text>
                         )}
                       </Text>
                     </View>

                     {selectedAssignmentForReplacement.dueDate && (
                       <View style={[
                         styles.timingWarningContainer,
                         new Date() > new Date(selectedAssignmentForReplacement.dueDate) && { backgroundColor: '#ffebee' }
                       ]}>
                         <MaterialIcons 
                           name="schedule" 
                           size={16} 
                           color={new Date() > new Date(selectedAssignmentForReplacement.dueDate) ? "#F44336" : "#4CAF50"} 
                         />
                         <Text style={[
                           styles.timingWarningText,
                           new Date() > new Date(selectedAssignmentForReplacement.dueDate) && { color: "#F44336" }
                         ]}>
                           {new Date() > new Date(selectedAssignmentForReplacement.dueDate) 
                             ? "🔒 Submission Closed - Assignment is past due"
                             : "✅ Submission is on time."
                           }
                         </Text>
                       </View>
                     )}
                   </View>

                   <TouchableOpacity
                     style={[
                       styles.modalActionButton,
                       (!replacementFile || uploadingReplacement || (selectedAssignmentForReplacement.dueDate && new Date(selectedAssignmentForReplacement.dueDate) < new Date())) && styles.disabledButton
                     ]}
                     onPress={uploadReplacementFile}
                     disabled={!replacementFile || uploadingReplacement || (selectedAssignmentForReplacement.dueDate && new Date(selectedAssignmentForReplacement.dueDate) < new Date())}
                   >
                     {uploadingReplacement ? (
                       <ActivityIndicator size="small" color="#fff" />
                     ) : (
                       <Text style={styles.modalActionButtonText}>
                         {(selectedAssignmentForReplacement.dueDate && new Date(selectedAssignmentForReplacement.dueDate) < new Date())
                           ? 'Submission Closed'
                           : 'Upload Replacement File'
                         }
                       </Text>
                     )}
                   </TouchableOpacity>

                   {/* Debug button to test URL construction */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF5722', marginBottom: 10 }]}
            onPress={() => {
              const assignmentId = String(selectedAssignmentForReplacement._id);
              const testUrl = `${API_BASE}/assignments/${assignmentId}/replace-file`;
              console.log('=== DEBUG URL TEST ===');
              console.log('API_BASE:', API_BASE);
              console.log('Assignment ID:', assignmentId);
              console.log('Assignment ID length:', assignmentId.length);
              console.log('Full URL:', testUrl);
              console.log('Selected Assignment Object:', selectedAssignmentForReplacement);
              console.log('=== END DEBUG ===');
              Alert.alert('Debug Info', `ID: ${assignmentId}\nLength: ${assignmentId.length}\nURL: ${testUrl}`);
            }}
          >
            <Text style={styles.actionButtonText}>Test URL Construction</Text>
          </TouchableOpacity>

          {/* Test button to verify basic assignment route */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50', marginBottom: 10 }]}
            onPress={async () => {
              try {
                const assignmentId = String(selectedAssignmentForReplacement._id);
                const testUrl = `${API_BASE}/assignments/${assignmentId}`;
                console.log('Testing basic assignment route:', testUrl);
                
                const token = await AsyncStorage.getItem('jwtToken');
                const response = await fetch(testUrl, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('Basic assignment route working, data:', data);
                  Alert.alert('Success', 'Basic assignment route is working!');
                } else {
                  console.log('Basic assignment route failed:', response.status, response.statusText);
                  Alert.alert('Error', `Basic route failed: ${response.status}`);
                }
              } catch (error) {
                console.error('Error testing basic route:', error);
                Alert.alert('Error', `Test failed: ${error.message}`);
              }
            }}
          >
            <Text style={styles.actionButtonText}>Test Basic Assignment Route</Text>
          </TouchableOpacity>

          {/* Test button to verify test-replace endpoint */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#9C27B0', marginBottom: 10 }]}
            onPress={async () => {
              try {
                const assignmentId = String(selectedAssignmentForReplacement._id);
                const testUrl = `${API_BASE}/assignments/${assignmentId}/test-replace`;
                console.log('Testing test-replace endpoint:', testUrl);
                
                const token = await AsyncStorage.getItem('jwtToken');
                const response = await fetch(testUrl, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('Test-replace endpoint working, data:', data);
                  Alert.alert('Success', 'Test-replace endpoint is working!');
                } else {
                  console.log('Test-replace endpoint failed:', response.status, response.statusText);
                  Alert.alert('Error', `Test-replace failed: ${response.status}`);
                }
              } catch (error) {
                console.error('Error testing test-replace endpoint:', error);
                Alert.alert('Error', `Test-replace failed: ${error.message}`);
              }
            }}
          >
            <Text style={styles.actionButtonText}>Test Test-Replace Endpoint</Text>
          </TouchableOpacity>

          {/* Simple test button to verify assignment ID */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#E91E63', marginBottom: 10 }]}
            onPress={() => {
              const assignmentId = String(selectedAssignmentForReplacement._id);
              console.log('=== SIMPLE ID TEST ===');
              console.log('Assignment ID:', assignmentId);
              console.log('Assignment ID type:', typeof assignmentId);
              console.log('Assignment ID length:', assignmentId.length);
              console.log('Assignment ID first 8 chars:', assignmentId.substring(0, 8));
              console.log('Assignment ID last 8 chars:', assignmentId.substring(assignmentId.length - 8));
              console.log('=== END SIMPLE ID TEST ===');
              Alert.alert('ID Test', `ID: ${assignmentId}\nLength: ${assignmentId.length}\nFirst 8: ${assignmentId.substring(0, 8)}\nLast 8: ${assignmentId.substring(assignmentId.length - 8)}`);
            }}
          >
            <Text style={styles.actionButtonText}>Test Assignment ID</Text>
          </TouchableOpacity>

          {/* Test button to fetch assignment directly by ID */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#607D8B', marginBottom: 10 }]}
            onPress={async () => {
              try {
                const assignmentId = String(selectedAssignmentForReplacement._id);
                const testUrl = `${API_BASE}/assignments/${assignmentId}`;
                console.log('Testing direct assignment fetch:', testUrl);
                
                const token = await AsyncStorage.getItem('jwtToken');
                const response = await fetch(testUrl, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('Direct assignment fetch working, data:', data);
                  console.log('Fetched assignment ID:', data._id);
                  console.log('Fetched assignment ID type:', typeof data._id);
                  console.log('Fetched assignment ID length:', data._id?.length);
                  Alert.alert('Success', 'Direct assignment fetch working!');
                } else {
                  console.log('Direct assignment fetch failed:', response.status, response.statusText);
                  Alert.alert('Error', `Direct fetch failed: ${response.status}`);
                }
              } catch (error) {
                console.error('Error testing direct assignment fetch:', error);
                Alert.alert('Error', `Direct fetch failed: ${error.message}`);
              }
            }}
          >
            <Text style={styles.actionButtonText}>Test Direct Assignment Fetch</Text>
          </TouchableOpacity>
                 </>
               )}
             </View>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00418b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  refreshButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
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
  gradingTabsContainer: {
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  gradingTabsBar: {
    marginHorizontal: 10,
    backgroundColor: '#f1f3f8',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 2,
  },
  gradingTabSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradingTabSegmentActive: {
    backgroundColor: '#00418b',
  },
  gradingTabText: {
    color: '#3a3a3a',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  gradingTabTextActive: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    fontFamily: 'Poppins-Bold',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  retryButton: {
    backgroundColor: '#00418b',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
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
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
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
  modalErrorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Poppins-Regular',
  },
  timingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  timingText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  motivationalContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    alignItems: 'center',
  },
     motivationalText: {
     fontSize: 12,
     color: '#4CAF50',
     fontFamily: 'Poppins-Medium',
     textAlign: 'center',
   },
   replacementButton: {
     backgroundColor: '#fff3e0',
     marginRight: 8,
   },
   replacementButtonText: {
     color: '#FF9800',
     fontSize: 10,
     marginLeft: 2,
     fontFamily: 'Poppins-Medium',
   },
   fileInfoContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#f8f9fa',
     padding: 12,
     borderRadius: 8,
     marginBottom: 12,
   },
   fileInfoText: {
     flex: 1,
     marginLeft: 12,
   },
   fileName: {
     fontSize: 14,
     fontWeight: '600',
     color: '#333',
     fontFamily: 'Poppins-Medium',
   },
   fileSize: {
     fontSize: 12,
     color: '#666',
     marginTop: 2,
     fontFamily: 'Poppins-Regular',
   },
   removeFileButton: {
     padding: 4,
   },
   fileUploadButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#e3f2fd',
     padding: 16,
     borderRadius: 8,
     borderWidth: 2,
     borderColor: '#2196F3',
     borderStyle: 'dashed',
     marginBottom: 12,
   },
   fileUploadText: {
     color: '#2196F3',
     fontSize: 14,
     marginLeft: 8,
     fontFamily: 'Poppins-Medium',
   },
   replacementInfoContainer: {
     flexDirection: 'row',
     alignItems: 'flex-start',
     backgroundColor: '#fff3e0',
     padding: 12,
     borderRadius: 8,
     marginBottom: 12,
   },
   replacementInfoText: {
     color: '#E65100',
     fontSize: 12,
     marginLeft: 8,
     fontFamily: 'Poppins-Regular',
     flex: 1,
     lineHeight: 16,
   },
   timingWarningContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#e8f5e9',
     padding: 12,
     borderRadius: 8,
     marginBottom: 16,
   },
   timingWarningText: {
     color: '#4CAF50',
     fontSize: 12,
     marginLeft: 8,
     fontFamily: 'Poppins-Regular',
     flex: 1,
     lineHeight: 16,
   },
   disabledButton: {
     backgroundColor: '#ccc',
     opacity: 0.6,
   },
   replacementText: {
     color: '#FF9800',
     fontSize: 12,
     fontWeight: 'bold',
   },
   timingStatusText: {
     fontSize: 12,
     fontWeight: 'bold',
   },
   onTimeText: {
     color: '#4CAF50',
   },
   lateText: {
     color: '#FF9800',
   },
   overdueText: {
     color: '#F44336',
   },
 };
