import { TouchableOpacity, View, Text, Dimensions } from "react-native";
import FacultyModuleStyle from "../styles/faculty/FacultyModuleStyle";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function ParentSchedule() {

    const back =()=>{
        changeScreen.navigate("PDash")
      }
    
      const changeScreen = useNavigation();

    return (
        <View style={{ flex: 1, justifyContent: "space-between" }}>
            {/* Header */}
            <View style={FacultyModuleStyle.header}>
                <TouchableOpacity onPress={back}>
                <Icon name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <View>
                    <Text style={FacultyModuleStyle.title}>Class Schedule</Text>
                </View>
                <Icon name="menu" size={24} color="black" style={{ marginLeft: "auto" }} />
            </View>
            <View style={{ backgroundColor: "lightgray", margin: 10, height: 400 }}>
            </View>
        </View>
    );
}
