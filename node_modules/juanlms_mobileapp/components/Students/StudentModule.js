import { Text, TouchableOpacity, View, Image, ScrollView, ActivityIndicator, Alert, Modal, Dimensions, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ImageBackground, ProgressBar } from 'react-native-web';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StudentModuleStyle from '../styles/Stud/StudentModuleStyle';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDate } from '../../utils/dateUtils';
import { getAuthHeaders, handleApiError } from '../../utils/apiUtils';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

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
    const [selectedFile, setSelectedFile] = useState(null);
    const [showFileViewer, setShowFileViewer] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

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
            
            // Check submission statuses for quizzes to enrich items
            let enrichedQuizzes = quizzes;
            try {
                const userStr = await AsyncStorage.getItem('user');
                const userObj = userStr ? JSON.parse(userStr) : null;
                const userId = userObj?._id;
                if (userId) {
                    const entries = await Promise.all(quizzes.map(async (q) => {
                        try {
                            const res = await fetch(`${API_BASE}/api/quizzes/${q._id}/myscore?studentId=${userId}` , {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            if (res.ok) {
                                const data = await res.json();
                                return { ...q, isSubmitted: true, score: data.score, totalPoints: data.total, percentage: data.percentage };
                            }
                        } catch (_) {}
                        return { ...q, isSubmitted: false };
                    }));
                    enrichedQuizzes = entries;
                }
            } catch (e) {
                console.log('Failed to enrich quizzes with submission state', e);
            }

            const allClasswork = [...assignments, ...enrichedQuizzes];
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

    // Helper functions for file handling
    const isImageFile = (fileName) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const lowerFileName = fileName.toLowerCase();
        return imageExtensions.some(ext => lowerFileName.endsWith(ext));
    };

    const isVideoFile = (fileName) => {
        const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
        const lowerFileName = fileName.toLowerCase();
        return videoExtensions.some(ext => lowerFileName.endsWith(ext));
    };

    const isPdfFile = (fileName) => {
        const lowerFileName = fileName.toLowerCase();
        return lowerFileName.endsWith('.pdf');
    };

    const toAbsoluteUrl = (url) => {
        if (!url) return url;
        // Ensure we return a valid, encoded URL that works even when filenames contain spaces or special characters
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return encodeURI(url);
        }
        const path = url.startsWith('/') ? url : `/${url}`;
        return encodeURI(`${API_BASE}${path}`);
    };

    const handleOpenExternalLink = (rawUrl) => {
        if (!rawUrl) return;
        const absoluteUrl = toAbsoluteUrl(rawUrl);
        Linking.openURL(absoluteUrl).catch(() => {
            Alert.alert('Error', 'Unable to open link');
        });
    };

    const handleFilePress = (file) => {
        console.log('File pressed:', file);
        if (isImageFile(file.fileName)) {
            // Validate image URL before opening
            if (!file.fileUrl || file.fileUrl.trim() === '') {
                Alert.alert('Error', 'Invalid image URL');
                return;
            }
            
            // Test if the image URL is accessible
            console.log('Opening image viewer for:', file.fileName);
            const absoluteUrl = toAbsoluteUrl(file.fileUrl);
            console.log('Image URL:', absoluteUrl);
            
            // Set loading state first
            setImageLoading(true);
            setSelectedFile({ ...file, fileUrl: absoluteUrl });
            setShowFileViewer(true);
        } else if (isVideoFile(file.fileName)) {
            // For videos, we'll try to open them in the device's default video player
            if (file.fileUrl) {
                const absoluteUrl = toAbsoluteUrl(file.fileUrl);
                Linking.openURL(absoluteUrl).catch(() => {
                    Alert.alert('Error', 'Unable to open video file');
                });
            }
        } else if (isPdfFile(file.fileName)) {
            // For PDFs, try to open in browser or download
            if (file.fileUrl) {
                const absoluteUrl = toAbsoluteUrl(file.fileUrl);
                Linking.openURL(absoluteUrl).catch(() => {
                    Alert.alert('Error', 'Unable to open PDF file');
                });
            }
        } else {
            // For other files, download them
            if (file.fileUrl) {
                const absoluteUrl = toAbsoluteUrl(file.fileUrl);
                Linking.openURL(absoluteUrl).catch(() => {
                    Alert.alert('Error', 'Unable to download file');
                });
            }
        }
    };

    const closeFileViewer = () => {
        console.log('Closing file viewer');
        setShowFileViewer(false);
        setSelectedFile(null);
        setImageLoading(false);
    };

    // Add timeout for image loading to prevent stuck states
    useEffect(() => {
        let timeoutId;
        if (imageLoading && showFileViewer) {
            timeoutId = setTimeout(() => {
                console.log('Image loading timeout - setting error state');
                setImageLoading(false);
                setSelectedFile(prev => ({ ...prev, error: true }));
            }, 15000); // 15 second timeout
        }
        
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [imageLoading, showFileViewer]);

    // Debug modal state changes
    useEffect(() => {
        console.log('Modal state changed:', { showFileViewer, selectedFile: selectedFile?.fileName });
    }, [showFileViewer, selectedFile]);

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
                                // Helper: determine if an item is posted (assignments/quizzes)
                                const isItemPosted = (item) => {
                                    const now = new Date();
                                    // Quizzes: respect timing.openEnabled/open when provided
                                    const looksLikeQuiz = item.type === 'quiz' || !!item.questions;
                                    if (looksLikeQuiz) {
                                        const openEnabled = item?.timing?.openEnabled;
                                        const openDate = item?.timing?.open ? new Date(item.timing.open) : null;
                                        if (openEnabled && openDate) {
                                            return openDate <= now;
                                        }
                                        // If no open gate configured, consider it posted immediately
                                        return true;
                                    }

                                    // Assignments: only gate when schedulePost is explicitly enabled
                                    const scheduleEnabled = item?.schedulePost === true;
                                    const postAt = item?.postAt ? new Date(item.postAt) : null;
                                    if (scheduleEnabled && postAt) {
                                        return postAt <= now;
                                    }
                                    // If no schedule or missing postAt, treat as posted
                                    return true;
                                };

                                // Filter and combine assignments/quizzes
                                let allItems = classwork.map(item => ({ 
                                    ...item, 
                                    isPosted: isItemPosted(item),
                                    type: item.type || (item.questions ? 'quiz' : 'assignment')
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

                                // Only show posted items to students
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
                                        {/* Unposted items are hidden for students */}

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
                                                                if (item.isSubmitted) {
                                                                    navigation.navigate('QuizView', { quizId: item._id, review: true });
                                                                } else {
                                                                    navigation.navigate('QuizView', { quizId: item._id });
                                                                }
                                                            } else {
                                                                if (item.isSubmitted) {
                                                                    Alert.alert(
                                                                        'Already Completed',
                                                                        'You have already completed this assignment.',
                                                                        [{ text: 'OK', style: 'default' }]
                                                                    );
                                                                    return;
                                                                }
                                                                navigation.navigate('AssignmentDetail', { 
                                                                    assignmentId: item._id,
                                                                    onSubmissionComplete: () => {
                                                                        fetchClasswork(classID);
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <View style={[
                                                            {
                                                                backgroundColor: 'white',
                                                                borderRadius: 12,
                                                                padding: 16,
                                                                marginBottom: 12,
                                                                elevation: 2,
                                                                shadowColor: '#000',
                                                                shadowOffset: { width: 0, height: 2 },
                                                                shadowOpacity: 0.1,
                                                                shadowRadius: 4,
                                                            },
                                                            !item.isPosted && {
                                                                opacity: 0.6,
                                                                backgroundColor: '#f5f5f5'
                                                            }
                                                        ]}>
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
                                                                
                                                                {!item.isPosted && (
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
                                                                )}
                                                                
                                                                {item.isSubmitted && (
                                                                    <View style={{ 
                                                                        backgroundColor: '#e8f5e9', 
                                                                        borderRadius: 6, 
                                                                        paddingHorizontal: 8, 
                                                                        paddingVertical: 4,
                                                                        marginLeft: 8,
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center'
                                                                    }}>
                                                                        <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                                                                        <Text style={{ 
                                                                            color: '#4CAF50', 
                                                                            fontWeight: 'bold', 
                                                                            fontSize: 11, 
                                                                            fontFamily: 'Poppins-Bold',
                                                                            marginLeft: 4
                                                                        }}>
                                                                            Completed
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                            
                                                            <Text style={{ 
                                                                fontFamily: 'Poppins-Bold', 
                                                                color: '#666', 
                                                                fontSize: 16, 
                                                                marginBottom: 4 
                                                            }}>
                                                                {item.title}
                                                            </Text>
                                                            
                                                            <Text style={{ 
                                                                fontFamily: 'Poppins-Regular', 
                                                                color: '#666', 
                                                                fontSize: 14, 
                                                                marginBottom: 6 
                                                            }}>
                                                                {item.className || 'N/A'}
                                                            </Text>
                                                            
                                                            {item.description && (
                                                                <Text style={{ 
                                                                    fontFamily: 'Poppins-Regular', 
                                                                    color: '#666', 
                                                                    fontSize: 13, 
                                                                    marginBottom: 6,
                                                                    lineHeight: 18
                                                                }}>
                                                                    {item.description}
                                                                </Text>
                                                            )}
                                                            
                                                            {item.dueDate && (
                                                                <Text style={{ 
                                                                    fontFamily: 'Poppins-Regular', 
                                                                    color: '#999', 
                                                                    fontSize: 12, 
                                                                    marginBottom: 2 
                                                                }}>
                                                                    Due: {new Date(item.dueDate).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    })}
                                                                </Text>
                                                            )}
                                                            
                                                            <Text style={{ 
                                                                fontFamily: 'Poppins-Regular', 
                                                                color: '#999', 
                                                                fontSize: 12, 
                                                                marginBottom: 2 
                                                            }}>
                                                                Points: {item.points || 0}
                                                            </Text>
                                                        </View>
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
                                    {/* External link (if provided) */}
                                    {lesson.link && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' }}>
                                            <View style={{ marginRight: 12 }}>
                                                <MaterialIcons name="link" size={20} color="#1976d2" />
                                            </View>
                                            <TouchableOpacity style={{ flex: 1, marginRight: 12 }} onPress={() => handleOpenExternalLink(lesson.link)}>
                                                <Text style={{ fontFamily: 'Poppins-Regular', color: '#1976d2', fontSize: 14, textDecorationLine: 'underline' }} numberOfLines={2}>
                                                    {lesson.link}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={{
                                                    backgroundColor: '#1976d2',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 6,
                                                    borderRadius: 6,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 4
                                                }}
                                                onPress={() => handleOpenExternalLink(lesson.link)}
                                            >
                                                <MaterialIcons name="open-in-new" size={16} color="white" />
                                                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Open</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    {/* File rows */}
                                    {lesson.files && lesson.files.map(file => (
                                        <View key={file.fileUrl} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' }}>
                                            {/* File type icon */}
                                            <View style={{ marginRight: 12 }}>
                                                {isImageFile(file.fileName) ? (
                                                    <MaterialIcons name="image" size={20} color="#4CAF50" />
                                                ) : isVideoFile(file.fileName) ? (
                                                    <MaterialIcons name="video-file" size={20} color="#FF5722" />
                                                ) : isPdfFile(file.fileName) ? (
                                                    <MaterialIcons name="picture-as-pdf" size={20} color="#F44336" />
                                                ) : (
                                                    <MaterialIcons name="insert-drive-file" size={20} color="#2196F3" />
                                                )}
                                            </View>
                                            
                                            {/* File info */}
                                            <TouchableOpacity style={{ flex: 1, marginRight: 12 }} onPress={() => handleFilePress(file)}>
                                                <Text style={{ fontFamily: 'Poppins-Regular', color: '#1976d2', fontSize: 14, textDecorationLine: 'underline', marginBottom: 2 }}>
                                                    {file.fileName}
                                                </Text>
                                                <Text style={{ fontFamily: 'Poppins-Regular', color: '#666', fontSize: 12 }}>
                                                    {isImageFile(file.fileName) ? 'Image File' : 
                                                     isVideoFile(file.fileName) ? 'Video File' : 
                                                     isPdfFile(file.fileName) ? 'PDF Document' : 'Document'}
                                                </Text>
                                            </TouchableOpacity>
                                            
                                            {/* Action button */}
                                            <TouchableOpacity 
                                                style={{
                                                    backgroundColor: isImageFile(file.fileName) ? '#4CAF50' : '#2196F3',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 6,
                                                    borderRadius: 6,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 4
                                                }}
                                                onPress={() => handleFilePress(file)}
                                            >
                                                <MaterialIcons 
                                                    name={isImageFile(file.fileName) ? 'visibility' : 'download'} 
                                                    size={16} 
                                                    color="white" 
                                                />
                                                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                                    {isImageFile(file.fileName) ? 'View' : 'Download'}
                                                </Text>
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
            
            {/* File Viewer Modal */}
            <Modal
                visible={showFileViewer}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    // Only allow closing if not loading and no critical errors
                    if (!imageLoading && !selectedFile?.error) {
                        closeFileViewer();
                    } else if (imageLoading) {
                        console.log('Preventing modal close while image is loading');
                    } else if (selectedFile?.error) {
                        console.log('Preventing modal close while showing error state');
                    }
                }}
                statusBarTranslucent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.fileViewerModal}>
                        {/* Header */}
                        <View style={styles.fileViewerHeader}>
                            <Text style={styles.fileViewerTitle}>
                                {selectedFile?.fileName || 'File Viewer'}
                            </Text>
                            <TouchableOpacity onPress={closeFileViewer} style={styles.closeButton}>
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        {/* File Content */}
                        <View style={styles.fileContent}>
                            {selectedFile && isImageFile(selectedFile.fileName) && (
                                <>
                                    {imageLoading && (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="large" color="#00418b" />
                                            <Text style={styles.loadingText}>Loading image...</Text>
                                        </View>
                                    )}

                                    {/* Error state */}
                                    {selectedFile?.error ? (
                                        <View style={styles.errorContainer}>
                                            <MaterialIcons name="error-outline" size={48} color="#f44336" />
                                            <Text style={styles.errorText}>Failed to load image</Text>
                                            <Text style={styles.errorSubtext}>The image could not be displayed</Text>
                                            <TouchableOpacity
                                                style={styles.retryButton}
                                                onPress={() => {
                                                    setImageLoading(true);
                                                    setSelectedFile(prev => ({ ...prev, error: false }));
                                                }}
                                            >
                                                <Text style={styles.retryButtonText}>Retry</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <Image
                                            source={{
                                                uri: selectedFile.fileUrl,
                                                cache: 'reload',
                                                headers: {
                                                    'Cache-Control': 'no-cache'
                                                }
                                            }}
                                            style={styles.imageViewer}
                                            resizeMode="contain"
                                            onLoadStart={() => {
                                                console.log('Image loading started for:', selectedFile.fileName);
                                                console.log('Image URL:', selectedFile.fileUrl);
                                                setImageLoading(true);
                                            }}
                                            onLoad={() => {
                                                console.log('Image loaded successfully for:', selectedFile.fileName);
                                                setImageLoading(false);
                                            }}
                                            onError={(error) => {
                                                console.error('Image loading error for:', selectedFile.fileName);
                                                console.error('Error details:', error);
                                                console.error('Image URL was:', selectedFile.fileUrl);
                                                setImageLoading(false);
                                                setSelectedFile(prev => ({ ...prev, error: true }));
                                            }}
                                            onLoadEnd={() => {
                                                console.log('Image loading ended for:', selectedFile.fileName);
                                                if (!selectedFile?.error) {
                                                    setImageLoading(false);
                                                }
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </View>
                        
                        {/* Action Buttons */}
                        <View style={styles.fileActions}>
                            <TouchableOpacity
                                style={styles.downloadButton}
                                onPress={() => {
                                    if (selectedFile?.fileUrl) {
                                        Linking.openURL(selectedFile.fileUrl).catch(() => {
                                            Alert.alert('Error', 'Unable to download file');
                                        });
                                    }
                                }}
                            >
                                <MaterialIcons name="download" size={20} color="white" />
                                <Text style={styles.downloadButtonText}>Download</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = {
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileViewerModal: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        overflow: 'hidden',
    },
    fileViewerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#f8f9fa',
    },
    fileViewerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 16,
    },
    closeButton: {
        padding: 4,
    },
    fileContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 300,
    },
    imageViewer: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f44336',
        marginTop: 10,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#00418b',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    fileActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#f8f9fa',
    },
    downloadButton: {
        backgroundColor: '#00418b',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    downloadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
};