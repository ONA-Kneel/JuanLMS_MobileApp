// Faculty Calendar Design
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const FacultyCalendarStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f9fa',
        paddingHorizontal: 0,
        fontFamily: 'Poppins-Regular',
    },
    
    // Profile Header
    profileHeader: {
        backgroundColor: '#00418b',
        paddingTop: 48,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    profileHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    greetingText: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: '#fff',
        marginBottom: 4,
    },
    userName: {
        fontWeight: 'bold',
    },
    roleText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#e3f2fd',
        marginBottom: 2,
    },
    dateText: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: '#b3e5fc',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },

    // Scroll Content
    scrollContent: {
        flex: 1,
        padding: 20,
    },

    // Calendar Title
    calendarTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    calendarTitle: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: '#00418b',
    },

    // Academic Info
    academicInfo: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#bbdefb',
    },
    academicText: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        color: '#00418b',
        textAlign: 'center',
    },

    // Month Navigation
    monthNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    navButton: {
        padding: 12,
        backgroundColor: '#f0f8ff',
        borderRadius: 12,
    },
    monthText: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        color: '#333',
    },

    // Calendar Container
    calendarContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    dayHeaders: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dayHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: '#666',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: (width - 80) / 7,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        position: 'relative',
    },
    selectedDay: {
        backgroundColor: '#00418b',
        borderColor: '#00418b',
    },
    today: {
        borderColor: '#ff6b6b',
        borderWidth: 2,
    },
    dayNumber: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: '#333',
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    todayText: {
        color: '#ff6b6b',
        fontWeight: 'bold',
    },
    eventIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#ff6b6b',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventCount: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'Poppins-Bold',
    },

    // Events Container
    eventsContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    eventsTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: '#333',
        marginBottom: 16,
    },
    eventsList: {
        flex: 1,
    },
    noEventsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    noEventsText: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: '#999',
        marginTop: 16,
    },

    // Event Card
    eventCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        borderLeftWidth: 4,
    },
    eventTitle: {
        color: '#00418b',
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        marginBottom: 2,
    },
    eventTime: {
        color: '#888',
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
    },
    eventStatus: {
        color: '#00418b',
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        marginLeft: 10,
    },

    // Legacy styles (keeping for backward compatibility)
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
        marginBottom: 3
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
    calendarCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginHorizontal: 18,
        marginBottom: 5,
        padding: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    upcomingTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: '#222',
        marginLeft: 24,
        marginBottom: 8,
        marginTop: 10,
    },
    eventsList: {
        marginHorizontal: 18,
        marginBottom: 18,
    },
});

export default FacultyCalendarStyle;
