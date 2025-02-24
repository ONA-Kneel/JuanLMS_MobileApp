import { StyleSheet } from 'react-native';

const LoginStyle = StyleSheet.create({


    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      },
    logo:{
        height:50,
        width:100,
        marginTop:50
    },
    text1:{
        fontFamily:"Poppins-Light",
        color:"white",
        fontSize: 12,
        margin:0
    },
    background: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      },

      loginContainer: {
        backgroundColor:"#f5f5f5",
        width:"100%",
        flex:1, 
        padding: 40,
        borderRadius: 80,
        alignItems: 'center',
        paddingBottom:"150%",
        margin: 20,
      },
      loginTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 50,
      },
      label: {
        alignSelf: 'flex-start',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
      },
      input: {
        width: '100%',
        padding: 10,
        borderBottomWidth: 1,
        marginBottom: 30,
      },
      passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
      },
      rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
      },
      rememberText: {
        marginLeft: 5,
        fontSize: 12,
      },
      forgotPassword: {
        marginLeft:100,
        color: 'blue',
        fontSize: 12,
        
      },
      loginButton: {
        backgroundColor: '#00418b',
        padding: 15,
        width: '100%',
        borderRadius: 50,
        alignItems: 'center',
        marginTop: 75,
      },
      loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
      },

});

export default LoginStyle;