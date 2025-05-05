import { Text, TouchableOpacity, View } from 'react-native';
import * as React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator()


export default function DirectorChats() {
  //navigation
  const changeScreen = useNavigation();

  const goChat=()=>{
    changeScreen.navigate("Chats")
  }
  return (
    <View>
      <View style={{margin:20}}>
        <Text  style={{fontWeight:'bold'}}>Chats</Text>

        <View style={{margin:20,}}>
          <TouchableOpacity 
          onPress={goChat}
          style={{backgroundColor:'lightgray', borderRadius:10, marginTop:10}}>
            <View  style={{margin:10, borderBottomColor:'black'}}> 
              <Text style={{fontWeight:'bold'}}>Chat 1</Text>
              <Text>Hej!</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
          onPress={goChat}
          style={{backgroundColor:'lightgray', borderRadius:10, marginTop:10}}>
            <View  style={{margin:10, borderBottomColor:'black'}}> 
              <Text style={{fontWeight:'bold'}}>Chat 2</Text>
              <Text>HOLLA!</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}