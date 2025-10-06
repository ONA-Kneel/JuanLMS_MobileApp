import { StyleSheet } from 'react-native';

const StudentModuleStyle = StyleSheet.create({
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
      code: {
        flex: 1,
        fontSize: 12,
      },
      lessonImage: {
        width: '100%',
        height: 150,
        marginBottom: 10,
      },
      link: {
        color: 'blue',
        textDecorationLine: 'underline',
        marginLeft:"auto"
      },
      progressBar: {
        width:275,
        height: 15,
        borderRadius:50,
        backgroundColor:'#c0c0c0',
        borderWidth:1
      },
      nextButton: {
        backgroundColor: '#00418b',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginLeft: 10,
      },
      nextText: {
        color: 'white',
        fontWeight: 'bold',
      },
      logo: {
        width: 120,
        height: 120,
        alignSelf: 'center',
        marginBottom: 20,
      },

});

export default StudentModuleStyle;