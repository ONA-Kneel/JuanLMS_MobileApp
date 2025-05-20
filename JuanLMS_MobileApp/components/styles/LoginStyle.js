import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const LoginStyle = StyleSheet.create({


  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.08,
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    height: height * 0.12,
    width: width * 0.33,
    resizeMode: 'contain',
  },
  text1: {
    fontFamily: "Poppins-Light",
    color: "white",
    fontSize: width * 0.035,
    textAlign: 'center',
  },
  background: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginContainer: {
    backgroundColor: "#f5f5f5",
    width: "100%",
    flex: 1,
    paddingTop: 60,
    padding: 40,
    borderRadius: 80,
    alignItems: 'center',
    paddingBottom: "150%",
    margin: "10%",
    gap: 5
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    fontFamily: 'Poppins-Bold',
    
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
    fontFamily: 'Poppins-Medium',
    marginLeft: 2,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#222',
    marginBottom: 18,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#222',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 4,
  },
  rememberContainer: {
    // alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  rememberText: {
    marginLeft: 5,
    fontSize: 12,
    width: '100%'
  },
  forgotPassword: {
    // marginLeft: 100,
    color: 'blue',
    fontSize: 12,

  },
  loginButton: {
    backgroundColor: '#00418b',
    padding: 15,
    width: '100%',
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 40,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },

});

export default LoginStyle;