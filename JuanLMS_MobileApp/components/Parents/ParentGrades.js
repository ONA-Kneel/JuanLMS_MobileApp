//table
import React, { Component } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Table, Row } from 'react-native-table-component';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ParentGradesStyle from '../styles/parent/ParentGradesStyle';

export default class ParentGrades extends Component {

    constructor(props) {
        super(props);
        this.state = {
            tableHead: ['Subject Code', 'Subject Description', 'Prelims', 'Midterm', 'Final', 'Final Grade', 'Remarks'],
            widthArr: [100, 300, 60, 60, 60, 80, 150]
        }
    }

    // Back function
    back = () => {
        this.props.navigation.goBack();
    };

    render() {
        const state = this.state;
        return (
            <View style={ParentGradesStyle.container}>
                <View style={ParentGradesStyle.header1}>
                    <TouchableOpacity
                    onPress={this.back}
                    >
                        <Icon name="arrow-left" size={24} color="black" /></TouchableOpacity>

                    <View>
                        <Text style={ParentGradesStyle.title}>My Grades</Text>
                    </View>

                </View>

                <ScrollView horizontal={true}>
                    <View>
                        {/* Table Header */}
                        <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>
                            <Row
                                data={state.tableHead}
                                widthArr={state.widthArr}
                                style={ParentGradesStyle.header}
                                textStyle={ParentGradesStyle.text}
                            />
                        </Table>

                        <ScrollView style={ParentGradesStyle.dataWrapper}>
                            <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>

                                {/* Semester Header */}
                                <Text style={ParentGradesStyle.semesterText}>2024-2025 2nd Semester</Text>

                                {/* Sample Data Rows */}
                                <Row data={["MATH101", "Calculus I", "85", "87", "90", "88", "Passed"]} widthArr={state.widthArr} style={ParentGradesStyle.row} textStyle={ParentGradesStyle.text} />
                                <Row data={["ENG101", "English Composition", "80", "83", "86", "83", "Passed"]} widthArr={state.widthArr} style={ParentGradesStyle.row} textStyle={ParentGradesStyle.text} />

                                {/* Next Semester */}
                                <Text style={ParentGradesStyle.semesterText}>2024-2025 1st Semester</Text>

                                <Row data={["CS101", "Intro to Programming", "88", "89", "91", "89", "Passed"]} widthArr={state.widthArr} style={ParentGradesStyle.row} textStyle={ParentGradesStyle.text} />
                                <Row data={["HIST101", "World History", "78", "81", "85", "81", "Passed"]} widthArr={state.widthArr} style={ParentGradesStyle.row} textStyle={ParentGradesStyle.text} />
                            </Table>
                        </ScrollView>
                    </View>
                </ScrollView>
            </View>
        )
    }

}

