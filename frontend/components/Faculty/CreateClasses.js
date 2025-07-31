import React, { useState, useEffect } from "react";
import { Text, TextInput, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import CreateClassesStyle from "../styles/faculty/CreateClassesStyle";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useUser } from '../UserContext';

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
        axios.get('http://localhost:5000/users')
            .then(res => {
                // Only students
                const filtered = res.data.filter(u => u.role && u.role.toLowerCase() === 'student');
                setStudents(filtered);
            })
            .catch(() => setStudents([]));
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
        if (!className || !classCode || !description || members.length === 0) {
            Alert.alert('Error', 'Please fill in all fields and add at least one member.');
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/classes', {
                className,
                classCode,
                classDesc: description,
                members: members.map(m => m._id),
                facultyID: user?._id || ''
            });
            if (res.status === 201 && res.data.success) {
                changeScreen.navigate('FDash');
            } else {
                Alert.alert('Error', 'Failed to create class.');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to create class.');
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
                        <View style={{ position: 'absolute', left: 30, right: 30, top: 230, backgroundColor: 'white', borderRadius: 8, elevation: 20, zIndex: 9999, maxHeight: 200, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
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