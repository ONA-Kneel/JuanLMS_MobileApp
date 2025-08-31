import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import CreateClassesStyle from "../styles/faculty/CreateClassesStyle";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useUser } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthHeaders, handleApiError } from '../../utils/apiUtils';

export default function CreateClasses() {
    const changeScreen = useNavigation();
    const { user } = useUser();
    const back = () => {
        changeScreen.navigate("FDash")
    }

    // State
    const [className, setClassName] = useState("");
    const [classCode, setClassCode] = useState("");
    const [description, setDescription] = useState("");
    const [members, setMembers] = useState([]); // array of selected students
    const [studentSearch, setStudentSearch] = useState("");
    const [students, setStudents] = useState([]); // all students fetched
    const [dropdownVisible, setDropdownVisible] = useState(false);

    // Fetch students on mount
    useEffect(() => {
        (async () => {
            const token = await AsyncStorage.getItem('jwtToken');
            axios.get('https://juanlms-webapp-server.onrender.com/users', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    // Only students
                    const filtered = res.data.filter(u => u.role && u.role.toLowerCase() === 'student');
                    setStudents(filtered);
                })
                .catch(() => setStudents([]));
        })();
    }, []);

    // Auto-generate class code
    useEffect(() => {
        if (className.length >= 3) {
            const letters = className.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
            const numbers = Math.floor(100 + Math.random() * 900); // 3 random digits
            setClassCode(letters + numbers);
        } else {
            setClassCode("");
        }
    }, [className]);

    // Filter students for dropdown
    const filteredStudents = students.filter(s =>
        (`${s.firstname} ${s.lastname}`.toLowerCase().includes(studentSearch.toLowerCase())) &&
        !members.some(m => m._id === s._id)
    );

    // Add member
    const addMember = (student) => {
        setMembers([...members, student]);
        setStudentSearch("");
        setDropdownVisible(false);
    };

    // Remove member
    const removeMember = (id) => {
        setMembers(members.filter(m => m._id !== id));
    };

    // Submit handler
    const handleSubmit = async () => {
        try {
            if (!className.trim() || !classCode.trim() || !description.trim() || members.length === 0) {
                Alert.alert('Error', 'Please fill in all required fields and add at least one member.');
                return;
            }

            const headers = await getAuthHeaders();
            
            const res = await axios.post('https://juanlms-webapp-server.onrender.com/api/classes', {
                className: className.trim(),
                classCode: classCode.trim(),
                classDesc: description.trim(),
                members: members.map(m => m._id),
                facultyID: user?._id || ''
            }, { headers });

            if (res.data) {
                Alert.alert('Success', 'Class created successfully!');
                changeScreen.navigate('FDash');
            }
        } catch (error) {
            console.error('Error creating class:', error);
            const errorMessage = handleApiError(error, 'Failed to create class');
            Alert.alert('Error', errorMessage);
        }
    };

    return (
        <View style={CreateClassesStyle.container}>
            {/* Blue curved header background */}
            <View style={CreateClassesStyle.blueHeaderBackground} />
            {/* White card */}
            <View style={CreateClassesStyle.whiteCard}>
                {/* Header row */}
                <View style={CreateClassesStyle.header}>
                    <TouchableOpacity onPress={back} style={CreateClassesStyle.backBtn}>
                        <Icon name="arrow-left" size={24} color="#00418b" />
                    </TouchableOpacity>
                    <Text style={CreateClassesStyle.headerTitle}>Create Class</Text>
                </View>
                {/* Form fields */}
                <View style={CreateClassesStyle.inputGroup}>
                    <Text style={CreateClassesStyle.label}>Class Name</Text>
                    <TextInput
                        style={CreateClassesStyle.input}
                        placeholder="Enter class name"
                        placeholderTextColor="#888"
                        value={className}
                        onChangeText={setClassName}
                    />
                </View>
                <View style={CreateClassesStyle.inputGroup}>
                    <Text style={CreateClassesStyle.label}>Class Code</Text>
                    <TextInput
                        style={CreateClassesStyle.input}
                        placeholder="Auto-generated class code"
                        placeholderTextColor="#888"
                        value={classCode}
                        editable={false}
                    />
                </View>
                <View style={CreateClassesStyle.inputGroup}>
                    <Text style={CreateClassesStyle.label}>Members</Text>
                    <TextInput
                        style={CreateClassesStyle.input}
                        placeholder="Enter Name"
                        placeholderTextColor="#888"
                        value={studentSearch}
                        onChangeText={text => {
                            setStudentSearch(text);
                            setDropdownVisible(true);
                        }}
                        onFocus={() => setDropdownVisible(true)}
                    />
                    {/* Selected members */}
                    <ScrollView
                        horizontal={false}
                        style={{ maxHeight: 120, marginTop: 5 }}
                        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
                        showsVerticalScrollIndicator={members.length > 3}
                    >
                        {members.map(m => (
                            <View key={m._id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f0ff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 2 }}>
                                <View>
                                    <Text style={{ color: '#00418b', fontWeight: 'bold' }}>{m.firstname} {m.lastname}</Text>
                                    <Text style={{ color: '#888', fontSize: 12 }}>{m.role}{m.college ? `: ${m.college}` : ''}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeMember(m._id)}>
                                    <Icon name="close" size={16} color="#00418b" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                    {/* Dropdown */}
                    {dropdownVisible && filteredStudents.length > 0 && (
                        <View style={{ position: 'absolute', left: 30, right: 30, top: 230, backgroundColor: 'white', borderRadius: 8, elevation: 20, zIndex: 9999, maxHeight: 200, borderWidth: 1, borderColor: '#eee', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)' }}>
                            <ScrollView keyboardShouldPersistTaps="handled">
                                {filteredStudents.map(s => (
                                    <TouchableOpacity key={s._id} onPress={() => addMember(s)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                                        <Text style={{ fontWeight: 'bold', color: '#222' }}>{s.firstname} {s.lastname}</Text>
                                        <Text style={{ color: '#888', fontSize: 12 }}>{s.role}</Text>
                                        {s.college ? <Text style={{ color: '#888', fontSize: 12 }}>{s.college}</Text> : null}
                                        <Text style={{ color: '#aaa', fontSize: 12 }}>{s.email}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
                <View style={CreateClassesStyle.inputGroup}>
                    <Text style={CreateClassesStyle.label}>Description</Text>
                    <TextInput
                        style={CreateClassesStyle.textarea}
                        placeholder="Enter description"
                        placeholderTextColor="#888"
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>
                {/* Submit button */}
                <TouchableOpacity
                    style={{
                        backgroundColor: '#204080',
                        borderRadius: 20,
                        paddingVertical: 14,
                        alignItems: 'center',
                        marginTop: 10
                    }}
                    onPress={handleSubmit}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Create Class</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
} 