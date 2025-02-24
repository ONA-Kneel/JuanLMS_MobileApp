import { StyleSheet } from 'react-native';

const LoginStyle = StyleSheet.create({


    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      },
    logo:{
        height:100,
        width:100
    },
    text1:{
        fontFamily:"Poppins-Light",
        color:"white"
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
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        paddingBottom:"150%",
        margin: 20
      },
      loginTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
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
        marginBottom: 10,
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
      },
      forgotPassword: {
        marginLeft:110,
        color: 'blue',
        
      },
      loginButton: {
        backgroundColor: '#00214D',
        padding: 15,
        width: '100%',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
      },
      loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
      },

});

export default LoginStyle;