import { TouchableOpacity, View, Text, Dimensions, Image } from "react-native";
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
                <Image 
                 source={require("../../assets/mockups/Sample Schedule.jpg")} 
                    style={{ 
                     width: 500, 
                     height: 800, 
                     padding: 5,
                     resizeMode: "contain", 
                     alignSelf: "center",
                     alignContent: "center"     
                    }}
                />
        </View>
    );
}
