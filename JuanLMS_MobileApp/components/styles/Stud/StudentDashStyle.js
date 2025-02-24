import { StyleSheet } from 'react-native';

const StudentDashStyle = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white',
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      card: {
        backgroundColor: '#00214D',
        padding: 15,
        borderRadius: 10,
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
        height: 5,
        marginTop: 5,
        backgroundColor: 'gray',
      },
      arrowButton: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -10 }],
      },

});

export default StudentDashStyle;