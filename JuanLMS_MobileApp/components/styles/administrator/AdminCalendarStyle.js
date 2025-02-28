// Admin Calendar Design
import { StyleSheet } from 'react-native';

const AdminCalendarStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',  // Light background color for the main screen
        paddingHorizontal: 15,
        paddingTop: 20,
    },
    logo: {
        width: 100,
        height: 50,
        marginBottom: 20,
        resizeMode: 'contain',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-start',  // Ensures the text and icon are aligned horizontally
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',  // White background for header
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 10,  // Space between the header and calendar
        // Removed shadow from header
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',  // Bold text for the month name
        color: '#333',  // Dark color for text
        marginRight: 10,  // Space between the text and the icon
    },
    arrowIcon: {
        fontSize: 24,
        color: '#333',  // Dark color for the chevron icon
    },
    calendar: {
        marginBottom: 10,
        backgroundColor: '#ffffff',  // White background for the calendar
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,  // Shadow for calendar
    },
    card: {
        marginRight: 10,
        marginTop: 17,
        backgroundColor: '#ffffff',  // Default card color
        borderRadius: 10,
        padding: 10,
        elevation: 3,  // Shadow for card
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatarText: {
        backgroundColor: '#ff5733',  // Color for the avatar background (deadline color)
        color: '#fff',  // White text for the avatar
        padding: 5,
        borderRadius: 15,
    },
});

export default AdminCalendarStyle;
