import { TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { TextInput, View } from "react-native";
import { ScrollView } from "react-native-web";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function Chat() {

      //navigation
      const changeScreen = useNavigation();
      
      const back =()=>{
            changeScreen.goBack()
          }
  
    return(
        <View style={{ flex: 1 }}>
      {/* Header with Chat Name and Call Buttons */}
      
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 15, backgroundColor: "lightgray" }}>
      <TouchableOpacity onPress={back}><Icon name="arrow-left" size={24} color="black"  /></TouchableOpacity>
        <Text style={{ fontWeight: "bold", fontSize: 18 }}>Chat 1</Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity style={{ marginRight: 15 }}>
            <Text style={{ fontWeight: "bold" }}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ fontWeight: "bold" }}>Video Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Chat Content */}
      <ScrollView style={{ flex: 1, padding: 10, backgroundColor: "white" }}>
        <View style={{ alignSelf: "flex-start", backgroundColor: "lightpink", padding: 10, borderRadius: 10, maxWidth: "70%", marginBottom: 10 }}>
          <Text>Hey! How's it going?</Text>
        </View>
        <View style={{ alignSelf: "flex-end", backgroundColor: "lightblue", padding: 10, borderRadius: 10, maxWidth: "70%", marginBottom: 10 }}>
          <Text>I'm good! What about you?</Text>
        </View>
      </ScrollView>

      {/* Input and Send Button */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "lightgray" }}>
        <TextInput style={{ flex: 1, backgroundColor: "white", padding: 10, borderRadius: 10 }} placeholder="Type a message..." />
        <TouchableOpacity style={{ marginLeft: 10, padding: 10, backgroundColor: "blue", borderRadius: 10 }}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
    )
}
