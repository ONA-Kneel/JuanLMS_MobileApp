import { Text } from "react-native"
import { TextInput, View } from "react-native"
import CreateClassesStyle from "../styles/faculty/CreateClassesStyle"
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


export default function CreateClasses() {

    const changeScreen = useNavigation();

    const back =()=>{
        changeScreen.navigate("FDash")
      }

    return(
        <View style={CreateClassesStyle.container}>
            <View>
                <View style={CreateClassesStyle.header}>
                    <TouchableOpacity onPress={back}><Icon name="arrow-left" size={24} color="black"  /></TouchableOpacity>
                    <Text>Create Classes</Text>
                </View>
                <View style={CreateClassesStyle.textinputborders}>
                    <TextInput
                    style={CreateClassesStyle.title}
                    placeholder="Class Name"/>
                </View>
                <View style={CreateClassesStyle.textinputborders}>
                    <TextInput
                    style={CreateClassesStyle.code}
                    placeholder="Class Code"/>
                </View>
            </View>

            <View style={CreateClassesStyle.members}>
                <Text style={CreateClassesStyle.title2}>Members</Text>
                <View style={CreateClassesStyle.textinputborders}>
                    <TextInput
                    placeholder="Enter Name"/>
                </View>
            </View>

            <View style={CreateClassesStyle.desc}> 
                <Text>Description</Text>
                <View style={CreateClassesStyle.descbox}>
                    <TextInput
                    placeholder="Enter Description"/>
                </View>
            </View>
        </View>
    )
}
