import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const AdminDashStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#f44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00418b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  
  // Main header
  header: {
    backgroundColor: '#00418b',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#e3eefd',
    marginLeft: 12,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  
  // Blue background
  blueBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 160,
    backgroundColor: '#00418b',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },
  
  // New header layout matching StudentDashboard
  blueHeaderBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 160,
    backgroundColor: '#00418b',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0,
  },
  whiteHeaderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 50,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  
  // Header text styles
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 2,
  },
  headerSubtitle2: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#888',
  },

  // Header styles
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#00418b',
  },
  userName: {
    fontWeight: 'bold',
  },
  dateText: {
    fontFamily: 'Poppins-Regular',
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  academicContext: {
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  // Scroll content
  scrollContent: {
    paddingBottom: 80,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Summary cards
  summaryCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: (width - 60) / 3, // 3 cards per row with margins
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#00418b',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: 4,
  },

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#00418b',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    color: '#00418b',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },

  // Progress section
  progressSection: {
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    minWidth: 40,
  },
  progressSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },

  // Active users section
  activeUsersSection: {
    marginBottom: 20,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  comingSoonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#999',
    fontStyle: 'italic',
  },

  // Last logins section
  lastLoginsSection: {
    marginBottom: 20,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  tableRowAlternate: {
    backgroundColor: '#f8f9fa',
  },
  tableCellText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },

  // Audit preview section (full width)
  auditPreviewSection: {
    marginBottom: 20,
  },
  auditPreviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  auditScrollView: {
    maxHeight: 200,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  auditTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    flex: 1,
  },
  auditUser: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    flex: 1,
  },
  auditAction: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#00418b',
    flex: 1,
  },

  // Calendar section (full width)
  calendarSection: {
    marginBottom: 20,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  calendarControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  calendarButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHeader: {
    width: (width - 80) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#666',
    marginBottom: 8,
  },
  calendarDay: {
    width: (width - 80) / 7,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarDayText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  calendarToday: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
  },
  calendarTodayText: {
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  calendarHoliday: {
    position: 'relative',
  },
  calendarHolidayText: {
    color: '#dc3545',
    fontFamily: 'Poppins-Bold',
  },
  holidayText: {
    position: 'absolute',
    bottom: -2,
    fontSize: 8,
    fontFamily: 'Poppins-Regular',
    color: '#dc3545',
  },

  // Legacy styles (keeping for compatibility)
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
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
  card: {
    backgroundColor: '#00418b',
    padding: 20,
    borderRadius: 20,
    margin: 10,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titles: {
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

  // Progress section
  progressSection: {
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#222',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#00418b',
    minWidth: 40,
    textAlign: 'right',
  },
  progressSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },

  // Table section
  tableSection: {
    marginBottom: 20,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tableHeaderText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#212529',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6c757d',
    fontStyle: 'italic',
  },

  // Quick actions section
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#222',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AdminDashStyle;