const StudentGradesStyle = {
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  blueHeaderBackground: {
    backgroundColor: '#00418b',
    height: 90,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  whiteHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -40,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 2,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 22,
    color: '#222',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  header1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  header: {
    height: 50,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    paddingVertical: 8,  // Adds spacing inside each cell
    fontFamily: 'Poppins-Regular',
  },
  row: {
    height: 40,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#C1C0B9',
  },
  semesterText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5,
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#C1C0B9',
  },
  dataWrapper: {
    // Add vertical scroll for table rows
  },
};

export default StudentGradesStyle;
