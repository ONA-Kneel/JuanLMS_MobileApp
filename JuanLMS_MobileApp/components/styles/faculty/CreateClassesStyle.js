import { StyleSheet } from 'react-native';

const CreateClassesStyle = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f3f3f3',
      },
      title:{
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        borderbottom:2,
        padding: 5,
      },
      code: {
        fontSize: 15,
        marginBottom: 10,
        padding: 5,
      },
      members:{
        flex: 1,
        padding: 5,
        
      },
      title2:{
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 10,
        borderbottom:2,
        padding: 5,
      },
      desc:{
        flex: 2,
        padding: 5,
        backgroundColor: '#f3f3f3',
      },
      descbox:{
        padding: 5,
        backgroundColor: 'white',
        borderColor:'black',
        borderWidth:2,
        borderRadius:10,
        height:100,
      },
      textinputborders:{
        backgroundColor: 'white',
        borderColor:'black',
        borderWidth:2,
        borderRadius:10,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
      },
})
export default CreateClassesStyle;