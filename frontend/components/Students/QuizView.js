import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  AppState,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';
const { width } = Dimensions.get('window');

const QuizView = React.memo(function QuizView() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const { quizId, review } = route.params;

  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealScoreNow, setRevealScoreNow] = useState(false);
  const [revealAnswersNow, setRevealAnswersNow] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [quizCheckedAnswers, setQuizCheckedAnswers] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(!!review);
  const [violationCount, setViolationCount] = useState(0);
  const [violationEvents, setViolationEvents] = useState([]);
  const [questionTimes, setQuestionTimes] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  
  // Performance optimization: Memoize expensive calculations
  const processedQuizData = useMemo(() => {
    if (!quiz) return null;
    
    return {
      ...quiz,
      totalPoints: quiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0,
      questionCount: quiz.questions?.length || 0
    };
  }, [quiz]);
  
  // Performance optimization: Memoize current question
  const currentQuestion = useMemo(() => {
    if (!quiz?.questions || !Array.isArray(quiz.questions)) return null;
    return quiz.questions[currentQuestionIndex];
  }, [quiz?.questions, currentQuestionIndex]);
  
  // Performance optimization: Memoize current answer
  const currentAnswer = useMemo(() => {
    return answers[currentQuestionIndex];
  }, [answers, currentQuestionIndex]);

  useEffect(() => {
    console.log('QuizView useEffect triggered with:', {
      quizId,
      review,
      user: user ? { id: user._id, name: user.firstname } : null
    });
    
    // Set review mode immediately if review prop is true
    if (review) {
      console.log('Setting review mode from navigation prop');
      setIsReviewMode(true);
    }
    
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, review]);

  // Debug state changes
  useEffect(() => {
    console.log('State changed - isReviewMode:', isReviewMode, 'quizResult:', !!quizResult, 'quiz:', !!quiz);
  }, [isReviewMode, quizResult, quiz]);

  useEffect(() => {
    if (quiz && quiz.timeLimit && quiz.timeLimit > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            forceSubmitQuiz(); // Use force submit when timer expires
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz]);

  // Monitor app state changes (similar to web version's focus/blur monitoring)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Record violation event
        setViolationEvents(prev => [...prev, { 
          question: currentQuestionIndex + 1, 
          time: new Date().toISOString() 
        }]);
        setViolationCount(prev => prev + 1);
        Alert.alert('Warning', 'You have left the quiz. Your teacher will be notified.');
      }
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [currentQuestionIndex]);

  // Track question timing
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      setQuestionTimes(prev => {
        const newTimes = [...prev];
        newTimes[currentQuestionIndex] = (newTimes[currentQuestionIndex] || 0) + timeSpent;
        return newTimes;
      });
    };
  }, [currentQuestionIndex]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('Fetching quiz data for ID:', quizId);
      console.log('Token retrieved:', token ? 'Token exists' : 'No token found');
      console.log('API URL:', `${API_BASE}/api/quizzes/${quizId}`);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Test API connectivity first
      try {
        const testResponse = await fetch(`${API_BASE}/api/quizzes`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        console.log('API connectivity test - Status:', testResponse.status);
      } catch (testError) {
        console.log('API connectivity test failed:', testError.message);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE}/api/quizzes/${quizId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Try to provide more specific error information
        if (response.status === 404) {
          throw new Error('Quiz not found. It may have been deleted or you may not have permission to access it.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view this quiz.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Failed to fetch quiz: ${response.status} ${response.statusText}`);
        }
      }
      
      const quizData = await response.json();
      
      console.log('Quiz data loaded:', {
        quizId: quizData._id,
        title: quizData.title,
        questionsLength: quizData.questions?.length,
        quizPoints: quizData.points
      });
      
      if (!quizData || !quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error('Invalid quiz data received from server');
      }
      
      // Performance optimization: Pre-process data and batch state updates
      const initialAnswers = {};
      let hasTimeLimit = false;
      let timeLimitSeconds = 0;
      
      quizData.questions.forEach((question, index) => {
        if (question.type === 'multiple') {
          initialAnswers[index] = [];
        } else {
          initialAnswers[index] = '';
        }
      });
      
      if (quizData.timeLimit && quizData.timeLimit > 0) {
        hasTimeLimit = true;
        timeLimitSeconds = quizData.timeLimit * 60;
      }
      
      // Batch all state updates together for better performance
      setQuiz(quizData);
      setAnswers(initialAnswers);
      if (hasTimeLimit) {
        setTimeLeft(timeLimitSeconds);
      }

      // Check if student has already submitted this quiz (and fetch answers for review)
      try {
        const responseRes = await fetch(`${API_BASE}/api/quizzes/${quizId}/myscore?studentId=${user._id}&revealAnswers=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (responseRes.ok) {
          const responseData = await responseRes.json();
          console.log('=== QUIZ RESPONSE DEBUG ===');
          console.log('Quiz response data:', responseData);
          console.log('Checked answers structure:', responseData.checkedAnswers);
          console.log('Answers structure:', responseData.answers);
          
          // Deep dive into the data structure
          if (responseData.answers && Array.isArray(responseData.answers)) {
            console.log('=== ANSWERS ARRAY ANALYSIS ===');
            responseData.answers.forEach((answerObj, index) => {
              console.log(`Answer ${index + 1}:`, {
                fullObject: answerObj,
                keys: Object.keys(answerObj),
                answer: answerObj.answer,
                value: answerObj.value,
                text: answerObj.text,
                choice: answerObj.choice,
                type: typeof answerObj.answer,
                isNull: answerObj.answer === null,
                isUndefined: answerObj.answer === undefined
              });
            });
          }
          
          if (responseData.checkedAnswers && Array.isArray(responseData.checkedAnswers)) {
            console.log('=== CHECKED ANSWERS ANALYSIS ===');
            responseData.checkedAnswers.forEach((check, index) => {
              console.log(`Checked Answer ${index + 1}:`, {
                fullObject: check,
                keys: Object.keys(check),
                correct: check.correct,
                studentAnswer: check.studentAnswer,
                correctAnswer: check.correctAnswer,
                studentAnswerType: typeof check.studentAnswer,
                correctAnswerType: typeof check.correctAnswer
              });
            });
          }
          
          if (responseData && responseData.score !== undefined) {
            // Student has already submitted
            console.log('Quiz already submitted:', responseData);
            
            // Performance optimization: Use pre-calculated values and reduce expensive operations
            const calculatedTotal = responseData.total || quizData.points || 100;
            const percentage = responseData.percentage || Math.round(((responseData.score || 0) / calculatedTotal) * 100);
            
            console.log('Score data received:', {
              score: responseData.score,
              total: responseData.total,
              quizDataPoints: quizData.points,
              calculatedTotal: calculatedTotal
            });
            
            setQuizResult({
              score: responseData.score || 0,
              totalPoints: calculatedTotal,
              percentage: percentage,
              timeSpent: responseData.timeSpent || 0,
              submittedAt: responseData.submittedAt || null,
            });
            
            if (Array.isArray(responseData.checkedAnswers)) {
              console.log('Checked answers array length:', responseData.checkedAnswers.length);
              // Log each checked answer for debugging
              responseData.checkedAnswers.forEach((check, idx) => {
                console.log(`Question ${idx + 1} check:`, {
                  correct: check.correct,
                  studentAnswer: check.studentAnswer,
                  correctAnswer: check.correctAnswer,
                  type: typeof check.correctAnswer,
                  isArray: Array.isArray(check.correctAnswer)
                });
              });
              setQuizCheckedAnswers(responseData.checkedAnswers);
            } else {
              console.log('No checked answers array found');
              setQuizCheckedAnswers([]);
            }
            
            // Performance optimization: Simplified answer processing
            if (responseData.answers && Array.isArray(responseData.answers)) {
              const previousAnswers = {};
              responseData.answers.forEach((answerObj, index) => {
                // Extract the actual answer value from the answer object
                const answerValue = answerObj.answer || answerObj.value || answerObj.text || answerObj.choice || '';
                previousAnswers[index] = answerValue;
              });
              setAnswers(previousAnswers);
            } else if (responseData.checkedAnswers && Array.isArray(responseData.checkedAnswers)) {
              // If no answers array, try to extract from checkedAnswers
              const extractedAnswers = {};
              responseData.checkedAnswers.forEach((check, index) => {
                if (check.studentAnswer !== undefined && check.studentAnswer !== null) {
                  extractedAnswers[index] = check.studentAnswer;
                }
              });
              if (Object.keys(extractedAnswers).length > 0) {
                setAnswers(extractedAnswers);
              }
            }
            
            // Performance optimization: Create fallback answers only if needed
            if (Object.keys(answers).length === 0 && quizData.questions) {
              const fallbackAnswers = {};
              quizData.questions.forEach((_, index) => {
                fallbackAnswers[index] = 'Answer not loaded';
              });
              setAnswers(fallbackAnswers);
            }
            
            // If explicitly in review mode, render full quiz with answers (no modal)
            if (review) {
              console.log('Setting review mode from navigation prop');
              setIsReviewMode(true);
              
              // Ensure we have quizResult set for review mode
              if (!quizResult) {
                console.log('Setting quizResult for review mode');
                setQuizResult({
                  score: responseData.score || 0,
                  totalPoints: calculatedTotal,
                  percentage: responseData.percentage || Math.round(((responseData.score || 0) / calculatedTotal) * 100),
                  timeSpent: responseData.timeSpent || 0,
                  submittedAt: responseData.submittedAt || null,
                });
              }
            } else {
              console.log('Setting review mode from quiz submission');
              setShowResultsModal(true);
              setIsReviewMode(true);
            }
          }
        } else {
          console.log('Response not ok:', responseRes.status);
          
          // Performance optimization: Create fallback data only if needed
          if (review) {
            console.log('Creating fallback quizResult for review mode');
            const calculatedTotal = quizData.points || 100; // Use pre-calculated value
            setQuizResult({
              score: 0,
              totalPoints: calculatedTotal,
              percentage: 0,
              timeSpent: 0,
              submittedAt: null,
            });
            
            // Create fallback answers for review mode
            const fallbackAnswers = {};
            quizData.questions.forEach((_, index) => {
              fallbackAnswers[index] = 'Answer not loaded';
            });
            setAnswers(fallbackAnswers);
            
            // Create fallback checkedAnswers for review mode
            const fallbackCheckedAnswers = [];
            quizData.questions.forEach((_, index) => {
              fallbackCheckedAnswers.push({
                correct: false,
                studentAnswer: 'Answer not loaded',
                correctAnswer: null
              });
            });
            setQuizCheckedAnswers(fallbackCheckedAnswers);
          }
        }
      } catch (responseError) {
        console.log('Error checking quiz response:', responseError);
        
        // If in review mode but error occurred, create a basic quizResult
        if (review) {
          console.log('Creating fallback quizResult due to error');
          const calculatedTotal = quizData.questions.reduce((sum, q) => sum + (q.points || 1), 0);
          setQuizResult({
            score: 0,
            totalPoints: calculatedTotal,
            percentage: 0,
            timeSpent: 0,
            submittedAt: null,
          });
          
          // Also create fallback answers for review mode
          const fallbackAnswers = {};
          quizData.questions.forEach((_, index) => {
            fallbackAnswers[index] = 'Answer not loaded';
          });
          setAnswers(fallbackAnswers);
          
          // Create fallback checkedAnswers for review mode
          const fallbackCheckedAnswers = [];
          quizData.questions.forEach((_, index) => {
            fallbackCheckedAnswers.push({
              correct: false,
              studentAnswer: 'Answer not loaded',
              correctAnswer: null
            });
          });
          setQuizCheckedAnswers(fallbackCheckedAnswers);
        }
      }
          } catch (error) {
        console.error('Error fetching quiz:', error);
        
        // Handle specific error types
        let errorMessage = error.message || 'Failed to load quiz';
        
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        // Log additional debugging information
        console.log('Quiz fetch error details:', {
          quizId,
          error: error.message,
          errorName: error.name,
          user: user ? { id: user._id, name: user.firstname } : null,
          timestamp: new Date().toISOString()
        });
        
        // Set error state for better user experience
        setError(errorMessage);
        setLoading(false);
        
        // Don't navigate back immediately, let user see the error and retry
      }
  };

  // Performance optimization: Memoize event handlers
  const handleAnswerChange = useCallback((questionIndex, value, isMultipleChoice = false) => {
    if (isMultipleChoice) {
      setAnswers(prev => {
        const currentAnswers = prev[questionIndex] || [];
        if (currentAnswers.includes(value)) {
          return {
            ...prev,
            [questionIndex]: currentAnswers.filter(ans => ans !== value)
          };
        } else {
          return {
            ...prev,
            [questionIndex]: [...currentAnswers, value]
          };
        }
      });
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionIndex]: value
      }));
    }
  }, []);

  // Performance optimization: Memoize choice selection handler
  const handleChoiceSelect = useCallback((choice, questionType) => {
    if (isReviewMode) return; // Disable in review mode
    
    if (questionType === 'multiple') {
      // For multiple choice, toggle the selection
      const currentAnswers = answers[currentQuestionIndex] || [];
      if (currentAnswers.includes(choice)) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestionIndex]: currentAnswers.filter(ans => ans !== choice)
        }));
      } else {
        setAnswers(prev => ({
          ...prev,
          [currentQuestionIndex]: [...currentAnswers, choice]
        }));
      }
    } else {
      // For single choice (true/false, etc.)
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: choice
      }));
    }
  }, [isReviewMode, answers, currentQuestionIndex]);

  // Performance optimization: Memoize text input handler
  const handleTextInput = useCallback((text, questionIndex) => {
    if (isReviewMode) return; // Disable in review mode
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: text
    }));
  }, [isReviewMode]);

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Check for unanswered questions (similar to web version)
      const unanswered = [];
      Object.keys(answers).forEach(index => {
        const questionIndex = parseInt(index);
        const question = quiz.questions[questionIndex];
        const answer = answers[index];
        
        if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
          unanswered.push(questionIndex + 1);
        }
      });
      
      if (unanswered.length > 0) {
        setUnansweredQuestions(unanswered);
        setShowUnansweredModal(true);
        setSubmitting(false);
        return;
      }
      
      await submitQuiz();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Force submit when timer expires (ignores unanswered questions)
  const forceSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      await submitQuiz();
    } catch (error) {
      console.error('Error force submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Common submission logic
  const submitQuiz = async () => {
    // Record time for current question before submitting
    const currentTime = Date.now();
    const timeSpent = Math.floor((currentTime - questionStartTime) / 1000);
    setQuestionTimes(prev => {
      const newTimes = [...prev];
      newTimes[currentQuestionIndex] = (newTimes[currentQuestionIndex] || 0) + timeSpent;
      return newTimes;
    });
    
    // Format answers to match the QuizResponse model
    const formattedAnswers = Object.keys(answers).map(index => {
      const questionIndex = parseInt(index);
      const question = quiz.questions[questionIndex];
      return {
        questionId: question._id || questionIndex, // Use question ID if available, fallback to index
        answer: answers[index]
      };
    });

    try {
      setSubmitting(true);
      
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_BASE}/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: user._id,
          answers: formattedAnswers,
          violationCount: violationCount,
          violationEvents: violationEvents,
          questionTimes: questionTimes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      console.log('Quiz submission result:', result);
      
      // Use backend totals when provided
      const calculatedScore = result.score || 0;
      const totalPoints = typeof result.total === 'number' ? result.total : (quiz.points || 100);
      const percentage = typeof result.percentage === 'number' ? result.percentage : Math.round((calculatedScore / (totalPoints || 1)) * 100);

      setQuizResult({
        score: calculatedScore,
        totalPoints: totalPoints,
        percentage: percentage,
        timeSpent: result.timeSpent || 0,
        submittedAt: result.submittedAt || new Date().toISOString(),
      });

      // Ask user whether to reveal now
      setShowRevealModal(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Performance optimization: Memoize question rendering function
  const renderQuestion = useCallback((question, index) => {
    const isCurrentQuestion = index === currentQuestionIndex;
    const currentAnswer = answers[index];
    const checked = Array.isArray(quizCheckedAnswers) ? quizCheckedAnswers[index] : null;
    const revealAnswers = isReviewMode && !!checked;

    // In review mode, show all questions, not just current
    if (!isReviewMode && !isCurrentQuestion) return null;

    // Fallback: if no checked data but in review mode, create a basic structure
    const safeChecked = checked || (isReviewMode ? { correct: false, studentAnswer: currentAnswer, correctAnswer: null } : null);
    const safeRevealAnswers = isReviewMode && !!safeChecked;

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Question {index + 1} of {questionsCount}</Text>
          <Text style={styles.questionPoints}>{question.points || 1} point{question.points !== 1 ? 's' : ''}</Text>
        </View>
        
        <Text style={styles.questionText}>{question.question}</Text>
        
        {/* Show student's answer and correct answer in review mode */}
        {safeRevealAnswers && safeChecked && (
          <View style={styles.answerFeedback}>
            <Text style={styles.answerLabel}>Your answer: </Text>
            <Text style={[
              styles.answerText, 
              { color: safeChecked.correct ? '#4CAF50' : '#F44336' }
            ]}>
              {(() => {
                if (Array.isArray(currentAnswer)) {
                  return currentAnswer.join(', ') || 'No answer';
                } else if (currentAnswer === undefined || currentAnswer === null || currentAnswer === '') {
                  return 'No answer';
                } else {
                  return currentAnswer;
                }
              })()}
            </Text>
            {!safeChecked.correct && safeChecked.correctAnswer && (
              <>
                <Text style={styles.answerLabel}>Correct answer: </Text>
                <Text style={[styles.answerText, { color: '#4CAF50' }]}>
                  {(() => {
                    if (question.type === 'multiple') {
                      if (Array.isArray(safeChecked.correctAnswer)) {
                        return safeChecked.correctAnswer.join(', ');
                      } else {
                        return safeChecked.correctAnswer;
                      }
                    } else {
                      return safeChecked.correctAnswer;
                    }
                  })()}
                </Text>
              </>
            )}
          </View>
        )}

        {question.type === 'multiple' && (
          <View style={styles.choicesContainer}>
            {question.choices.map((choice, choiceIndex) => {
              // Handle both cases: student answer might be stored as choice text or choice index
              const isSelected = Array.isArray(currentAnswer) 
                ? currentAnswer.includes(choiceIndex) || currentAnswer.includes(choice)
                : currentAnswer === choiceIndex || currentAnswer === choice;
              
              // For multiple choice, check if this choice is the correct answer
              let isCorrectAnswer = false;
              if (safeRevealAnswers && safeChecked && safeChecked.correctAnswer !== undefined) {
                if (Array.isArray(safeChecked.correctAnswer)) {
                  // Multiple correct answers (array of values)
                  isCorrectAnswer = safeChecked.correctAnswer.includes(choice);
                } else if (typeof safeChecked.correctAnswer === 'string') {
                  // Single correct answer (text)
                  isCorrectAnswer = safeChecked.correctAnswer === choice;
                }
              }

              const choiceStyle = [
                styles.choice,
                isSelected && styles.selectedChoice,
                safeRevealAnswers && isCorrectAnswer && styles.correctChoice,
                safeRevealAnswers && isSelected && !safeChecked.correct && styles.incorrectChoice
              ];

              return (
                <View key={choiceIndex} style={styles.choiceRow}>
                  <TouchableOpacity
                    style={choiceStyle}
                    disabled={isReviewMode} // Disable in review mode
                    onPress={() => !isReviewMode && handleChoiceSelect(choiceIndex, question.type)}
                  >
                    <Text style={[
                      styles.choiceText,
                      isSelected && styles.selectedChoiceText,
                      safeRevealAnswers && isCorrectAnswer && styles.correctChoiceText,
                      safeRevealAnswers && isSelected && !safeChecked.correct && styles.incorrectChoiceText
                    ]}>
                      {choice}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {question.type === 'truefalse' && (
          <View style={styles.choicesContainer}>
            {['True', 'False'].map((choice, choiceIndex) => {
              const isSelected = currentAnswer === choice;
              const isCorrectAnswer = safeRevealAnswers && safeChecked && safeChecked.correctAnswer === choice;
              
              const choiceStyle = [
                styles.choice,
                isSelected && styles.selectedChoice,
                safeRevealAnswers && isCorrectAnswer && styles.correctChoice,
                safeRevealAnswers && isSelected && !safeChecked.correct && styles.incorrectChoice
              ];

              return (
                <View key={choiceIndex} style={styles.choiceRow}>
                  <TouchableOpacity
                    style={choiceStyle}
                    disabled={isReviewMode} // Disable in review mode
                    onPress={() => !isReviewMode && handleChoiceSelect(choice, question.type)}
                  >
                    <Text style={[
                      styles.choiceText,
                      isSelected && styles.selectedChoiceText,
                      safeRevealAnswers && isCorrectAnswer && styles.correctChoiceText,
                      safeRevealAnswers && isSelected && !safeChecked.correct && styles.incorrectChoiceText
                    ]}>
                      {choice}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {question.type === 'identification' && (
          <View style={styles.identificationContainer}>
            <TextInput
              style={[
                styles.identificationInput,
                safeRevealAnswers && safeChecked && safeChecked.correct && styles.correctAnswer,
                safeRevealAnswers && safeChecked && !safeChecked.correct && styles.incorrectAnswer
              ]}
              placeholder="Type your answer..."
              value={currentAnswer || ''}
              onChangeText={(text) => !isReviewMode && handleTextInput(text, index)}
              editable={!isReviewMode} // Disable in review mode
            />
            {safeRevealAnswers && safeChecked && safeChecked.correctAnswer && (
              <Text style={{ fontSize: 14, color: '#4CAF50', marginTop: 4 }}>
                Correct answer: {safeChecked.correctAnswer}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }, [currentQuestionIndex, answers, quizCheckedAnswers, isReviewMode, quiz.questions?.length, handleTextInput]);

  // Performance optimization: Memoize navigation handlers
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, quiz.questions?.length]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex]);

  // Performance optimization: Memoize availability check
  const isAvailable = useCallback(() => {
    if (!quiz) return false;
    const now = new Date();
    
    // Check if quiz is open
    if (quiz.timing?.open && new Date(quiz.timing.open) > now) {
      return false;
    }
    
    // Check if quiz is closed
    if (quiz.timing?.close && new Date(quiz.timing.close) < now) {
      return false;
    }
    
    return true;
  }, [quiz]);

  if (loading && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>
          {isReviewMode ? 'Loading quiz review...' : 'Loading quiz...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#f44336" />
        <Text style={styles.errorTitle}>Failed to Load Quiz</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchQuiz();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Quiz not found</Text>
      </View>
    );
  }

  // Performance optimization: Use memoized values instead of recalculating
  const questionsCount = processedQuizData?.questionCount || 0;
  const totalPoints = processedQuizData?.totalPoints || 0;

  // Check quiz availability
  if (!isAvailable()) {
    const openTime = quiz.timing?.open ? new Date(quiz.timing.open) : null;
    const closeTime = quiz.timing?.close ? new Date(quiz.timing.close) : null;
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Not Available</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.quizTitle}>{quiz.title}</Text>
            <Text style={styles.quizDescription}>
              This quiz is not available at this time.
            </Text>
            
            {openTime && (
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Opens:</Text>
                <Text style={styles.timeValue}>
                  {openTime.toLocaleString()}
                </Text>
              </View>
            )}
            
            {closeTime && (
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Closes:</Text>
                <Text style={styles.timeValue}>
                  {closeTime.toLocaleString()}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back to Activities</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz.title}</Text>
        {!isReviewMode && timeLeft !== null && (
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={20} color="white" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {/* Score Header - Show in review mode when quiz result exists */}
      {isReviewMode && quizResult && (
        <View style={styles.scoreHeader}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreTitle}>Quiz Results</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Score:</Text>
              <Text style={styles.scoreValue}>
                {quizResult.score || 0} / {quizResult.totalPoints || 0}
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Percentage:</Text>
              <Text style={styles.scoreValue}>
                {quizResult.percentage || 0}%
              </Text>
            </View>
            {quizResult.timeSpent && (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Time Spent:</Text>
                <Text style={styles.scoreValue}>
                  {formatTime(quizResult.timeSpent || 0)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Fallback score display for review mode */}
      {isReviewMode && !quizResult && (
        <View style={styles.scoreHeader}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreTitle}>Quiz Review Mode</Text>
            <Text style={styles.scoreText}>Loading quiz results...</Text>
          </View>
        </View>
      )}

      {/* Progress Bar - Only show in quiz mode */}
      {!isReviewMode && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1} / {quiz.questions.length}
          </Text>
        </View>
      )}

      {/* Questions */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {isReviewMode ? (
          // In review mode, show all questions
          quiz.questions.map((question, index) => renderQuestion(question, index))
        ) : (
          // In quiz mode, show only current question
          currentQuestion && renderQuestion(currentQuestion, currentQuestionIndex)
        )}
      </ScrollView>

      {/* Navigation - Only show in quiz mode */}
      {!isReviewMode && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentQuestionIndex === 0 && styles.disabledButton
            ]}
            onPress={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <MaterialIcons name="navigate-before" size={24} color="white" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {currentQuestionIndex === questionsCount - 1 ? (
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={() => setShowSubmitModal(true)}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToNextQuestion}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <MaterialIcons name="navigate-next" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Question Navigation for Review Mode */}
      {isReviewMode && (
        <View style={styles.reviewNavigationContainer}>
          <Text style={styles.reviewNavigationTitle}>Navigate to Question:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.questionNumbersContainer}>
            {Array.from({ length: questionsCount }, (_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.questionNumberButton,
                  currentQuestionIndex === index && styles.currentQuestionButton
                ]}
                onPress={() => setCurrentQuestionIndex(index)}
              >
                <Text style={[
                  styles.questionNumberText,
                  currentQuestionIndex === index && styles.currentQuestionNumberText
                ]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Submit Quiz?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to submit your quiz? You won't be able to change your answers after submission.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSubmit}
                onPress={() => {
                  setShowSubmitModal(false);
                  handleSubmitQuiz();
                }}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unanswered Questions Warning Modal */}
      <Modal
        visible={showUnansweredModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnansweredModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Unanswered Questions</Text>
            <Text style={styles.modalText}>
              You have unanswered questions: {unansweredQuestions.join(', ')}
            </Text>
            <Text style={styles.modalText}>
              Are you sure you want to submit with unanswered questions?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowUnansweredModal(false)}
              >
                <Text style={styles.modalButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSubmit}
                onPress={() => {
                  setShowUnansweredModal(false);
                  // Submit anyway
                  forceSubmitQuiz();
                }}
              >
                <Text style={styles.modalButtonText}>Submit Anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowResultsModal(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultsModal}>
            <View style={styles.resultsHeader}>
              <MaterialIcons 
                name="check-circle" 
                size={64} 
                color="#4CAF50" 
              />
              <Text style={styles.resultsTitle}>Quiz Submitted!</Text>
            </View>

            {quizResult && (
              <View style={styles.resultsContent}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Score:</Text>
                  <Text style={styles.resultValue}>
                    {quizResult.score || 0} / {quizResult.totalPoints || 0}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Percentage:</Text>
                  <Text style={styles.resultValue}>
                    {quizResult.percentage || 0}%
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Time Spent:</Text>
                  <Text style={styles.resultValue}>
                    {formatTime(quizResult.timeSpent || 0)}
                  </Text>
                </View>
                {Array.isArray(quizCheckedAnswers) && quizCheckedAnswers.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.resultLabel, { marginBottom: 8 }]}>Answers:</Text>
                    {quizCheckedAnswers.map((it, idx) => (
                      <View key={idx} style={{ paddingVertical: 6 }}>
                        <Text style={{ fontSize: 14, color: '#333' }}>Q{idx + 1}: {it.correct ? 'Correct' : 'Incorrect'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.resultsButton}
              onPress={() => {
                setShowResultsModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.resultsButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reveal Options Modal */}
      <Modal
        visible={showRevealModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRevealModal(false);
          setShowResultsModal(true);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>View Results</Text>
            <Text style={styles.modalText}>Choose what to reveal now.</Text>

            <TouchableOpacity
              onPress={() => setRevealScoreNow(!revealScoreNow)}
              style={[styles.choiceButton, revealScoreNow && styles.selectedChoice]}
            >
              <MaterialIcons
                name={revealScoreNow ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={revealScoreNow ? '#00418b' : '#ccc'}
              />
              <Text style={[styles.choiceText, revealScoreNow && styles.selectedChoiceText]}>
                Show score now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRevealAnswersNow(!revealAnswersNow)}
              style={[styles.choiceButton, revealAnswersNow && styles.selectedChoice]}
            >
              <MaterialIcons
                name={revealAnswersNow ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={revealAnswersNow ? '#00418b' : '#ccc'}
              />
              <Text style={[styles.choiceText, revealAnswersNow && styles.selectedChoiceText]}>
                Show correct answers now
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowRevealModal(false);
                  setShowResultsModal(true);
                }}
              >
                <Text style={styles.modalButtonText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSubmit}
                onPress={async () => {
                  try {
                    setShowRevealModal(false);
                    if (!revealScoreNow && !revealAnswersNow) {
                      setShowResultsModal(true);
                      return;
                    }
                    const token = await AsyncStorage.getItem('jwtToken');
                    const res = await fetch(`${API_BASE}/api/quizzes/${quizId}/myscore?studentId=${user._id}&revealAnswers=${revealAnswersNow ? 'true' : 'false'}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setQuizResult({
                        score: data.score || 0,
                        totalPoints: typeof data.total === 'number' ? data.total : (quizResult?.totalPoints || 0),
                        percentage: typeof data.percentage === 'number' ? data.percentage : (quizResult?.percentage || 0),
                        timeSpent: data.timeSpent || quizResult?.timeSpent || 0,
                        submittedAt: data.submittedAt || quizResult?.submittedAt,
                      });
                      setQuizCheckedAnswers(revealAnswersNow ? (data.checkedAnswers || []) : null);
                    }
                    setShowResultsModal(true);
                  } catch (e) {
                    setShowResultsModal(true);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Show</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

export default QuizView;

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00418b',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00418b',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  questionPoints: {
    fontSize: 14,
    color: '#00418b',
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    marginBottom: 20,
  },
  imageContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  imageText: {
    color: '#666',
    fontSize: 14,
  },
  choicesContainer: {
    marginBottom: 20,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  selectedChoice: {
    borderColor: '#00418b',
    backgroundColor: '#e3f2fd',
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedChoiceText: {
    color: '#00418b',
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00418b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: width - 40,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonSubmit: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: width - 40,
    alignItems: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  resultsContent: {
    width: '100%',
    marginBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  resultsButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  resultsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  quizDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonContainer: {
    backgroundColor: '#00418b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  scoreHeader: {
    backgroundColor: '#f0f8ff', // Light blue background
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreContainer: {
    width: '100%',
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  reviewNavigationContainer: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  reviewNavigationTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  questionNumbersContainer: {
    flexDirection: 'row',
  },
  questionNumberButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  currentQuestionButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  questionNumberText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  currentQuestionNumberText: {
    color: 'white',
  },
  answerFeedback: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f7fbff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  answerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  correctChoice: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  incorrectChoice: {
    borderColor: '#F44336',
    backgroundColor: '#ffebee',
  },
  correctChoiceText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  incorrectChoiceText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  identificationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f7fbff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  identificationInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  correctAnswer: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  incorrectAnswer: {
    borderColor: '#F44336',
    backgroundColor: '#ffebee',
  },
  choiceRow: {
    marginBottom: 8,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  selectedChoice: {
    borderColor: '#00418b',
    backgroundColor: '#e3f2fd',
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedChoiceText: {
    color: '#00418b',
    fontWeight: 'bold',
  },
};
