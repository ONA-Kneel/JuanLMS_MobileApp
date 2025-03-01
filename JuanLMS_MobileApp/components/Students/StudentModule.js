import { Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { Image, ImageBackground, ProgressBar, ScrollView } from 'react-native-web';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import StudentModuleStyle from '../styles/Stud/StudentModuleStyle';
import { useNavigation } from '@react-navigation/native';


export default function StudentModule(){

    const lessons = [
        { title: "Lesson 1: Introduction", content: "Welcome to computing!", image: "https://example.com/image1.jpg", progress: 0.10 },
        { title: "Lesson 2: Basics", content: "Let's learn about basic concepts.", image: "https://example.com/image2.jpg", progress: 0.10 },
        { title: "Lesson 3: Advanced Topics", content: "Time for advanced computing!", image: "https://example.com/image3.jpg", progress: 0.10 },
    ];

    const [currentLesson, setCurrentLesson] = useState(0);
    const totalLessons = lessons.length;

    //navigation
    const changeScreen = useNavigation();
    
    const back =()=>{
          changeScreen.navigate("SDash")
        }
    
    const handleNext = () => {
        if (currentLesson < totalLessons - 1) {
            setCurrentLesson(currentLesson + 1);
           }
        };

    const progressPercentage = ((currentLesson + 1) / totalLessons) * 100;
    
    return(
        <View>
            <View style={StudentModuleStyle.header}>
            <TouchableOpacity onPress={back}><Icon name="arrow-left" size={24} color="black"  /></TouchableOpacity>
            
            <View>
            <Text style={StudentModuleStyle.title}>Introduction to Computing</Text>
            <Text style={StudentModuleStyle.code}>CCINCOML</Text>
            </View>
            
            <Icon name="menu" size={24} color="black" style={{marginLeft:"auto"}} />

            </View>
            <ScrollView>
                <View style={{backgroundColor:'lightgray', margin:20, minHeight:500, height:"auto", padding:20}}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{lessons[currentLesson].title}</Text>
                    <Text style={{ marginTop: 10 }}>{lessons[currentLesson].content}</Text>
                    <Image source={{ uri: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.redgreencode.com%2Fjava-lessons-from-uhunt-chapter-1%2F&psig=AOvVaw13oSNlNSrG6r1_eJYvjAPc&ust=1740514133769000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCNig0saO3YsDFQAAAAAdAAAAABAa' }} 
                    style={StudentModuleStyle.lessonImage} />
                    <TouchableOpacity>
                    <Text style={StudentModuleStyle.link}>ppt lesson.ppt</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <View style={{margin:20, flexDirection: 'row', alignItems: 'center'}}>
                <View style={{ flex: 1 }}>
                        <Text style={{ textAlign: 'left' }}>Page {currentLesson + 1} / {totalLessons} ({Math.round(progressPercentage)}%)</Text>
                        <ProgressBar 
                            progress={(currentLesson + 1) / totalLessons} 
                            color="blue" 
                            style={{ height: 10, borderRadius: 5, marginRight: 10,  width:"75%"}}
                        />
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: currentLesson < totalLessons - 1 ? '#0047AB' : 'gray',
                            width: 80,
                            height: 40,
                            borderRadius: 10,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onPress={handleNext}
                        disabled={currentLesson >= totalLessons - 1}
                    >
                        <Text style={{ color: 'White', fontWeight: 'bold' }}>Next</Text>
                    </TouchableOpacity>
                </View>
        </View>
    )
}