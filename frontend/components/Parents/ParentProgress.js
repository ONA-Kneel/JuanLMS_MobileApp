import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image } from "react-native-web";
import { ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ParentProgStyle from "../styles/parent/ParentProgStyle";

ParentProgStyle
export default function ParentProgress() {
    const navigation = useNavigation();
    const screenWidth = Dimensions.get("window").width;

    return (
        <ScrollView style={ParentProgStyle.container}>
            <View style={ParentProgStyle.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={ParentProgStyle.title}>My Child's Progress</Text>
            </View>

            <View style={ParentProgStyle.card}>
                <Text style={ParentProgStyle.cardTitle}>Semester 1</Text>
                <Text style={ParentProgStyle.cardCode}>AHSN-001</Text>
                <Text style={ParentProgStyle.cardSubText}>60% Done - 2 weeks remaining</Text>
                <ProgressBar progress={0.6} color="black" style={ParentProgStyle.progressBar} />
                <Ionicons name="arrow-forward-circle" size={24} color="white" style={ParentProgStyle.arrowIcon} />
            </View>

            <View style={ParentProgStyle.imageContainer}>
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

            <View style={ParentProgStyle.card}>
                <Text style={ParentProgStyle.cardTitle}>Weekly Progression</Text>
                <Text style={ParentProgStyle.insight}>Insight: </Text>
                <Text style={ParentProgStyle.cardSubText}>Last week vs This week</Text>
                <ProgressBar progress={0.75} color="black" style={ParentProgStyle.progressBar} />
                <Text style={ParentProgStyle.feedback}>Doing better this</Text>
                <Text style={ParentProgStyle.feedback2}>week, keep it up!</Text>
            </View>
        </ScrollView>
    );
}
