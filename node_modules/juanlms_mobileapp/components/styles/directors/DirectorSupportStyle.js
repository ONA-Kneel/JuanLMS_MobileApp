import { StyleSheet } from 'react-native';

const DirectorSupportStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'flex-start', // Align logo to the left
    width: '100%',            // Ensure full width so alignItems works properly
    paddingLeft: 20,          // Optional padding from the left edge
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: '#4B79A1',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    marginTop: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 24,
    color: 'white',
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  icon: {
    width: 80,
    height: 80,
    tintColor: 'white',
  },
  input: {
    backgroundColor: '#2A5D9F',
    borderRadius: 20,
    padding: 10,
    color: 'white',
    marginVertical: 8,
    textAlign: 'center',
  },
  textarea: {
    backgroundColor: '#144C8B',
    borderRadius: 20,
    padding: 10,
    color: 'white',
    height: 120,
    marginVertical: 8,
    textAlignVertical: 'top',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  problemButton: {
    backgroundColor: '#FDF1C8',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  problemButtonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
  requestButton: {
    backgroundColor: '#0E3162',
    padding: 12,
    borderRadius: 20,
    flex: 1,
  },
  requestButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default DirectorSupportStyle;
