import { Text, TouchableOpacity, View } from 'react-native';
//import StudentModuleStyle from '../styles/Stud/StudentModuleStyle';
import { useState } from 'react';
import { Image, ImageBackground, ProgressBar, ScrollView } from 'react-native-web';
import { StatusBar } from 'expo-status-bar';
import { Icon } from 'react-native-paper';


export default function StudentModule(){

    const lessons = [
        { title: "Lesson 1: Introduction", content: "Welcome to computing!", image: "https://example.com/image1.jpg" },
        { title: "Lesson 2: Basics", content: "Let's learn about basic concepts.", image: "https://example.com/image2.jpg" },
        { title: "Lesson 3: Advanced Topics", content: "Time for advanced computing!", image: "https://example.com/image3.jpg" },
    ];

    const [currentLesson, setCurrentLesson] = useState(0);
    const totalLessons = lessons.length;
    
    const handleNext = () => {
        if (currentLesson < totalLessons - 1) {
            setCurrentLesson(currentLesson + 1);
        }
    };
    
   

    return(
        <View>
            <View>
                <Icon></Icon>

            </View>
            <ScrollView>
                <View style={{backgroundColor:'lightgray', margin:20, height:500,}}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{lessons[currentLesson].title}</Text>
                    <Text style={{ marginTop: 10 }}>{lessons[currentLesson].content}</Text>
                    <Image
                        source={{ uri: lessons[currentLesson].image }}
                        style={{ width: "100%", height: 200, marginTop: 10, borderRadius: 10 }}
                        resizeMode="contain"
                    />
                </View>
            </ScrollView>
            <View style={{margin:20, flexDirection: 'row', alignItems: 'center'}}>
                <View style={{ flex: 1 }}>
                        <Text style={{ textAlign: 'left' }}>Page {currentLesson + 1} / {totalLessons}</Text>
                        <ProgressBar 
                            progress={(currentLesson + 1) / totalLessons} 
                            color="blue" 
                            style={{ height: 10, borderRadius: 5, marginRight: 10,  width:"75%"}}
                        />
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: currentLesson < totalLessons - 1 ? 'lightgray' : 'gray',
                            width: 80,
                            height: 40,
                            borderRadius: 10,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onPress={handleNext}
                        disabled={currentLesson >= totalLessons - 1}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Next</Text>
                    </TouchableOpacity>
                </View>
        </View>
    )
}