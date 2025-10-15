import { TouchableOpacity, View, Text, Dimensions, ActivityIndicator } from "react-native";
import FacultyModuleStyle from "../styles/faculty/FacultyModuleStyle";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useUser } from "../../UserContext";

export default function GenSched() {
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

    return (
        <View style={{ flex: 1, justifyContent: "space-between" }}>
            {/* Header */}
            <View style={FacultyModuleStyle.header}>
                <TouchableOpacity onPress={back}>
                <Icon name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <View>
                <Text style={FacultyModuleStyle.title}>Create Schedule</Text>
                </View>
                <Icon name="menu" size={24} color="black" style={{ marginLeft: "auto" }} />
            </View>
            <View style={{ backgroundColor: "lightgray", margin: 10, height: 400 }}>
            </View>
            
            {/* Department & Section Buttons */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginHorizontal: 10 }}>
                <TouchableOpacity
                    style={{ backgroundColor: "lightgray", height: 40, width: 150, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold", fontSize: 18 }}>Department</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={{ backgroundColor: "lightgray", height: 40, width: 150, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold", fontSize: 18 }}>Section</Text>
                </TouchableOpacity>
            </View>
            
            {/* Generate Schedule Button */}
            <TouchableOpacity 
                style={{ 
                    backgroundColor: "darkblue", 
                    width: Dimensions.get("window").width, 
                    height: 50, 
                    justifyContent: "center", 
                    alignItems: "center" 
                }}>
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>Generate Schedule</Text>
            </TouchableOpacity>
        </View>
    );
}
