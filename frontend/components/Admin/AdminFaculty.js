import { View, ActivityIndicator } from "react-native";
import AdminDashStyle from "../styles/administrator/AdminDashStyle";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text } from "react-native-web";
import FacultyModuleStyle from "../styles/faculty/FacultyModuleStyle";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../UserContext";

export default function AdminFaculty() {
    const { user, loading: userLoading } = useUser();
    const changeScreen = useNavigation();

    // Add safety check to prevent white screen when user is null (during logout)
    // This must be placed AFTER all hooks to avoid "Rendered fewer hooks than expected" error
    if (userLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fa' }}>
                <ActivityIndicator size="large" color="#00418b" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
                    Loading user data...
                </Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f9fa' }}>
                <ActivityIndicator size="large" color="#00418b" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontFamily: 'Poppins-Regular' }}>
                    Redirecting to login...
                </Text>
            </View>
        );
    }

    const back =()=>{
        changeScreen.navigate("ADash")
      }

    return(
        <View>

            {/* Header */}
            <View style={FacultyModuleStyle.header}>
                <TouchableOpacity onPress={back}>
                <Icon name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <View>
                <Text style={FacultyModuleStyle.title}>Faculty</Text>
                </View>
                <Icon name="menu" size={24} color="black" style={{ marginLeft: "auto" }} />
            </View>

            {/* Faculty 1 */}
            <View style={AdminDashStyle.card}>
                <View style={[AdminDashStyle.cardHeader, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Icon name="circle" size={24} color="white"/>  
                    <View>
                        <Text style={[AdminDashStyle.titles]}>Dr. Johnny Doe</Text>
                        <Text style={AdminDashStyle.progressText}>Availability: Monday - Wednesday</Text>
                    </View>
                </View>
            </View>

            {/* Faculty 2 */}
            <View style={AdminDashStyle.card}>
                <View style={[AdminDashStyle.cardHeader, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Icon name="circle" size={24} color="white"/>  
                    <View>
                        <Text style={[AdminDashStyle.titles]}>Dr. Johanna Doey</Text>
                        <Text style={AdminDashStyle.progressText}>Availability: Wednesday - Friday</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}
