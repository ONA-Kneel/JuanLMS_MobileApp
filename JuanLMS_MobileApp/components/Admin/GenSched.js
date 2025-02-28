import { TouchableOpacity, View, Text, Dimensions } from "react-native";

export default function GenSched() {
    return (
        <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View style={{ backgroundColor: "lightpink", margin: 10, height: 400 }}>
                <Text>Content here</Text>
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
