import { View } from "react-native";
import AdminDashStyle from "../styles/administrator/AdminDashStyle";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text } from "react-native-web";
import FacultyModuleStyle from "../styles/faculty/FacultyModuleStyle";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function AdminFaculty() {

    const changeScreen = useNavigation();

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
