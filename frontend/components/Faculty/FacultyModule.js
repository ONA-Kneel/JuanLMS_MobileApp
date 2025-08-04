import { Text, TouchableOpacity, View, ScrollView, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FacultyModuleStyle from '../styles/faculty/FacultyModuleStyle';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useUser } from '../UserContext';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

function formatDateHeader(date) {
  if (!date) return 'No date';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function groupByDate(items, getDate) {
  const groups = {};
  items.forEach(item => {
    const date = getDate(item);
    const key = date ? new Date(date).toDateString() : 'No date';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

export default function FacultyModule() {
    const route = useRoute();
    const navigation = useNavigation();

    // Get the classId from navigation params
    const classId = route.params?.classId;
    console.log('DEBUG FacultyModule: classId from navigation params:', classId);

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
    const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [savingAnnouncement, setSavingAnnouncement] = useState(false);
    // Edit/Delete state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editAnnouncementId, setEditAnnouncementId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteAnnouncementId, setDeleteAnnouncementId] = useState(null);

    // Edit/Delete state for modules
    const [showEditModuleModal, setShowEditModuleModal] = useState(false);
    const [editModuleId, setEditModuleId] = useState(null);
    const [editModuleTitle, setEditModuleTitle] = useState('');
    const [editModuleFiles, setEditModuleFiles] = useState([]);
    const [editModuleLink, setEditModuleLink] = useState('');
    const [savingEditModule, setSavingEditModule] = useState(false);
    const [showDeleteModuleModal, setShowDeleteModuleModal] = useState(false);
    const [deleteModuleId, setDeleteModuleId] = useState(null);

    useEffect(() => {
        console.log('DEBUG FacultyModule: useEffect classId:', classId);
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
            const res = await axios.get(`http://localhost:5000/assignments?classID=${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            const token = await AsyncStorage.getItem('jwtToken');
            const res = await axios.get(`http://localhost:5000/lessons?classID=${classId}`, {
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
            console.log('DEBUG FacultyModule: fetchSpecificClass targetClassId:', targetClassId);
            // Fetch class by classID using query param
            const classRes = await axios.get(`http://localhost:5000/api/classes?classID=${targetClassId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('DEBUG FacultyModule: API returned classes:', classRes.data);
            let classObj = null;
            if (Array.isArray(classRes.data)) {
                classObj = classRes.data.find(c => c.classID === targetClassId);
            } else if (classRes.data.success && Array.isArray(classRes.data.classes)) {
                classObj = classRes.data.classes.find(c => c.classID === targetClassId);
            }
            console.log('DEBUG FacultyModule: selected classObj:', classObj);
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
            // First, get all available classes
            const token = await AsyncStorage.getItem('jwtToken');
            const classesRes = await axios.get(`http://localhost:5000/api/classes`, {
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
            console.log('DEBUG FacultyModule: fetchAnnouncements classId:', classId);
            const res = await axios.get(`http://localhost:5000/announcements?classID=${classId}`, {
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
        setShowCreateAnnouncementModal(true);
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

    const saveAnnouncement = async () => {
        if (!announcementTitle.trim() || !announcementContent.trim()) return;
        setSavingAnnouncement(true);
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            await axios.post('http://localhost:5000/announcements', {
                classID,
                title: announcementTitle,
                content: announcementContent,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateAnnouncementModal(false);
            setAnnouncementTitle('');
            setAnnouncementContent('');
            // Refresh announcements
            fetchAnnouncements(classID);
        } catch (err) {
            alert('Failed to save announcement');
        } finally {
            setSavingAnnouncement(false);
        }
    };

    // Edit handlers
    const openEditModal = (announcement) => {
        setEditAnnouncementId(announcement._id);
        setEditTitle(announcement.title);
        setEditContent(announcement.content);
        setShowEditModal(true);
    };
    const saveEdit = async () => {
        if (!editTitle.trim() || !editContent.trim()) return;
        setSavingEdit(true);
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            await axios.put(`http://localhost:5000/announcements/${editAnnouncementId}`, {
                title: editTitle,
                content: editContent,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEditModal(false);
            setEditAnnouncementId(null);
            setEditTitle('');
            setEditContent('');
            fetchAnnouncements(classID);
        } catch (err) {
            alert('Failed to save changes');
        } finally {
            setSavingEdit(false);
        }
    };
    // Delete handlers
    const openDeleteModal = (announcementId) => {
        setDeleteAnnouncementId(announcementId);
        setShowDeleteModal(true);
    };
    const confirmDelete = async () => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            await axios.delete(`http://localhost:5000/announcements/${deleteAnnouncementId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowDeleteModal(false);
            setDeleteAnnouncementId(null);
            fetchAnnouncements(classID);
        } catch (err) {
            alert('Failed to delete announcement');
        }
    };

    // Edit handlers
    function openEditModuleModal(module) {
        setEditModuleId(module._id);
        setEditModuleTitle(module.title);
        setEditModuleFiles(module.files || []);
        setEditModuleLink(module.link || '');
        setShowEditModuleModal(true);
    }
    function handleEditModuleFileChange(e) {
        setEditModuleFiles(Array.from(e.target.files));
    }
    async function saveEditModule() {
        if (!editModuleTitle.trim() || (editModuleFiles.length === 0 && !editModuleLink.trim())) return;
        setSavingEditModule(true);
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            const formData = new FormData();
            formData.append('title', editModuleTitle);
            if (editModuleLink.trim()) formData.append('link', editModuleLink.trim());
            editModuleFiles.forEach(file => {
                if (isWeb) {
                    formData.append('files', file);
                } else {
                    formData.append('files', {
                        uri: file.uri,
                        name: file.name || 'file',
                        type: file.mimeType || 'application/octet-stream',
                    });
                }
            });
            await axios.put(`http://localhost:5000/lessons/${editModuleId}`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            setShowEditModuleModal(false);
            setEditModuleId(null);
            setEditModuleTitle('');
            setEditModuleFiles([]);
            setEditModuleLink('');
            fetchMaterials(classID);
        } catch (err) {
            alert('Failed to save module changes');
        } finally {
            setSavingEditModule(false);
        }
    }
    // Delete handlers
    function openDeleteModuleModal(moduleId) {
        setDeleteModuleId(moduleId);
        setShowDeleteModuleModal(true);
    }
    async function confirmDeleteModule() {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            await axios.delete(`http://localhost:5000/lessons/${deleteModuleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowDeleteModuleModal(false);
            setDeleteModuleId(null);
            fetchMaterials(classID);
        } catch (err) {
            alert('Failed to delete module');
        }
    }

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
                        {/* Create Announcement Modal */}
                        <Modal
                            visible={showCreateAnnouncementModal}
                            animationType="slide"
                            transparent={true}
                            onRequestClose={() => setShowCreateAnnouncementModal(false)}
                        >
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)', zIndex: 9999 }}
                            >
                                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '94%', maxWidth: 420, borderWidth: 1, borderColor: '#b6c8e6', zIndex: 9999 }}>
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 18, marginBottom: 16 }}>Add New Announcement</Text>
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>Title</Text>
                                    <TextInput
                                        value={announcementTitle}
                                        onChangeText={setAnnouncementTitle}
                                        style={{ backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#222', padding: 8, marginBottom: 16, fontFamily: 'Poppins-Regular', fontSize: 15 }}
                                        placeholder="Enter announcement title"
                                    />
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>Content</Text>
                                    <TextInput
                                        value={announcementContent}
                                        onChangeText={setAnnouncementContent}
                                        style={{ backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#222', padding: 8, marginBottom: 20, fontFamily: 'Poppins-Regular', fontSize: 15, minHeight: 70, textAlignVertical: 'top' }}
                                        placeholder="Enter announcement content"
                                        multiline
                                    />
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                        <TouchableOpacity
                                            onPress={() => setShowCreateAnnouncementModal(false)}
                                            style={{ backgroundColor: '#888fa1', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, marginRight: 10 }}
                                            disabled={savingAnnouncement}
                                        >
                                            <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={saveAnnouncement}
                                            style={{ backgroundColor: '#183a8c', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, opacity: (!announcementTitle.trim() || !announcementContent.trim() || savingAnnouncement) ? 0.6 : 1 }}
                                            disabled={!announcementTitle.trim() || !announcementContent.trim() || savingAnnouncement}
                                        >
                                            <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Save Announcement</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </KeyboardAvoidingView>
                        </Modal>
                        {/* Edit Announcement Modal */}
                        <Modal
                            visible={showEditModal}
                            animationType="slide"
                            transparent={true}
                            onRequestClose={() => setShowEditModal(false)}
                        >
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)' }}
                            >
                                <View style={{ backgroundColor: '#e3eefd', borderRadius: 10, padding: 20, width: '94%', maxWidth: 700, borderWidth: 1, borderColor: '#b6c8e6' }}>
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>Edit Title</Text>
                                    <TextInput
                                        value={editTitle}
                                        onChangeText={setEditTitle}
                                        style={{ backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#222', padding: 8, marginBottom: 16, fontFamily: 'Poppins-Regular', fontSize: 15 }}
                                        placeholder="Enter announcement title"
                                    />
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>Edit Content</Text>
                                    <TextInput
                                        value={editContent}
                                        onChangeText={setEditContent}
                                        style={{ backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#222', padding: 8, marginBottom: 16, fontFamily: 'Poppins-Regular', fontSize: 15, minHeight: 70, textAlignVertical: 'top' }}
                                        placeholder="Enter announcement content"
                                        multiline
                                    />
                                    <TouchableOpacity
                                        onPress={saveEdit}
                                        style={{ backgroundColor: '#183a8c', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, alignSelf: 'flex-start', marginTop: 4, opacity: (!editTitle.trim() || !editContent.trim() || savingEdit) ? 0.6 : 1 }}
                                        disabled={!editTitle.trim() || !editContent.trim() || savingEdit}
                                    >
                                        <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Save Changes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ position: 'absolute', top: 10, right: 14 }}>
                                        <Text style={{ fontSize: 22, color: '#888' }}>×</Text>
                                    </TouchableOpacity>
                                </View>
                            </KeyboardAvoidingView>
                        </Modal>
                        {/* Delete Confirmation Modal */}
                        <Modal
                            visible={showDeleteModal}
                            animationType="fade"
                            transparent={true}
                            onRequestClose={() => setShowDeleteModal(false)}
                        >
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)' }}>
                                <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 24, width: '85%', maxWidth: 400, borderWidth: 1, borderColor: '#b6c8e6', alignItems: 'center' }}>
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 16, marginBottom: 12, textAlign: 'center' }}>Are you sure you want to delete this announcement?</Text>
                                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                                        <TouchableOpacity onPress={confirmDelete} style={{ backgroundColor: '#d32f2f', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, marginRight: 10 }}>
                                            <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Delete</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={{ backgroundColor: '#bdbdbd', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18 }}>
                                            <Text style={{ color: '#222', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
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
                                        {/* Edit/Delete buttons (faculty only) */}
                                        {user?.role === 'faculty' && (
                                            <View style={{ flexDirection: 'row', position: 'absolute', top: 12, right: 12 }}>
                                                <TouchableOpacity onPress={() => openEditModal(item)} style={{ backgroundColor: '#ffd600', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8 }}>
                                                    <Text style={{ color: '#222', fontFamily: 'Poppins-Bold', fontSize: 13 }}>Edit</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => openDeleteModal(item._id)} style={{ backgroundColor: '#d32f2f', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 10 }}>
                                                    <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 13 }}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between', position: 'relative'}}>
                            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>Classwork</Text>
                            {/* + Create Dropdown Button (faculty only) */}
                            {/* <View style={{ position: 'relative', alignSelf: 'flex-start ', zIndex: 9999  }}>
                                {user?.role === 'faculty' && (
                                    <TouchableOpacity
                                        onPress={() => setShowCreateDropdown(!showCreateDropdown)}
                                        style={{ backgroundColor: '#183a8c', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start' }}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 14, textAlign: 'center' }}>+ Create ▼</Text>
                                    </TouchableOpacity>
                                )}
                                {showCreateDropdown && (
                                    <View style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        backgroundColor: '#fff',
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: '#183a8c',
                                        zIndex: 9999,
                                        minWidth: 120,
                                        shadowColor: '#000',
                                        shadowOpacity: 0.12,
                                        shadowRadius: 8,
                                        elevation: 12,
                                        marginBottom: 8,
                                    }}>
                                        <TouchableOpacity onPress={handleCreateAssignment} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
                                            <Text style={{ color: '#222', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Assignment</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleCreateQuiz} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
                                            <Text style={{ color: '#222', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Quiz</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View> */}
                        </View>
                        {/* Classwork Content */}
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            (() => {
                                // Sort by createdAt/postAt descending
                                const sorted = [...classwork].sort((a, b) => {
                                    const aDate = a.postAt || a.createdAt;
                                    const bDate = b.postAt || b.createdAt;
                                    return new Date(bDate) - new Date(aDate);
                                });
                                // Group by date
                                const groups = groupByDate(sorted, item => item.postAt || item.createdAt);
                                return Object.entries(groups).map(([dateKey, items]) => (
                                    <View key={dateKey}>
                                        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: '#222', marginBottom: 8, marginTop: 18 }}>
                                            {(() => {
                                                const year = new Date(dateKey).getFullYear();
                                                return year >= 2099 ? 'Not Posted Yet' : formatDateHeader(dateKey);
                                            })()}
                                        </Text>
                                        {items.map(item => {
                                            const isFuturePost = item.postAt && new Date(item.postAt) > new Date();
                                            const isSuperFuture = item.postAt && new Date(item.postAt).getFullYear() >= 2099;
                                            return (
                                                <View key={item._id} style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#cfe2ff', padding: 18, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                                                    {isFuturePost ? (
                                                        <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#888fa1', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                                                            <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 12 }}>Not Posted Yet</Text>
                                                        </View>
                                                    ) : null}
                                                    <View style={{ flex: 1 }}>
                                                        {/* Type Pill */}
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                                            <View style={{ backgroundColor: item.type === 'quiz' ? '#cdb4f6' : '#b6f5c3', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 2, marginRight: 8 }}>
                                                                <Text style={{ color: item.type === 'quiz' ? '#7c3aed' : '#15803d', fontWeight: 'bold', fontSize: 13, fontFamily: 'Poppins-Bold' }}>{item.type === 'quiz' ? 'Quiz' : 'Assignment'}</Text>
                                                            </View>
                                                        </View>
                                                        {/* Title */}
                                                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 18, marginBottom: 2 }}>{item.title}</Text>
                                                        {isFuturePost ? (
                                                            <Text style={{ color: '#888fa1', fontFamily: 'Poppins-Regular', fontSize: 13, marginTop: 4 }}>
                                                                {isSuperFuture ? 'Not Posted Yet' : `Will be posted on ${formatDateHeader(item.postAt)}`}
                                                            </Text>
                                                        ) : null}
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
                                            );
                                        })}
                                    </View>
                                ))
                            })()
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
                            <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
                                {user?.role === 'faculty' && (
                                    <TouchableOpacity
                                        onPress={() => setShowAddModuleModal(true)}
                                        style={{ backgroundColor: '#183a8c', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start' }}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 14, textAlign: 'center' }}>+ Add Material</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
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
                                        {/* Edit/Delete buttons (faculty only) */}
                                        {user?.role === 'faculty' && (
                                            <View style={{ flexDirection: 'row' }}>
                                                <TouchableOpacity onPress={() => openEditModuleModal(lesson)} style={{ backgroundColor: '#ffd600', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8 }}>
                                                    <Text style={{ color: '#222', fontFamily: 'Poppins-Bold', fontSize: 13 }}>Edit</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => openDeleteModuleModal(lesson._id)} style={{ backgroundColor: '#d32f2f', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 10 }}>
                                                    <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 13 }}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
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

    // For web file input
    const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

    // Add mobile file picker handler
    async function handleMobileFilePick(setFiles) {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
            if (!result.canceled) {
                // result.assets is an array of picked files
                setFiles(files => [...files, ...result.assets]);
            }
        } catch (err) {
            alert('Failed to pick file');
        }
    }

    const [showAddModuleModal, setShowAddModuleModal] = useState(false);
    const [moduleTitle, setModuleTitle] = useState('');
    const [moduleFiles, setModuleFiles] = useState([]);
    const [moduleLink, setModuleLink] = useState('');
    const [savingModule, setSavingModule] = useState(false);

    // File input handler (web only)
    function handleFileChange(e) {
        setModuleFiles(Array.from(e.target.files));
    }

    async function saveModule() {
        if (!moduleTitle.trim() || (moduleFiles.length === 0 && !moduleLink.trim())) return;
        setSavingModule(true);
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            const formData = new FormData();
            formData.append('classID', classID);
            formData.append('title', moduleTitle);
            if (moduleLink.trim()) formData.append('link', moduleLink.trim());
            moduleFiles.forEach(file => {
                if (isWeb) {
                    formData.append('files', file);
                } else {
                    formData.append('files', {
                        uri: file.uri,
                        name: file.name || 'file',
                        type: file.mimeType || 'application/octet-stream',
                    });
                }
            });
            await axios.post('http://localhost:5000/lessons', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            setShowAddModuleModal(false);
            setModuleTitle('');
            setModuleFiles([]);
            setModuleLink('');
            fetchMaterials(classID);
        } catch (err) {
            alert('Failed to save module');
        } finally {
            setSavingModule(false);
        }
    }

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
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 8, marginLeft: 10, marginRight: 10 }}>
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
                <View style={{
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#00418b',
                    width: '92%',
                    marginBottom: 20,
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                    overflow: 'hidden',
                    flex: 1,
                }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            padding: 18,
                            paddingBottom: 40,
                        }}
                    >
                        {renderTabContent()}
                    </ScrollView>
                </View>
            </View>
            {/* Blue curved background at bottom */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, backgroundColor: '#00418b', borderTopLeftRadius: 60, borderTopRightRadius: 60, zIndex: -1 }} />
            {/* Edit Module Modal */}
            <Modal
                visible={showEditModuleModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModuleModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)' }}
                >
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '94%', maxWidth: 420, borderWidth: 1, borderColor: '#b6c8e6' }}>
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 18, marginBottom: 16 }}>Edit Module</Text>
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>Lesson Title</Text>
                        <TextInput
                            value={editModuleTitle}
                            onChangeText={setEditModuleTitle}
                            style={{ backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#222', padding: 8, marginBottom: 16, fontFamily: 'Poppins-Regular', fontSize: 15 }}
                            placeholder="Enter lesson title"
                        />
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>Upload Files</Text>
                        {isWeb ? (
                            <input
                                type="file"
                                multiple
                                onChange={handleEditModuleFileChange}
                                style={{ marginBottom: 16, fontFamily: 'Poppins-Regular', fontSize: 15 }}
                            />
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => handleMobileFilePick(setEditModuleFiles)}
                                    style={{ backgroundColor: '#e3eefd', borderRadius: 5, borderWidth: 1, borderColor: '#183a8c', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 }}
                                >
                                    <Text style={{ color: '#183a8c', fontFamily: 'Poppins-Bold', fontSize: 14 }}>Pick Files</Text>
                                </TouchableOpacity>
                                {editModuleFiles.length > 0 && (
                                    <View style={{ marginBottom: 12 }}>
                                        {editModuleFiles.map((file, idx) => (
                                            <Text key={file.uri || file.name || idx} style={{ fontSize: 13, color: '#222' }}>{file.name || file.uri}</Text>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>or Paste Link</Text>
                        <TextInput
                            value={editModuleLink}
                            onChangeText={setEditModuleLink}
                            style={{ backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#222', padding: 8, marginBottom: 20, fontFamily: 'Poppins-Regular', fontSize: 15 }}
                            placeholder="https://example.com/lesson.pdf"
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                            <TouchableOpacity
                                onPress={() => setShowEditModuleModal(false)}
                                style={{ backgroundColor: '#888fa1', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, marginRight: 10 }}
                                disabled={savingEditModule}
                            >
                                <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveEditModule}
                                style={{ backgroundColor: '#183a8c', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, opacity: (!editModuleTitle.trim() || (editModuleFiles.length === 0 && !editModuleLink.trim()) || savingEditModule) ? 0.6 : 1 }}
                                disabled={!editModuleTitle.trim() || (editModuleFiles.length === 0 && !editModuleLink.trim()) || savingEditModule}
                            >
                                <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Save Module</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            {/* Delete Module Confirmation Modal */}
            <Modal
                visible={showDeleteModuleModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowDeleteModuleModal(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)' }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 24, width: '85%', maxWidth: 400, borderWidth: 1, borderColor: '#b6c8e6', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 16, marginBottom: 12, textAlign: 'center' }}>Are you sure you want to delete this module?</Text>
                        <View style={{ flexDirection: 'row', marginTop: 10 }}>
                            <TouchableOpacity onPress={confirmDeleteModule} style={{ backgroundColor: '#d32f2f', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, marginRight: 10 }}>
                                <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowDeleteModuleModal(false)} style={{ backgroundColor: '#bdbdbd', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18 }}>
                                <Text style={{ color: '#222', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Add Material Modal */}
            <Modal
                visible={showAddModuleModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModuleModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)', zIndex: 9999 }}
                >
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '94%', maxWidth: 420, borderWidth: 1, borderColor: '#b6c8e6', zIndex: 9999 }}>
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 18, marginBottom: 16 }}>Add New Material</Text>
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>Lesson Title</Text>
                        <TextInput
                            value={moduleTitle}
                            onChangeText={setModuleTitle}
                            style={{ backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#222', padding: 8, marginBottom: 16, fontFamily: 'Poppins-Regular', fontSize: 15 }}
                            placeholder="Enter lesson title"
                        />
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>Upload Files</Text>
                        {isWeb ? (
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                style={{ marginBottom: 16, fontFamily: 'Poppins-Regular', fontSize: 15 }}
                            />
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => handleMobileFilePick(setModuleFiles)}
                                    style={{ backgroundColor: '#e3eefd', borderRadius: 5, borderWidth: 1, borderColor: '#183a8c', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 }}
                                >
                                    <Text style={{ color: '#183a8c', fontFamily: 'Poppins-Bold', fontSize: 14 }}>Pick Files</Text>
                                </TouchableOpacity>
                                {moduleFiles.length > 0 && (
                                    <View style={{ marginBottom: 12 }}>
                                        {moduleFiles.map((file, idx) => (
                                            <Text key={file.uri || file.name || idx} style={{ fontSize: 13, color: '#222' }}>{file.name || file.uri}</Text>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#222', fontSize: 15, marginBottom: 6 }}>or Paste Link</Text>
                        <TextInput
                            value={moduleLink}
                            onChangeText={setModuleLink}
                            style={{ backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#222', padding: 8, marginBottom: 20, fontFamily: 'Poppins-Regular', fontSize: 15 }}
                            placeholder="https://example.com/lesson.pdf"
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                            <TouchableOpacity
                                onPress={() => setShowAddModuleModal(false)}
                                style={{ backgroundColor: '#888fa1', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, marginRight: 10 }}
                                disabled={savingModule}
                            >
                                <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveModule}
                                style={{ backgroundColor: '#183a8c', borderRadius: 5, paddingVertical: 10, paddingHorizontal: 18, opacity: (!moduleTitle.trim() || (moduleFiles.length === 0 && !moduleLink.trim()) || savingModule) ? 0.6 : 1 }}
                                disabled={!moduleTitle.trim() || (moduleFiles.length === 0 && !moduleLink.trim()) || savingModule}
                            >
                                <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>Save Material</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    )
}