import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image } from "react-native-web";
import { ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import StudentProgStyle from "../styles/Stud/StudentProgStyle";

export default function AdminProgress() {
    const navigation = useNavigation();
    const screenWidth = Dimensions.get("window").width;

    return (
        <ScrollView style={StudentProgStyle.container}>
            <View style={StudentProgStyle.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={StudentProgStyle.title}>My Progress</Text>
            </View>

            <View style={StudentProgStyle.card}>
                <Text style={StudentProgStyle.cardTitle}>Semester 1</Text>
                <Text style={StudentProgStyle.cardCode}>AHSN-001</Text>
                <Text style={StudentProgStyle.cardSubText}>90% Done - 1 Day Remaining</Text>
                <ProgressBar progress={0.9} color="black" style={StudentProgStyle.progressBar} />
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
                <Text style={StudentProgStyle.cardTitle}>Monthly Progression</Text>
                <Text style={StudentProgStyle.insight}>Insight: </Text>
                <Text style={StudentProgStyle.cardSubText}>Past Month vs This Month</Text>
                <ProgressBar progress={0.75} color="black" style={StudentProgStyle.progressBar} />
                <Text style={StudentProgStyle.feedback}>Keep trying!</Text>
                <Text style={StudentProgStyle.feedback2}>You'll Do Better, Trust!</Text>
            </View>
        </ScrollView>
    );
}
