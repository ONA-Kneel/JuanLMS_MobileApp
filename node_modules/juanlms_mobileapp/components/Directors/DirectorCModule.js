import { TextInput, TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import { ScrollView } from "react-native-web";
import DirectorModuleStyle from "../styles/directors/DirectorModuleStyle";


export default function DirectorCModule(){


    const changeScreen = useNavigation();

    const back =()=>{
        changeScreen.navigate("DDash")
      }

    return(
        <View>
            <View style={DirectorModuleStyle.header}>
            <TouchableOpacity onPress={back}><Icon name="arrow-left" size={24} color="black"  /></TouchableOpacity>
            
            <View>
            <Text style={DirectorModuleStyle.title}>Introduction to Computing</Text>
            <Text style={DirectorModuleStyle.code}>CCINCOML</Text>
            </View>
            
            <Icon name="menu" size={24} color="black" style={{marginLeft:"auto"}} />

            </View>
            <ScrollView>
                <View style={{backgroundColor:'lightgray', margin:20, minHeight:500, height:"auto", padding:20}}>
                    <TextInput
                        style={{ fontWeight: 'bold', fontSize: 18 }}
                        placeholder="Enter Title"
                    />
                    <View>
                        <TextInput
                        placeholder="Enter Lesson"/>
                    </View>
                </View>
            </ScrollView>
            <View style={{margin:20, flexDirection: 'row', alignItems: 'center'}}>
                    {/* Import A File */}
                    <TouchableOpacity
                        style={{
                            width: 200,
                            height: 40,
                            borderRadius: 10,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor:'lightgray',
                        }}
                    >
                        <Text style={{ color: 'Black', fontWeight: 'bold', margin: 5, textAlign:'center' }}>Import A File</Text>
                    </TouchableOpacity>

                    {/* Save */}
                    <TouchableOpacity
                        style={{
                            width: 200,
                            height: 40,
                            borderRadius: 10,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor:'lightgray',
                            margin: 10
                        }}
                    >
                        <Text style={{ color: 'Black', fontWeight: 'bold', margin: 5, textAlign:'center' }}>Save</Text>
                    </TouchableOpacity>
                </View>
        </View>
    )
}