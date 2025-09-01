import { StyleSheet } from 'react-native';

const StudentSCMainStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    padding: 20,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#4A74A5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    position: 'relative',
  },
  crossButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  crossText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  icon: {
    width: 60,
    height: 60,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  problemBox: {
    backgroundColor: '#F4E28D',
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestBox: {
    backgroundColor: '#90BAF3',
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mailIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  messageTextBold: {
    fontWeight: '700',
    fontSize: 14,
    color: '#000',
  },
  checkMark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
  },
});

export default StudentSCMainStyle;
