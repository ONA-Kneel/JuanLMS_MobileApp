const StudentGradesStyle = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5', // Matches the gray background in the image
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
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#C1C0B9',
  }
};

export default StudentGradesStyle;
