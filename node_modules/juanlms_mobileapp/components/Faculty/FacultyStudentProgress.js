import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image, StyleSheet } from "react-native-web";
import { ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import StudentProgStyle from "../styles/Stud/StudentProgStyle";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../UserContext';

export default function FacultyStudentProgress() {
    const navigation = useNavigation();
    const { user } = useUser();
    const screenWidth = Dimensions.get("window").width;
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [academicContext, setAcademicContext] = useState('2025-2026 | Term 1');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const resolveProfileUri = () => {
        if (user?.profilePicture) {
            if (user.profilePicture.startsWith('http')) {
                return user.profilePicture;
            } else {
                return `http://192.168.1.100:3000/${user.profilePicture}`;
            }
        }
        return null;
    };

    return (
        <ScrollView style={StudentProgStyle.container}>
            {/* Blue background */}
            <View style={styles.blueHeaderBackground} />
            {/* White card header */}
            <View style={styles.whiteHeaderCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={styles.headerTitle}>
                            Student Progress
                        </Text>
                        <Text style={styles.headerSubtitle}>{academicContext}</Text>
                        <Text style={styles.headerSubtitle2}>{formatDateTime(currentDateTime)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={20} color="#00418b" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('FProfile')}>
                            {resolveProfileUri() ? (
                                <Image 
                                    source={{ uri: resolveProfileUri() }} 
                                    style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Image 
                                    source={require('../../assets/profile-icon (2).png')} 
                                    style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }}
                                    resizeMode="cover"
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={StudentProgStyle.card}>
                <Text style={StudentProgStyle.cardTitle}>Semester 1</Text>
                <Text style={StudentProgStyle.cardCode}>AHSN-001</Text>
                <Text style={StudentProgStyle.cardSubText}>60% Done - 2 weeks remaining</Text>
                <ProgressBar progress={0.6} color="black" style={StudentProgStyle.progressBar} />
                <Ionicons name="arrow-forward-circle" size={24} color="white" style={StudentProgStyle.arrowIcon} />
            </View>

            <View style={StudentProgStyle.imageContainer}>
            <Image
                source={require("../../assets/mockups/studentprogress.png")}
                style={{ 
                    width: screenWidth * 0.9,  
                    height: 300,               
                    resizeMode: "contain",    
                    alignSelf: "center",       
                }}
            />

            </View>

            <View style={StudentProgStyle.card}>
                <Text style={StudentProgStyle.cardTitle}>Weekly Progression</Text>
                <Text style={StudentProgStyle.insight}>Insight: </Text>
                <Text style={StudentProgStyle.cardSubText}>Last week vs This week</Text>
                <ProgressBar progress={0.75} color="black" style={StudentProgStyle.progressBar} />
                <Text style={StudentProgStyle.feedback}>Doing better this</Text>
                <Text style={StudentProgStyle.feedback2}>week, keep it up!</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // Unified header styles
    blueHeaderBackground: {
        backgroundColor: '#00418b',
        height: 90,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    whiteHeaderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: -40,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        zIndex: 2,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        color: '#222',
        fontFamily: 'Poppins-Bold',
    },
    headerSubtitle: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    headerSubtitle2: {
        color: '#666',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        marginTop: 2,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
