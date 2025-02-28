import { StatusBar } from 'expo-status-bar';
import { Alert, LoginStyleheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckBox, Image, ImageBackground, TextInput } from 'react-native-web';
import { useState } from 'react';
import LoginStyle from './styles/LoginStyle';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';



export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [email,setEmail] = useState('');
    const changeScreen = useNavigation();

    const btnLogin =()=>{
      //For Login of Students, Faculty and Admin
      if (email.trim() === '') {
        alert("Please enter your email."); 
        setEmail('');
        return;
      } 
      else if (email.toLowerCase().includes("@students.sjddef.edu.ph")) {
        alert("Welcome, Student!")
        changeScreen.navigate("SDash")
      }
      else if(email.toLowerCase().includes("@sjddef.edu.ph")){
        alert("Welcome, Faculty!")
        changeScreen.navigate("FDash")
      }
      else if(email.toLowerCase().includes("@admin_sjddef.edu.ph")){
        alert("Welcome, Admin!")
        changeScreen.navigate("ADash")
      }
      else{
        setEmail('');
        alert("Please enter a valid School Email!");
        return;
      }
    }

  return (
    <View>
        <ImageBackground source={require('../assets/JuanLMS - bg.png')} style={LoginStyle.background} resizeMode="cover">
        <Image source={require('../assets/Logo4.svg')} style={LoginStyle.logo}></Image>
        <Text style={LoginStyle.text1}>Where faith and reason are expressed in Charity</Text>

        <View style={LoginStyle.loginContainer}>
            <Text style={LoginStyle.loginTitle}>Login</Text>

            
            <TextInput
            style={LoginStyle.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            />


            <View style={LoginStyle.passwordContainer}>
            <TextInput
                style={LoginStyle.input}
                placeholder="Password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} />
          </TouchableOpacity>
            </View>

            <View style={LoginStyle.rememberContainer}>
          <CheckBox
            status={rememberMe ? 'checked' : 'unchecked'}
            onPress={() => setRememberMe(!rememberMe)}
          />
          <Text style={LoginStyle.rememberText}>Remember Me</Text>
          <TouchableOpacity>
            <Text style={LoginStyle.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={btnLogin}
           style={LoginStyle.loginButton}>
          <Text style={LoginStyle.loginButtonText}>Login</Text>
        </TouchableOpacity>

        </View>
        </ImageBackground>

    </View>
  );
}