import React, { useState, useEffect, useCallback } from "react";
import { 
    Text, 
    View, 
    TouchableOpacity, 
    ScrollView, 
    Alert, 
    RefreshControl,
    ActivityIndicator 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../UserContext';
import { getAuthHeaders, handleApiError } from '../../utils/apiUtils';
import ClassConfirmationModal from './ClassConfirmationModal';

const API_BASE = 'https://juanlms-webapp-server.onrender.com';

export default function ConfirmClasses() {
    const navigation = useNavigation();
    const { user } = useUser();
    const [pendingClasses, setPendingClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [confirmingClass, setConfirmingClass] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const back = () => {
        navigation.navigate("FDash");
    };

    // Fetch pending classes function
    const fetchPendingClasses = useCallback(async () => {
        if (!user?._id) return;
        
        try {
            const headers = await getAuthHeaders();
            
            // Fetch pending confirmation classes
            const response = await fetch(`${API_BASE}/api/classes/pending-confirmation?facultyID=${user._id}`, {
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                setPendingClasses(data.classes || []);
                console.log('Fetched pending classes:', data.classes?.length || 0);
            } else {
                console.error('Failed to fetch pending classes');
                setPendingClasses([]);
            }
        } catch (error) {
            console.error('Error fetching pending classes:', error);
            setPendingClasses([]);
        }
    }, [user?._id]);

    // Initial load
    useEffect(() => {
        fetchPendingClasses().finally(() => {
            setLoading(false);
        });
    }, [fetchPendingClasses]);

    // Handle refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPendingClasses();
        setRefreshing(false);
    }, [fetchPendingClasses]);

    // Handle class confirmation
    const handleConfirmClass = (classData) => {
        setConfirmingClass(classData);
        setShowConfirmationModal(true);
    };

    // Handle confirmation success
    const handleConfirmationSuccess = () => {
        setShowConfirmationModal(false);
        setConfirmingClass(null);
        fetchPendingClasses(); // Refresh the list
        Alert.alert('Success', 'Class confirmed successfully!');
    };

    // Sync students to classes (placeholder for future implementation)
    const handleSyncStudents = async () => {
        Alert.alert(
            'Sync Students',
            'This feature will sync students to auto-created classes. Implementation coming soon!',
            [{ text: 'OK' }]
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={back} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#00418b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Confirm Classes</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00418b" />
                    <Text style={styles.loadingText}>Loading pending classes...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={back} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#00418b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm Classes</Text>
            </View>

            <ScrollView 
                style={styles.scrollContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {pendingClasses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="check-circle" size={80} color="#4CAF50" />
                        <Text style={styles.emptyTitle}>No Pending Classes</Text>
                        <Text style={styles.emptyMessage}>
                            All your classes have been confirmed! You can view your active classes in the Classes section.
                        </Text>
                        <TouchableOpacity 
                            style={styles.viewClassesBtn}
                            onPress={() => navigation.navigate('FDash')}
                        >
                            <Text style={styles.viewClassesBtnText}>View My Classes</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Info Banner */}
                        <View style={styles.infoBanner}>
                            <Icon name="information" size={24} color="#1976D2" />
                            <Text style={styles.infoText}>
                                Classes have been automatically created for you! Please review and confirm each class below.
                            </Text>
                        </View>

                        {/* Sync Students Button */}
                        <TouchableOpacity 
                            style={styles.syncBtn}
                            onPress={handleSyncStudents}
                        >
                            <Icon name="sync" size={20} color="white" />
                            <Text style={styles.syncBtnText}>Sync Students to Classes</Text>
                        </TouchableOpacity>

                        {/* Pending Classes List */}
                        <Text style={styles.sectionTitle}>Classes Pending Confirmation</Text>
                        {pendingClasses.map((classData) => (
                            <View key={classData.classID} style={styles.classCard}>
                                <View style={styles.classInfo}>
                                    <Text style={styles.className}>{classData.className}</Text>
                                    <Text style={styles.classDetails}>
                                        Class Code: {classData.classCode}
                                    </Text>
                                    {classData.section && (
                                        <Text style={styles.classDetails}>
                                            Section: {classData.section}
                                        </Text>
                                    )}
                                    <Text style={styles.classDetails}>
                                        Students: {classData.members?.length || 0}
                                    </Text>
                                    {classData.academicYear && (
                                        <Text style={styles.classDetails}>
                                            Academic Year: {classData.academicYear}
                                        </Text>
                                    )}
                                    {classData.termName && (
                                        <Text style={styles.classDetails}>
                                            Term: {classData.termName}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity 
                                    style={styles.confirmBtn}
                                    onPress={() => handleConfirmClass(classData)}
                                >
                                    <Text style={styles.confirmBtnText}>Confirm Class</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Confirmation Modal */}
            {showConfirmationModal && confirmingClass && (
                <ClassConfirmationModal
                    classData={confirmingClass}
                    visible={showConfirmationModal}
                    onClose={() => {
                        setShowConfirmationModal(false);
                        setConfirmingClass(null);
                    }}
                    onSuccess={handleConfirmationSuccess}
                />
            )}
        </View>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backBtn: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00418b',
    },
    scrollContainer: {
        flex: 1,
        padding: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginTop: 15,
        marginBottom: 10,
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    viewClassesBtn: {
        backgroundColor: '#00418b',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    viewClassesBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoBanner: {
        backgroundColor: '#E3F2FD',
        borderColor: '#1976D2',
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#1976D2',
        lineHeight: 20,
    },
    syncBtn: {
        backgroundColor: '#1976D2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginBottom: 20,
    },
    syncBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    classCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    classInfo: {
        marginBottom: 15,
    },
    className: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    classDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    confirmBtn: {
        backgroundColor: '#00418b',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
};