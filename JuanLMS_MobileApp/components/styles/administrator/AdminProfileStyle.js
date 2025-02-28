import { StyleSheet } from 'react-native';

const AdminProfileStyle = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f3f3f3', 
        alignItems: 'center', 
        paddingTop: 40 
    },
    card: { 
        backgroundColor: '#e2e2e2', 
        width: '90%', 
        borderRadius: 12, 
        padding: 20, 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 5 
    },
    profileContainer: { 
        alignItems: 'center' 
    },
    avatar: { 
        width: 80, 
        height: 80, 
        backgroundColor: '#004d00', 
        borderRadius: 40, 
        marginBottom: 10 
    },
    name: { 
        fontSize: 20, 
        fontWeight: 'bold' 
    },
    info: { 
        color: '#555' 
    },
    button: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#004d00', 
        padding: 8, 
        borderRadius: 5, 
        marginTop: 10 
    },
    buttonText: { 
        color: 'white', 
        marginLeft: 5 
    },
    contactContainer: { 
        marginTop: 20, 
        width: '100%'
    },
    contactTitle: { 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    contactRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 5 
    },
    contactText: { 
        marginLeft: 5, 
        color: '#555' 
    },
    


});

export default AdminProfileStyle;