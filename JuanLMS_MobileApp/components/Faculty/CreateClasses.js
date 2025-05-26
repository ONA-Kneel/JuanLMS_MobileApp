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
            {/* Blue curved header background */}
            <View style={CreateClassesStyle.blueHeaderBackground} />
            {/* White card */}
            <View style={CreateClassesStyle.whiteCard}>
                {/* Header row */}
                <View style={CreateClassesStyle.header}>
                    <TouchableOpacity onPress={back} style={CreateClassesStyle.backBtn}>
                        <Icon name="arrow-left" size={24} color="#00418b" />
                    </TouchableOpacity>
                    <Text style={CreateClassesStyle.headerTitle}>Create Class</Text>
                </View>
                {/* Form fields */}
                <View style={CreateClassesStyle.inputGroup}>
                    <Text style={CreateClassesStyle.label}>Class Name</Text>
                    <TextInput
                        style={CreateClassesStyle.input}
                        placeholder="Enter class name"
                        placeholderTextColor="#888"
                    />
                </View>
                <View style={CreateClassesStyle.inputGroup}>
                    <Text style={CreateClassesStyle.label}>Class Code</Text>
                    <TextInput
                        style={CreateClassesStyle.input}
                        placeholder="Enter class code"
                        placeholderTextColor="#888"
                    />
                </View>
                <View style={CreateClassesStyle.inputGroup}>
                    <Text style={CreateClassesStyle.label}>Members</Text>
                    <TextInput
                        style={CreateClassesStyle.input}
                        placeholder="Enter member name"
                        placeholderTextColor="#888"
                    />
                </View>
                <View style={CreateClassesStyle.inputGroup}>
                    <Text style={CreateClassesStyle.label}>Description</Text>
                    <TextInput
                        style={CreateClassesStyle.textarea}
                        placeholder="Enter description"
                        placeholderTextColor="#888"
                        multiline
                        numberOfLines={4}
                    />
                </View>
                {/* You can add a submit button here if needed */}
            </View>
        </View>
    )
}
