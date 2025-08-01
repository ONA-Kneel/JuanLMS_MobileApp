import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = Math.min(width * 0.96, 420);
const CARD_RADIUS = 40;

const LoginStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1a4f',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  topSection: {
    flex:1,
    width: '100%',
    backgroundColor: '#0a1a4f',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '20%', // reduced from 100
    paddingTop: 70,
    paddingBottom: 0,
    marginBottom: '35%', // was 10, now 0 for closer text
  },
  logo: {
    height: height * 0.15,
    width: width * 0.55,
    
    resizeMode: 'contain',
    marginBottom: 2, // reduced from 10 for closer text
  },
  text1: {
    fontFamily: 'Poppins-Light',
    color: 'white',
    fontSize: width * 0.038,
    textAlign: 'center',
    marginTop: 0, // remove extra space between lines
  },
  card: {
    flex:1,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    width:'100%',
    alignSelf: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 28,
    marginTop: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    minHeight: height * 0.62,
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
    fontFamily: 'Poppins-Medium',
    marginLeft: 2,
  },
  inputUnderline: {
    width: '100%',
    borderBottomWidth: 2,
    borderBottomColor: '#222',
    backgroundColor: 'transparent',
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#222',
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderRadius: 0,
  },
  passwordContainerUnderline: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 2,
    borderBottomColor: '#222',
    marginBottom: 24,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#222',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rememberText: {
    marginLeft: 2,
    fontSize: 13,
    color: '#222',
    fontFamily: 'Poppins-Regular',
  },
  forgotPassword: {
    color: '#1976d2',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    textAlign: 'right',
  },
  loginButton: {
    backgroundColor: '#00418b',
    paddingVertical: 14,
    width: '100%',
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
});
export default LoginStyle;
