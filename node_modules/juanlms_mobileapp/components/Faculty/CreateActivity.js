import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import FacultyModuleStyle from "../styles/faculty/FacultyModuleStyle";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";


export default function CreateActivity() {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([]);

  const back =()=>{
    changeScreen.navigate("FMod")
  }

  const changeScreen = useNavigation();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        type: "multiple-choice",
        text: "",
        choices: ["", "", ""],
        answer: "",
      },
    ]);
  };

  const updateQuestion = (id, key, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [key]: value } : q
      )
    );
  };

  const addChoice = (id) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? { ...q, choices: [...q.choices, ""] }
          : q
      )
    );
  };

  const saveActivity = () => {
    alert("Success", "Activity has been created", [{ text: "OK" }]);
    changeScreen.navigate('FMod')
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Header */}
      <View style={FacultyModuleStyle.header}>
        <TouchableOpacity onPress={back}>
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <View>
          <Text style={FacultyModuleStyle.title}>Introduction to Computing</Text>
          <Text style={FacultyModuleStyle.code}>CCINCOML</Text>
        </View>
        <Icon name="menu" size={24} color="black" style={{ marginLeft: "auto" }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Quiz Title Input */}
        <TextInput
          style={{
            backgroundColor: "#F0F0F0",
            borderRadius: 8,
            padding: 10,
            marginTop: 10,
          }}
          placeholder="Enter Quiz Title"
          value={quizTitle}
          onChangeText={setQuizTitle}
        />

        {/* Questions List */}
        {questions.map((q, index) => (
          <View key={q.id} style={{ marginTop: 10, padding: 10, backgroundColor: "#FFF", borderRadius: 8 }}>
            {/* Question Input */}
            <TextInput
              style={{
                backgroundColor: "#F0F0F0",
                borderRadius: 8,
                padding: 10,
              }}
              placeholder="Enter Question"
              value={q.text}
              onChangeText={(text) => updateQuestion(q.id, "text", text)}
            />

            {/* Dropdown for Question Type */}
            <Picker
              selectedValue={q.type}
              onValueChange={(itemValue) => updateQuestion(q.id, "type", itemValue)}
              style={{
                backgroundColor: "#2ecc71",
                color: "white",
                borderRadius: 5,
                marginTop: 8,
              }}
            >
              <Picker.Item label="Multiple Choice" value="multiple-choice" />
              <Picker.Item label="Essay" value="essay" />
            </Picker>

            {/* Multiple Choice Format */}
            {q.type === "multiple-choice" &&
              q.choices.map((choice, idx) => (
                <TextInput
                  key={idx}
                  style={{
                    backgroundColor: "#F0F0F0",
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 5,
                  }}
                  placeholder={`Choice ${idx + 1}`}
                  value={choice}
                  onChangeText={(text) => {
                    const newChoices = [...q.choices];
                    newChoices[idx] = text;
                    updateQuestion(q.id, "choices", newChoices);
                  }}
                />
              ))}

            {/* Add Choice Button */}
            {q.type === "multiple-choice" && (
              <TouchableOpacity
                onPress={() => addChoice(q.id)}
                style={{
                  backgroundColor: "#e67e22",
                  padding: 8,
                  borderRadius: 5,
                  marginTop: 5,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>+ Add Choice</Text>
              </TouchableOpacity>
            )}

            {/* Essay Format */}
            {q.type === "essay" && (
              <TextInput
                style={{
                  backgroundColor: "#F0F0F0",
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 5,
                }}
                placeholder="Enter Answer"
                value={q.answer}
                onChangeText={(text) => updateQuestion(q.id, "answer", text)}
              />
            )}

            {/* Add Question Button after each question */}
            <TouchableOpacity
              onPress={addQuestion}
              style={{
                backgroundColor: "#3498db",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 15,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Add Question</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* If no questions exist, show "Add Question" button at the start */}
        {questions.length === 0 && (
          <TouchableOpacity
            onPress={addQuestion}
            style={{
              backgroundColor: "#3498db",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
              marginTop: 15,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Add Question</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Save Button Fixed at Bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={saveActivity}
          style={{
            backgroundColor: "lightgray",
            padding: 12,
            borderRadius: 8,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "Black", fontWeight: "bold" }}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
