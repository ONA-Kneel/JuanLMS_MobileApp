//table
import React, { Component } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Table, TableWrapper, Row } from 'react-native-table-component';


import { useState } from 'react';
import { Image, ImageBackground, ProgressBar } from 'react-native-web';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import StudentGradesStyle from '../styles/Stud/StudentGradesStyle';


export default class StudentGrades extends Component {
    

    constructor(props) {

        super(props);
        this.state = {
            tableHead: ['Subject Code', 'Subject Description', 'Prelims', 'Midterm', 'Final', 'Final Grade', 'Remarks'],
            widthArr: [100, 300, 60, 60, 60, 80, 150]
        }
    }

    // profile function
    profile = () => {
        this.props.navigation.navigate('SProfile');
    };

    render() {
        const state = this.state;

        return (
            <View style={StudentGradesStyle.container}>
                {/* Blue background */}
                <View style={StudentGradesStyle.blueHeaderBackground} />
                {/* White card header */}
                <View style={StudentGradesStyle.whiteHeaderCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={StudentGradesStyle.headerTitle}>Grades</Text>
                            <Text style={StudentGradesStyle.headerSubtitle}>Date and Time</Text>
                        </View>
                        <TouchableOpacity onPress={this.profile}>
                            <Image source={require('../../assets/profile-icon (2).png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={StudentGradesStyle.contentWrapper}>
                    <ScrollView horizontal={true}>
                        <View>
                            {/* Table Header */}
                            <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>
                                <Row
                                    data={state.tableHead}
                                    widthArr={state.widthArr}
                                    style={StudentGradesStyle.header}
                                    textStyle={StudentGradesStyle.text}
                                />
                            </Table>

                            <ScrollView style={StudentGradesStyle.dataWrapper}>
                                <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>

                                    {/* Semester Header */}
                                    <Text style={StudentGradesStyle.semesterText}>2024-2025 2nd Semester</Text>

                                    {/* Sample Data Rows */}
                                    <Row data={["MATH101", "Calculus I", "85", "87", "90", "88", "Passed"]} widthArr={state.widthArr} style={StudentGradesStyle.row} textStyle={StudentGradesStyle.text} />
                                    <Row data={["ENG101", "English Composition", "80", "83", "86", "83", "Passed"]} widthArr={state.widthArr} style={StudentGradesStyle.row} textStyle={StudentGradesStyle.text} />

                                    {/* Next Semester */}
                                    <Text style={StudentGradesStyle.semesterText}>2024-2025 1st Semester</Text>

                                    <Row data={["CS101", "Intro to Programming", "88", "89", "91", "89", "Passed"]} widthArr={state.widthArr} style={StudentGradesStyle.row} textStyle={StudentGradesStyle.text} />
                                    <Row data={["HIST101", "World History", "78", "81", "85", "81", "Passed"]} widthArr={state.widthArr} style={StudentGradesStyle.row} textStyle={StudentGradesStyle.text} />
                                </Table>
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
            </View>
        )
    }

}

