import { StyleSheet } from 'react-native';

const DirectorDashStyle = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f3f3',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 50,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 20,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  iconWrapper: {
    alignItems: 'center',
  },
  iconCircle: {
    backgroundColor: '#00418b',
    padding: 10,
    borderRadius: 50,
  },
  iconLabel: {
    fontWeight: 'bold',
    marginTop: 5,
    color: '#000',
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
    marginBottom: 5,
    fontSize: 12,
  },
  progressBar: {
    height: 10,
    marginTop: 5,
    backgroundColor: 'gray',
    borderRadius: 50,
  },
  arrowButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },

  // Added for the menu buttons at the bottom
  menuContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  menuItem: {
    backgroundColor: '#00418b', // Button background
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    color: '#fff', // White button text
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 15,
  },
});

export default DirectorDashStyle;
