import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_TOP = 90;

const StudentsProfileStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f3f3',
        alignItems: 'center',
    },
    topBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: 180,
        backgroundColor: '#00418b',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        zIndex: 0,
    },
    avatarWrapper: {
        position: 'absolute',
        top: 110,
        zIndex: 2,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 60,
        padding: 5,
        elevation: 5,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#eee',
    },
    card: {
        marginTop: CARD_TOP,
        width: width * 0.9,
        backgroundColor: '#fff',
        borderRadius: 18,
        alignItems: 'center',
        paddingTop: "35%",
        paddingBottom: 20,
        paddingHorizontal: 20,
        elevation: 6,
        zIndex: 1,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Poppins_700Bold',
        color: '#222',
        marginBottom: 2,
    },
    emoji: {
        fontSize: 18,
    },
    email: {
        fontSize: 14,
        color: '#888',
        fontFamily: 'Poppins_400Regular',
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    infoBox: {
        flex: 1,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 13,
        color: '#888',
        fontFamily: 'Poppins_400Regular',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00418b',
        fontFamily: 'Poppins_600SemiBold',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 18,
        marginBottom: 5,
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    actionText: {
        fontSize: 12,
        color: '#00418b',
        fontFamily: 'Poppins_500Medium',
        marginTop: 2,
    },
    settingsList: {
        marginTop: 18,
        width: width * 0.9,
        backgroundColor: 'transparent',
    },
    settingsItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    settingsText: {
        fontSize: 15,
        color: '#222',
        fontFamily: 'Poppins_500Medium',
    },
    logout: {
        backgroundColor: '#00418b',
        padding: 15,
        width: width * 0.9,
        borderRadius: 50,
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 20,
    },
    logoutText: {
        color: 'white',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
    },
});

export default StudentsProfileStyle;