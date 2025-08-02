import { Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FacultyModuleStyle from '../styles/faculty/FacultyModuleStyle';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useUser } from '../UserContext';

export default function FacultyModule() {
    const route = useRoute();
    const navigation = useNavigation();
    
    // Get the classId from navigation params
    const classId = route.params?.classId;
    
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
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const createBtnRef = useRef(null);
    const { user } = useUser();

    useEffect(() => {
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
            const res = await axios.get(`http://localhost:5000/api/assignments?classID=${classId}`);
            setClasswork(res.data);
            console.log('Fetched classwork (Faculty):', res.data); // Debug log
        } catch (err) {
            setClasswork([]);
            console.log('Error fetching classwork (Faculty):', err);
        }
    };

    const fetchMaterials = async (classId) => {
        setMaterialsLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/lessons?classID=${classId}`);
            setMaterials(res.data);
        } catch (err) {
            setMaterials([]);
        } finally {
            setMaterialsLoading(false);
        }
    };

    const fetchSpecificClass = async (targetClassId) => {
        try {
            // Fetch specific class by ID
            const classRes = await axios.get(`http://localhost:5000/api/classes/${targetClassId}`);
            if (classRes.data.success) {
                setClassID(classRes.data.class.classID);
                setClassInfo({
                    className: classRes.data.class.className,
                    classCode: classRes.data.class.classCode
                });
                
                // Fetch announcements for this specific class
                fetchAnnouncements(classRes.data.class.classID);
                fetchClasswork(classRes.data.class.classID); // Fetch classwork
                fetchMaterials(classRes.data.class.classID); // Fetch materials
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
            // First, get all available classes
            const classesRes = await axios.get(`http://localhost:5000/api/classes`);
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
            const res = await axios.get(`http://localhost:5000/api/announcements?classID=${classId}`);
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
    const [activeTab, setActiveTab] = useState('Announcement');
    const changeScreen = useNavigation();
    const back = () => changeScreen.goBack();
    let [fontsLoaded] = useFonts({
        'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    });
    if (!fontsLoaded) return null;

    // Placeholder handlers
    const handleCreateAnnouncement = () => {
        // TODO: Open create announcement modal/screen
        alert('Create New Announcement');
    };
    const handleCreateAssignment = () => {
        setShowCreateDropdown(false);
        alert('Create Assignment');
    };
    const handleCreateQuiz = () => {
        setShowCreateDropdown(false);
        alert('Create Quiz');
    };
    const handleAddMaterial = () => {
        alert('Add Material');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Announcement':
                return (
                    <>
                        {/* Announcement Title Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1, alignItems: 'center' }}>Announcement</Text>
                            {/* Create New Announcement Button (faculty only) */}
                            <View style={{ position: 'relative' }}>
                                {user?.role === 'faculty' && (
                                    <TouchableOpacity
                                        onPress={handleCreateAnnouncement}
                                        style={{ backgroundColor: '#183a8c', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start', marginBottom: 14 }}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 14, textAlign: 'center' }}>+ Announcement</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
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
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontFamily: 'Poppins-Bold',
                                          color: '#00418b',
                                          fontSize: 17,
                                          marginBottom: 4,
                                          letterSpacing: 0.1,
                                        }}
                                      >
                                        {item.title}
                                      </Text>
                                      <Text
                                        style={{
                                          fontFamily: 'Poppins-Regular',
                                          color: '#222',
                                          fontSize: 15,
                                          lineHeight: 21,
                                        }}
                                      >
                                        {item.content}
                                      </Text>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>Classwork</Text>
                            {/* + Create Dropdown Button (faculty only) */}
                            {user?.role === 'faculty' && (
                                <TouchableOpacity
                                    ref={createBtnRef}
                                    onLayout={event => {
                                        const { x, y, width, height } = event.nativeEvent.layout;
                                        setDropdownPos({ x, y, width, height });
                                    }}
                                    onPress={() => setShowCreateDropdown(!showCreateDropdown)}
                                    style={{ backgroundColor: '#183a8c', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start' }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 14, textAlign: 'center' }}>+ Create ▼</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {/* Classwork Content */}
                        {loading ? (
                            <ActivityIndicator />
                        ) : classwork.length === 0 ? (
                            <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13, marginTop: 10 }}>No classwork assigned yet.</Text>
                        ) : (
                            classwork.map(item => (
                                <View key={item._id} style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#cfe2ff', padding: 18, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                                    <View style={{ flex: 1 }}>
                                        {/* Type Pill */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                            <View style={{ backgroundColor: item.type === 'quiz' ? '#cdb4f6' : '#b6f5c3', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 2, marginRight: 8 }}>
                                                <Text style={{ color: item.type === 'quiz' ? '#7c3aed' : '#15803d', fontWeight: 'bold', fontSize: 13, fontFamily: 'Poppins-Bold' }}>{item.type === 'quiz' ? 'Quiz' : 'Assignment'}</Text>
                                            </View>
                                        </View>
                                        {/* Title */}
                                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 18, marginBottom: 2 }}>{item.title}</Text>
                                        {/* Description */}
                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 15, marginBottom: 6 }}>{item.description || item.instructions}</Text>
                                        {/* Due Date */}
                                        {item.dueDate && <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 13, marginBottom: 2 }}>Due: {new Date(item.dueDate).toLocaleString()}</Text>}
                                        {/* Points */}
                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 13 }}>Points: {item.points || 1}</Text>
                                    </View>
                                    {/* Three-dot menu */}
                                    <View style={{ marginLeft: 10 }}>
                                        <Icon name="dots-vertical" size={22} color="#222" />
                                    </View>
                                </View>
                            ))
                        )}
                    </>
                );
            case 'Class Materials':
                return (
                    <>
                        {/* Class Materials Title Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }}>
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>Class Materials</Text>
                            {/* Add Material Button (faculty only) */}
                            {user?.role === 'faculty' && (
                                <TouchableOpacity
                                    onPress={handleAddMaterial}
                                    style={{ backgroundColor: '#183a8c', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start' }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 14, textAlign: 'center' }}>+ Add Material</Text>
                                </TouchableOpacity>
                            )}
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
                                }}>
                                  {/* Header */}
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
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#fff', fontSize: 17, flex: 1 }}>
                                      {lesson.title}
                                    </Text>
                                  </View>
                                  {/* Section label row */}
                                  <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f9f9f9' }}>
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 14, flex: 1 }}>Module</Text>
                                  </View>
                                  {/* File rows */}
                                  {lesson.files && lesson.files.map(file => (
                                    <View key={file.fileUrl} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff' }}>
                                      <Icon name="file-document-outline" size={18} color="#222" style={{ marginRight: 6 }} />
                                      <TouchableOpacity onPress={() => {/* handle file open/download */}}>
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
                <TouchableOpacity onPress={back} style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}><Icon name="arrow-left" size={24} color="black" /></TouchableOpacity>
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
                <ScrollView style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#00418b', width: '92%', flex: 1, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'visible' }}>
                    {renderTabContent()}
                </ScrollView>
            </View>
            {/* Blue curved background at bottom */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, backgroundColor: '#00418b', borderTopLeftRadius: 60, borderTopRightRadius: 60, zIndex: -1 }} />
            {/* Portal-like Dropdown for + Create */}
            {showCreateDropdown && (
                <View style={{
                    position: 'absolute',
                    top: dropdownPos.y + dropdownPos.height + 10, // 10px below button
                    left: dropdownPos.x,
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#183a8c',
                    zIndex: 2000,
                    minWidth: 120,
                    shadowColor: '#000',
                    shadowOpacity: 0.12,
                    shadowRadius: 8,
                    elevation: 12,
                }}>
                    <TouchableOpacity onPress={handleCreateAssignment} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
                        <Text style={{ color: '#222', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Assignment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCreateQuiz} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
                        <Text style={{ color: '#222', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Quiz</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}