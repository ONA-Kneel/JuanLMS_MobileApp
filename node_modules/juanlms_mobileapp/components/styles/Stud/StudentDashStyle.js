import { StyleSheet } from 'react-native';

const StudentDashStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f3f3',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    logo: {
        width: 100,
        height: 50,
        marginBottom: 20,
        resizeMode: 'contain',
    },
    iconsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    iconWrapper: {
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#00418b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flex: 1,
        marginRight: 16,
    },
    courseTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    courseCode: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
    },
    progressText: {
        color: 'white',
        marginTop: 5,
        fontSize: 12,
    },
    progressBar: {
        height: 10,
        marginTop: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 50,
    },
    arrowButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
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
        marginBottom: 16,
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
    headerSubtitle2: {
        color: '#666',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 12,
        color: '#222',
        fontFamily: 'Poppins-Bold',
    },
});

export default StudentDashStyle;
        color: '#222',
        fontFamily: 'Poppins-Bold',
    },
});

export default StudentDashStyle;