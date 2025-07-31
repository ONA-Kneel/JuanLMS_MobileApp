// Faculty Calendar Design
import { StyleSheet } from 'react-native';

const FacultyCalendarStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 0,
        fontFamily: 'Poppins-Regular',
    },
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
    eventCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
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
    noEventsText: {
        textAlign: 'center',
        color: '#888',
        fontFamily: 'Poppins-Regular',
        marginTop: 30,
        fontSize: 15,
    },
});

export default FacultyCalendarStyle;
