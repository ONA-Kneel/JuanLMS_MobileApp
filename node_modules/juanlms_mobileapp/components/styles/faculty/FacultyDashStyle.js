import { StyleSheet } from 'react-native';

const FacultyDashStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f3f3',
        gap: 10
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      logo: {
        width: 100,
        height:50,
        marginBottom:20,
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
        padding: 20,
        borderRadius: 20,
        marginBottom: 10,
        position: 'relative',
      },
      cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      courseTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
      courseCode: {
        color: 'white',
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
        backgroundColor: 'gray',
        borderRadius:50
      },
      arrowButton: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -10 }],
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
        marginBottom: 3,
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
    // New header styles
    header: {
        backgroundColor: '#00418b',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    welcomeText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        marginBottom: 2,
    },
    nameText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
        marginBottom: 4,
    },
    dateText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        opacity: 0.9,
    },
});

export default FacultyDashStyle;