import { Text, TouchableOpacity, View, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ImageBackground, ProgressBar } from 'react-native-web';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StudentModuleStyle from '../styles/Stud/StudentModuleStyle';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

function formatDateHeader(date) {
  if (!date) return 'No due date';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function groupByDate(items, getDate) {
  const groups = {};
  items.forEach(item => {
    const date = getDate(item);
    const key = date ? new Date(date).toDateString() : 'No due date';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

export default function StudentModule(){
    const route = useRoute();
    const navigation = useNavigation();
    
    // Get the classId from navigation params
    const classId = route.params?.classId;
    console.log('DEBUG StudentModule: classId from navigation params:', classId);
    
    const [classID, setClassID] = useState(classId || null);
    const [classInfo, setClassInfo] = useState({
        className: "Loading...",
        classCode: "Loading..."
    });
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classwork, setClasswork] = useState([]); // Add this state
    const [materials, setMaterials] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // Add filter state

    useEffect(() => {
        console.log('DEBUG StudentModule: useEffect classId:', classId);
        if (classId) {
            // If we have a specific classId from navigation, use it
            fetchSpecificClass(classId);
        } else {
            // Fallback to fetching all classes if no specific classId
            fetchAvailableClasses();
        }
    }, [classId]);

    const fetchClasswork = async (classId) => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            
            // Fetch both assignments and quizzes (similar to web version)
            const [assignmentsRes, quizzesRes] = await Promise.all([
                axios.get(`https://juanlms-webapp-server.onrender.com/assignments?classID=${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`https://juanlms-webapp-server.onrender.com/api/quizzes?classID=${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // Combine assignments and quizzes with type indicators
            const assignments = assignmentsRes.data.map(item => ({ ...item, type: 'assignment' }));
            const quizzes = quizzesRes.data.map(item => ({ ...item, type: 'quiz' }));
            
            const allClasswork = [...assignments, ...quizzes];
            setClasswork(allClasswork);
            console.log('Fetched classwork (Student):', allClasswork); // Debug log
        } catch (err) {
            setClasswork([]);
            console.log('Error fetching classwork (Student):', err);
        }
    };

    const fetchMaterials = async (classId) => {
        setMaterialsLoading(true);
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            const res = await axios.get(`https://juanlms-webapp-server.onrender.com/lessons?classID=${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaterials(res.data);
        } catch (err) {
            setMaterials([]);
        } finally {
            setMaterialsLoading(false);
        }
    };

    const fetchSpecificClass = async (targetClassId) => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            console.log('DEBUG StudentModule: fetchSpecificClass targetClassId:', targetClassId);
            // Fetch all classes and find the one with the exact classID
            const classesRes = await axios.get(`https://juanlms-webapp-server.onrender.com/api/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('DEBUG StudentModule: API returned:', classesRes.data);
            let classObj = null;
            if (Array.isArray(classesRes.data)) {
                classObj = classesRes.data.find(c => c.classID === targetClassId);
            } else if (classesRes.data.success && Array.isArray(classesRes.data.classes)) {
                classObj = classesRes.data.classes.find(c => c.classID === targetClassId);
            }
            console.log('DEBUG StudentModule: selected classObj:', classObj);
            if (classObj) {
                setClassID(classObj.classID);
                setClassInfo({
                    className: classObj.className,
                    classCode: classObj.classCode
                });
                // Fetch announcements for this specific class
                fetchAnnouncements(classObj.classID);
                fetchClasswork(classObj.classID); // Fetch classwork
                fetchMaterials(classObj.classID); // Fetch materials
            } else {
                throw new Error('Class not found');
            }
        } catch (err) {
            console.log('Error fetching specific class:', err);
            // Fallback to general class fetching
            fetchAvailableClasses();
        }
    };

    const fetchAvailableClasses = async () => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            // First, get all available classes
            const classesRes = await axios.get(`https://juanlms-webapp-server.onrender.com/api/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (classesRes.data.success && classesRes.data.classes.length > 0) {
                // Use the first available class
                const firstClass = classesRes.data.classes[0];
                setClassID(firstClass.classID);
                setClassInfo({
                    className: firstClass.className,
                    classCode: firstClass.classCode
                });
                
                // Now fetch announcements for this class
                fetchAnnouncements(firstClass.classID);
                fetchClasswork(firstClass.classID); // Fetch classwork
                fetchMaterials(firstClass.classID); // Fetch materials
            } else {
                setClassInfo({
                    className: "No Classes Found",
                    classCode: "N/A"
                });
                setLoading(false);
            }
        } catch (err) {
            console.log('Error fetching classes:', err);
            setClassInfo({
                className: "Error Loading Class",
                classCode: "N/A"
            });
            setLoading(false);
        }
    };

    const fetchAnnouncements = async (classId) => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            console.log('DEBUG StudentModule: fetchAnnouncements classId:', classId);
            const res = await axios.get(`https://juanlms-webapp-server.onrender.com/announcements?classID=${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(res.data);
        } catch (err) {
            console.log('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const lessons = [
        { title: "Lesson 1: Introduction", content: "Welcome to computing!", image: "https://example.com/image1.jpg", progress: 0.10 },
        { title: "Lesson 2: Basics", content: "Let's learn about basic concepts.", image: "https://example.com/image2.jpg", progress: 0.10 },
        { title: "Lesson 3: Advanced Topics", content: "Time for advanced computing!", image: "https://example.com/image3.jpg", progress: 0.10 },
    ];

    const [currentLesson, setCurrentLesson] = useState(0);
    const totalLessons = lessons.length;

    //navigation
    const changeScreen = useNavigation();
    const back = () => {
      changeScreen.goBack();
    }
    const [activeTab, setActiveTab] = useState('Announcement');
    let [fontsLoaded] = useFonts({
        'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    });
    if (!fontsLoaded) return null;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Announcement':
                return (
                    <>
                        {/* Announcement Title Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>Announcement</Text>
                            
                        </View>
                        {/* Announcements */}
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            announcements.length === 0 ? (
                                <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13, marginTop: 10 }}>No announcements yet.</Text>
                            ) : (
                                announcements.map((item) => (
                                    <View
                                        key={item._id}
                                        style={{
                                            backgroundColor: '#e3eefd',
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: '#1976d2',
                                            paddingVertical: 16,
                                            paddingHorizontal: 18,
                                            marginBottom: 16,
                                            shadowColor: '#000',
                                            shadowOpacity: 0.04,
                                            shadowRadius: 4,
                                            elevation: 1,
                                            position: 'relative',
                                        }}
                                    >
                                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#00418b', fontSize: 17, marginBottom: 4, letterSpacing: 0.1 }}>{item.title}</Text>
                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 15, lineHeight: 21 }}>{item.content}</Text>
                                    </View>
                                ))
                            )
                        )}
                    </>
                );
            case 'Classwork':
                return (
                    <>
                        {/* Classwork Title Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>
                                {filterType === 'all' ? 'Classwork' : filterType === 'quiz' ? 'Quizzes' : 'Assignments'}
                            </Text>
                        </View>
                        
                        {/* Filter Dropdown */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: '#666', marginRight: 8 }}>Filter:</Text>
                            <TouchableOpacity
                                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'white' }}
                                onPress={() => {
                                    // Simple filter toggle - in a real app you might want a proper dropdown
                                    if (filterType === 'all') setFilterType('quiz');
                                    else if (filterType === 'quiz') setFilterType('assignment');
                                    else setFilterType('all');
                                }}
                            >
                                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: '#333' }}>
                                    {filterType === 'all' ? 'All' : filterType === 'quiz' ? 'Quiz' : 'Assignment'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Classwork Content */}
                        {loading ? (
                            <ActivityIndicator />
                        ) : classwork.length === 0 ? (
                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13, marginTop: 10 }}>No classwork assigned yet.</Text>
                        ) : (
                            (() => {
                                // Helper function to check if assignment is posted
                                const isAssignmentPosted = (assignment) => {
                                    if (!assignment.postAt) return false;
                                    const now = new Date();
                                    const postAt = new Date(assignment.postAt);
                                    return postAt <= now;
                                };

                                // Filter and combine assignments/quizzes
                                let allItems = classwork.map(item => ({ 
                                    ...item, 
                                    isPosted: isAssignmentPosted(item),
                                    type: item.type || 'assignment' // Default to assignment if no type
                                }));

                                // Apply filter
                                if (filterType !== 'all') {
                                    allItems = allItems.filter(item => item.type === filterType);
                                }

                                // Check if there are items after filtering
                                if (allItems.length === 0) {
                                    return (
                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
                                            No {filterType === 'all' ? 'classwork' : filterType === 'quiz' ? 'quizzes' : 'assignments'} found.
                                        </Text>
                                    );
                                }

                                // Separate unposted and posted
                                const unposted = allItems.filter(item => !item.isPosted);
                                const posted = allItems.filter(item => item.isPosted);

                                // Group posted by date (descending)
                                const groupedByDate = {};
                                posted.forEach(item => {
                                    const date = new Date(item.createdAt || item.postAt || new Date());
                                    const dateKey = date.toDateString();
                                    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
                                    groupedByDate[dateKey].push(item);
                                });
                                const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

                                return (
                                    <>
                                        {/* Unposted at the top */}
                                        {unposted.length > 0 && (
                                            <View style={{ marginBottom: 24 }}>
                                                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#666', marginBottom: 12 }}>Not Yet Posted</Text>
                                                {unposted.map(item => (
                                                    <TouchableOpacity
                                                        key={item._id}
                                                        style={{
                                                            backgroundColor: '#f5f5f5',
                                                            borderRadius: 12,
                                                            borderWidth: 1,
                                                            borderColor: '#ddd',
                                                            padding: 16,
                                                            marginBottom: 12,
                                                            opacity: 0.75
                                                        }}
                                                        onPress={() => {
                                                            if (item.type === 'quiz') {
                                                                navigation.navigate('QuizView', { quizId: item._id });
                                                            } else {
                                                                navigation.navigate('AssignmentDetail', { 
                                                                    assignmentId: item._id,
                                                                    onSubmissionComplete: () => {
                                                                        // Refresh classwork when returning from submission
                                                                        fetchClasswork(classID);
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                            <View style={{ 
                                                                backgroundColor: item.type === 'quiz' ? '#e9d5ff' : '#dcfce7', 
                                                                borderRadius: 6, 
                                                                paddingHorizontal: 10, 
                                                                paddingVertical: 4, 
                                                                marginRight: 8 
                                                            }}>
                                                                <Text style={{ 
                                                                    color: item.type === 'quiz' ? '#7c3aed' : '#15803d', 
                                                                    fontWeight: 'bold', 
                                                                    fontSize: 12, 
                                                                    fontFamily: 'Poppins-Bold' 
                                                                }}>
                                                                    {item.type === 'quiz' ? 'Quiz' : 'Assignment'}
                                                                </Text>
                                                            </View>
                                                            <View style={{ 
                                                                backgroundColor: '#6b7280', 
                                                                borderRadius: 6, 
                                                                paddingHorizontal: 8, 
                                                                paddingVertical: 4 
                                                            }}>
                                                                <Text style={{ 
                                                                    color: 'white', 
                                                                    fontWeight: 'bold', 
                                                                    fontSize: 11, 
                                                                    fontFamily: 'Poppins-Bold' 
                                                                }}>
                                                                    Not Posted Yet
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#666', fontSize: 16, marginBottom: 4 }}>{item.title}</Text>
                                                        {item.description && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 14, marginBottom: 6 }}>{item.description}</Text>
                                                        )}
                                                        {item.instructions && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 14, marginBottom: 6 }}>{item.instructions}</Text>
                                                        )}
                                                        {item.dueDate && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#999', fontSize: 12, marginBottom: 2 }}>
                                                                Due: {new Date(item.dueDate).toLocaleString()}
                                                            </Text>
                                                        )}
                                                        {item.points && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#999', fontSize: 12, marginBottom: 2 }}>
                                                                Points: {item.points}
                                                            </Text>
                                                        )}
                                                        {item.postAt && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#3b82f6', fontSize: 12, marginTop: 4 }}>
                                                                Will be posted: {new Date(item.postAt).toLocaleString()}
                                                            </Text>
                                                        )}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}

                                        {/* Posted grouped by date */}
                                        {sortedDateKeys.map(dateKey => (
                                            <View key={dateKey} style={{ marginBottom: 24 }}>
                                                <Text style={{ 
                                                    fontFamily: 'Poppins-Bold', 
                                                    fontSize: 18, 
                                                    color: '#666', 
                                                    marginBottom: 12, 
                                                    marginTop: 8 
                                                }}>
                                                    {new Date(dateKey).toLocaleDateString('en-US', {
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric'
                                                    })}
                                                </Text>
                                                {groupedByDate[dateKey].map(item => (
                                                    <TouchableOpacity
                                                        key={item._id}
                                                        style={{
                                                            backgroundColor: 'white',
                                                            borderRadius: 12,
                                                            borderWidth: 1,
                                                            borderColor: '#dbeafe',
                                                            padding: 16,
                                                            marginBottom: 12,
                                                            shadowColor: '#000',
                                                            shadowOpacity: 0.04,
                                                            shadowRadius: 4,
                                                            elevation: 1
                                                        }}
                                                        onPress={() => {
                                                            if (item.type === 'quiz') {
                                                                navigation.navigate('QuizView', { quizId: item._id });
                                                            } else {
                                                                navigation.navigate('AssignmentDetail', { 
                                                                    assignmentId: item._id,
                                                                    onSubmissionComplete: () => {
                                                                        // Refresh classwork when returning from submission
                                                                        fetchClasswork(classID);
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                            <View style={{ 
                                                                backgroundColor: item.type === 'quiz' ? '#e9d5ff' : '#dcfce7', 
                                                                borderRadius: 6, 
                                                                paddingHorizontal: 10, 
                                                                paddingVertical: 4, 
                                                                marginRight: 8 
                                                            }}>
                                                                <Text style={{ 
                                                                    color: item.type === 'quiz' ? '#7c3aed' : '#15803d', 
                                                                    fontWeight: 'bold', 
                                                                    fontSize: 12, 
                                                                    fontFamily: 'Poppins-Bold' 
                                                                }}>
                                                                    {item.type === 'quiz' ? 'Quiz' : 'Assignment'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 16, marginBottom: 4 }}>{item.title}</Text>
                                                        {item.description && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 14, marginBottom: 6 }}>{item.description}</Text>
                                                        )}
                                                        {item.instructions && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 14, marginBottom: 6 }}>{item.instructions}</Text>
                                                        )}
                                                        {item.dueDate && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 12, marginBottom: 2 }}>
                                                                Due: {new Date(item.dueDate).toLocaleString()}
                                                            </Text>
                                                        )}
                                                        {item.points && (
                                                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 12, marginBottom: 2 }}>
                                                                Points: {item.points}
                                                            </Text>
                                                        )}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        ))}
                                    </>
                                );
                            })()
                        )}
                    </>
                );
            case 'Class Materials':
                return (
                    <>
                        {/* Class Materials Title Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>Class Materials</Text>
                           
                        </View>
                        {/* Class Materials Content */}
                        {materialsLoading ? (
                            <ActivityIndicator />
                        ) : materials.length === 0 ? (
                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13, marginTop: 10 }}>No materials uploaded yet.</Text>
                        ) : (
                            materials.map(lesson => (
                                <View key={lesson._id} style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#1976d2',
                                    marginBottom: 18,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.04,
                                    shadowRadius: 4,
                                    elevation: 1,
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}>
                                    <View style={{
                                        backgroundColor: '#183a8c',
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderTopLeftRadius: 12,
                                        borderTopRightRadius: 12,
                                    }}>
                                        <Icon name="file-document-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#fff', fontSize: 17, flex: 1 }}>{lesson.title}</Text>
                                    </View>
                                    {/* Section label row */}
                                    <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f9f9f9' }}>
                                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 14, flex: 1 }}>Module</Text>
                                    </View>
                                    {/* File rows */}
                                    {lesson.files && lesson.files.map(file => (
                                        <View key={file.fileUrl} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff' }}>
                                            <Icon name="file-document-outline" size={18} color="#222" style={{ marginRight: 6 }} />
                                            <TouchableOpacity onPress={() => {/* handle file open/download */ }}>
                                                <Text style={{ fontFamily: 'Poppins-Regular', color: '#1976d2', fontSize: 14, textDecorationLine: 'underline' }}>{file.fileName}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ))
                        )}
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 10 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 16 }}>
                <TouchableOpacity onPress={back} style={{position: 'absolute', top: 40, left: 20, zIndex: 10 }}><Icon name="arrow-left" size={24} color="black" /></TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', marginLeft: -24 }}>
                    <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 22, color: '#222' }}>{classInfo.className}</Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: '#888' }}>{classInfo.classCode}</Text>
                </View>
            </View>
            {/* Tabs */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 8, marginLeft:10, marginRight:10 }}>
                {['Announcement', 'Classwork', 'Class Materials'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={{
                            backgroundColor: activeTab === tab ? '#00418b' : '#e3eefd',
                            paddingVertical: 7,
                            paddingHorizontal: 10,
                            borderRadius: 10,
                        }}
                    >
                        <Text style={{ color: activeTab === tab ? '#fff' : '#00418b', fontFamily: 'Poppins-Bold', fontSize: 14 }}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {/* Main Card */}
            <View style={{ flex: 1, alignItems: 'center', marginTop: 12, marginBottom: 0 }}>
                <ScrollView style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#00418b', width: '92%', flex: 1, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                    {renderTabContent()}
                </ScrollView>
            </View>
            {/* Blue curved background at bottom */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, backgroundColor: '#00418b', borderTopLeftRadius: 60, borderTopRightRadius: 60, zIndex: -1 }} />
        </View>
    )
}