import { Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { Image, ScrollView } from 'react-native-web';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FacultyModuleStyle from '../styles/faculty/FacultyModuleStyle';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';

export default function FacultyModule() {
    const lessons = [
        { title: "Lesson 1: Introduction", content: "Welcome to computing!", image: "https://example.com/image1.jpg", progress: 0.10 },
        { title: "Lesson 2: Basics", content: "Let's learn about basic concepts.", image: "https://example.com/image2.jpg", progress: 0.10 },
        { title: "Lesson 3: Advanced Topics", content: "Time for advanced computing!", image: "https://example.com/image3.jpg", progress: 0.10 },
    ];
    const [currentLesson, setCurrentLesson] = useState(0);
    const [activeTab, setActiveTab] = useState('Home Page');
    const changeScreen = useNavigation();
    const back = () => changeScreen.goBack();
    let [fontsLoaded] = useFonts({
        'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    });
    if (!fontsLoaded) return null;

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 10 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 16 }}>
                <TouchableOpacity onPress={back} style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}><Icon name="arrow-left" size={24} color="black" /></TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', marginLeft: -24 }}>
                    <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 22, color: '#222' }}>Class Title</Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: '#888' }}>Class Code/Section</Text>
                </View>
            </View>
            {/* Tabs */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 8, marginLeft:10, marginRight:10 }}>
                {['Home Page', 'Classwork', 'Class Materials'].map(tab => (
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
                    {/* Home Page Title Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: '#222', flex: 1 }}>Home Page</Text>
                        <Icon name="video" size={22} color="#222" style={{ marginHorizontal: 6 }} />
                        <Icon name="phone" size={22} color="#222" />
                    </View>
                    {/* Announcement Card */}
                    <View style={{ backgroundColor: '#e3eefd', borderRadius: 8, borderWidth: 1, borderColor: '#00418b', padding: 10, marginBottom: 8 }}>
                        <Text style={{ fontFamily: 'Poppins-Bold', color: '#00418b', fontSize: 15 }}>Announcement!</Text>
                        <Text style={{ fontFamily: 'Poppins-Regular', color: '#222', fontSize: 13 }}>Welcome to the class!</Text>
                    </View>
                    {/* Lesson content (if needed) */}
                    {/* ... You can add lesson content here for other tabs ... */}
                </ScrollView>
            </View>
            {/* Blue curved background at bottom */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, backgroundColor: '#00418b', borderTopLeftRadius: 60, borderTopRightRadius: 60, zIndex: -1 }} />
        </View>
    )
}