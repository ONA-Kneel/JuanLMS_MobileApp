import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  StyleSheet,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTimer } from '../../TimerContext';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';
const { width } = Dimensions.get('window');

const QuizView = React.memo(function QuizView() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const { quizId, review } = route.params;
  const { startTimer, removeTimer, getRemainingTime, formatTime, pauseTimer, resumeTimer } = useTimer();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
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

  useEffect(() => {
    if (quiz && !review && quiz.timing?.duration) {
      const duration = quiz.timing.duration;
      setTimeRemaining(duration);
      
      // Start timer when quiz begins
      if (quizStarted) {
        startTimer(quizId, duration, handleTimeUp);
      }
    }
    
    return () => {
      if (quizId) {
        removeTimer(quizId);
      }
    };
  }, [quiz, quizStarted, review]);

  const handleTimeUp = () => {
    Alert.alert(
      'Time\'s Up!',
      'The quiz time has expired. Your answers will be submitted automatically.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Auto-submit quiz
            submitQuiz();
          }
        }
      ]
    );
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(new Date());
    if (quiz.timing?.duration) {
      startTimer(quizId, quiz.timing.duration, handleTimeUp);
    }
  };

  const pauseQuiz = () => {
    if (quiz.timing?.duration) {
      pauseTimer(quizId);
      setIsPaused(true);
    }
  };

  const resumeQuiz = () => {
    if (quiz.timing?.duration) {
      const remaining = getRemainingTime(quizId);
      if (remaining > 0) {
        resumeTimer(quizId, remaining, handleTimeUp);
        setIsPaused(false);
      }
    }
  };

  const renderTimer = () => {
    if (review || !quiz.timing?.duration || !quizStarted) return null;
    
    const remaining = getRemainingTime(quizId);
    const isLowTime = remaining <= 60; // Show warning when less than 1 minute
    
    return (
      <View style={[styles.timerContainer, isLowTime && styles.timerWarning]}>
        <MaterialIcons 
          name="timer" 
          size={24} 
          color={isLowTime ? '#f44336' : '#2196F3'} 
        />
        <Text style={[styles.timerText, isLowTime && styles.timerWarningText]}>
          {formatTime(remaining)}
        </Text>
        {isPaused && (
          <TouchableOpacity onPress={resumeQuiz} style={styles.resumeButton}>
            <MaterialIcons name="play-arrow" size={20} color="#4CAF50" />
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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

  // Safety check: ensure current question index is valid when quiz changes
  useEffect(() => {
    if (quiz?.questions && Array.isArray(quiz.questions) && currentQuestionIndex >= quiz.questions.length) {
      setCurrentQuestionIndex(0);
    }
  }, [quiz, currentQuestionIndex]);
  
  // Debug: Monitor answers state changes
  useEffect(() => {
    console.log('=== ANSWERS STATE CHANGE DEBUG ===');
    console.log('Answers state updated:', answers);
    console.log('Current question index:', currentQuestionIndex);
    console.log('Answers keys:', Object.keys(answers));
    if (quiz?.questions) {
      console.log('Current question:', quiz.questions[currentQuestionIndex]);
      console.log('Current answer:', answers[currentQuestionIndex]);
      console.log('All questions have answers:', quiz.questions.map((q, i) => ({ 
        questionIndex: i, 
        hasAnswer: answers[i] !== undefined,
        answerValue: answers[i]
      })));
    }
  }, [answers, currentQuestionIndex, quiz?.questions]);

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
      setError(null);
      
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('Fetching quiz data for ID:', quizId);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Performance optimization: Use Promise.all to fetch quiz and response simultaneously
      const [quizResponse, responseResponse] = await Promise.allSettled([
        // Fetch quiz data
        fetch(`${API_BASE}/api/quizzes/${quizId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }),
        // Fetch student response data (if exists)
        fetch(`${API_BASE}/api/quizzes/${quizId}/myscore?studentId=${user._id}&revealAnswers=true`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      // Handle quiz data
      if (quizResponse.status === 'rejected') {
        throw new Error(`Failed to fetch quiz: ${quizResponse.reason.message}`);
      }
      
      if (!quizResponse.value.ok) {
        const errorText = await quizResponse.value.text();
        console.error('Quiz API Error Response:', errorText);
        
        if (quizResponse.value.status === 404) {
          throw new Error('Quiz not found. It may have been deleted or you may not have permission to access it.');
        } else if (quizResponse.value.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (quizResponse.value.status === 403) {
          throw new Error('Access denied. You do not have permission to view this quiz.');
        } else if (quizResponse.value.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Failed to fetch quiz: ${quizResponse.value.status} ${quizResponse.value.statusText}`);
        }
      }
      
      const quizData = await quizResponse.value.json();
      
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
      
      console.log('=== QUIZ LOADING DEBUG ===');
      console.log('Quiz questions:', quizData.questions);
      
      // Ensure all questions have answers initialized
      for (let i = 0; i < quizData.questions.length; i++) {
        const question = quizData.questions[i];
        
        console.log(`Question ${i}:`, {
          id: question._id,
          type: question.type,
          text: question.question,
          choices: question.choices,
          correctAnswers: question.correctAnswers,
          correctAnswer: question.correctAnswer
        });
        
        if (question.type === 'multiple') {
          initialAnswers[i] = [];
        } else {
          initialAnswers[i] = '';
        }
      }
      
      console.log('Initial answers structure:', initialAnswers);
      console.log('Answers keys:', Object.keys(initialAnswers));
      console.log('Expected question count:', quizData.questions.length);
      
      if (quizData.timeLimit && quizData.timeLimit > 0) {
        hasTimeLimit = true;
        timeLimitSeconds = quizData.timeLimit * 60;
      }
      
      // Batch all state updates together for better performance
      setQuiz(quizData);
      setAnswers(initialAnswers);
      
      // Debug: Log the initial state
      console.log('=== STATE UPDATE DEBUG ===');
      console.log('Quiz data set:', quizData._id);
      console.log('Initial answers set:', initialAnswers);
      console.log('Answers state should now contain:', Object.keys(initialAnswers).length, 'questions');
      console.log('Answers validation after initialization:');
      console.log('- All questions have answers:', Object.keys(initialAnswers).length === quizData.questions.length);
      console.log('- Answer types:', Object.keys(initialAnswers).map(key => ({
        questionIndex: key,
        answerType: typeof initialAnswers[key],
        answerValue: initialAnswers[key],
        isArray: Array.isArray(initialAnswers[key])
      })));
      if (hasTimeLimit) {
        setTimeLeft(timeLimitSeconds);
      }

      // Safety check: ensure current question index is within bounds
      if (currentQuestionIndex >= quizData.questions.length) {
        setCurrentQuestionIndex(0);
      }

      // Handle student response data (if exists)
      if (responseResponse.status === 'fulfilled' && responseResponse.value.ok) {
        const responseData = await responseResponse.value.json();
        console.log('=== QUIZ RESPONSE DEBUG ===');
        console.log('Quiz response data:', responseData);
        
        if (responseData && responseData.score !== undefined) {
          // Student has already submitted
          console.log('Quiz already submitted:', responseData);
          
          // Performance optimization: Use pre-calculated values and reduce expensive operations
          const calculatedTotal = responseData.total || quizData.points || 100;
          const percentage = responseData.percentage || Math.round(((responseData.score || 0) / calculatedTotal) * 100);
          
          setQuizResult({
            score: responseData.score || 0,
            totalPoints: calculatedTotal,
            percentage: percentage,
            timeSpent: responseData.timeSpent || 0,
            submittedAt: responseData.submittedAt || null,
          });
          
          if (Array.isArray(responseData.checkedAnswers)) {
            setQuizCheckedAnswers(responseData.checkedAnswers);
          } else {
            setQuizCheckedAnswers([]);
          }
          
          // Performance optimization: Simplified answer processing
          if (responseData.answers && Array.isArray(responseData.answers)) {
            const previousAnswers = {};
            responseData.answers.forEach((answerObj, index) => {
              const answerValue = answerObj.answer || answerObj.value || answerObj.text || answerObj.choice || '';
              previousAnswers[index] = answerValue;
            });
            setAnswers(previousAnswers);
          }
          
          // If explicitly in review mode, render full quiz with answers (no modal)
          if (review) {
            console.log('Setting review mode from navigation prop');
            setIsReviewMode(true);
          } else {
            console.log('Setting review mode from quiz submission');
            setShowResultsModal(true);
            setIsReviewMode(true);
          }
        }
      } else {
        console.log('No previous quiz response found or error occurred');
        setQuizCheckedAnswers([]);
      }
      
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError(error.message);
      setQuiz(null);
      setAnswers({});
    } finally {
      setLoading(false);
    }
  };

  // Performance optimization: Memoize event handlers
  const handleAnswerChange = useCallback((questionIndex, value, isMultipleChoice = false) => {
    console.log(`handleAnswerChange called: questionIndex=${questionIndex}, value=${value}, isMultipleChoice=${isMultipleChoice}`);
    
    if (isMultipleChoice) {
      setAnswers(prev => {
        const currentAnswers = prev[questionIndex] || [];
        const newAnswers = currentAnswers.includes(value) 
          ? currentAnswers.filter(ans => ans !== value)
          : [...currentAnswers, value];
        
        console.log(`Multiple choice answer updated for question ${questionIndex}:`, newAnswers);
        return {
          ...prev,
          [questionIndex]: newAnswers
        };
      });
    } else {
      setAnswers(prev => {
        const newAnswers = { ...prev, [questionIndex]: value };
        console.log(`Single choice answer updated for question ${questionIndex}:`, value);
        console.log('Updated answers state:', newAnswers);
        return newAnswers;
      });
    }
  }, []);

  // Performance optimization: Memoize choice selection handler
  const handleChoiceSelect = useCallback((choice, questionType) => {
    if (isReviewMode) return; // Disable in review mode
    
    console.log(`handleChoiceSelect called: choice=${choice}, questionType=${questionType}, currentQuestionIndex=${currentQuestionIndex}`);
    
    if (questionType === 'multiple') {
      // For multiple choice, toggle the selection
      const currentAnswers = answers[currentQuestionIndex] || [];
      const newAnswers = currentAnswers.includes(choice)
        ? currentAnswers.filter(ans => ans !== choice)
        : [...currentAnswers, choice];
      
      console.log(`Multiple choice selection updated for question ${currentQuestionIndex}:`, newAnswers);
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: newAnswers
      }));
    } else {
      // For single choice (true/false, etc.)
      console.log(`Single choice selection updated for question ${currentQuestionIndex}:`, choice);
      setAnswers(prev => {
        const newAnswers = { ...prev, [currentQuestionIndex]: choice };
        console.log('Updated answers state:', newAnswers);
        return newAnswers;
      });
    }
  }, [isReviewMode, answers, currentQuestionIndex]);

  // Performance optimization: Memoize text input handler
  const handleTextInput = useCallback((text, questionIndex) => {
    if (isReviewMode) return; // Disable in review mode
    
    console.log(`handleTextInput called: text=${text}, questionIndex=${questionIndex}`);
    
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionIndex]: text };
      console.log(`Text input updated for question ${questionIndex}:`, text);
      console.log('Updated answers state:', newAnswers);
      return newAnswers;
    });
  }, [isReviewMode]);

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Check for unanswered questions (similar to web version)
      const unanswered = [];
      console.log('=== ANSWER VALIDATION DEBUG ===');
      console.log('Current answers state:', answers);
      console.log('Quiz questions count:', quiz.questions.length);
      console.log('Answers keys:', Object.keys(answers));
      
      // Check all questions, not just the ones with answers
      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        const answer = answers[i];
        
        console.log(`Question ${i + 1}:`, {
          questionText: question?.question,
          questionType: question?.type,
          answer: answer,
          answerType: typeof answer,
          isArray: Array.isArray(answer),
          isEmpty: !answer || (Array.isArray(answer) && answer.length === 0) || answer === ''
        });
        
        if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
          unanswered.push(i + 1);
        }
      }
      
      console.log('Unanswered questions:', unanswered);
      
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
    
          // Format answers to match what the backend expects
      // The backend expects answers array with objects containing questionId and answer
      const formattedAnswers = [];
      
      console.log('=== ANSWER FORMATTING DEBUG ===');
      console.log('Processing answers for submission...');
      
      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        const answer = answers[i];
        
        console.log(`Question ${i}:`, {
          questionId: question?._id,
          questionType: question?.type,
          answer: answer,
          answerType: typeof answer,
          isArray: Array.isArray(answer)
        });
        
        if (!question || !question._id) {
          console.error(`Question ${i} is missing _id:`, question);
          continue;
        }
        
        // For the backend submission, we need to send answers in the format:
        // [{ questionId: "id1", answer: "value1" }, { questionId: "id2", answer: "value2" }]
        const formattedAnswer = {
          questionId: question._id,
          answer: answer || (question.type === 'multiple' ? [] : '')
        };
        
        console.log(`Formatted answer ${i}:`, formattedAnswer);
        formattedAnswers.push(formattedAnswer);
      }
    
          // Debug logging
      console.log('=== QUIZ SUBMISSION DEBUG ===');
      console.log('Original answers state:', answers);
      console.log('Formatted answers for submission:', formattedAnswers);
      console.log('Quiz questions:', quiz.questions);
      console.log('Answers validation:');
      console.log('- Total questions:', quiz.questions.length);
      console.log('- Formatted answers count:', formattedAnswers.length);
      console.log('- Answers with values:', Object.keys(answers).filter(key => {
        const answer = answers[key];
        return answer !== undefined && answer !== '' && (!Array.isArray(answer) || answer.length > 0);
      }).length);
      console.log('- Empty answers:', Object.keys(answers).filter(key => {
        const answer = answers[key];
        return answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0);
      }).length);
      
      // Validate that we have answers for all questions
      if (formattedAnswers.length === 0) {
        throw new Error('No valid answers to submit');
      }
      
      if (formattedAnswers.length !== quiz.questions.length) {
        console.warn(`Warning: Only ${formattedAnswers.length} answers for ${quiz.questions.length} questions`);
        console.warn('This might cause issues with answer processing');
      }

    try {
      setSubmitting(true);
      
      const token = await AsyncStorage.getItem('jwtToken');
      const requestBody = {
        studentId: user._id,
        answers: formattedAnswers,
        violationCount: violationCount,
        violationEvents: violationEvents,
        questionTimes: questionTimes
      };
      
      console.log('=== SUBMISSION REQUEST DEBUG ===');
      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));
      console.log('Request body summary:', {
        studentId: requestBody.studentId,
        answersCount: requestBody.answers.length,
        answersStructure: requestBody.answers.map((a, i) => ({
          index: i,
          questionId: a.questionId,
          answerType: typeof a.answer,
          answerValue: a.answer,
          isArray: Array.isArray(a.answer)
        }))
      });
      
      const response = await fetch(`${API_BASE}/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Quiz submission failed:', response.status, response.statusText);
        console.error('Error response:', errorText);
        throw new Error(`Failed to submit quiz: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('=== QUIZ SUBMISSION RESULT ===');
      console.log('Quiz submission result:', result);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Use backend totals when provided
      const calculatedScore = result.score || 0;
      const totalPoints = typeof result.total === 'number' ? result.total : (quiz.points || 100);
      const percentage = typeof result.percentage === 'number' ? result.percentage : Math.round((calculatedScore / (totalPoints || 1)) * 100);

      console.log('=== QUIZ RESULT PROCESSING ===');
      console.log('Calculated score:', calculatedScore);
      console.log('Total points:', totalPoints);
      console.log('Percentage:', percentage);
      console.log('Time spent:', result.timeSpent);
      console.log('Submitted at:', result.submittedAt);

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
      console.error('=== QUIZ SUBMISSION ERROR ===');
      console.error('Error submitting quiz:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', `Failed to submit quiz: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // formatTime is now provided by TimerContext

  // Performance optimization: Memoize question rendering function
  const renderQuestion = useCallback((question, index) => {
    // Defensive programming: check if question exists
    if (!question || !question.question) {
      console.warn('Invalid question data:', question);
      return null;
    }

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

        {question.type === 'multiple' && question.choices && Array.isArray(question.choices) && (
          <View style={styles.choicesContainer}>
            {question.choices.map((choice, choiceIndex) => {
              // Check if this choice is selected (answers are now stored as choice text)
              const isSelected = Array.isArray(currentAnswer) 
                ? currentAnswer.includes(choice)
                : currentAnswer === choice;
              
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

        {question.type === 'identification' && question.question && (
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
  }, [currentQuestionIndex, answers, quizCheckedAnswers, isReviewMode, quiz?.questions?.length, handleTextInput]);

  // Performance optimization: Memoize navigation handlers
  const goToNextQuestion = useCallback(() => {
    if (quiz?.questions && currentQuestionIndex < quiz.questions.length - 1) {
      console.log(`Navigating to next question: ${currentQuestionIndex + 1}`);
      console.log('Current answers state before navigation:', answers);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, quiz?.questions?.length, answers]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      console.log(`Navigating to previous question: ${currentQuestionIndex - 1}`);
      console.log('Current answers state before navigation:', answers);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex, answers]);

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

  // Motivational message based on score (similar to web app)
  const getMotivationalMessage = (score, total) => {
    if (score === total) return "Perfect! 🎉 Congratulations, you aced it!";
    if (score >= total * 0.8) return "Great job! Keep up the good work!";
    if (score >= total * 0.5) return "Not bad! Review and try again for a higher score!";
    return "Don't give up! Every attempt is a step closer to success!";
  };

  // Enhanced score display component
  const renderScoreDisplay = () => {
    if (!quizResult) return null;
    
    const message = getMotivationalMessage(quizResult.score, quizResult.totalPoints);
    
    return (
      <View style={styles.scoreDisplayContainer}>
        <View style={styles.scoreHeader}>
          <MaterialIcons name="emoji-events" size={48} color="#FFD700" />
          <Text style={styles.scoreTitle}>Quiz Results</Text>
        </View>
        
        <View style={styles.scoreMain}>
          <Text style={styles.scoreValue}>
            {quizResult.score || 0} / {quizResult.totalPoints || 0}
          </Text>
          <Text style={styles.scorePercentage}>
            {quizResult.percentage || 0}%
          </Text>
          <Text style={styles.motivationalMessage}>{message}</Text>
        </View>
        
        <View style={styles.scoreDetails}>
          {quizResult.timeSpent && (
            <View style={styles.scoreDetailRow}>
              <MaterialIcons name="schedule" size={20} color="#666" />
              <Text style={styles.scoreDetailLabel}>Time Spent:</Text>
              <Text style={styles.scoreDetailValue}>
                {formatTime(quizResult.timeSpent)}
              </Text>
            </View>
          )}
          
          {quizResult.submittedAt && (
            <View style={styles.scoreDetailRow}>
              <MaterialIcons name="event" size={20} color="#666" />
              <Text style={styles.scoreDetailLabel}>Submitted:</Text>
              <Text style={styles.scoreDetailValue}>
                {new Date(quizResult.submittedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

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

  // Additional safety check for quiz questions
  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Invalid Quiz Data</Text>
        <Text style={styles.errorText}>This quiz has no questions or invalid data.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Safety check for current question index
  if (currentQuestionIndex >= quiz.questions.length) {
    setCurrentQuestionIndex(0);
  }

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

  // Final safety check: ensure all required data exists
  if (!quiz || !quiz.title || !quiz.questions) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Quiz Data Error</Text>
        <Text style={styles.errorText}>Unable to load quiz data. Please try again.</Text>
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz.title}</Text>
        {renderTimer()}
      </View>

      {/* Score Header - Show in review mode when quiz result exists */}
      {isReviewMode && quizResult && (
        <View style={styles.scoreHeader}>
          {renderScoreDisplay()}
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
                { width: `${((currentQuestionIndex + 1) / questionsCount) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1} / {quiz?.questions?.length || 0}
          </Text>
        </View>
      )}

      {/* Questions */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {isReviewMode ? (
          // In review mode, show all questions
          quiz?.questions?.map((question, index) => renderQuestion(question, index)) || []
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
            <ScrollView 
              style={{ flex: 1, width: '100%' }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {renderScoreDisplay()}
              
              {Array.isArray(quizCheckedAnswers) && quizCheckedAnswers.length > 0 && (
                <View style={styles.answersSummary}>
                  <Text style={styles.answersSummaryTitle}>Question Summary</Text>
                  <View style={styles.answersList}>
                    {quizCheckedAnswers.map((answer, idx) => (
                      <View key={idx} style={styles.answerItem}>
                        <MaterialIcons 
                          name={answer.correct ? "check-circle" : "cancel"} 
                          size={16} 
                          color={answer.correct ? "#4CAF50" : "#F44336"} 
                        />
                        <Text style={[styles.answerItemText, { fontSize: 12 }]}>
                          Q{idx + 1}: {answer.correct ? 'Correct' : 'Incorrect'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

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
    borderRadius: 16,
    padding: 16,
    margin: 10,
    width: width - 20,
    maxHeight: '80%',
    alignItems: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  resultsContent: {
    width: '100%',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  resultsButton: {
    backgroundColor: '#00418b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  resultsButtonText: {
    color: 'white',
    fontSize: 16,
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
  timerWarning: {
    backgroundColor: '#ffebee', // Light red background
  },
  timerWarningText: {
    color: '#f44336', // Red text
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e8f5e9', // Light green background
    borderRadius: 20,
  },
  resumeButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scoreDisplayContainer: {
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
  scoreMain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00418b',
    marginBottom: 12,
  },
  motivationalMessage: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  scoreDetails: {
    width: '100%',
    marginTop: 16,
  },
  scoreDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreDetailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  scoreDetailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  answersSummary: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f7fbff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
  },
  answersSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  answersList: {
    //
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
};
