import { TouchableOpacity, View, Text, Dimensions, Image } from "react-native";
import FacultyModuleStyle from "../styles/faculty/FacultyModuleStyle";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function GenSched() {

    const back =()=>{
        changeScreen.navigate("ADash")
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
                <Text style={FacultyModuleStyle.title}>Create Schedule</Text>
                </View>
                <Icon name="menu" size={24} color="black" style={{ marginLeft: "auto" }} />
            </View>
            <View style={{ backgroundColor: "lightgray", margin: 10, height: 400 }}>
                <Image 
                 source={require("../../assets/mockups/Sample Schedule.jpg")} 
                 style={{ 
                     width: 400, 
                     height: 700, 
                     padding: 5,
                     resizeMode: "contain", 
                     alignSelf: "center",
                     alignContent: "center"
                    }}
                />
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
