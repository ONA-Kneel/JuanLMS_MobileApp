import { Text, TouchableOpacity, View, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ImageBackground, ProgressBar } from 'react-native-web';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StudentModuleStyle from '../styles/Stud/StudentModuleStyle';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts } from 'expo-font';

export default function StudentModule(){
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

    useEffect(() => {
        if (classId) {
            // If we have a specific classId from navigation, use it
            fetchSpecificClass(classId);
        } else {
            // Fallback to fetching all classes if no specific classId
            fetchAvailableClasses();
        }
    }, [classId]);

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
                            <Icon name="video" size={22} color="#222" style={{ marginHorizontal: 6 }} />
                            <Icon name="phone" size={22} color="#222" />
                        </View>
                        {/* Announcements */}
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            announcements.length === 0 ? (
                                <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13, marginTop: 10 }}>No announcements yet.</Text>
                            ) : (
                                announcements.map((item) => (
                                    <View key={item._id} style={{ backgroundColor: '#e3eefd', borderRadius: 8, borderWidth: 1, borderColor: '#00418b', padding: 10, marginBottom: 8 }}>
                                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#00418b', fontSize: 15 }}>{item.title}</Text>
                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13 }}>{item.content}</Text>
                                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#888', fontSize: 11, marginTop: 4 }}>{new Date(item.createdAt).toLocaleString()}</Text>
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
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>Classwork</Text>
                            <Icon name="video" size={22} color="#222" style={{ marginHorizontal: 6 }} />
                            <Icon name="phone" size={22} color="#222" />
                        </View>
                        {/* Classwork Content */}
                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13, marginTop: 10 }}>No classwork assigned yet.</Text>
                    </>
                );
            case 'Class Materials':
                return (
                    <>
                        {/* Class Materials Title Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>Class Materials</Text>
                            <Icon name="video" size={22} color="#222" style={{ marginHorizontal: 6 }} />
                            <Icon name="phone" size={22} color="#222" />
                        </View>
                        {/* Class Materials Content */}
                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13, marginTop: 10 }}>No materials uploaded yet.</Text>
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