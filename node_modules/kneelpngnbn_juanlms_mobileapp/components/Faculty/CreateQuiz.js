import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../UserContext';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function CreateQuiz() {
  const navigation = useNavigation();
  const route = useRoute();
  const { classId, classInfo } = route.params || {};
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: '',
      choices: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [facultyClasses, setFacultyClasses] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [formHint, setFormHint] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      text: '',
      choices: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const updateQuestion = (questionId, field, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const updateChoice = (questionId, choiceIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newChoices = [...q.choices];
        newChoices[choiceIndex] = value;
        return { ...q, choices: newChoices };
      }
      return q;
    }));
  };

  const validateForm = () => {
    if (!title.trim() || !description.trim() || !points.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (parseInt(points) <= 0) {
      Alert.alert('Error', 'Points must be greater than 0');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        Alert.alert('Error', `Question ${i + 1} text is required`);
        return false;
      }

      const validChoices = q.choices.filter(choice => choice.trim() !== '');
      if (validChoices.length < 2) {
        Alert.alert('Error', `Question ${i + 1} must have at least 2 choices`);
        return false;
      }

      if (q.correctAnswer >= validChoices.length) {
        Alert.alert('Error', `Question ${i + 1} correct answer is invalid`);
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    const loadClasses = async () => {
      try {
        if (classId) return;
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE}/api/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load classes');
        const data = await res.json();
        const facultyIdentifier = user?.userID || user?._id;
        const mine = Array.isArray(data)
          ? data.filter(c => c.facultyID === facultyIdentifier)
          : (data.classes || []).filter(c => c.facultyID === facultyIdentifier);
        setFacultyClasses(mine);
        if (mine && mine.length > 0) {
          setSelectedClassIds(mine.map(c => c.classID));
        }
      } catch (e) {
        console.log('Load classes error:', e);
      }
    };
    loadClasses();
  }, [classId, user]);

  const toggleClass = (cid) => {
    setSelectedClassIds(prev => prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setFormHint('Please complete all required fields. Each question needs text, at least 2 choices, and a selected correct answer.');
      return;
    }
    setFormHint('');

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!classId && selectedClassIds.length === 0) {
        Alert.alert('Select classes', 'Please select at least one class to post the quiz.');
        setLoading(false);
        return;
      }
      
      const quizData = {
        title: title.trim(),
        description: description.trim(),
        points: Math.min(parseInt(points), 100),
        dueDate: dueDate.toISOString(),
        createdBy: user?._id || undefined,
        type: 'quiz',
        classID: classId || (selectedClassIds && selectedClassIds.length > 0 ? selectedClassIds[0] : undefined),
        classIDs: selectedClassIds && selectedClassIds.length > 0 ? selectedClassIds : (classId ? [classId] : undefined),
        assignedTo: classId 
          ? [{ classID: classId, studentIDs: [] }]
          : selectedClassIds.map(cid => ({ classID: cid, studentIDs: [] })),
        questions: questions.map(q => ({
          type: 'multiple', // Default type for now
          question: q.text.trim(),
          choices: q.choices.filter(choice => choice.trim() !== ''),
          correctAnswers: [q.correctAnswer],
          points: q.points
        }))
      };

      // Validate createdBy looks like a Mongo ObjectId; otherwise omit
      if (!quizData.createdBy || !/^([a-fA-F0-9]{24})$/.test(String(quizData.createdBy))) {
        delete quizData.createdBy;
      }

      const attempt = async (url) => {
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(quizData)
        });
      };

      console.log('CreateQuiz: attempting POST to /quizzes');
      let response = await attempt(`${API_BASE}/quizzes`);
      if (response.status === 404) {
        console.log('CreateQuiz: /quizzes 404, retrying /api/quizzes');
        response = await attempt(`${API_BASE}/api/quizzes`);
      }

      if (response.ok) {
        let infoText = 'Quiz created successfully';
        try {
          const data = await response.json();
          const targets = (classId ? [classId] : selectedClassIds) || [];
          if (targets.length > 0) {
            const names = targets.map(cid => {
              const m = facultyClasses.find(c => c.classID === cid);
              return m ? `${m.className} (${m.classCode})` : cid;
            });
            infoText = `Quiz posted to ${targets.length} class${targets.length > 1 ? 'es' : ''}` + (names.length ? `:\n${names.join('\n')}` : '');
          }
        } catch (_) {}
        Alert.alert('Success', infoText, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        let errMsg = 'Failed to create quiz';
        try {
          const clone = response.clone();
          const errorData = await response.json();
          errMsg = errorData.error || errMsg;
        } catch (_) {}
        try {
          const text = await response.text();
          console.log('CreateQuiz error body:', text);
        } catch (_) {}
        Alert.alert('Error', errMsg);
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      Alert.alert('Error', error.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{ 
        backgroundColor: '#00418b', 
        paddingTop: 50, 
        paddingBottom: 20, 
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleBack} style={{ padding: 8, marginRight: 16 }}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              color: '#fff', 
              fontFamily: 'Poppins-Bold'
            }}>
              Create Quiz
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#e3eefd', 
              fontFamily: 'Poppins-Regular',
              marginTop: 4
            }}>
              {classInfo?.className || 'Class'} - {classInfo?.classCode || 'Code'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Class Selector (when no classId passed) */}
        {!classId && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, fontFamily: 'Poppins-Bold', color: '#333' }}>Assign to Classes</Text>
            {facultyClasses.length === 0 ? (
              <Text style={{ color: '#666', fontFamily: 'Poppins-Regular' }}>No classes found.</Text>
            ) : (
              facultyClasses.map(cls => (
                <TouchableOpacity key={cls.classID} onPress={() => toggleClass(cls.classID)} style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 8
                }}>
                  <Icon name={selectedClassIds.includes(cls.classID) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={selectedClassIds.includes(cls.classID) ? '#00418b' : '#999'} />
                  <Text style={{ marginLeft: 8, color: '#333', fontFamily: 'Poppins-Regular' }}>{cls.className} ({cls.classCode})</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        {/* Quiz Details Form */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 20, 
            fontFamily: 'Poppins-Bold',
            color: '#333'
          }}>
            Quiz Details
          </Text>

          {/* Title */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Title *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                fontFamily: 'Poppins-Regular',
                fontSize: 16
              }}
              placeholder="Enter quiz title"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Description *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                fontFamily: 'Poppins-Regular',
                fontSize: 16,
                minHeight: 80,
                textAlignVertical: 'top'
              }}
              placeholder="Enter quiz description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Points */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Total Points *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                fontFamily: 'Poppins-Regular',
                fontSize: 16
              }}
              placeholder="Enter total points"
              value={points}
              onChangeText={(text) => {
                const onlyNums = text.replace(/[^0-9]/g, '');
                const num = Math.min(parseInt(onlyNums || '0', 10), 100);
                setPoints(onlyNums === '' ? '' : String(num));
              }}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          {/* Due Date */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              marginBottom: 8, 
              fontFamily: 'Poppins-SemiBold',
              color: '#333'
            }}>
              Due Date
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e9ecef',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ 
                fontFamily: 'Poppins-Regular',
                fontSize: 16,
                color: '#333'
              }}>
                {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Icon name="calendar" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Questions Section */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              fontFamily: 'Poppins-Bold',
              color: '#333'
            }}>
              Questions ({questions.length})
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#28a745',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8
              }}
              onPress={addQuestion}
            >
              <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold' }}>+ Add Question</Text>
            </TouchableOpacity>
          </View>

          {questions.map((question, index) => (
            <View key={question.id} style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#e9ecef'
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  fontFamily: 'Poppins-Bold',
                  color: '#333'
                }}>
                  Question {index + 1}
                </Text>
                {questions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeQuestion(question.id)}
                    style={{ padding: 4 }}
                  >
                    <Icon name="delete" size={20} color="#dc3545" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Question Text */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  marginBottom: 8, 
                  fontFamily: 'Poppins-SemiBold',
                  color: '#333'
                }}>
                  Question Text *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#e9ecef',
                    fontFamily: 'Poppins-Regular',
                    fontSize: 16,
                    minHeight: 60,
                    textAlignVertical: 'top'
                  }}
                  placeholder="Enter your question"
                  value={question.text}
                  onChangeText={(text) => updateQuestion(question.id, 'text', text)}
                  multiline
                />
              </View>

              {/* Choices */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  marginBottom: 8, 
                  fontFamily: 'Poppins-SemiBold',
                  color: '#333'
                }}>
                  Choices *
                </Text>
                {question.choices.map((choice, choiceIndex) => (
                  <View key={choiceIndex} style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginBottom: 8 
                  }}>
                    <TouchableOpacity
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: question.correctAnswer === choiceIndex ? '#00418b' : '#ccc',
                        backgroundColor: question.correctAnswer === choiceIndex ? '#00418b' : '#fff',
                        marginRight: 12,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onPress={() => updateQuestion(question.id, 'correctAnswer', choiceIndex)}
                    >
                      {question.correctAnswer === choiceIndex && (
                        <Icon name="check" size={12} color="#fff" />
                      )}
                    </TouchableOpacity>
                    <TextInput
                      style={{
                        flex: 1,
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        padding: 10,
                        borderWidth: 1,
                        borderColor: '#e9ecef',
                        fontFamily: 'Poppins-Regular',
                        fontSize: 16
                      }}
                      placeholder={`Choice ${choiceIndex + 1}`}
                      value={choice}
                      onChangeText={(text) => updateChoice(question.id, choiceIndex, text)}
                    />
                  </View>
                ))}
              </View>

              {/* Question Points */}
              <View>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  marginBottom: 8, 
                  fontFamily: 'Poppins-SemiBold',
                  color: '#333'
                }}>
                  Points for this question
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#e9ecef',
                    fontFamily: 'Poppins-Regular',
                    fontSize: 16
                  }}
                  placeholder="Points"
                  value={question.points.toString()}
                  onChangeText={(text) => updateQuestion(question.id, 'points', parseInt(text) || 1)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#00418b',
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
            marginBottom: 20
          }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ 
              color: '#fff', 
              fontSize: 16, 
              fontWeight: 'bold',
              fontFamily: 'Poppins-Bold'
            }}>
              Create Quiz
            </Text>
          )}
        </TouchableOpacity>
        {formHint ? (
          <Text style={{ color: '#c62828', marginBottom: 12, textAlign: 'center', fontFamily: 'Poppins-Regular' }}>
            {formHint}
          </Text>
        ) : null}
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (Platform.OS === 'ios' ? event.type === 'set' : true) {
              if (selectedDate) {
                setDueDate(selectedDate);
              }
            }
            setShowDatePicker(false);
          }}
          minimumDate={new Date()}
        />
      )}
    </KeyboardAvoidingView>
  );
}
