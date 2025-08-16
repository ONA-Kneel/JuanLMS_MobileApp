import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDate } from '../../utils/dateUtils';
import adminService from '../../services/adminService';

export default function AdminProgress() {
    const navigation = useNavigation();
    const [schoolYearProgress, setSchoolYearProgress] = useState(18); // Set default value
    const [termProgress, setTermProgress] = useState(100); // Set default value
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProgressData = async () => {
            try {
                setLoading(true);
                const data = await adminService.getAcademicProgress();
                setSchoolYearProgress(data.schoolYear.progress || 18);
                setTermProgress(data.term.progress || 100);
                setError(null);
            } catch (error) {
                console.error('Error fetching progress data:', error);
                setError('Failed to load progress data');
                // Fallback to calculated values
                const now = new Date();
                const schoolYearStart = new Date('2025-06-01');
                const schoolYearEnd = new Date('2026-04-30');
                const termStart = new Date('2025-08-02');
                const termEnd = new Date('2025-08-03');
                
                const schoolYearTotal = schoolYearEnd - schoolYearStart;
                const schoolYearElapsed = Math.max(0, now - schoolYearStart);
                const schoolYearPercent = Math.min(100, (schoolYearElapsed / schoolYearTotal) * 100);
                
                const termTotal = termEnd - termStart;
                const termElapsed = Math.max(0, now - termStart);
                const termPercent = Math.min(100, (termElapsed / termTotal) * 100);
                
                setSchoolYearProgress(Math.round(schoolYearPercent) || 18);
                setTermProgress(Math.round(termPercent) || 100);
            } finally {
                setLoading(false);
            }
        };

        fetchProgressData();
    }, []);

    const styles = {
        container: {
            flex: 1,
            backgroundColor: '#f7f9fa',
            padding: 16,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        backButton: {
            marginRight: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#00418b',
            fontFamily: 'Poppins-Bold',
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#00418b',
            marginBottom: 16,
            fontFamily: 'Poppins-Bold',
        },
        progressCard: {
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
        },
        progressTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            marginBottom: 12,
            fontFamily: 'Poppins-SemiBold',
        },
        progressBarContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
        },
        progressBar: {
            flex: 1,
            height: 16, // Increased height for better visibility
            backgroundColor: '#e0e0e0',
            borderRadius: 8,
            marginRight: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#d0d0d0',
        },
        progressFill: {
            height: '100%',
            borderRadius: 7,
            minWidth: 4, // Ensure minimum width for visibility
        },
        progressText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333',
            minWidth: 50,
            textAlign: 'right',
            fontFamily: 'Poppins-Bold',
        },
        progressSubtext: {
            fontSize: 14,
            color: '#666',
            fontFamily: 'Poppins-Regular',
        },
        statsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
        },
        statItem: {
            alignItems: 'center',
            flex: 1,
        },
        statNumber: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#00418b',
            fontFamily: 'Poppins-Bold',
        },
        statLabel: {
            fontSize: 12,
            color: '#666',
            marginTop: 4,
            fontFamily: 'Poppins-Regular',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorContainer: {
            backgroundColor: '#fee',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
        },
        errorText: {
            color: '#c33',
            fontFamily: 'Poppins-Regular',
            fontSize: 14,
        },
        debugInfo: {
            fontSize: 12,
            color: '#999',
            fontFamily: 'Poppins-Regular',
            marginTop: 8,
        },
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00418b" />
                <Text style={{ marginTop: 16, fontFamily: 'Poppins-Regular', color: '#666' }}>
                    Loading progress data...
                </Text>
            </View>
        );
    }

    // Ensure progress values are valid
    const schoolYearPercent = Math.max(1, Math.min(100, schoolYearProgress));
    const termPercent = Math.max(1, Math.min(100, termProgress));

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#00418b" />
                </TouchableOpacity>
                <Text style={styles.title}>Academic Progress</Text>
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Progress Tracking Section */}
            <View>
                <Text style={styles.sectionTitle}>Progress Tracking</Text>
                
                {/* School Year Progress */}
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>School Year Progress</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { 
                                        width: `${schoolYearPercent}%`, 
                                        backgroundColor: '#8B5CF6' 
                                    }
                                ]} 
                            />
                        </View>
                        <Text style={styles.progressText}>{schoolYearPercent}%</Text>
                    </View>
                    <Text style={styles.progressSubtext}>
                        Estimating from June 1, 2025 to April 30, 2026
                    </Text>
                    
                    {/* Debug info */}
                    <Text style={styles.debugInfo}>
                        Debug: Progress value = {schoolYearProgress}, Displayed = {schoolYearPercent}%
                    </Text>
                    
                    {/* Additional Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{schoolYearPercent}%</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{100 - schoolYearPercent}%</Text>
                            <Text style={styles.statLabel}>Remaining</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>11</Text>
                            <Text style={styles.statLabel}>Months Left</Text>
                        </View>
                    </View>
                </View>

                {/* Term Progress */}
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Term Progress</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { 
                                        width: `${termPercent}%`, 
                                        backgroundColor: '#10B981' 
                                    }
                                ]} 
                            />
                        </View>
                        <Text style={styles.progressText}>{termPercent}%</Text>
                    </View>
                    <Text style={styles.progressSubtext}>
                        From 8/2/2025 to 8/3/2025
                    </Text>
                    
                    {/* Debug info */}
                    <Text style={styles.debugInfo}>
                        Debug: Progress value = {termProgress}, Displayed = {termPercent}%
                    </Text>
                    
                    {/* Additional Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{termPercent}%</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{100 - termPercent}%</Text>
                            <Text style={styles.statLabel}>Remaining</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>1</Text>
                            <Text style={styles.statLabel}>Day Left</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Academic Calendar Summary */}
            <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Academic Calendar Summary</Text>
                <Text style={styles.progressSubtext}>
                    Current Academic Year: 2025-2026
                </Text>
                <Text style={styles.progressSubtext}>
                    Current Term: Term 1
                </Text>
                <Text style={styles.progressSubtext}>
                    Current Date: {formatDate(new Date(), 'MMMM D, YYYY')}
                </Text>
            </View>
        </ScrollView>
    );
}
