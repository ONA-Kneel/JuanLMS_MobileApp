import { StyleSheet } from 'react-native';

const StudentActsStyle = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f3f3f3',
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
      },
      title: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
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

});

export default StudentActsStyle;