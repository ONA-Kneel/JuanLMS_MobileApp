import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const StudentActsStyle = StyleSheet.create({
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
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 10,
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    courseTitle: {
        color: '#00418b',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
    },
    courseCode: {
        color: '#555',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
    progressText: {
        color: '#00418b',
        marginTop: 5,
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
    progressBar: {
        height: 10,
        marginTop: 5,
        backgroundColor: 'gray',
        borderRadius:50
    },
    arrowButton: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
});

export default StudentActsStyle;