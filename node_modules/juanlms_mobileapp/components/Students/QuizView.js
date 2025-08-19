import React, { useState, useEffect } from 'react';
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

export default function QuizView() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUser();
  const { quizId, review } = route.params;

  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    setIsReviewMode(!!review);
    fetchQuiz();
  }, [quizId]);

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
      const response = await fetch(`${API_BASE}/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }

      const quizData = await response.json();
      setQuiz(quizData);
      
      // Initialize answers object
      const initialAnswers = {};
      quizData.questions.forEach((question, index) => {
        if (question.type === 'multiple') {
          initialAnswers[index] = [];
        } else {
          initialAnswers[index] = '';
        }
      });
      setAnswers(initialAnswers);

      // Set time limit if exists
      if (quizData.timeLimit && quizData.timeLimit > 0) {
        setTimeLeft(quizData.timeLimit * 60); // Convert minutes to seconds
      }

      // Check if student has already submitted this quiz (and fetch answers for review)
      try {
        const responseRes = await fetch(`${API_BASE}/api/quizzes/${quizId}/myscore?studentId=${user._id}&revealAnswers=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (responseRes.ok) {
          const responseData = await responseRes.json();
          if (responseData && responseData.score !== undefined) {
            // Student has already submitted
            console.log('Quiz already submitted:', responseData);
            setQuizResult({
              score: responseData.score || 0,
              totalPoints: responseData.total || quizData.points || 100,
              percentage: responseData.percentage || Math.round(((responseData.score || 0) / (responseData.total || quizData.points || 100)) * 100),
              timeSpent: responseData.timeSpent || 0,
              submittedAt: responseData.submittedAt || null,
            });
            if (Array.isArray(responseData.checkedAnswers)) {
              setQuizCheckedAnswers(responseData.checkedAnswers);
            }
            // If explicitly in review mode, render full quiz with answers (no modal)
            if (review) {
              setIsReviewMode(true);
            } else {
              setShowResultsModal(true);
              setIsReviewMode(true);
            }
          }
        }
      } catch (responseError) {
        console.log('Error checking quiz response:', responseError);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      Alert.alert('Error', 'Failed to load quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, value, isMultipleChoice = false) => {
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
  };

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

  const renderQuestion = (question, index) => {
    const isCurrentQuestion = index === currentQuestionIndex;
    const currentAnswer = answers[index];
    const checked = Array.isArray(quizCheckedAnswers) ? quizCheckedAnswers[index] : null;
    const revealAnswers = isReviewMode && !!checked;

    if (!isCurrentQuestion) return null;

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Question {index + 1} of {quiz.questions.length}</Text>
          <Text style={styles.questionPoints}>{question.points || 1} point{question.points !== 1 ? 's' : ''}</Text>
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        {question.image && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageText}>[Image: {question.image}]</Text>
          </View>
        )}

        {question.type === 'multiple' && (
          <View style={styles.choicesContainer}>
            {question.choices.map((choice, choiceIndex) => (
              <TouchableOpacity
                key={choiceIndex}
                style={[
                  styles.choiceButton,
                  (Array.isArray(currentAnswer) && currentAnswer.includes(choice)) && styles.selectedChoice,
                  revealAnswers && checked && Array.isArray(checked.correctAnswer) && checked.correctAnswer.includes(choice) && { borderColor: '#4CAF50' },
                  revealAnswers && checked && Array.isArray(currentAnswer) && currentAnswer.includes(choice) && !checked.correct && { borderColor: '#F44336' }
                ]}
                onPress={!isReviewMode ? () => handleAnswerChange(index, choice, true) : undefined}
              >
                <MaterialIcons
                  name={(Array.isArray(currentAnswer) && currentAnswer.includes(choice)) ? 'check-circle' : 'radio-button-unchecked'}
                  size={24}
                  color={(Array.isArray(currentAnswer) && currentAnswer.includes(choice)) ? '#00418b' : '#ccc'}
                />
                <Text style={[
                  styles.choiceText,
                  (Array.isArray(currentAnswer) && currentAnswer.includes(choice)) && styles.selectedChoiceText
                ]}>
                  {choice}
                </Text>
              </TouchableOpacity>
            ))}
            {revealAnswers && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: checked?.correct ? '#4CAF50' : '#F44336' }}>
                  {checked?.correct ? 'Correct' : 'Incorrect'}
                </Text>
                {Array.isArray(checked?.correctAnswer) && (
                  <Text style={{ fontSize: 12, color: '#4CAF50' }}>Correct answer: {checked.correctAnswer.join(', ')}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {question.type === 'identification' && (
          <TextInput
            style={styles.textInput}
            placeholder="Enter your answer"
            value={currentAnswer || ''}
            onChangeText={!isReviewMode ? (text) => handleAnswerChange(index, text) : undefined}
            multiline
          />
        )}
        {isReviewMode && question.type === 'identification' && (
          <View style={{ marginTop: 8, padding: 12, backgroundColor: '#f7fbff', borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: '#333' }}>Your answer: {String(currentAnswer || '')}</Text>
            {checked?.correctAnswer !== undefined && (
              <Text style={{ fontSize: 12, color: '#4CAF50', marginTop: 4 }}>Correct answer: {String(checked.correctAnswer)}</Text>
            )}
          </View>
        )}

        {question.type === 'truefalse' && (
          <View style={styles.choicesContainer}>
            <TouchableOpacity
              style={[
                styles.choiceButton,
                currentAnswer === 'true' && styles.selectedChoice,
                revealAnswers && checked && checked.correctAnswer === 'true' && { borderColor: '#4CAF50' },
                revealAnswers && checked && currentAnswer === 'true' && !checked.correct && { borderColor: '#F44336' }
              ]}
              onPress={!isReviewMode ? () => handleAnswerChange(index, 'true') : undefined}
            >
              <MaterialIcons
                name={currentAnswer === 'true' ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={currentAnswer === 'true' ? '#00418b' : '#ccc'}
              />
              <Text style={[
                styles.choiceText,
                currentAnswer === 'true' && styles.selectedChoiceText
              ]}>
                True
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choiceButton,
                currentAnswer === 'false' && styles.selectedChoice,
                revealAnswers && checked && checked.correctAnswer === 'false' && { borderColor: '#4CAF50' },
                revealAnswers && checked && currentAnswer === 'false' && !checked.correct && { borderColor: '#F44336' }
              ]}
              onPress={!isReviewMode ? () => handleAnswerChange(index, 'false') : undefined}
            >
              <MaterialIcons
                name={currentAnswer === 'false' ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={currentAnswer === 'false' ? '#00418b' : '#ccc'}
              />
              <Text style={[
                styles.choiceText,
                currentAnswer === 'false' && styles.selectedChoiceText
              ]}>
                False
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {revealAnswers && question.type !== 'multiple' && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 12, color: checked?.correct ? '#4CAF50' : '#F44336' }}>
              {checked?.correct ? 'Correct' : 'Incorrect'}
            </Text>
            {checked?.correctAnswer && (
              <Text style={{ fontSize: 12, color: '#4CAF50' }}>Correct answer: {String(checked.correctAnswer)}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isAvailable = () => {
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
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00418b" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
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
        {timeLeft !== null && (
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={20} color="white" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
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

      {/* Question */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {renderQuestion(quiz.questions[currentQuestionIndex], currentQuestionIndex)}
      </ScrollView>

      {/* Navigation */}
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

        {currentQuestionIndex === quiz.questions.length - 1 ? (
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
}

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
    backgroundColor: '#f0f8ff',
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  selectedChoiceText: {
    color: '#00418b',
    fontWeight: '500',
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
};
